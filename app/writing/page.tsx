import type { Metadata } from "next";
import { getPosts } from "@/lib/queries";
import { WritingContent } from "@/components/writing/writing-content";

export const metadata: Metadata = {
  title: "Writing · BeeBombshell",
  description: "Essays, notes, and technical articles on systems and design.",
  alternates: {
    canonical: "/writing",
  },
};

export default async function WritingPage() {
  const posts = await getPosts();

  return <WritingContent posts={posts} />;
}
