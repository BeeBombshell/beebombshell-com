import { getProfile, getProjects, getPosts, getTakes, getConfig } from "@/lib/queries";
import { HeroSection } from "@/components/hero/hero-section";

export default async function HomePage() {
  const [profile, projects, posts, takes, config] = await Promise.all([
    getProfile(),
    getProjects(),
    getPosts(),
    getTakes(),
    getConfig(),
  ]);

  return (
    <HeroSection
      profile={profile}
      selectedProjects={projects}
      recentPosts={posts}
      takes={takes}
      enableCharacter={config.featureFlags?.character !== false}
    />
  );
}
