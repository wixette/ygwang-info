# Source code of [ygwang.info](https://ygwang.info)

The site is built with [Astro](https://astro.build/) (v5) and deployed as a fully static site.

## Project structure

```
src/
├── content/          # All content (poems, essays, fictions, creations)
├── components/       # Astro components (Header, Footer, PoemRenderer, …)
├── layouts/          # Page layouts (BaseLayout, PostLayout, ListLayout)
├── pages/            # File-based routes
├── styles/           # CSS (global.css, poem.css, themes/classic.css)
└── utils/            # Shared TypeScript utilities
static/               # Static assets served as-is (site SVGs, section images)
docs/                 # Design documentation
utils/                # Python helper scripts
```

## Local development

```shell
npm install
npm run dev
```

## Build

```shell
npm run build   # outputs to dist/
npm run preview # preview the build locally
```

## Content

Content lives in `src/content/` as Markdown files with YAML frontmatter.
New posts follow the same frontmatter schema defined in `src/content/config.ts`.

Poems use a fenced code block inside `<div class="poem">` — the client-side
`PoemRenderer` component detects traditional-form poems and applies
character-level styling automatically.

Media files (images, etc.) are co-located with their Markdown source in the
same directory under `src/content/`. Reference them with relative paths such
as `./image.jpg`. A custom Astro integration in `astro.config.mjs` handles
serving them in development and copying them to `dist/` at build time.

## Embedding YouTube videos

To embed a YouTube video in a content page:

1. Name the file `.mdx` instead of `.md` (e.g. `my-post/my-post.mdx`).
2. Use the `<YouTube>` component anywhere in the body:

```mdx
<YouTube id="VIDEO_ID" title="Optional accessible title" />
```

The `id` is the YouTube video ID from the URL (`?v=VIDEO_ID`). The component
renders a responsive 16:9 iframe. No import needed — `YouTube` is injected
globally by each collection's slug page (`creations`, `fictions`, `essays`).
