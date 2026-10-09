import { useEffect, useState } from 'react';
import library from 'virtual:library';
import type { ArticleMetadata } from './data-utils';
import { searchDocuments, type SearchDocument } from './search-utils';
export const articles = library.articles.sort((a, b) => a.order - b.order || a.title.localeCompare(b.title, 'zh-CN'));
export const resources = library.resources;
const bodies = new Map<string, Promise<string>>();
let searchRequest: Promise<SearchDocument[]> | undefined;
async function readJSON(path: string): Promise<unknown> {
  const response = await fetch(new URL(`${import.meta.env.BASE_URL}${path}`, document.baseURI));
  if (!response.ok) throw new Error(`加载失败（${response.status}），请重试。`);
  return response.json();
}
export function loadArticle(article: ArticleMetadata) {
  let request = bodies.get(article.bodyPath);
  if (!request) {
    request = readJSON(article.bodyPath).then((data) => {
      if (!data || typeof data !== 'object' || !('content' in data) || typeof data.content !== 'string') throw new Error('正文数据格式错误。');
      return data.content;
    }).catch((error) => { bodies.delete(article.bodyPath); throw error; });
    bodies.set(article.bodyPath, request);
  }
  return request;
}
export function loadSearchIndex() {
  return searchRequest ??= readJSON(library.searchPath).then((data) => {
    if (!Array.isArray(data) || data.some((item) => !item || typeof item.id !== 'string' || typeof item.text !== 'string')) throw new Error('搜索索引格式错误。');
    return data as SearchDocument[];
  }).catch((error) => { searchRequest = undefined; throw error; });
}
export function useSearchIndex(query: string) {
  const [documents, setDocuments] = useState<SearchDocument[]>();
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const active = Boolean(query.trim());
  useEffect(() => {
    if (!active || documents) return;
    let current = true; setError('');
    loadSearchIndex().then((data) => { if (current) setDocuments(data); }, (error: Error) => { if (current) setError(error.message); });
    return () => { current = false; };
  }, [active, documents, attempt]);
  return { documents, error, loading: active && !documents && !error, retry: () => setAttempt((value) => value + 1) };
}
export function searchArticles(query: string, documents: SearchDocument[] = []) {
  const matches = searchDocuments(documents, query);
  return articles.filter((article) => matches.has(article.id)).map((article) => ({ ...article, snippet: matches.get(article.id)! }));
}
