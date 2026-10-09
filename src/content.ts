import library from 'virtual:library';
import type { Article } from './data-utils';

export const articles: Article[] = library.articles
  .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title, 'zh-CN'));
export const resources = library.resources;
export const categories = [...new Set(articles.map((article) => article.category))];
export function searchArticles(query: string) {
  const terms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  return articles.filter((article) => {
    const text = `${article.title} ${article.category} ${article.tags.join(' ')} ${article.description} ${article.content}`.toLocaleLowerCase();
    return terms.every((term) => text.includes(term));
  });
}
