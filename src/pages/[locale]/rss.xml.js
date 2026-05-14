import rss from "@astrojs/rss";
import { resolveBlogLocaleMeta } from "../../i18n/locale-config";
import { listLocalizedLocales, listLocalizedPostsForLocale } from "../../lib/localizedBlog";

export function getStaticPaths() {
  return listLocalizedLocales().map((locale) => ({
    params: { locale },
    props: { locale },
  }));
}

export async function GET(context) {
  const locale = context.props?.locale;
  const posts = typeof locale === "string" ? listLocalizedPostsForLocale(locale) : [];
  const localeMeta = resolveBlogLocaleMeta(locale);
  const baseUrl = import.meta.env.BASE_URL ?? "/";
  const normalizedBaseUrl = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;

  return rss({
    title: localeMeta.blogTitle,
    description: localeMeta.blogDescription,
    site: context.site,
    items: posts.map((post) => ({
      ...post.frontmatter,
      pubDate: post.frontmatter?.pubDate ? new Date(post.frontmatter.pubDate) : new Date(),
      link: `${normalizedBaseUrl}${locale}/${post.slug}/`,
    })),
  });
}
