import fs from "fs";
import path from "path";
import { revalidateTag, revalidatePath } from "next/cache";
import type { QueryDocumentSnapshot } from "firebase-admin/firestore";
import { firestore } from "./firebase-admin";
import { REVALIDATE_TAGS } from "./revalidate";
import {
  ProfileSchema,
  ProjectSchema,
  PostSchema,
  SiteConfigSchema,
  type Profile,
  type Project,
  type Post,
  type SiteConfig,
} from "./schemas";

function getSeedPath(filename: string): string {
  return path.join(process.cwd(), "content", "seed", filename);
}

function readSeedFile<T>(filename: string): T {
  const filePath = getSeedPath(filename);
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw);
}

function writeSeedFile<T>(filename: string, data: T): void {
  const filePath = getSeedPath(filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}

// ── Admin Data Retrieval ───────────────────────────────────────────────────

export async function getAllAdminData() {
  let isFirestoreConnected = false;
  let posts: Post[] = [];
  let projects: Project[] = [];
  let profile: Profile;
  let config: SiteConfig;

  // 1. Fetch Posts (including drafts)
  if (firestore) {
    try {
      const snap = await firestore
        .collection("posts")
        .orderBy("publishedAt", "desc")
        .get();
      if (!snap.empty) {
        posts = snap.docs.map((d: QueryDocumentSnapshot) =>
          PostSchema.parse({ ...d.data(), slug: d.id })
        );
        isFirestoreConnected = true;
      }
    } catch (err) {
      console.warn("Admin Firestore getPosts failed, using seed fallback:", err);
    }
  }

  if (posts.length === 0) {
    const raw = readSeedFile<unknown[]>("posts.json");
    posts = raw.map((item) => PostSchema.parse(item));
  }

  // 2. Fetch Projects
  if (firestore) {
    try {
      const snap = await firestore.collection("projects").orderBy("order", "asc").get();
      if (!snap.empty) {
        projects = snap.docs.map((d: QueryDocumentSnapshot) =>
          ProjectSchema.parse({ ...d.data(), slug: d.id })
        );
        isFirestoreConnected = true;
      }
    } catch (err) {
      console.warn("Admin Firestore getProjects failed, using seed fallback:", err);
    }
  }

  if (projects.length === 0) {
    const raw = readSeedFile<unknown[]>("projects.json");
    projects = raw.map((item) => ProjectSchema.parse(item));
  }

  // 3. Fetch Profile
  let profileLoaded = false;
  if (firestore) {
    try {
      const doc = await firestore.collection("profile").doc("main").get();
      if (doc.exists) {
        profile = ProfileSchema.parse(doc.data());
        profileLoaded = true;
      }
    } catch {
      // fallback
    }
  }
  if (!profileLoaded) {
    const raw = readSeedFile<unknown>("profile.json");
    profile = ProfileSchema.parse(raw);
  }

  // 4. Fetch Config
  let configLoaded = false;
  if (firestore) {
    try {
      const doc = await firestore.collection("site").doc("config").get();
      if (doc.exists) {
        config = SiteConfigSchema.parse(doc.data());
        configLoaded = true;
      }
    } catch {
      // fallback
    }
  }
  if (!configLoaded) {
    const raw = readSeedFile<unknown>("config.json");
    config = SiteConfigSchema.parse(raw);
  }

  return {
    posts,
    projects,
    profile: profile!,
    config: config!,
    isFirestoreConnected,
  };
}

// ── Post Mutations ─────────────────────────────────────────────────────────

export async function savePost(postData: unknown): Promise<Post> {
  const post = PostSchema.parse(postData);

  // Write to Firestore if available
  if (firestore) {
    try {
      await firestore.collection("posts").doc(post.slug).set(post, { merge: true });
    } catch (err) {
      console.error("Failed to write post to Firestore:", err);
    }
  }

  // Also update local seed file as backup/sync
  try {
    const seedPosts = readSeedFile<Post[]>("posts.json");
    const index = seedPosts.findIndex((p) => p.slug === post.slug);
    if (index >= 0) {
      seedPosts[index] = post;
    } else {
      seedPosts.unshift(post);
    }
    writeSeedFile("posts.json", seedPosts);
  } catch (err) {
    console.error("Failed to update seed posts.json:", err);
  }

  // Revalidate caches
  revalidateTag(REVALIDATE_TAGS.posts, "max");
  revalidatePath("/");
  revalidatePath("/writing");
  revalidatePath(`/writing/${post.slug}`);
  revalidatePath("/llms.txt");
  revalidatePath("/llms-full.txt");
  revalidatePath("/feed.xml");
  revalidatePath("/rss.xml");
  revalidatePath("/sitemap.xml");

  return post;
}

export async function deletePost(slug: string): Promise<void> {
  if (firestore) {
    try {
      await firestore.collection("posts").doc(slug).delete();
    } catch (err) {
      console.error("Failed to delete post from Firestore:", err);
    }
  }

  try {
    const seedPosts = readSeedFile<Post[]>("posts.json");
    const filtered = seedPosts.filter((p) => p.slug !== slug);
    writeSeedFile("posts.json", filtered);
  } catch (err) {
    console.error("Failed to delete post from seed posts.json:", err);
  }

  revalidateTag(REVALIDATE_TAGS.posts, "max");
  revalidatePath("/");
  revalidatePath("/writing");
  revalidatePath(`/writing/${slug}`);
  revalidatePath("/llms.txt");
  revalidatePath("/llms-full.txt");
  revalidatePath("/sitemap.xml");
}

// ── Project Mutations ──────────────────────────────────────────────────────

export async function saveProject(projectData: unknown): Promise<Project> {
  const project = ProjectSchema.parse(projectData);

  if (firestore) {
    try {
      await firestore.collection("projects").doc(project.slug).set(project, { merge: true });
    } catch (err) {
      console.error("Failed to write project to Firestore:", err);
    }
  }

  try {
    const seedProjects = readSeedFile<Project[]>("projects.json");
    const index = seedProjects.findIndex((p) => p.slug === project.slug);
    if (index >= 0) {
      seedProjects[index] = project;
    } else {
      seedProjects.push(project);
    }
    // Keep sorted by order
    seedProjects.sort((a, b) => a.order - b.order);
    writeSeedFile("projects.json", seedProjects);
  } catch (err) {
    console.error("Failed to update seed projects.json:", err);
  }

  revalidateTag(REVALIDATE_TAGS.projects, "max");
  revalidatePath("/");
  revalidatePath("/work");
  revalidatePath(`/work/${project.slug}`);
  revalidatePath("/llms.txt");
  revalidatePath("/llms-full.txt");
  revalidatePath("/sitemap.xml");

  return project;
}

export async function deleteProject(slug: string): Promise<void> {
  if (firestore) {
    try {
      await firestore.collection("projects").doc(slug).delete();
    } catch (err) {
      console.error("Failed to delete project from Firestore:", err);
    }
  }

  try {
    const seedProjects = readSeedFile<Project[]>("projects.json");
    const filtered = seedProjects.filter((p) => p.slug !== slug);
    writeSeedFile("projects.json", filtered);
  } catch (err) {
    console.error("Failed to delete project from seed projects.json:", err);
  }

  revalidateTag(REVALIDATE_TAGS.projects, "max");
  revalidatePath("/");
  revalidatePath("/work");
  revalidatePath(`/work/${slug}`);
  revalidatePath("/llms.txt");
  revalidatePath("/llms-full.txt");
  revalidatePath("/sitemap.xml");
}

// ── Config Mutations ───────────────────────────────────────────────────────

export async function saveConfig(configData: unknown): Promise<SiteConfig> {
  const config = SiteConfigSchema.parse(configData);

  if (firestore) {
    try {
      await firestore.collection("site").doc("config").set(config, { merge: true });
    } catch (err) {
      console.error("Failed to write config to Firestore:", err);
    }
  }

  try {
    writeSeedFile("config.json", config);
  } catch (err) {
    console.error("Failed to update seed config.json:", err);
  }

  revalidateTag(REVALIDATE_TAGS.config, "max");
  revalidatePath("/");
  return config;
}

// ── Global Revalidation ────────────────────────────────────────────────────

export async function triggerAllRevalidations() {
  for (const t of Object.values(REVALIDATE_TAGS)) {
    revalidateTag(t, "max");
  }
  revalidatePath("/");
  revalidatePath("/work");
  revalidatePath("/writing");
  revalidatePath("/about");
  revalidatePath("/llms.txt");
  revalidatePath("/llms-full.txt");
  revalidatePath("/sitemap.xml");
  revalidatePath("/feed.xml");
  revalidatePath("/rss.xml");
}
