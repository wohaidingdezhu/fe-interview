import type { ArticleMetadata } from './data-utils';
import type { SearchDocument } from './search-utils';
import { searchHits } from './search-utils.ts';
export type QuestionEntry = { number: number; title: string; articleId: string; category: string; tags: string[]; status: 'draft' | 'published' };
export type LibraryView = 'home' | 'questions' | 'learning' | 'notes';
export const publicView = (value: string | null): LibraryView => {
  return value === 'questions' || value === 'learning' || value === 'notes' ? value : 'home';
};
export const libraryCounts = (articles: ArticleMetadata[], resources: unknown[]) => {
  const topics = articles.filter(article => article.questionCount > 0);
  return { questions: topics.reduce((sum, article) => sum + article.publishedQuestionCount, 0), topics: topics.length, notes: articles.length - topics.length, resources: resources.length };
};
export const articleHref = (id: string, anchor = '') => { return `?article=${encodeURIComponent(id)}${anchor ? `#${encodeURIComponent(anchor)}` : ''}`; };
export const articleIdFromLocation = (pathname: string, search: string) => {
  const params = new URLSearchParams(search);
  if (params.has('article')) return params.get('article') || undefined;
  if (params.has('view')) return undefined;
  return /\/articles\/([a-z0-9-]+)\/?(?:index\.html)?$/.exec(pathname)?.[1];
};
export const questionPage = (questions: QuestionEntry[], options: { query: string; category: string; tag: string; page: number; size: number; documents?: SearchDocument[]; ids?: Set<number> }) => {
  const query = options.query.trim();
  const exact = /^q([1-9]\d*)$/i.exec(query);
  const matches = query && !exact && options.documents ? new Map(searchHits(options.documents, query).map((hit, rank) => [hit.questionNumber, rank])) : undefined;
  const words = query.toLocaleLowerCase().split(/\s+/);
  const all = questions.filter(question => (!options.category || question.category === options.category)
    && (!options.tag || question.tags.includes(options.tag)) && (!options.ids || options.ids.has(question.number))
    && (!query || (exact ? question.number === Number(exact[1]) : matches ? matches.has(question.number)
      : words.every(word => `${question.title} ${question.category} ${question.tags.join(' ')}`.toLocaleLowerCase().includes(word)))))
    .sort((a, b) => matches ? matches.get(a.number)! - matches.get(b.number)! : a.number - b.number);
  const size = [12, 24, 48].includes(options.size) ? options.size : 12;
  const pages = Math.max(1, Math.ceil(all.length / size));
  const page = Math.min(pages, Math.max(1, Number.isFinite(options.page) ? Math.floor(options.page) : 1));
  return { items: all.slice((page - 1) * size, page * size), queue: all, total: all.length, page, pages, size };
};
