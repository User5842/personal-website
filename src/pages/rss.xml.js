import rss from "@astrojs/rss";
import { getCollection } from "astro:content";

import sanitizeHtml from "sanitize-html";
import MarkdownIt from "markdown-it";
const parser = new MarkdownIt();

export async function GET(context) {
  const guides = await getCollection("guide");

  return rss({
    customData: `<language>en-us</language>`,
    description:
      "Insights from a career professional on a mission to help others find joy and fulfillment in their work.",
    items: guides.map((guide) => ({
      content: sanitizeHtml(parser.render(guide.body)),
      description: guide.data.description,
      link: `/guide/${guide.id}/`,
      pubDate: guide.data.pubDate,
      title: guide.data.title,
    })),
    site: context.site,
    stylesheet: "/rss/pretty-feed-v3.xsl",
    title: "The Declassified Career Survival Guide",
    trailingSlash: false,
  });
}
