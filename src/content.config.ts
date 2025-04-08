import { defineCollection, z } from "astro:content";

import { glob } from "astro/loaders";

const schema = z.object({
  description: z.string(),
  pubDate: z.coerce.date(),
  title: z.string(),
});

const blog = defineCollection({
  loader: glob({ base: "./blog", pattern: "**/*.md" }),
  schema,
});

const guide = defineCollection({
  loader: glob({ base: "./guide", pattern: "**/*.md" }),
  schema,
});

export const collections = { blog, guide };
