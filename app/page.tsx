import { getProfile, getProjects, getPosts } from "@/lib/queries";
import { HeroSection } from "@/components/hero/hero-section";

export default async function HomePage() {
  const [profile, projects, posts] = await Promise.all([
    getProfile(),
    getProjects(),
    getPosts(),
  ]);

  return (
    <HeroSection
      profile={profile}
      selectedProjects={projects}
      recentPosts={posts}
    />
  );
}
