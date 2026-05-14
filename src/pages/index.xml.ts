import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';
import { sortByDate, entrySlug, poemSlug } from '@/utils/collections';

export async function GET(context: APIContext) {
  const [poems, essays, fictions, creations] = await Promise.all([
    getCollection('poems', e => !e.data.draft),
    getCollection('essays', e => !e.data.draft),
    getCollection('fictions', e => !e.data.draft),
    getCollection('creations', e => !e.data.draft),
  ]);

  type Item = { title: string; pubDate: Date; link: string; author: string; sortDate: Date };

  const poemItems: Item[] = poems.map(e => ({
    title: e.data.title,
    pubDate: e.data.date,
    link: `/poems/${poemSlug(e)}/`,
    author: e.data.author,
    sortDate: e.data.date,
  }));

  const essayItems: Item[] = essays.map(e => ({
    title: e.data.title,
    pubDate: e.data.date,
    link: `/essays/${entrySlug(e)}/`,
    author: e.data.author,
    sortDate: e.data.date,
  }));

  const fictionItems: Item[] = fictions.map(e => ({
    title: e.data.title,
    pubDate: e.data.date,
    link: `/fictions/${entrySlug(e)}/`,
    author: e.data.author,
    sortDate: e.data.date,
  }));

  const creationItems: Item[] = creations.map(e => ({
    title: e.data.title,
    pubDate: e.data.date,
    link: `/creations/${entrySlug(e)}/`,
    author: e.data.author,
    sortDate: e.data.date,
  }));

  const allItems = [...poemItems, ...essayItems, ...fictionItems, ...creationItems]
    .sort((a, b) => b.sortDate.getTime() - a.sortDate.getTime());

  return rss({
    title: '半轻小屋：王咏刚的诗文、小说、笔记、创意',
    description: '王咏刚的个人网站 RSS 订阅',
    site: context.site!,
    items: allItems,
    customData: '<language>zh-cn</language>',
  });
}
