/* eslint-disable @typescript-eslint/no-explicit-any */
import fs from "fs";
import path from "path";
import https from "https";
import http from "http";

interface TargetItem {
  type: "work" | "blog";
  slug: string;
  url: string;
  publishedAt: string;
  tags: string[];
}

const TARGETS: TargetItem[] = [
  // 1. Work blogs first (per user requirement)
  {
    type: "work",
    slug: "community-templating",
    url: "https://www.beebombshell.com/work/community-templating",
    publishedAt: "2025-12-10T00:00:00.000Z",
    tags: ["Work", "Product", "Architecture", "BuildShip"],
  },
  {
    type: "work",
    slug: "human-in-loop",
    url: "https://www.beebombshell.com/work/human-in-loop",
    publishedAt: "2025-12-10T00:00:00.000Z",
    tags: ["Work", "AI Agents", "Slack", "BuildShip"],
  },
  {
    type: "work",
    slug: "readme",
    url: "https://www.beebombshell.com/work/readme",
    publishedAt: "2024-09-08T00:00:00.000Z",
    tags: ["Work", "DevTools", "Documentation", "BuildShip"],
  },
  {
    type: "work",
    slug: "google-vision-api",
    url: "https://www.beebombshell.com/work/google-vision-api",
    publishedAt: "2024-05-20T00:00:00.000Z",
    tags: ["Work", "AI", "Pipelines", "BuildShip"],
  },

  // 2. Regular blogs
  {
    type: "blog",
    slug: "framer-cms-plugin",
    url: "https://www.beebombshell.com/blog/framer-cms-plugin",
    publishedAt: "2025-12-26T00:00:00.000Z",
    tags: ["Framer", "CMS", "Plugins", "Data Sync"],
  },
  {
    type: "blog",
    slug: "google-vision",
    url: "https://www.beebombshell.com/blog/google-vision",
    publishedAt: "2024-05-20T00:00:00.000Z",
    tags: ["Vision AI", "Object Detection", "Workflows", "Tutorial"],
  },
  {
    type: "blog",
    slug: "telegram-bot",
    url: "https://www.beebombshell.com/blog/telegram-bot",
    publishedAt: "2024-04-12T00:00:00.000Z",
    tags: ["Telegram", "No-Code", "Automation", "Bot"],
  },
  {
    type: "blog",
    slug: "seo-technical-blogs",
    url: "https://www.beebombshell.com/blog/seo-technical-blogs",
    publishedAt: "2024-02-10T00:00:00.000Z",
    tags: ["SEO", "AI", "YouTube", "Content Engineering"],
  },
];

function fetchUrl(urlStr: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(urlStr);
    const client = parsed.protocol === "https:" ? https : http;
    const req = client.get(
      urlStr,
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
      },
      (res) => {
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          const nextUrl = new URL(res.headers.location, urlStr).toString();
          return resolve(fetchUrl(nextUrl));
        }
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => resolve(data));
      }
    );
    req.on("error", reject);
  });
}

function downloadBinary(urlStr: string, destPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    const parsed = new URL(urlStr);
    const client = parsed.protocol === "https:" ? https : http;

    const req = client.get(
      urlStr,
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        },
      },
      (res) => {
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          const nextUrl = new URL(res.headers.location, urlStr).toString();
          return resolve(downloadBinary(nextUrl, destPath));
        }
        if (res.statusCode !== 200) {
          return reject(new Error(`Failed to download ${urlStr}: HTTP ${res.statusCode}`));
        }
        const fileStream = fs.createWriteStream(destPath);
        res.pipe(fileStream);
        fileStream.on("finish", () => {
          fileStream.close();
          resolve();
        });
      }
    );
    req.on("error", reject);
  });
}

interface ExtractedPost {
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  tags: string[];
  status: "published";
  publishedAt: string;
  updatedAt?: string;
}

function parseFlightRSC(html: string) {
  const matches = [...html.matchAll(/<script>self\.__next_f\.push\(\[1,([\s\S]*?)\]\)<\/script>/g)];
  let flightStream = "";
  for (const m of matches) {
    try {
      flightStream += JSON.parse(m[1]);
    } catch {
      // ignore
    }
  }

  const model = new Map<string, any>();
  const lines = flightStream.split("\n");
  for (const line of lines) {
    const colonIdx = line.indexOf(":");
    if (colonIdx > 0 && colonIdx < 10) {
      const id = line.substring(0, colonIdx);
      const jsonStr = line.substring(colonIdx + 1);
      try {
        model.set(id, JSON.parse(jsonStr));
      } catch {
        model.set(id, jsonStr);
      }
    }
  }

  return model;
}

