import type { Metadata } from "next";
import { Blocks } from "@/components/site/Blocks";
import { Lead } from "@/components/site/Lead";
import { SectionHeader } from "@/components/site/SectionHeader";
import { Reveal } from "@/components/ui/Reveal";
import { getPublishedPosts, getSettings } from "@/lib/data";
import { editorialBlocks } from "@/lib/posts";
import { SITE_DESCRIPTION } from "@/lib/site";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const { siteName } = await getSettings();
  return {
    title: { absolute: `${siteName} | News, culture, sport and entertainment in Igbo` },
    description: SITE_DESCRIPTION,
  };
}

export default async function HomePage() {
  const [settings, posts] = await Promise.all([getSettings(), getPublishedPosts()]);

  if (posts.length === 0) {
    return (
      <div className="mx-auto max-w-[1240px] px-5 py-32 md:px-8">
        <p className="kicker">{settings.siteName}</p>
        <h1 className="mt-4 max-w-[16ch] font-display text-[2.5rem] font-semibold leading-[1.05] tracking-[-0.02em] md:text-[4rem]">
          The first stories are on their way.
        </h1>
      </div>
    );
  }

  // The lead is the pinned story if there is one, otherwise the newest.
  const lead = posts.find((post) => post._id === settings.featuredPostId) ?? posts[0];
  const rest = posts.filter((post) => post._id !== lead._id);

  // The three newest videos get their own strip; everything else flows by date.
  const videos = rest.filter((post) => post.type === "video").slice(0, 3);
  const inStrip = new Set(videos.map((post) => post._id));
  const flow = rest.filter((post) => !inStrip.has(post._id));
  const alsoInNews = flow.slice(0, 3);
  const latest = flow.slice(3, 11);

  return (
    <div className="mx-auto max-w-[1240px] px-5 md:px-8">
      <Lead post={lead} more={alsoInNews} />

      {latest.length > 0 && (
        <section aria-label="Latest stories" className="mt-16 md:mt-24">
          <Reveal>
            <SectionHeader title="Latest" eyebrow="Kacha Ọhụrụ" href="/blog" hrefLabel="All articles" />
          </Reveal>
          <Blocks blocks={editorialBlocks(latest)} />
        </section>
      )}

      {videos.length > 0 && (
        <section aria-label="Videos" className="mt-16 md:mt-24">
          <Reveal>
            <SectionHeader title="Videos" eyebrow="Vidiyo" href="/videos" hrefLabel="All videos" />
          </Reveal>
          <Blocks blocks={[videos.length === 3 ? { kind: "trio", items: videos } : { kind: "rest", items: videos }]} />
        </section>
      )}
    </div>
  );
}
