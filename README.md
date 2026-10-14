# BeeBombshell Portfolio

Bhavya Verma's portfolio and writing site, built with Next.js 16, React 19, Tailwind CSS, Motion, and a custom canvas particle system.

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Quality checks

```bash
npm run lint
npm run typecheck
npm run build
```

## Content

The site is file-backed and does not require a database.

- Posts: `content/seed/posts.json`
- Projects: `content/seed/projects.json`
- Profile: `content/seed/profile.json`
- Site configuration: `content/seed/config.json`
- Unsolicited takes: `content/seed/takes.json`

Long-form Markdown source files may also live in `content/blogs/`, but published post metadata and bodies are read from `content/seed/posts.json`.

## Deployment

Deploy the repository as a standard Next.js application. No environment variables are required for the current file-backed setup.
