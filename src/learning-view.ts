import type { ArticleMetadata } from './data-utils';
import type { QuestionEntry } from './library-utils';
import { articleHref } from './library-utils.ts';
import type { LearningData } from './learning-utils';
import { normalizeCategory } from './categories.ts';

export type LearningTarget = { key: string; title: string; category: string; href: string };
export type LearningFilter = 'bookmarked' | 'read' | 'review' | 'unread';
export const learningFilters: { value: LearningFilter; label: string }[] = [
  { value: 'bookmarked', label: '已收藏' }, { value: 'read', label: '已读' },
  { value: 'review', label: '待复习' }, { value: 'unread', label: '未读' },
];

export function learningTargets(questions: QuestionEntry[], articles: ArticleMetadata[]): LearningTarget[] {
  return [
    ...questions.map(q => ({ key: `q:${q.number}`, title: `Q${q.number}｜${q.title}`, category: q.category, href: articleHref(q.articleId, `q${q.number}`) })),
    ...articles.filter(a => !a.questionCount).map(a => ({ key: `a:${a.id}`, title: a.title, category: a.category, href: articleHref(a.id) })),
  ];
}

export function matchesLearning(data: LearningData, key: string, filter: LearningFilter) {
  const entry = data.entries[key];
  return filter === 'bookmarked' ? Boolean(entry?.bookmarked) : (entry?.status ?? 'unread') === filter;
}

type Progress = { total: number; read: number; review: number; unread: number; bookmarked: number };
const emptyProgress = (): Progress => ({ total: 0, read: 0, review: 0, unread: 0, bookmarked: 0 });
export function learningOverview(targets: LearningTarget[], data: LearningData) {
  const total = emptyProgress(), categories = new Map<string, Progress>();
  for (const target of targets) {
    const category = normalizeCategory(target.category);
    const progress = categories.get(category) ?? emptyProgress();
    categories.set(category, progress);
    for (const counts of [total, progress]) {
      counts.total++;
      counts[data.entries[target.key]?.status ?? 'unread']++;
      if (data.entries[target.key]?.bookmarked) counts.bookmarked++;
    }
  }
  return { total, categories: [...categories].map(([category, counts]) => ({ category, ...counts })) };
}

export function learningShelf(targets: LearningTarget[], data: LearningData, params: URLSearchParams) {
  const filter = learningFilters.find(item => item.value === params.get('filter'))?.value ?? 'bookmarked';
  const category = normalizeCategory(params.get('category') || '');
  const query = (params.get('q') || '').trim().toLocaleLowerCase();
  const exact = /^q([1-9]\d*)$/.exec(query);
  const kind = ['questions', 'notes'].includes(params.get('kind') ?? '') ? params.get('kind')! : '';
  const sort = ['recent', 'oldest', 'title'].includes(params.get('sort') ?? '') ? params.get('sort')! : filter === 'review' ? 'oldest' : 'recent';
  const size = [12, 24, 48].includes(Number(params.get('size'))) ? Number(params.get('size')) : 12;
  const matching = targets.filter(target => matchesLearning(data, target.key, filter)
    && (!kind || target.key.startsWith(kind === 'questions' ? 'q:' : 'a:'))
    && (!category || normalizeCategory(target.category) === category)
    && (!query || (exact ? target.key === `q:${exact[1]}` : query.split(/\s+/).every(word => `${target.title} ${target.category}`.toLocaleLowerCase().includes(word)))))
    .sort((a, b) => sort === 'title' ? a.title.localeCompare(b.title, 'zh-CN', { numeric: true }) : sort === 'oldest'
      ? (data.entries[a.key]?.updatedAt ?? '').localeCompare(data.entries[b.key]?.updatedAt ?? '')
      : (data.entries[b.key]?.updatedAt ?? '').localeCompare(data.entries[a.key]?.updatedAt ?? ''));
  const pages = Math.max(1, Math.ceil(matching.length / size));
  const requested = Number(params.get('page'));
  const page = Math.min(pages, Math.max(1, Number.isFinite(requested) ? Math.floor(requested) : 1));
  return { filter, category, kind, sort, size, total: matching.length, pages, page, queue: matching, items: matching.slice((page - 1) * size, page * size) };
}
