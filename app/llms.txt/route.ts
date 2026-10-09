import { getProfile, getProjects, getPosts } from "@/lib/queries";

export async function GET() {
  const [profile, projects, posts] = await Promise.all([
    getProfile(),
    getProjects(),
    getPosts(),
  ]);

  const projectsMarkdown = projects
    .map(
      (p) =>
        `- [${p.title}](${p.links.repo || p.links.live || "#"}): ${p.blurb} (Stack: ${p.stack.join(", ")})`
    )
    .join("\n");

  const postsMarkdown = posts
    .map(
      (p) =>
        `- ${p.title} (${new Date(p.publishedAt).toLocaleDateString()}): ${p.excerpt}`
    )
    .join("\n");

  const socialsMarkdown = profile.socials
    .map((s) => `- ${s.label}: ${s.url}`)
    .join("\n");

  const body = `# ${profile.name}
> ${profile.role} · ${profile.location}
> Status: ${profile.statusText}

${profile.bio}

## Selected Projects
${projectsMarkdown}

## Writing & Dispatches
${postsMarkdown}

## Contact & Elsewhere
${socialsMarkdown}
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
