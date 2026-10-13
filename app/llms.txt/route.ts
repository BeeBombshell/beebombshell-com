import { getProfile, getProjects, getPosts } from "@/lib/queries";
import { COPY } from "@/lib/copy";

const SITE_URL = "https://beebombshell.com";

function cleanInline(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

export async function GET() {
  const [profile, projects, posts] = await Promise.all([
    getProfile(),
    getProjects(),
    getPosts(),
  ]);

  const projectsMarkdown = projects
    .map(
      (p) =>
        `- [${p.title}](${SITE_URL}/work/${p.slug}): ${cleanInline(p.blurb)}`
    )
    .join("\n");

  const postsMarkdown = posts.length
    ? posts
        .map(
          (p) =>
            `- [${p.title}](${SITE_URL}/writing/${p.slug}): ${cleanInline(p.excerpt)}`
        )
        .join("\n")
    : "- First post loading. Opinions are being formed.";

  const socialsMarkdown = profile.socials
    .map((s) => `- [${s.label}](${s.url})`)
    .join("\n");

  const body = `# ${profile.name} — ${profile.role}

> ${COPY.bio.oneLiner}

${COPY.bio.medium}

## Canonical pages

- [Home](${SITE_URL}/)
- [About](${SITE_URL}/about)
- [Work](${SITE_URL}/work)
- [Writing](${SITE_URL}/writing)
- [Full portfolio context](${SITE_URL}/llms-full.txt)

## Selected projects

${projectsMarkdown}

## Recent writing

${postsMarkdown}

## Contact and profiles

${socialsMarkdown}
- [Website](${SITE_URL})
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control":
        "public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400",
    },
  });
}
