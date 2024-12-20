import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const posts = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./posts" }),
  schema: z.object({
    title: z.string(),
    pubDate: z.date(),
    description: z.string(),
    tags: z.array(z.string()),
    heroImage: z.string().optional(),
  }),
});

const notes = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./notes" }),
  schema: z.object({
    id: z.number(),
    title: z.string().optional(),
    pubDate: z.date(),
    tags: z.array(z.string()),
    draft: z.boolean().optional(),
  }),
});

export const collections = { posts, notes };
