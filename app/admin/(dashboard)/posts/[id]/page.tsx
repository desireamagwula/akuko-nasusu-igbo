"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { PostForm } from "@/components/admin/PostForm";

export default function EditPostPage() {
  const { id } = useParams<{ id: string }>();
  const post = useQuery(api.posts.adminGet, { id: id as Id<"posts"> });

  if (post === undefined) {
    return (
      <div aria-busy="true" aria-label="Loading post" className="space-y-6">
        <div className="skeleton h-8 w-48" />
        <div className="skeleton h-14 w-full" />
        <div className="skeleton h-40 w-full" />
        <div className="skeleton h-[380px] w-full" />
      </div>
    );
  }

  if (post === null) {
    return (
      <div className="py-16">
        <h1 className="font-display text-[2rem] font-semibold">That post does not exist.</h1>
        <p className="meta mt-2">It may have been deleted.</p>
        <Link href="/admin" className="u-draw mt-6 inline-block">
          Back to all posts
        </Link>
      </div>
    );
  }

  return <PostForm key={post._id} post={post} />;
}
