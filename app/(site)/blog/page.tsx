import type { Metadata } from "next";
import { PageHeader } from "@/components/site/SectionHeader";
import { BlogBrowser } from "@/components/site/Browsers";
import { getPublishedPosts } from "@/lib/data";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Blog",
  description: "Written stories on Igbo culture, news, sport and entertainment, in Igbo and English.",
  alternates: { canonical: "/blog" },
  openGraph: { title: "Blog", url: "/blog" },
};

export default async function BlogPage() {
  const articles = (await getPublishedPosts()).filter((post) => post.type === "blog");
  return (
    <div className="mx-auto max-w-[1240px] px-5 pb-8 md:px-8">
      <PageHeader
        eyebrow="Akụkọ"
        title="Blog"
        description="Written stories on news, culture, sport and entertainment, in Igbo and in English."
      />
      <BlogBrowser posts={articles} />
    </div>
  );
}
