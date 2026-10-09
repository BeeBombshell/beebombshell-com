import fs from "fs";
import path from "path";
import type { QueryDocumentSnapshot } from "firebase-admin/firestore";
import { firestore } from "./firebase-admin";
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

function readSeedFile<T>(filename: string): T {
  const filePath = path.join(process.cwd(), "content", "seed", filename);
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw);
}

export async function getProfile(): Promise<Profile> {
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

export async function getProjects(): Promise<Project[]> {
  if (firestore) {
    try {
      const snap = await firestore.collection("projects").orderBy("order", "asc").get();
      if (!snap.empty) {
        return snap.docs.map((d: QueryDocumentSnapshot) =>
          ProjectSchema.parse({ ...d.data(), slug: d.id })
        );
      }
    } catch (err) {
      console.warn("Firestore getProjects failed, using seed fallback:", err);
    }
  }

  const raw = readSeedFile<unknown[]>("projects.json");
  return raw.map((item) => ProjectSchema.parse(item));
}

export async function getProject(slug: string): Promise<Project | null> {
  const projects = await getProjects();
  return projects.find((p) => p.slug === slug) ?? null;
}

export async function getPosts(): Promise<Post[]> {
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

export async function getPost(slug: string): Promise<Post | null> {
  const posts = await getPosts();
  return posts.find((p) => p.slug === slug) ?? null;
}

export async function getConfig(): Promise<SiteConfig> {
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
