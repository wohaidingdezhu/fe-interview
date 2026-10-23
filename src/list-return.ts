import { articleIdFromLocation } from './library-utils.ts';

const labels = { questions: '题目列表', notes: '专题与笔记', resources: '相关资料', learning: '我的学习' };
export type ListReturn = { href: string; label: string };

const parseListReturn = (value: unknown): ListReturn | undefined => {
  if (typeof value !== 'string' || !value.startsWith('?') || value.length > 10_000) return;
  const url = new URL(value, 'https://library.local/'), params = url.searchParams;
  const view = params.get('view');
  if (url.hash || params.has('article') || params.has('study') || !view || !Object.hasOwn(labels, view)) return;
  return { href: url.search, label: view === 'learning' && params.get('path') === 'react-basics' ? 'React 学习路径' : labels[view as keyof typeof labels] };
};

export const readListReturn = (state: unknown): ListReturn | undefined => {
  return state && typeof state === 'object' ? parseListReturn((state as Record<string, unknown>).listReturn) : undefined;
};

export const navigationListReturn = (previous: URL, target: URL, state: unknown): ListReturn | undefined => {
  if (previous.origin !== target.origin || !articleIdFromLocation(target.pathname, target.search) || target.searchParams.get('study') === '1') return;
  if (articleIdFromLocation(previous.pathname, previous.search)) return previous.searchParams.get('study') === '1' ? undefined : readListReturn(state);
  return parseListReturn(previous.search);
};
