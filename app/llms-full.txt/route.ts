import { getProfile, getProjects, getPosts } from "@/lib/queries";
import { COPY } from "@/lib/copy";

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

  const postsMarkdown = posts.length
    ? posts
        .map(
          (p) => `### ${p.title}
- Published: ${p.publishedAt}
- Tags: ${p.tags.join(", ")}

${p.body}
`
        )
        .join("\n\n")
    : "First post loading. Opinions are being formed.\n";

  const body = `# ${profile.name} - Full Documentation & Portfolio Context
Role: ${profile.role}
Bio: ${COPY.bio.medium}

${COPY.bio.long.join("\n\n")}

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
