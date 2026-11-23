import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

const link = z.string().refine((s) => s.startsWith('/') || /^https?:\/\//.test(s), 'must be a /path or http(s) URL');

const papers = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/papers' }),
  schema: ({ image }) =>
    z
      .object({
        title: z.string().min(5),
        status: z.enum(['published', 'working', 'wip']),
        order: z.number().int(),
        link: link.optional(),
        coauthors: z.array(z.object({ name: z.string(), url: z.url().optional() })).default([]),
        // Optional explicit author order (full names, including Luigi Caloi). Default: alphabetical by surname.
        authorOrder: z.array(z.string()).optional(),
        dateText: z.string().optional(),
        venueLine: z.string().optional(),
        extraLine: z.string().optional(),
        note: z.string().optional(),
        journal: z.string().optional(),
        datePublished: z.union([z.string(), z.date()]).optional(),
        dateModified: z.union([z.string(), z.date()]).optional(),
        doi: z.string().optional(),
        image: image().optional(),
        imageAlt: z.string().optional(),
        keywords: z.array(z.string()).default([]),
      })
      .refine((p) => !p.image || !!p.imageAlt, { message: 'imageAlt is required when image is set' })
      .refine((p) => p.status !== 'published' || !!p.journal, { message: 'published papers need a journal' }),
});

export const collections = { papers };
