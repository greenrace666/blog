import rss from "@astrojs/rss";
import { blog } from "../lib/schema";
import { readAll } from "../lib/content";
import { SITE_TITLE, SITE_DESCRIPTION, SITE_URL } from "../config";

export const get = async () => {
  const posts = await readAll({
    directory: "blog",
    frontmatterSchema: blog,
  });

  const sortedPosts = posts
    .filter((p) => p.frontmatter.draft !== true)
    .sort(
      (a, b) =>
        new Date(b.frontmatter.date).valueOf() -
        new Date(a.frontmatter.date).valueOf()
    );

  let baseUrl = SITE_URL;
  // removing trailing slash if found
  // https://example.com/ => https://example.com
  baseUrl = baseUrl.replace(/\/+$/g, "");

  const rssItems = sortedPosts.map(({ frontmatter, slug }) => {
    const title = frontmatter.title;
    const description = frontmatter.description || "";
    const link = frontmatter.external 
      ? (frontmatter.canonicalUrl || `${baseUrl}/blog/${slug}`)
      : `${baseUrl}/blog/${slug}`;

    return {
      title,
      description,
      link,
      pubDate: frontmatter.date
    };
  });

  return rss({
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    site: baseUrl,
    items: rssItems
  });
};