function resolveRefs(node: any, model: Map<string, any>, depth = 0): any {
  if (depth > 25 || node === null || node === undefined) return node;

  if (typeof node === "string") {
    if (node.startsWith("$L")) {
      const refId = node.substring(2);
      if (model.has(refId)) {
        return resolveRefs(model.get(refId), model, depth + 1);
      }
    }
    return node;
  }

  if (Array.isArray(node)) {
    return node.map((child) => resolveRefs(child, model, depth + 1));
  }

  if (typeof node === "object") {
    const res: any = {};
    for (const key of Object.keys(node)) {
      res[key] = resolveRefs(node[key], model, depth + 1);
    }
    return res;
  }

  return node;
}

function elementToMarkdown(elem: any, model: Map<string, any>): string {
  if (!elem) return "";
  if (typeof elem === "string") {
    if (elem.startsWith("$L")) {
      const refId = elem.substring(2);
      if (model.has(refId)) {
        return elementToMarkdown(resolveRefs(model.get(refId), model), model);
      }
    }
    return elem;
  }

  if (Array.isArray(elem)) {
    if (elem[0] === "$" && elem.length >= 4) {
      const tag = elem[1];
      const props = elem[3] || {};

      // Headings
      if (props.as && typeof props.as === "string" && props.as.startsWith("h")) {
        const depth = parseInt(props.as.substring(1), 10) || 2;
        const text = elementToMarkdown(props.children, model).trim();
        return `\n\n${"#".repeat(depth)} ${text}\n\n`;
      }

      // Images
      if (props.src) {
        const alt = props.alt ? elementToMarkdown(props.alt, model).trim() : "";
        return `\n\n![${alt}](${props.src})\n\n`;
      }

      // Strong / Bold
      if (
        tag === "strong" ||
        props.as === "strong" ||
        (typeof props.className === "string" && props.className.includes("font-strong"))
      ) {
        return `**${elementToMarkdown(props.children, model).trim()}**`;
      }

      // Emphasis / Italic
      if (tag === "em" || props.as === "em") {
        return `*${elementToMarkdown(props.children, model).trim()}*`;
      }

      // Links
      if (props.href) {
        const text = elementToMarkdown(props.children, model).trim() || props.href;
        return `[${text}](${props.href})`;
      }

      // Code blocks or inline code
      if (props.code || tag === "code" || (typeof props.className === "string" && props.className.includes("InlineCode"))) {
        const codeText = elementToMarkdown(props.children || props.code, model);
        if (codeText.includes("\n")) {
          const lang = props.lang || "";
          return `\n\n\`\`\`${lang}\n${codeText}\n\`\`\`\n\n`;
        }
        return ` \`${codeText.trim()}\` `;
      }

      // List items
      if (tag === "li" || props.as === "li") {
        return `\n- ${elementToMarkdown(props.children, model).trim()}`;
      }

      // Blockquotes
      if (tag === "blockquote" || props.as === "blockquote") {
        return `\n\n> ${elementToMarkdown(props.children, model).trim()}\n\n`;
      }

      // Containers with children
      if (props.children) {
        const inner = elementToMarkdown(props.children, model);
        if (typeof props.className === "string" && (props.className.includes("mb-") || props.className.includes("mt-"))) {
          return `\n\n${inner.trim()}\n\n`;
        }
        return inner;
      }
      return "";
    }
    return elem.map((item) => elementToMarkdown(item, model)).join("");
  }

  return "";
}

