import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPublishedPageBySlugData } from '@/lib/cache';
import { SITE_URL } from '@/lib/constants';

export const revalidate = 900;

interface PageProps {
  params: Promise<{ slug: string }> | { slug: string };
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await Promise.resolve(params);
  const page = await getPublishedPageBySlugData(slug);

  if (!page) {
    return { title: 'Page not found' };
  }

  const canonical = `/pages/${page.slug}`;
  const title = page.metaTitle || page.title;
  const description = page.metaDescription || undefined;

  return {
    title,
    description,
    alternates: { canonical },
    robots: page.noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
    openGraph: {
      title,
      description,
      type: 'website',
      url: `${SITE_URL}${canonical}`,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default async function CustomPublicPage({ params }: PageProps) {
  const { slug } = await Promise.resolve(params);
  const page = await getPublishedPageBySlugData(slug);

  if (!page) {
    notFound();
  }

  return (
    <>
      {page.css && (
        <style
          dangerouslySetInnerHTML={{
            __html: `\n/* Custom page CSS: ${page.slug} */\n${page.css}\n`,
          }}
        />
      )}
      <main
        className="custom-page"
        data-page-slug={page.slug}
        dangerouslySetInnerHTML={{ __html: page.html || '' }}
      />
    </>
  );
}
