import resourcesData from './data/resources.json';
import { parseArticle, validateLibrary, type Article } from './data-utils';

const files = import.meta.glob('./articles/*.md', { query: '?raw', import: 'default', eager: true });
export const articles: Article[] = Object.entries(files)
  .map(([path, content]) => parseArticle(String(content), path))
  .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title, 'zh-CN'));
export const resources = validateLibrary(resourcesData, articles);
export const categories = [...new Set(articles.map((article) => article.category))];
export function searchArticles(query: string) {
  const terms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  return articles.filter((article) => {
    const text = `${article.title} ${article.category} ${article.tags.join(' ')} ${article.description} ${article.content}`.toLocaleLowerCase();
    return terms.every((term) => text.includes(term));
  });
}
