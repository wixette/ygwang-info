# ygwang.info v5 — Redesign Document

---

## 1. Framework Decision: Astro over Hugo

**Verdict: Migrate to Astro.**

Hugo is excellent for content-only sites, but all Stage 2 features — interactive JS islands, MDX-based rich-media posts, extensible content layout plugins, and flexible per-category data queries — push against Hugo's hard boundaries. Hugo's templating model has no component abstraction, no native MDX, and no way to co-locate client-side JS with content without hacks. The workarounds (Go template partials, `extend_head.html` scripts, raw HTML in Markdown with `unsafe: true`) accumulate technical debt with every new feature added.

Astro resolves every pain point:

| Requirement | Hugo (v4.1) | Astro (v5) |
|---|---|---|
| Per-category prev/next nav | Requires taxonomy hacks; missing for 3 of 4 categories | `getStaticPaths()` + sorted Collection → trivial |
| Flexible category index (filter, group by year/form) | Not possible without JS build pipeline | Client-side island or static pre-grouped data |
| Embed canvas / interactive demo in a post | Raw `<script>` tag in Markdown, no isolation | MDX `import` + `<Component client:load />` |
| LaTeX math | Not supported natively | `remark-math` + `rehype-katex` (server-rendered, zero runtime JS) |
| Photo gallery / slideshow | Raw HTML in Markdown | MDX `<Gallery>` component |
| Extensible custom content layouts | Not possible | Astro layout plugin components, declared via frontmatter |
| Multiple visual design themes | Partial via CSS vars; theme change requires CSS edit | CSS custom properties + `data-theme`; switch by config |
| TypeScript throughout | Not applicable | Native |

Astro outputs a fully static site (zero-JS pages by default; JS only in explicit "islands"). The build output is identical in nature to Hugo's `public/` — a folder of HTML/CSS/JS files deployable anywhere.

---

## 2. Stage 1 — Astro Migration (Feature Parity)

**Goal:** Reproduce the full v4.1 site in Astro with identical content, URLs, and visual design. No new features yet. Lay the schema and infrastructure groundwork for Stage 2.

### 2.1 Project Structure

```
/
├── src/
│   ├── content/
│   │   ├── config.ts              # Zod schemas for all collections
│   │   ├── poems/                 # poem_0000.md … poem_0161.md (content unchanged)
│   │   ├── essays/                # subdirectory-per-essay (content unchanged)
│   │   ├── fictions/              # subdirectory-per-fiction (content unchanged)
│   │   └── creations/             # subdirectory-per-creation (content unchanged)
│   ├── layouts/
│   │   ├── BaseLayout.astro       # <html>, head, global CSS, GA4
│   │   ├── PostLayout.astro       # single post; dispatches to layout plugins
│   │   └── ListLayout.astro       # section index pages
│   ├── components/
│   │   ├── Header.astro
│   │   ├── Footer.astro
│   │   ├── PoemRenderer.astro     # replaces poem_renderer.js (client:load)
│   │   ├── ProfileHome.astro      # homepage profile mode
│   │   └── layouts/               # content layout plugins (Stage 2 extended here)
│   │       └── DefaultLayout.astro
│   ├── pages/
│   │   ├── index.astro            # homepage
│   │   ├── poems/
│   │   │   ├── index.astro        # /poems/
│   │   │   └── [slug].astro       # /poems/poem_0000/ etc.
│   │   ├── essays/[...slug].astro
│   │   ├── fictions/[...slug].astro
│   │   └── creations/[...slug].astro
│   ├── styles/
│   │   ├── themes/
│   │   │   └── classic.css        # v4.1 visual design as named theme
│   │   ├── global.css             # layout, typography, post styles (ported from PaperMod overrides)
│   │   └── poem.css               # poem rendering styles (ported unchanged)
│   └── utils/
│       └── collections.ts         # shared query helpers (sort, getSiblings, groupByYear)
├── public/
│   └── images/                    # seal SVGs (unchanged)
├── astro.config.mjs
└── package.json
```

### 2.2 Content Collections Schema

```typescript
// src/content/config.ts
import { defineCollection, z } from 'astro:content';

const POEM_FORMS = [
  '古近体', '词', '现代诗', '偈子', '骈文', '顺口溜', '其他'
] as const;

const poemSchema = z.object({
  title:  z.string(),
  author: z.string().default('王咏刚'),
  date:   z.date(),
  draft:  z.boolean().default(false),
  form:   z.enum(POEM_FORMS).default('其他'),  // new field; backfilled during migration
  layout: z.string().optional(),               // content layout plugin name
});

const baseSchema = z.object({
  title:  z.string(),
  author: z.string().default('王咏刚'),
  date:   z.date(),
  draft:  z.boolean().default(false),
  layout: z.string().optional(),               // content layout plugin name
});

export const collections = {
  poems:     defineCollection({ type: 'content', schema: poemSchema }),
  essays:    defineCollection({ type: 'content', schema: baseSchema }),
  fictions:  defineCollection({ type: 'content', schema: baseSchema }),
  creations: defineCollection({ type: 'content', schema: baseSchema }),
};
```

