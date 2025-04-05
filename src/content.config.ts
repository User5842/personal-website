import { defineCollection, z } from "astro:content";

import { glob } from "astro/loaders";

const guide = defineCollection({
  loader: glob({ base: "./guide", pattern: "**/*.md" }),
  schema: z.object({
    description: z.string(),
    pubDate: z.coerce.date(),
    title: z.string(),
  }),
});

export const collections = { guide };
