import fs from "fs";
import path from "path";
import { unstable_cache } from "next/cache";
import {
  ProfileSchema,
  ProjectSchema,
  PostSchema,
  SiteConfigSchema,
  TakeSchema,
  type Profile,
  type Project,
  type Post,
  type SiteConfig,
  type Take,
} from "./schemas";

function readSeedFile<T>(filename: string): T {
  const filePath = path.join(process.cwd(), "content", "seed", filename);
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

async function fetchProfile(): Promise<Profile> {
  return ProfileSchema.parse(readSeedFile<unknown>("profile.json"));
}

const cachedGitHubRepoMeta = unstable_cache(
  async (owner: string, repo: string): Promise<{ stars?: number; year?: number } | null> => {
    try {
      const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
        headers: {
          "User-Agent": "BeeBombshell-Portfolio",
          Accept: "application/vnd.github.v3+json",
        },
      });
      if (!response.ok) return null;

      const data = await response.json();
      return {
        stars:
          typeof data.stargazers_count === "number" ? data.stargazers_count : undefined,
        year: data.created_at
          ? new Date(data.created_at).getFullYear()
          : undefined,
      };
    } catch {
      return null;
    }
  },
  ["github-repo-meta"],
  { revalidate: 3600 }
);

async function fetchGitHubRepoMeta(
  repoUrl?: string
): Promise<{ stars?: number; year?: number } | null> {
  if (!repoUrl) return null;

  const match = repoUrl.match(/github\.com\/([^/]+)\/([^/#?]+)/i);
  if (!match) return null;

  return cachedGitHubRepoMeta(match[1], match[2]);
}

async function fetchProjects(): Promise<Project[]> {
  const projects = readSeedFile<unknown[]>("projects.json").map((item) =>
    ProjectSchema.parse(item)
  );

  return Promise.all(
    projects.map(async (project) => {
      const meta = await fetchGitHubRepoMeta(project.links.repo);
      if (!meta) return project;

      return {
        ...project,
        stars: meta.stars ?? project.stars,
        year: meta.year ?? project.year,
      };
    })
  );
}

async function fetchPosts(): Promise<Post[]> {
  return readSeedFile<unknown[]>("posts.json")
    .map((item) => PostSchema.parse(item))
    .filter((post) => post.status === "published")
    .sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );
}

async function fetchConfig(): Promise<SiteConfig> {
  return SiteConfigSchema.parse(readSeedFile<unknown>("config.json"));
}

async function fetchTakes(): Promise<Take[]> {
  return readSeedFile<unknown[]>("takes.json").map((item, index) =>
    TakeSchema.parse({
      order: index + 1,
      ...(typeof item === "object" && item !== null ? item : {}),
    })
  );
}

const cachedGetProfile = unstable_cache(fetchProfile, ["profile-data"]);
const cachedGetProjects = unstable_cache(fetchProjects, ["projects-data"], {
  revalidate: 3600,
});
const cachedGetPosts = unstable_cache(fetchPosts, ["posts-data"]);
const cachedGetConfig = unstable_cache(fetchConfig, ["config-data"]);
const cachedGetTakes = unstable_cache(fetchTakes, ["takes-data"]);

export async function getProfile(): Promise<Profile> {
  return process.env.NODE_ENV === "development"
    ? fetchProfile()
    : cachedGetProfile();
}

export async function getProjects(): Promise<Project[]> {
  return process.env.NODE_ENV === "development"
    ? fetchProjects()
    : cachedGetProjects();
}

export async function getProject(slug: string): Promise<Project | null> {
  const projects = await getProjects();
  return projects.find((project) => project.slug === slug) ?? null;
}

export async function getPosts(): Promise<Post[]> {
  return process.env.NODE_ENV === "development" ? fetchPosts() : cachedGetPosts();
}

export async function getPost(slug: string): Promise<Post | null> {
  const posts = await getPosts();
  return posts.find((post) => post.slug === slug) ?? null;
}

export async function getConfig(): Promise<SiteConfig> {
  return process.env.NODE_ENV === "development"
    ? fetchConfig()
    : cachedGetConfig();
}

export async function getTakes(): Promise<Take[]> {
  return process.env.NODE_ENV === "development" ? fetchTakes() : cachedGetTakes();
}
