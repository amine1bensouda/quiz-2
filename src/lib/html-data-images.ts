/**
 * Detect and replace Quill data:image base64 embeds with uploaded CDN URLs.
 * Large base64 payloads break quiz save (nginx/body limits).
 */

const DATA_IMAGE_SRC_RE = /src=(["'])(data:image\/[a-zA-Z0-9+.-]+;base64,[A-Za-z0-9+/=\s]+)\1/gi;

export function htmlContainsDataImages(html: string | null | undefined): boolean {
  if (!html) return false;
  return /data:image\/[a-zA-Z0-9+.-]+;base64,/i.test(html);
}

async function uploadDataUrlAsImage(dataUrl: string): Promise<string> {
  const blobRes = await fetch(dataUrl);
  const blob = await blobRes.blob();
  if (!blob.type.startsWith('image/')) {
    throw new Error('Invalid embedded image type');
  }
  if (blob.size > 5 * 1024 * 1024) {
    throw new Error('Embedded image exceeds 5 MB');
  }

  const ext =
    blob.type === 'image/jpeg'
      ? 'jpg'
      : blob.type === 'image/png'
        ? 'png'
        : blob.type === 'image/gif'
          ? 'gif'
          : blob.type === 'image/webp'
            ? 'webp'
            : 'png';

  const formData = new FormData();
  formData.append('image', blob, `embedded.${ext}`);

  const uploadRes = await fetch('/api/admin/upload/image', {
    method: 'POST',
    body: formData,
  });
  const data = await uploadRes.json().catch(() => ({}));
  if (!uploadRes.ok || !data.url) {
    throw new Error(data.error || 'Failed to upload embedded image');
  }
  return data.url as string;
}

/**
 * Replace every data:image src in HTML with an uploaded public URL.
 * Uploads are sequential to avoid hammering the API.
 */
export async function replaceDataImagesInHtml(
  html: string,
  onProgress?: (done: number, total: number) => void
): Promise<string> {
  if (!htmlContainsDataImages(html)) return html;

  const matches = Array.from(html.matchAll(DATA_IMAGE_SRC_RE));
  if (matches.length === 0) return html;

  const uniqueDataUrls = Array.from(new Set(matches.map((m) => m[2])));
  const urlMap = new Map<string, string>();

  for (let i = 0; i < uniqueDataUrls.length; i++) {
    const dataUrl = uniqueDataUrls[i];
    const compact = dataUrl.replace(/\s+/g, '');
    urlMap.set(dataUrl, await uploadDataUrlAsImage(compact));
    onProgress?.(i + 1, uniqueDataUrls.length);
  }

  return html.replace(DATA_IMAGE_SRC_RE, (_full, quote: string, dataUrl: string) => {
    const uploaded = urlMap.get(dataUrl);
    return uploaded ? `src=${quote}${uploaded}${quote}` : _full;
  });
}

export async function replaceDataImagesInQuizPayload<T extends {
  description?: string;
  excerpt?: string;
  questions?: Array<{
    text?: string;
    explanation?: string;
    answers?: Array<{ text?: string; explanation?: string }>;
  }>;
}>(payload: T, onProgress?: (message: string) => void): Promise<T> {
  let uploadsDone = 0;
  let uploadsTotal = 0;

  const countIn = (html?: string) => {
    if (!htmlContainsDataImages(html)) return 0;
    return Array.from((html || '').matchAll(DATA_IMAGE_SRC_RE)).length;
  };

  uploadsTotal += countIn(payload.description);
  uploadsTotal += countIn(payload.excerpt);
  for (const q of payload.questions || []) {
    uploadsTotal += countIn(q.text);
    uploadsTotal += countIn(q.explanation);
    for (const a of q.answers || []) {
      uploadsTotal += countIn(a.text);
      uploadsTotal += countIn(a.explanation);
    }
  }

  if (uploadsTotal === 0) return payload;

  const track = async (html: string | undefined) => {
    if (!html || !htmlContainsDataImages(html)) return html || '';
    return replaceDataImagesInHtml(html, (done) => {
      // done is per-field unique count; approximate overall message
      onProgress?.(
        `Uploading embedded images… ${Math.min(uploadsDone + done, uploadsTotal)}/${uploadsTotal}`
      );
    }).then((result) => {
      uploadsDone += countIn(html);
      return result;
    });
  };

  onProgress?.(`Uploading embedded images… 0/${uploadsTotal}`);

  const description = await track(payload.description);
  const excerpt = await track(payload.excerpt);
  const questions = [];

  for (const q of payload.questions || []) {
    const text = await track(q.text);
    const explanation = await track(q.explanation);
    const answers = [];
    for (const a of q.answers || []) {
      answers.push({
        ...a,
        text: await track(a.text),
        explanation: await track(a.explanation),
      });
    }
    questions.push({ ...q, text, explanation, answers });
  }

  return {
    ...payload,
    description,
    excerpt,
    questions,
  };
}
