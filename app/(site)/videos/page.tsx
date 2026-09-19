import type { Metadata } from "next";
import { PageHeader } from "@/components/site/SectionHeader";
import { VideoBrowser } from "@/components/site/Browsers";
import { getPublishedPosts } from "@/lib/data";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Videos",
  description: "Video reports, interviews and conversations in Igbo and English, first shared on our Facebook page.",
  alternates: { canonical: "/videos" },
  openGraph: { title: "Videos", url: "/videos" },
};

export default async function VideosPage() {
  const videos = (await getPublishedPosts()).filter((post) => post.type === "video");
  return (
    <div className="mx-auto max-w-[1240px] px-5 pb-8 md:px-8">
      <PageHeader
        eyebrow="Vidiyo"
        title="Videos"
        description="Reports, interviews and conversations, first shared on our Facebook page and kept here in one place."
      />
      <VideoBrowser posts={videos} />
    </div>
  );
}
