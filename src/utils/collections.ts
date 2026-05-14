import type { CollectionEntry } from 'astro:content';

type AnyEntry = CollectionEntry<'poems'> | CollectionEntry<'essays'> | CollectionEntry<'fictions'> | CollectionEntry<'creations'>;

export function sortByDate<T extends AnyEntry>(entries: T[]): T[] {
  return [...entries].sort(
    (a, b) => b.data.date.getTime() - a.data.date.getTime()
  );
}

export function getSiblings<T extends AnyEntry>(
  entries: T[],
  current: T
): { prev: T | null; next: T | null } {
  const sorted = sortByDate(entries);
  const idx = sorted.findIndex(e => e.id === current.id);
  return {
    prev: idx > 0 ? sorted[idx - 1] : null,
    next: idx < sorted.length - 1 ? sorted[idx + 1] : null,
  };
}

/** Derive the URL slug from a content entry id.
 *  Poems: "poem_0000.md" → "poem_0000"
 *  Nested (essays/paris/paris.md): "paris/paris.md" → "paris"
 */
export function entrySlug(entry: AnyEntry): string {
  const parts = entry.id.split('/');
  return parts[0].replace(/\.mdx?$/, '');
}

/** Slug for flat poem entries: strip .md extension. */
export function poemSlug(entry: CollectionEntry<'poems'>): string {
  return entry.id.replace(/\.mdx?$/, '');
}

/** Count words/characters for CJK-heavy content. */
export function wordCount(body: string): number {
  // Strip HTML tags and markdown syntax
  const text = body.replace(/<[^>]+>/g, '').replace(/```[\s\S]*?```/g, '');
  // CJK character range
  const cjkChars = (text.match(/[一-鿿㐀-䶿]/g) || []).length;
  // Non-CJK words
  const latinWords = (text.replace(/[一-鿿㐀-䶿]/g, '').match(/\S+/g) || []).length;
  return cjkChars + latinWords;
}

export function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  return `${y}年${m}月${d}日`;
}
