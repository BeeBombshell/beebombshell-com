import { getProjects } from "@/lib/queries";
import type { Metadata } from "next";
import { WorkContent } from "@/components/work/work-content";

export const metadata: Metadata = {
  title: "Work · BeeBombshell",
  description: "Selected projects and software craftsmanship by Bhavya Verma.",
  alternates: {
    canonical: "/work",
  },
};

export default async function WorkPage() {
  const projects = await getProjects();

  return <WorkContent projects={projects} />;
}
