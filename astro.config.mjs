import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { visit } from 'unist-util-visit';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const contentDir = path.join(__dirname, 'src', 'content');

const IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.avif']);
const MIME = {
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.png': 'image/png', '.gif': 'image/gif',
  '.webp': 'image/webp', '.svg': 'image/svg+xml',
  '.avif': 'image/avif',
};

// Remark plugin: rewrites ./image.ext paths in co-located markdown to absolute URLs.
// Works for both markdown image nodes and raw HTML <img> tags.
function remarkContentImages() {
  return function (tree, vfile) {
    const filePath = vfile.history[0];
    if (!filePath || !filePath.startsWith(contentDir)) return;

    // e.g. "essays/paris" for src/content/essays/paris/paris.md
    const relDir = path.dirname(path.relative(contentDir, filePath)).replace(/\\/g, '/');

    function rewriteUrl(url) {
      if (!url.startsWith('./')) return url;
      const [urlPart, ...hashParts] = url.split('#');
      const ext = path.extname(urlPart).toLowerCase();
      if (!IMAGE_EXTS.has(ext)) return url;
      const filename = urlPart.slice(2); // strip "./"
      const newPath = '/' + relDir + '/' + filename;
      return hashParts.length > 0 ? newPath + '#' + hashParts.join('#') : newPath;
    }

    visit(tree, 'image', (node) => {
      node.url = rewriteUrl(node.url);
    });

    // Handle raw HTML nodes (e.g. <img src="./image.jpg#center">)
    visit(tree, 'html', (node) => {
      node.value = node.value.replace(/src="([^"]+)"/g, (match, src) => {
        return `src="${rewriteUrl(src)}"`;
      });
    });
  };
}

// Astro integration: dev server middleware + build-time copy of content images.
function contentImagesIntegration() {
  return {
    name: 'content-images',
    hooks: {
      'astro:config:setup': ({ updateConfig }) => {
        updateConfig({
          vite: {
            plugins: [{
              name: 'serve-content-images',
              configureServer(server) {
                server.middlewares.use((req, res, next) => {
                  // Strip query string and hash from URL
                  const url = (req.url || '').split('?')[0].split('#')[0];
                  const ext = path.extname(url).toLowerCase();
                  if (!IMAGE_EXTS.has(ext)) return next();

                  const filePath = path.join(contentDir, url);
                  if (fs.existsSync(filePath)) {
                    res.setHeader('Content-Type', MIME[ext] || 'application/octet-stream');
                    fs.createReadStream(filePath).pipe(res);
                    return;
                  }
                  next();
                });
              },
            }],
          },
        });
      },

      'astro:build:done': ({ dir }) => {
        const distDir = fileURLToPath(dir);

        function copyDir(srcDir, relBase) {
          const entries = fs.readdirSync(srcDir, { withFileTypes: true });
          for (const entry of entries) {
            const srcPath = path.join(srcDir, entry.name);
            const relPath = relBase ? relBase + '/' + entry.name : entry.name;
            if (entry.isDirectory()) {
              copyDir(srcPath, relPath);
            } else if (IMAGE_EXTS.has(path.extname(entry.name).toLowerCase())) {
              const destPath = path.join(distDir, relPath);
              fs.mkdirSync(path.dirname(destPath), { recursive: true });
              fs.copyFileSync(srcPath, destPath);
            }
          }
        }

        copyDir(contentDir, '');
      },
    },
  };
}

export default defineConfig({
  site: 'https://ygwang.info',
  integrations: [
    mdx(),
    sitemap(),
    contentImagesIntegration(),
  ],
  markdown: {
    remarkPlugins: [remarkMath, remarkContentImages],
    rehypePlugins: [[rehypeKatex, {}]],
    remarkRehype: { allowDangerousHtml: true },
  },
  outDir: './dist',
  publicDir: './static',
});