**`form` field** classifies each poem for index filtering. Allowed values:

| Value | Meaning |
|-------|---------|
| `古近体` | Classical regulated verse (律诗、绝句、古风, following 平水韵 or 今韵) |
| `词` | Ci — classical song-lyric form |
| `现代诗` | Modern free verse |
| `偈子` | Buddhist / Chan verse |
| `骈文` | Parallel prose |
| `顺口溜` | Humorous doggerel |
| `其他` | Default / uncategorized |

All 162 existing poems must have `form` backfilled in their frontmatter as part of Stage 1. This is the only mandatory content edit during the migration.

**`layout` field** (optional, all collections) names a layout plugin component. When absent, `DefaultLayout` is used. Details in Section 3.3.5.

All existing `.md` frontmatter is TOML — Astro supports TOML frontmatter natively. No format conversion required.

### 2.3 URL Preservation

All existing URLs are preserved exactly:

| URL | Astro route |
|-----|-------------|
| `/poems/poem_0000/` | `src/pages/poems/[slug].astro` |
| `/essays/paris/` | `src/pages/essays/[...slug].astro` |
| `/fictions/meowl/` | `src/pages/fictions/[...slug].astro` |
| `/creations/doors/` | `src/pages/creations/[...slug].astro` |

### 2.4 Poem Renderer Migration

The v4.1 `poem_renderer.js` becomes a `<PoemRenderer>` Astro component with `client:load`. The JavaScript logic (`isTraditionalPoem`, `renderTraditionalPoem`, the punctuation regex) is moved unchanged into the component's `<script>` block. The `.poem` CSS class contract and the red-underline-per-character rendering remain identical.

### 2.5 Visual Design Parity

All v4.1 CSS is ported directly. The PaperMod theme dependency is **dropped** — all CSS previously inherited from PaperMod is ported into the project's own stylesheets, giving full ownership of the design. This is a prerequisite for Stage 3.

The ported v4.1 visual design becomes the **`classic` theme** under the Stage 3 theme architecture, so the migration already establishes the multi-theme file structure.

### 2.6 Dependencies

| Package | Purpose |
|---------|---------|
| `astro` | Framework |
| `@astrojs/mdx` | MDX support (for Stage 2 new content) |
| `@astrojs/sitemap` | Auto-generate sitemap.xml |
| `@astrojs/rss` | RSS feed |
| `remark-math` + `rehype-katex` | LaTeX math; wired up in Stage 1 even if unused yet |

No CSS framework. No React/Vue/Svelte — Astro components only.

### 2.7 Migration Checklist

- [ ] All 162 poems render correctly; poem renderer detects traditional/modern
- [ ] `form` field backfilled in all poem frontmatter
- [ ] All essays, fictions, creations render correctly (embedded images, raw HTML)
- [ ] Homepage profile mode (seal image, title couplet, buttons, social icons)
- [ ] Light/dark auto-theme toggle works
- [ ] Breadcrumbs, post nav links (poems only at this stage), word count, page numbers
- [ ] RSS feed at `/rss.xml`; per-section RSS
- [ ] `robots.txt` and `sitemap.xml` generated
- [ ] Google Analytics 4 tag included
- [ ] All existing URLs resolve (no 404 regressions)

---

## 3. Stage 2 — New Features

### 3.1 Per-Category Post Navigation (Prev / Next)

In v4.1, only `/poems/*` pages have prev/next links. In Astro, this is uniform across all four categories via a shared utility:

```typescript
// src/utils/collections.ts
export function getSiblings<T extends { data: { date: Date } }>(
  entries: T[], current: T
): { prev: T | null; next: T | null } {
  const sorted = [...entries].sort(
    (a, b) => a.data.date.getTime() - b.data.date.getTime()
  );
  const idx = sorted.findIndex(e => e.id === current.id);
  return {
    prev: idx > 0 ? sorted[idx - 1] : null,
    next: idx < sorted.length - 1 ? sorted[idx + 1] : null,
  };
}
```

Each `[slug].astro` page calls this with its own collection's entries. Nav links appear at the bottom of every post across all categories.

