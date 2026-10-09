import { getProfile, getProjects } from "@/lib/queries";
import { HeroSection } from "@/components/hero/hero-section";

export default async function HomePage() {
  const [profile, projects] = await Promise.all([getProfile(), getProjects()]);

  return <HeroSection profile={profile} selectedProjects={projects} />;
}

