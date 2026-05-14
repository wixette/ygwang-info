import { defineCollection, z } from 'astro:content';

const POEM_FORMS = ['古近体', '词', '现代诗', '偈子', '骈文', '顺口溜', '其他'] as const;

const poemCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    author: z.string().default('王咏刚'),
    date: z.coerce.date(),
    draft: z.boolean().default(false),
    form: z.enum(POEM_FORMS).default('其他'),
    layout: z.string().optional(),
  }),
});

const baseCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    author: z.string().default('王咏刚'),
    date: z.coerce.date(),
    draft: z.boolean().default(false),
    layout: z.string().optional(),
  }),
});

export const collections = {
  poems: poemCollection,
  essays: baseCollection,
  fictions: baseCollection,
  creations: baseCollection,
};
