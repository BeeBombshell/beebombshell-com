import fs from "fs";
import path from "path";
import { unstable_cache } from "next/cache";
import type { QueryDocumentSnapshot } from "firebase-admin/firestore";
import { firestore } from "./firebase-admin";
import { REVALIDATE_TAGS } from "./revalidate";
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
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw);
}

// ── Raw Fetchers (with Firestore primary + Seed JSON fallback) ─────────────

async function fetchProfile(): Promise<Profile> {
  if (firestore) {
    try {
      const doc = await firestore.collection("profile").doc("main").get();
      if (doc.exists) {
        return ProfileSchema.parse(doc.data());
      }
    } catch (err) {
      console.warn("Firestore getProfile failed, using seed fallback:", err);
    }
  }

  const raw = readSeedFile<unknown>("profile.json");
  return ProfileSchema.parse(raw);
}

const cachedGitHubRepoMeta = unstable_cache(
  async (owner: string, repo: string): Promise<{ stars?: number; year?: number } | null> => {
    try {
      const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
        headers: {
          "User-Agent": "BeeBombshell-Portfolio",
          Accept: "application/vnd.github.v3+json",
        },
      });
      if (!res.ok) return null;
      const data = await res.json();
      const year = data.created_at ? new Date(data.created_at).getFullYear() : undefined;
      const stars = typeof data.stargazers_count === "number" ? data.stargazers_count : undefined;
      return { stars, year };
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
  const owner = match[1];
  const repo = match[2];

  return cachedGitHubRepoMeta(owner, repo);
}

async function fetchProjects(): Promise<Project[]> {
  let projects: Project[] = [];

  if (firestore) {
    try {
      const snap = await firestore.collection("projects").orderBy("order", "asc").get();
      if (!snap.empty) {
        projects = snap.docs.map((d: QueryDocumentSnapshot) =>
          ProjectSchema.parse({ ...d.data(), slug: d.id })
        );
      }
    } catch (err) {
      console.warn("Firestore getProjects failed, using seed fallback:", err);
    }
  }

  if (projects.length === 0) {
    const raw = readSeedFile<unknown[]>("projects.json");
    projects = raw.map((item) => ProjectSchema.parse(item));
  }

  // Augment with real GitHub star counts and creation year (ISR revalidate: 3600)
  const augmented = await Promise.all(
    projects.map(async (project) => {
      const meta = await fetchGitHubRepoMeta(project.links?.repo);
      if (!meta) return project;
      return {
        ...project,
        stars: meta.stars !== undefined ? meta.stars : project.stars,
        year: meta.year !== undefined ? meta.year : project.year,
      };
    })
  );

  return augmented;
}

async function fetchPosts(): Promise<Post[]> {
  if (firestore) {
    try {
      const snap = await firestore
        .collection("posts")
        .where("status", "==", "published")
        .orderBy("publishedAt", "desc")
        .get();
      if (!snap.empty) {
        return snap.docs.map((d: QueryDocumentSnapshot) =>
          PostSchema.parse({ ...d.data(), slug: d.id })
        );
      }
    } catch (err) {
      console.warn("Firestore getPosts failed, using seed fallback:", err);
    }
  }

  const raw = readSeedFile<unknown[]>("posts.json");
  const posts = raw.map((item) => PostSchema.parse(item));
  return posts.filter((p) => p.status === "published");
}

async function fetchConfig(): Promise<SiteConfig> {
  if (firestore) {
    try {
      const doc = await firestore.collection("site").doc("config").get();
      if (doc.exists) {
        return SiteConfigSchema.parse(doc.data());
      }
    } catch (err) {
      console.warn("Firestore getConfig failed, using seed fallback:", err);
    }
  }

  const raw = readSeedFile<unknown>("config.json");
  return SiteConfigSchema.parse(raw);
}

// ── Cached Query APIs (with Next.js ISR tag revalidation) ───────────────────

const cachedGetProfile = unstable_cache(
  fetchProfile,
  ["profile-data"],
  {
    tags: [REVALIDATE_TAGS.profile],
    revalidate: 3600, // Background revalidation every hour
  }
);

export async function getProfile(): Promise<Profile> {
  if (process.env.NODE_ENV === "development") {
    return fetchProfile();
  }
  return cachedGetProfile();
}

const cachedGetProjects = unstable_cache(
  fetchProjects,
  ["projects-data"],
  {
    tags: [REVALIDATE_TAGS.projects],
    revalidate: 3600,
  }
);

export async function getProjects(): Promise<Project[]> {
  if (process.env.NODE_ENV === "development") {
    return fetchProjects();
  }
  return cachedGetProjects();
}

export async function getProject(slug: string): Promise<Project | null> {
  const projects = await getProjects();
  return projects.find((p) => p.slug === slug) ?? null;
}

const cachedGetPosts = unstable_cache(
  fetchPosts,
  ["posts-data"],
  {
    tags: [REVALIDATE_TAGS.posts],
    revalidate: 3600,
  }
);

export async function getPosts(): Promise<Post[]> {
  if (process.env.NODE_ENV === "development") {
    return fetchPosts();
  }
  return cachedGetPosts();
}

export async function getPost(slug: string): Promise<Post | null> {
  const posts = await getPosts();
  return posts.find((p) => p.slug === slug) ?? null;
}

const cachedGetConfig = unstable_cache(
  fetchConfig,
  ["config-data"],
  {
    tags: [REVALIDATE_TAGS.config],
    revalidate: 3600,
  }
);

export async function getConfig(): Promise<SiteConfig> {
  if (process.env.NODE_ENV === "development") {
    return fetchConfig();
  }
  return cachedGetConfig();
}

async function fetchTakes(): Promise<Take[]> {
  const viewsPath = path.join(process.cwd(), "content", "views.json");
  if (fs.existsSync(viewsPath)) {
    try {
      const raw = JSON.parse(fs.readFileSync(viewsPath, "utf-8"));
      return raw.map((item: unknown, idx: number) =>
        TakeSchema.parse({
          order: idx + 1,
          ...(typeof item === "object" && item !== null ? item : {}),
        })
      );
    } catch (err) {
      console.warn("Failed to load content/views.json:", err);
    }
  }

  if (firestore) {
    try {
      const snap = await firestore.collection("takes").orderBy("order", "asc").get();
      if (!snap.empty) {
        return snap.docs.map((d: QueryDocumentSnapshot) =>
          TakeSchema.parse({ ...d.data(), id: d.id })
        );
      }
    } catch (err) {
      console.warn("Firestore getTakes failed, using seed fallback:", err);
    }
  }

  const raw = readSeedFile<unknown[]>("takes.json");
  return raw.map((item, idx) =>
    TakeSchema.parse({
      order: idx + 1,
      ...(typeof item === "object" && item !== null ? item : {}),
    })
  );
}

const cachedGetTakes = unstable_cache(
  fetchTakes,
  ["takes-data"],
  {
    tags: ["takes"],
    revalidate: 3600,
  }
);

export async function getTakes(): Promise<Take[]> {
  if (process.env.NODE_ENV === "development") {
    return fetchTakes();
  }
  return cachedGetTakes();
}


