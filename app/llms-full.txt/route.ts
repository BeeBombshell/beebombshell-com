import { getProfile, getProjects, getPosts } from "@/lib/queries";
import { COPY } from "@/lib/copy";

const SITE_URL = "https://beebombshell.com";

export async function GET() {
  const [profile, projects, posts] = await Promise.all([
    getProfile(),
    getProjects(),
    getPosts(),
  ]);

  const projectsMarkdown = projects
    .map(
      (p) => `### [${p.title}](${SITE_URL}/work/${p.slug}) (${p.year})

${p.blurb}

- Stack: ${p.stack.join(", ")}
${p.links.repo ? `- Repository: ${p.links.repo}\n` : ""}${p.links.live ? `- Live site: ${p.links.live}\n` : ""}

${p.body}
`
    )
    .join("\n\n");

  const postsMarkdown = posts.length
    ? posts
        .map(
          (p) => `### [${p.title}](${SITE_URL}/writing/${p.slug})

- Published: ${p.publishedAt}
- Tags: ${p.tags.join(", ")}

${p.body}
`
        )
        .join("\n\n")
    : "First post loading. Opinions are being formed.\n";

  const socialsMarkdown = profile.socials
    .map((social) => `- ${social.label}: ${social.url}`)
    .join("\n");

  const body = `# ${profile.name} — full portfolio context

- Role: ${profile.role}
- Website: ${SITE_URL}
- Location: ${profile.location || "Remote"}
- Availability: ${profile.statusText}

## About

${COPY.bio.medium}

${COPY.bio.long.join("\n\n")}

## Projects

${projectsMarkdown}

## Writing

${postsMarkdown}

## Contact and profiles

${socialsMarkdown}
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control":
        "public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400",
    },
  });
}
