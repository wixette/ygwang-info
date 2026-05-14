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
static/               # Static assets served as-is (images, SVGs)
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
