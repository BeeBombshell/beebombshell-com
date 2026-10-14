import { marked } from "marked";
import { codeToHtml } from "shiki";

export interface HeadingItem {
  id: string;
  text: string;
  level: number;
}

export interface MarkdownRenderResult {
  html: string;
  headings: HeadingItem[];
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Parses markdown body, extracts table of contents headings,
 * and highlights code blocks using Shiki with dual dark/light themes.
 */
export async function renderMarkdown(markdown: string): Promise<MarkdownRenderResult> {
  "use cache";
  const headings: HeadingItem[] = [];
  const renderer = new marked.Renderer();

  // Custom heading renderer that tracks TOC and adds anchor links
  renderer.heading = ({ tokens, depth }) => {
    const rawText = tokens.map((t) => t.raw).join("");
    // strip inline markdown formatting from title text
    const text = rawText.replace(/[*_`]/g, "");
    const id = slugify(text);

    if (depth >= 2 && depth <= 3) {
      headings.push({ id, text, level: depth });
    }

    return `
      <h${depth} id="${id}" class="group relative scroll-mt-24">
        <a href="#${id}" class="heading-anchor absolute -left-5 opacity-0 group-hover:opacity-60 transition-opacity text-[var(--mut)] no-underline" aria-hidden="true">#</a>
        ${tokens.map((t) => t.raw).join("")}
      </h${depth}>
    `;
  };

  // Custom image & video renderer: renders videos for .mp4/.webm and figures with captions
  renderer.image = ({ href, text, title }) => {
    const isVideo = /\.(mp4|webm|mov|ogg)$/i.test(href);
    const caption = text || title || "";
    if (isVideo) {
      return `
        <figure class="my-8">
          <video
            src="${href}"
            controls
            autoplay
            loop
            muted
            playsinline
            class="w-full rounded-xl border border-[var(--line)] bg-black/5 shadow-sm block"
          ></video>
          ${caption ? `<figcaption class="mt-2.5 text-center text-xs font-mono text-[var(--mut)]">${caption}</figcaption>` : ""}
        </figure>
      `;
    }

    return `
      <figure class="my-8">
        <img
          src="${href}"
          alt="${caption}"
          class="w-full h-auto rounded-xl border border-[var(--line)] shadow-sm block"
        />
        ${caption ? `<figcaption class="mt-2.5 text-center text-xs font-mono text-[var(--mut)]">${caption}</figcaption>` : ""}
      </figure>
    `;
  };

  // Custom link renderer with rel="noopener noreferrer" for external links
  renderer.link = ({ href, title, tokens }) => {
    const text = tokens.map((t) => t.raw).join("");
    const isExternal = href.startsWith("http://") || href.startsWith("https://");
    const extAttrs = isExternal ? ' target="_blank" rel="noopener noreferrer"' : "";
    return `<a href="${href}"${title ? ` title="${title}"` : ""}${extAttrs} class="underline underline-offset-4 text-[var(--fg)] decoration-[var(--line)] hover:decoration-[var(--fg)] transition-colors">${text}</a>`;
  };

  // Custom hr divider
  renderer.hr = () => {
    return `<hr class="my-10 border-0 border-t border-[var(--line)]" />`;
  };

  // Extract all code blocks and highlight them asynchronously
  const codeBlocks: { placeholder: string; code: string; lang: string }[] = [];
  let blockIndex = 0;

  renderer.code = ({ text, lang }) => {
    const placeholder = `%%SHIKI_CODE_BLOCK_${blockIndex++}%%`;
    codeBlocks.push({ placeholder, code: text, lang: lang || "plaintext" });
    return placeholder;
  };

  // Custom blockquote styling
  renderer.blockquote = ({ tokens }) => {
    const body = marked.parser(tokens);
    return `<blockquote class="border-l-2 border-[var(--fg)] pl-4 italic text-[var(--mut)] my-6">${body}</blockquote>`;
  };

  // Custom table styling
  renderer.table = ({ header, rows }) => {
    const headerHtml = header
      .map(
        (cell) =>
          `<th class="border-b border-[var(--line)] py-2 px-3 text-left font-mono text-xs uppercase tracking-wider text-[var(--fg)]">${cell.tokens.map((t) => t.raw).join("")}</th>`
      )
      .join("");

    const rowsHtml = rows
      .map(
        (row) =>
          `<tr class="border-b border-[var(--line)]/50 hover:bg-[var(--line)]/20 transition-colors">${row
            .map(
              (cell) =>
                `<td class="py-2.5 px-3 text-sm text-[var(--mut)]">${cell.tokens.map((t) => t.raw).join("")}</td>`
            )
            .join("")}</tr>`
      )
      .join("");

    return `
      <div class="my-6 overflow-x-auto rounded-xl border border-[var(--line)]">
        <table class="w-full text-left border-collapse">
          <thead><tr>${headerHtml}</tr></thead>
          <tbody>${rowsHtml}</tbody>
        </table>
      </div>
    `;
  };

  // Initial parse into HTML
  let rawHtml = await marked.parse(markdown, { renderer, async: true });

  // Highlight all code blocks with Shiki
  for (const block of codeBlocks) {
    let highlightedHtml: string;
    try {
      highlightedHtml = await codeToHtml(block.code, {
        lang: block.lang || "plaintext",
        themes: {
          light: "github-light",
          dark: "github-dark",
        },
        defaultColor: false,
      });
    } catch {
      // Fallback for unknown language
      highlightedHtml = await codeToHtml(block.code, {
        lang: "plaintext",
        themes: {
          light: "github-light",
          dark: "github-dark",
        },
        defaultColor: false,
      });
    }

    const wrappedBlock = `
      <div class="code-block-wrapper my-6 rounded-xl border border-[var(--line)] bg-[var(--line)]/30 backdrop-blur-sm overflow-hidden text-sm font-mono">
        <div class="flex items-center justify-between px-4 py-2 border-b border-[var(--line)] text-[11px] text-[var(--mut)]">
          <span class="uppercase tracking-wider font-semibold">${block.lang || "code"}</span>
          <button
            type="button"
            class="copy-code-btn px-2 py-0.5 rounded text-[10px] hover:text-[var(--fg)] hover:bg-[var(--line)] transition-colors cursor-pointer"
            data-code="${encodeURIComponent(block.code)}"
          >
            Copy
          </button>
        </div>
        <div class="p-4 overflow-x-auto">
          ${highlightedHtml}
        </div>
      </div>
    `;

    rawHtml = rawHtml.replace(block.placeholder, wrappedBlock);
  }

  return {
    html: rawHtml,
    headings,
  };
}