### 3.2 Enhanced Category Index — Poems

The current flat paginated list (10/page) is inadequate for 162 poems spanning 1995–2025. The v5 poems index provides:

**Year-grouped layout:** Poems grouped by year, newest first. Each group shows the count and is collapsible.

```
2025  (4)
  • 标题  ·  现代诗  ·  2025-03-01

2024  (8)
  • 标题  ·  古近体  ·  2024-11-15
  ...

1995  (3)
  • 舞进尘埃  ·  现代诗  ·  1995-05-01
```

**Form filter:** A row of filter chips — 全部 / 古近体 / 词 / 现代诗 / 偈子 / 骈文 / 顺口溜. Clicking a chip hides all entries of other forms. Implemented as a minimal client-side JS island, no external library.

**Title search:** A text `<input>` filters entries live by title. Orthogonal to the form filter (both can be active simultaneously).

For essays, fictions, and creations, the existing date-sorted list with excerpt summaries is sufficient given the small item count.

### 3.3 Rich-Media Posts

New content can be authored in `.mdx` files. Existing `.md` files do not change. MDX files are processed through the same Content Collections pipeline — no separate routing required.

#### 3.3.1 Photo Gallery / Slideshow

```mdx
import ImageGallery from '@/components/ImageGallery.astro';

<ImageGallery images={[
  { src: './img1.jpg', caption: '描述' },
  { src: './img2.jpg', caption: '描述' },
]} />
```

Renders as a CSS grid by default. A `slideshow` prop switches to a CSS `scroll-snap` track. No external library.

#### 3.3.2 Video Embeds

```mdx
import YouTube from '@/components/YouTube.astro';
<YouTube id="dQw4w9WgXcQ" />

import Video from '@/components/Video.astro';
<Video src="./demo.mp4" />
```

Semantic `<iframe>` / `<video>` HTML with aspect-ratio CSS. No JS library.

#### 3.3.3 Interactive JS Canvas / Demo

Each interactive demo is a self-contained Astro component with `client:load`. Its `<script>` runs only on pages that include it.

```mdx
import CanvasDemo from '@/demos/MySketch.astro';
<CanvasDemo client:load />
```

The component contains its `<canvas>` and setup script. Full TypeScript. Multiple independent demos can appear in one post.

#### 3.3.4 LaTeX Math

`remark-math` + `rehype-katex` wired into `astro.config.mjs`. KaTeX renders math server-side to static HTML — only the KaTeX CSS needs to load, zero runtime JS. Works in `.md` and `.mdx` files.

```
行列式 $\det(A)$，或块公式：

$$
\nabla \times \mathbf{B} = \mu_0 \mathbf{J} + \mu_0\varepsilon_0 \frac{\partial \mathbf{E}}{\partial t}
$$
```

#### 3.3.5 Extensible Content Layout Plugin System

Stage 2's core architectural feature. The goal is not a single layout (e.g. vertical text) but a **plugin system** that allows any number of post-level rendering modes to be added incrementally, without touching core infrastructure.

**Concept:** A "layout plugin" is an Astro component that takes over the full rendering of a post's content area. Plugins live in `src/components/layouts/`. A post declares its plugin via the `layout` frontmatter field.

```toml
# A poem rendered in vertical columns
layout = "vertical-poem"

# A fiction entry formatted as a screenplay
layout = "screenplay"
```

`PostLayout.astro` reads the `layout` field and dynamically selects the component:

```astro
---
// PostLayout.astro (simplified)
const layoutName = entry.data.layout ?? 'default';
const LayoutPlugin = await import(`../components/layouts/${layoutName}.astro`);
---
<LayoutPlugin.default content={entry.body} data={entry.data} />
```

**What a layout plugin consists of:**
- One `.astro` file in `src/components/layouts/`
- A typed props interface (`content: string`, `data: CollectionEntry['data']`)
- Its own scoped `<style>` (CSS isolated to the component)
- Optionally a `<script>` for client-side behavior (`client:load` if interactive)
- A `README` comment at the top describing supported content format

**Adding a new plugin = adding one file.** No changes to routing, schemas, or `PostLayout.astro`.

**MDX escape hatch:** For highly custom or one-off layouts, `.mdx` posts can import a layout component directly instead of using the frontmatter field:

```mdx
import VerticalPoem from '@/components/layouts/VerticalPoem.astro';
<VerticalPoem>
野有蔓草，零露漙兮。
有美一人，清扬婉兮。
</VerticalPoem>
```

**Built-in layout plugins shipped with v5:**

