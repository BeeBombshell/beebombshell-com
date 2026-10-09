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
      (p) =>
        `- [${p.title}](${p.links.repo || p.links.live || `https://github.com/BeeBombshell/${p.slug}`}): ${p.blurb}`
    )
    .join("\n");

  const postsMarkdown = posts.length
    ? posts
        .map(
          (p) =>
            `- [${p.title}](https://beebombshell.com/writing/${p.slug}): ${p.excerpt}`
        )
        .join("\n")
    : "- First post loading. Opinions are being formed.";

  const socialsMarkdown = profile.socials
    .map((s) => `- [${s.label}](${s.url})`)
    .join("\n");

  const body = `# ${profile.name}
> ${COPY.bio.oneLiner}

${COPY.bio.medium}

## Projects
${projectsMarkdown}

## Writing
${postsMarkdown}

## Elsewhere
${socialsMarkdown}
- [Site](https://beebombshell.com)
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
