import { createHmac } from 'crypto';
import type { SyncIngestResponse, SyncQuizPayload } from './types';

function getFreeSiteUrl(): string {
  const url =
    process.env.FREE_SITE_URL?.trim() ||
    process.env.THE_SCHOOL_SITE_URL?.trim() ||
    '';
  if (!url) {
    throw new Error(
      'FREE_SITE_URL is missing (e.g. http://localhost:3002 for the-school)'
    );
  }
  return url.replace(/\/$/, '');
}

function getSyncSecrets(): { apiKey: string; hmacSecret: string } {
  const apiKey = process.env.FREE_SYNC_API_KEY?.trim();
  const hmacSecret = process.env.FREE_SYNC_HMAC_SECRET?.trim();
  if (!apiKey || !hmacSecret) {
    throw new Error('FREE_SYNC_API_KEY and FREE_SYNC_HMAC_SECRET are required');
  }
  return { apiKey, hmacSecret };
}

function signBody(body: string, secret: string): string {
  return createHmac('sha256', secret).update(body).digest('hex');
}

export async function pushQuizPayloadToFreeSite(
  payload: SyncQuizPayload
): Promise<SyncIngestResponse> {
  const baseUrl = getFreeSiteUrl();
  const { apiKey, hmacSecret } = getSyncSecrets();
  const body = JSON.stringify(payload);
  const signature = signBody(body, hmacSecret);

  const res = await fetch(`${baseUrl}/api/internal/sync/ingest`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'X-Sync-Signature': signature,
    },
    body,
    cache: 'no-store',
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg =
      typeof data?.error === 'string'
        ? data.error
        : `Sync failed (${res.status})`;
    throw new Error(msg);
  }

  return data as SyncIngestResponse;
}