async function extractPost(item: TargetItem): Promise<ExtractedPost> {
  console.log(`\nFetching [${item.type.toUpperCase()}] ${item.slug} from ${item.url}...`);
  const html = await fetchUrl(item.url);

  // 1. Metadata
  const titleMatch = html.match(/<title>([^<]+)<\/title>/);
  const descMatch = html.match(/name="description" content="([^"]+)"/);

  let rawTitle = (titleMatch ? titleMatch[1] : item.slug)
    .replace(/&amp;/g, "&")
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"');

  if (rawTitle.includes(" · ")) {
    rawTitle = rawTitle.split(" · ")[0].trim();
  }

  const rawExcerpt = (descMatch ? descMatch[1] : "")
    .replace(/&amp;/g, "&")
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"');

  // 2. Flight Model
  const model = parseFlightRSC(html);

  // Find candidate content array
  let contentKey: string | null = null;
  for (const [k, v] of model.entries()) {
    if (Array.isArray(v) && v.length > 5) {
      const serialized = JSON.stringify(v);
      if (
        serialized.includes("children") &&
        (serialized.includes("Overview") ||
          serialized.includes("Finding the Right Extension Point") ||
          serialized.includes("as\":\"h2") ||
          serialized.includes("as\\\":\\\"h2"))
      ) {
        contentKey = k;
        break;
      }
    }
  }

  let body = "";
  if (contentKey) {
    const rawTree = model.get(contentKey);
    const resolvedTree = resolveRefs(rawTree, model);
    body = elementToMarkdown(resolvedTree, model)
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  // 3. Collect and Download Images
  const imageRegex = /!\[([^\]]*)\]\(((\/images\/[^)]+))\)/g;
  const foundImages = [...body.matchAll(imageRegex)].map((m) => m[2]);
  const uniqueImages = [...new Set(foundImages)];

  console.log(`  Found ${uniqueImages.length} images to sync locally.`);
  for (const imgUrl of uniqueImages) {
    const localDest = path.join(process.cwd(), "public", imgUrl);
    if (!fs.existsSync(localDest)) {
      const remoteUrl = `https://www.beebombshell.com${imgUrl}`;
      try {
        console.log(`    Downloading asset: ${remoteUrl} -> ${imgUrl}`);
        await downloadBinary(remoteUrl, localDest);
      } catch (err: any) {
        console.error(`    Failed to download image ${remoteUrl}:`, err.message);
      }
    } else {
      console.log(`    Asset already cached: ${imgUrl}`);
    }
  }

  return {
    slug: item.slug,
    title: rawTitle,
    excerpt: rawExcerpt,
    body,
    tags: item.tags,
    status: "published",
    publishedAt: item.publishedAt,
    updatedAt: item.publishedAt,
  };
}

async function runImport() {
  console.log("==================================================");
  console.log(" BeeBombshell Automated Blog & Case-Study Import  ");
  console.log("==================================================");

  const extractedPosts: ExtractedPost[] = [];

  for (const target of TARGETS) {
    try {
      const post = await extractPost(target);
      extractedPosts.push(post);
      console.log(`✓ Successfully extracted "${post.title}" (${post.body.length} chars)`);
    } catch (err: any) {
      console.error(`✗ Error extracting ${target.slug}:`, err);
    }
  }

  console.log(`\nExtracted total ${extractedPosts.length} posts.`);

  // 1. Update content/seed/posts.json
  // Work blogs are placed first (specimen tier), followed by regular blogs
  const postsJsonPath = path.join(process.cwd(), "content", "seed", "posts.json");
  fs.writeFileSync(postsJsonPath, JSON.stringify(extractedPosts, null, 2) + "\n", "utf-8");
  console.log(`✓ Updated ${postsJsonPath} with ${extractedPosts.length} posts.`);

  // 2. Also ensure work case studies are reflected in projects.json for /work expandable view
  const projectsJsonPath = path.join(process.cwd(), "content", "seed", "projects.json");
  if (fs.existsSync(projectsJsonPath)) {
    const existingProjects: any[] = JSON.parse(fs.readFileSync(projectsJsonPath, "utf-8"));
    const workPosts = extractedPosts.filter((p) =>
      ["community-templating", "human-in-loop", "readme", "google-vision-api"].includes(p.slug)
    );

    for (const wp of workPosts) {
      const existingIdx = existingProjects.findIndex((pr) => pr.slug === wp.slug);
      const projectItem = {
        slug: wp.slug,
        title: wp.title,
        blurb: wp.excerpt,
        body: wp.body,
        stack: wp.tags,
        links: {
          live: `https://beebombshell.com/work/${wp.slug}`,
        },
        year: new Date(wp.publishedAt).getFullYear(),
        order: existingIdx >= 0 ? existingProjects[existingIdx].order : existingProjects.length + 1,
        featured: true,
      };

      if (existingIdx >= 0) {
        existingProjects[existingIdx] = { ...existingProjects[existingIdx], ...projectItem };
      } else {
        existingProjects.push(projectItem);
      }
    }

    fs.writeFileSync(projectsJsonPath, JSON.stringify(existingProjects, null, 2) + "\n", "utf-8");
    console.log(`✓ Updated ${projectsJsonPath} with work case studies.`);
  }

  console.log("\n✓ Extraction and sync completed successfully!");
}

runImport().catch((err) => {
  console.error("Fatal error during import:", err);
  process.exit(1);
});
