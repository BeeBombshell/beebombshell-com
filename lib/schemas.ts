import { z } from "zod";

export const SocialLinkSchema = z.object({
  label: z.string(),
  url: z.string().url(),
  handle: z.string().optional(),
});

export const ProfileSchema = z.object({
  name: z.string(),
  role: z.string(),
  location: z.string().optional().default(""),
  bio: z.string(),
  socials: z.array(SocialLinkSchema),
  statusText: z.string().default("open for chats"),
});

export function normalizeTweetUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  const clean = url.split("?")[0].trim();
  const match = clean.match(/^https?:\/\/(?:x|twitter)\.com\/bee_bombshell\/status\/(\d+)$/i);
  if (!match) {
    const msg = `Invalid tweet URL: "${url}". Must match https://x.com/bee_bombshell/status/<id>`;
    if (process.env.NODE_ENV === "development") {
      console.warn(`[Views] ${msg}`);
      return undefined;
    }
    throw new Error(msg);
  }
  return `https://x.com/bee_bombshell/status/${match[1]}`;
}

export const TakeSchema = z.object({
  id: z.string(),
  text: z.string(),
  url: z.string().optional().transform((val) => normalizeTweetUrl(val)),
  date: z.string().optional(),
  order: z.number().int().optional().default(0),
});


export const ProjectSchema = z.object({
  slug: z.string(),
  title: z.string(),
  blurb: z.string(),
  body: z.string(),
  stack: z.array(z.string()),
  links: z.object({
    repo: z.string().url().optional(),
    live: z.string().url().optional(),
  }),
  year: z.number().int(),
  stars: z.number().int().optional(),
  order: z.number().int().default(0),
  featured: z.boolean().default(false),
});

export const PostSchema = z.object({
  slug: z.string(),
  title: z.string(),
  excerpt: z.string(),
  body: z.string(),
  tags: z.array(z.string()),
  status: z.enum(["draft", "published"]).default("draft"),
  publishedAt: z.string(), // ISO date string
  updatedAt: z.string().optional(),
});

export const SiteConfigSchema = z.object({
  availability: z.enum(["open", "closed"]).default("open"),
  bookingUrl: z.string().url().optional(),
  bookingProvider: z.enum(["cal", "google", "custom"]).default("cal"),
  featureFlags: z.record(z.string(), z.boolean()).default({}),
});

export type SocialLink = z.infer<typeof SocialLinkSchema>;
export type Profile = z.infer<typeof ProfileSchema>;
export type Take = z.infer<typeof TakeSchema>;
export type Project = z.infer<typeof ProjectSchema>;
export type Post = z.infer<typeof PostSchema>;
export type SiteConfig = z.infer<typeof SiteConfigSchema>;
