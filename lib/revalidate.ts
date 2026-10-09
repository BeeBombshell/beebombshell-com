export const REVALIDATE_TAGS = {
  profile: "profile",
  projects: "projects",
  posts: "posts",
  config: "config",
} as const;

export type RevalidateTag = (typeof REVALIDATE_TAGS)[keyof typeof REVALIDATE_TAGS];
