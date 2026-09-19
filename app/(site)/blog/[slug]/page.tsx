import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { BackToTop, CopyLink, ReadingProgress } from "@/components/site/ArticleTools";
import { Kicker } from "@/components/site/PostCard";
import { getArticle, getPublishedPosts, getSettings } from "@/lib/data";
import { formatDate, isoDate, wasUpdated } from "@/lib/format";
import { sanitizeArticle } from "@/lib/sanitize";
import { SITE_URL } from "@/lib/site";
import { readingMinutes } from "@/convex/lib/text";

export const revalidate = 60;

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const posts = await getPublishedPosts();
  return posts.filter((post) => post.type === "blog").map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) return { title: "Article not found", robots: { index: false } };

  const path = `/blog/${article.slug}`;
  const images = article.thumbnailUrl ? [{ url: article.thumbnailUrl, alt: article.thumbnailAlt }] : undefined;
  return {
    title: article.title,
    description: article.excerpt,
    alternates: { canonical: path },
    openGraph: {
      type: "article",
      url: path,
      title: article.title,
      description: article.excerpt,
      publishedTime: isoDate(article.publishedAt),
      modifiedTime: isoDate(article.updatedAt),
      section: article.category,
      images,
    },
    twitter: {
      card: article.thumbnailUrl ? "summary_large_image" : "summary",
      title: article.title,
      description: article.excerpt,
      images: article.thumbnailUrl ? [article.thumbnailUrl] : undefined,
    },
  };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const [article, settings] = await Promise.all([getArticle(slug), getSettings()]);
  if (!article) notFound();

  const body = sanitizeArticle(article.body);
  const minutes = readingMinutes(body);
  const updated = wasUpdated(article.publishedAt, article.updatedAt);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
    description: article.excerpt,
    datePublished: isoDate(article.publishedAt),
    dateModified: isoDate(article.updatedAt),
    articleSection: article.category,
    mainEntityOfPage: `${SITE_URL}/blog/${article.slug}`,
    image: article.thumbnailUrl ? [article.thumbnailUrl] : undefined,
    publisher: { "@type": "Organization", name: settings.siteName },
  };

  return (
    <>
      <ReadingProgress targetId="article-body" />
      <script
        type="application/ld+json"
        // "<" is escaped so no field can close the script element.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />

      <article className="pb-6">
        <header className="mx-auto max-w-[760px] px-5 pt-8 md:px-8 md:pt-12">
          <nav aria-label="Breadcrumb" className="meta">
            <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <li>
                <Link href="/" className="u-draw hover:text-ink">
                  Home
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li>
                <Link href="/blog" className="u-draw hover:text-ink">
                  Blog
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li aria-current="page" className="max-w-[28ch] truncate text-ink sm:max-w-[44ch]">
                {article.title}
              </li>
            </ol>
          </nav>

          <div className="mt-10 md:mt-14">
            <Kicker>{article.category}</Kicker>
            <h1 className="mt-4 font-display text-[2.375rem] font-semibold leading-[1.06] tracking-[-0.022em] text-balance md:text-[3.5rem]">
              {article.title}
            </h1>
            {article.excerpt && (
              <p className="mt-6 font-body text-[1.25rem] leading-[1.5] text-muted md:text-[1.4375rem]">{article.excerpt}</p>
            )}
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-x-6 gap-y-4 border-y border-hairline py-4">
            <p className="meta flex flex-wrap items-center gap-x-3 gap-y-1">
              <span>
                <time dateTime={isoDate(article.publishedAt)}>{formatDate(article.publishedAt)}</time>
              </span>
              {updated && (
                <>
                  <span aria-hidden="true" className="h-3 w-px bg-hairline" />
                  <span>
                    Updated <time dateTime={isoDate(article.updatedAt)}>{formatDate(article.updatedAt)}</time>
                  </span>
                </>
              )}
              <span aria-hidden="true" className="h-3 w-px bg-hairline" />
              <span>{minutes} min read</span>
            </p>
            <CopyLink />
          </div>
        </header>

        {article.thumbnailUrl && (
          <figure className="mx-auto mt-10 max-w-[1000px] px-5 md:mt-12 md:px-8">
            <div className="relative aspect-[3/2] overflow-hidden bg-ink">
              <Image
                src={article.thumbnailUrl}
                alt={article.thumbnailAlt}
                fill
                priority
                sizes="(min-width: 1000px) 936px, 100vw"
                className="object-cover"
              />
            </div>
          </figure>
        )}

        <div className="mx-auto mt-10 max-w-[760px] px-5 md:mt-14 md:px-8">
          <div id="article-body" className="prose-akuko" dangerouslySetInnerHTML={{ __html: body }} />

          <footer className="mt-16 flex items-center justify-between border-t border-hairline pt-6">
            <Link href="/blog" className="group inline-flex items-center gap-2 text-[0.875rem]">
              <ArrowLeft size={15} strokeWidth={1.5} aria-hidden="true" />
              <span className="u-draw">All articles</span>
            </Link>
            <CopyLink />
          </footer>
        </div>
      </article>

      <BackToTop />
    </>
  );
}
