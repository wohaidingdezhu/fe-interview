import type { ArticleMetadata } from './data-utils';
import type { SearchDocument } from './search-utils';
import { searchHits } from './search-utils.ts';
export type QuestionEntry = { number: number; title: string; articleId: string; category: string; tags: string[]; status: 'draft' | 'published' };
export type LibraryView = 'home' | 'questions' | 'learning' | 'notes';
export function publicView(value: string | null): LibraryView {
  return value === 'questions' || value === 'learning' || value === 'notes' ? value : 'home';
}
export function libraryCounts(articles: ArticleMetadata[], resources: unknown[]) {
  const topics = articles.filter(article => article.questionCount > 0);
  return { questions: topics.reduce((sum, article) => sum + article.publishedQuestionCount, 0), topics: topics.length, notes: articles.length - topics.length, resources: resources.length };
}
export function articleHref(id: string, anchor = '') { return `?article=${encodeURIComponent(id)}${anchor ? `#${encodeURIComponent(anchor)}` : ''}`; }
export function articleIdFromLocation(pathname: string, search: string) {
  const params = new URLSearchParams(search);
  if (params.has('article')) return params.get('article') || undefined;
  if (params.has('view')) return undefined;
  return /\/articles\/([a-z0-9-]+)\/?(?:index\.html)?$/.exec(pathname)?.[1];
}
export function questionPage(questions: QuestionEntry[], options: { query: string; category: string; tag: string; page: number; size: number; documents?: SearchDocument[]; ids?: Set<number> }) {
  const query = options.query.trim();
  const exact = /^q([1-9]\d*)$/i.exec(query);
  const matches = query && !exact && options.documents ? new Set(searchHits(options.documents, query).map(hit => hit.questionNumber)) : undefined;
  const words = query.toLocaleLowerCase().split(/\s+/);
  const all = questions.filter(question => (!options.category || question.category === options.category)
    && (!options.tag || question.tags.includes(options.tag)) && (!options.ids || options.ids.has(question.number))
    && (!query || (exact ? question.number === Number(exact[1]) : matches ? matches.has(question.number)
      : words.every(word => `${question.title} ${question.category} ${question.tags.join(' ')}`.toLocaleLowerCase().includes(word)))))
    .sort((a, b) => a.number - b.number);
  const size = [12, 24, 48].includes(options.size) ? options.size : 12;
  const pages = Math.max(1, Math.ceil(all.length / size));
  const page = Math.min(pages, Math.max(1, Number.isFinite(options.page) ? Math.floor(options.page) : 1));
  return { items: all.slice((page - 1) * size, page * size), total: all.length, page, pages };
}
