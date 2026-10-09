import { getProfile, getProjects, getPosts } from "@/lib/queries";

export async function GET() {
  const [profile, projects, posts] = await Promise.all([
    getProfile(),
    getProjects(),
    getPosts(),
  ]);

  const projectsMarkdown = projects
    .map(
      (p) => `### ${p.title} (${p.year})
- Blurb: ${p.blurb}
- Stack: ${p.stack.join(", ")}
- Links: Repo (${p.links.repo || "N/A"}), Live (${p.links.live || "N/A"})

${p.body}
`
    )
    .join("\n\n");

  const postsMarkdown = posts
    .map(
      (p) => `### ${p.title}
- Published: ${p.publishedAt}
- Tags: ${p.tags.join(", ")}

${p.body}
`
    )
    .join("\n\n");

  const body = `# ${profile.name} - Full Documentation & Portfolio Context
Role: ${profile.role}
Location: ${profile.location}
Bio: ${profile.bio}

---

## Detailed Projects
${projectsMarkdown}

---

## Full Essays & Writing
${postsMarkdown}
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
