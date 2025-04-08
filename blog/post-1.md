---
description: "The one where I christen the blog."
pubDate: "2025-04-07"
title: "The Obligatory First Post"
---

This isn't my first rodeo with making blogs or random websites. In fact, I created a personal website long ago (that's still up) with a similar domain name: https://www.rafaeln.me. It's funny how that first post is also about Astro; what a full-circle moment it has been.

Writing a blog and doing something creative have always been goals of mine, so it's natural that I would go through this cycle often in my life. Now that I feel like I have settled into something I genuinely enjoy, I feel like it was all part of the process, and without trial and error, I wouldn't be where I am today.

The posts I make on **"The Blog"** are meant to be unrelated to my YouTube content, though I wouldn't be surprised if there's some spillover—a way for me to write website updates, content updates, updates on anything.

For all of you technical folk out there, let's explore the technical part of this site a bit.

## The technical part

This website (if you didn't already guess) is written using the [Astro](https://astro.build/) framework. I love using Astro because the ecosystem has tools that simplify setting up and running a static site. I completed most of the skeleton for this website in less than an hour, and with the help of [Vercel](https://vercel.com/) (the hosting platform), my website was live shortly thereafter.

For styling, I use [Tailwind](https://tailwindcss.com/) because it's easy. Similar to Astro, it allows me to quickly prototype something I can iterate on.

These blog posts leverage the [content collections API](https://docs.astro.build/en/guides/content-collections/) from Astro, which has also been a pleasure to work with. It makes sectioning my content into different areas of my file structure simple, and the type safety offered by TypeScript is great.

```js
const schema = z.object({
  description: z.string(),
  pubDate: z.coerce.date(),
  title: z.string(),
});

const blog = defineCollection({
  loader: glob({ base: "./blog", pattern: "**/*.md" }),
  schema,
});
```

That's it--for the technical part.

## Other creative endeavors

In high school, my best friend Jeffrey and I always made funny images of our friends in [Adobe PhotoShop](https://www.adobe.com/products/photoshop.html), which sparked my interest in graphic design. Eventually, my love of skateboarding also introduced me to the world of video and editing, which I now use weekly with my YouTube videos and [Adobe Premiere Pro](https://www.adobe.com/products/premiere.html).

I'm still so new to Premiere, but I have noticed my skills improving slowly every day. I want to take my videos to the next level (relative to my previous ones) and continue to hone that skill set. It's fun, and it allows me to deviate from the day-to-day routine of programming at work (which, to be fair, is a creative pursuit).

## That's it

That's it for now. I'll write more here as everything evolves. I genuinely hope this is where I can settle on the internet. I want to grow this website and be able to look at it years from now and see my work. Hopefully, by then, I would have inspired some others as well.

Peace! ✌️