| Plugin name | Description |
|-------------|-------------|
| `default` | Standard horizontal prose + the existing poem renderer logic |
| `vertical-poem` | CSS `writing-mode: vertical-rl`; renders poem in right-to-left vertical columns |
| `screenplay` | Screenplay formatting: scene headings (INT./EXT.), character names centered, dialogue indented |
| `image-gallery` | Full-bleed image grid or slideshow as the primary post content |

**New content categories:** A layout plugin can accompany a new top-level content category. For example, `/screenplays/` would be a new Astro Content Collection with a `screenplay`-specific schema (cast, runtime, genre) and `layout = "screenplay"` as its default. New categories follow the same pattern as existing ones: collection schema → `src/pages/{category}/[slug].astro` → optional new nav menu item.

---

## 4. Stage 3 — Visual Design System

### 4.1 Theme Architecture

The v4.1 CSS custom properties approach is extended. Each visual theme is one CSS file in `src/styles/themes/`. The active theme is set via `data-theme` on `<html>`; light/dark is the `.dark` class, orthogonal to theme selection.

```css
/* src/styles/themes/classic.css — v4.1 visual design */
[data-theme="classic"] {
  --theme: rgb(240, 240, 240);
  --entry: rgb(255, 255, 255);
  --primary: rgb(30, 30, 30);
  --underline-red: rgb(192, 0, 0);
  /* ... all tokens ... */
}
[data-theme="classic"].dark {
  --theme: rgb(29, 30, 32);
  --entry: rgb(46, 46, 51);
  --underline-red: rgb(232, 0, 0);
  /* ... dark overrides ... */
}

/* src/styles/themes/v5.css — new visual design (Stage 3) */
[data-theme="v5"] { ... }
[data-theme="v5"].dark { ... }
```

**Theme selection is developer-config only.** There is no runtime theme-picker UI. The active theme name is set in a single config constant (`src/config.ts` or `astro.config.mjs`), which `BaseLayout.astro` reads to set `data-theme` on `<html>`. Switching the whole site to a new visual design = changing one config value and rebuilding.

Light/dark auto-detection (matching `prefers-color-scheme`) is preserved, with the same manual toggle available in the header. This toggle only switches the `.dark` class, not the theme.

**Adding a new theme:** create one CSS file in `src/styles/themes/`, define all CSS tokens, update the config constant. Component markup and layout structure are theme-agnostic throughout.

### 4.2 New v5 Visual Design

The specific aesthetic for the v5 theme will be designed and implemented collaboratively in the Stage 3 phase. The infrastructure defined above (named themes, CSS token files, `data-theme` attribute) means the design work is fully decoupled from the structural implementation in Stages 1 and 2.

What is fixed now: the v5 theme will be implemented as `src/styles/themes/v5.css`, replacing `classic` as the default config value once finalized.

### 4.3 Typography

**Body text:** System CJK font stack — no webfonts. System fonts render correctly, load instantly, and avoid the 5–10 MB per-weight penalty of CJK webfont files.

```css
font-family: "PingFang SC", "Noto Serif CJK SC", "Source Han Serif SC",
             "STSong", serif;
```

**Title / display text (optional):** If a good display font is wanted for headings, Chinese webfonts can be made practical via `unicode-range` subsetting. The technique: generate a subset font file containing only the characters actually present in the site's titles (a known, finite set), then declare it with `unicode-range` so it loads only on pages that use those characters. Tools: `fonttools/pyftsubset` (offline) or on-demand subsetting services. This is worth exploring during Stage 3 design work; it is not a Stage 1 or Stage 2 dependency.

---

## 5. Staging and Dependencies

```
Stage 1: Astro migration
  └─ Deliverable: feature-identical site on Astro, PaperMod dropped
  └─ Includes: poem form backfill, layout plugin infrastructure (DefaultLayout only),
               classic theme CSS file, remark-math wired up
  └─ Prerequisite for: everything else

Stage 2: New features
  └─ Prerequisite: Stage 1 complete
  └─ Rollout order (recommended):
       1. Per-category prev/next nav (quick win, pure Astro data)
       2. Enhanced poems index (year groups + form filter + title search)
       3. Rich-media components (Gallery, YouTube, Video, Canvas, LaTeX)
       4. Layout plugin system + built-in plugins (vertical-poem, screenplay, image-gallery)
       5. New content categories (e.g. /screenplays/) as needed

Stage 3: Visual design
  └─ Independent of Stage 2; can begin design exploration during Stage 2
  └─ Deliverable: v5.css theme file + typography decisions
  └─ Rollout: new theme developed alongside classic, then set as default in config
```
