import { getProfile, getProjects, getPosts, getTakes } from "@/lib/queries";
import { HeroSection } from "@/components/hero/hero-section";

export default async function HomePage() {
  const [profile, projects, posts, takes] = await Promise.all([
    getProfile(),
    getProjects(),
    getPosts(),
    getTakes(),
  ]);

  return (
    <HeroSection
      profile={profile}
      selectedProjects={projects}
      recentPosts={posts}
      takes={takes}
    />
  );
}
