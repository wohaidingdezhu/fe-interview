import type { LearningTarget } from './learning-view';
import { articleIdFromLocation } from './library-utils.ts';

export type StudySession = { version: 1; keys: string[]; returnSearch: string };
const keyPattern = /^(q:[1-9]\d*|a:[a-z0-9]+(?:-[a-z0-9]+)*)$/;

export function parseStudySession(text: string): StudySession {
  if (text.length > 100_000) throw new Error('学习清单过大');
  const value = JSON.parse(text);
  if (!value || value.version !== 1 || !Array.isArray(value.keys) || !value.keys.length || value.keys.length > 1000
    || value.keys.some((key: unknown) => typeof key !== 'string' || !keyPattern.test(key))
    || typeof value.returnSearch !== 'string' || value.returnSearch.length > 10_000 || !value.returnSearch.startsWith('?')) throw new Error('学习清单无效');
  const params = new URLSearchParams(value.returnSearch);
  if (params.get('view') !== 'learning' || params.has('article')) throw new Error('学习清单返回地址无效');
  return { version: 1, keys: [...new Set<string>(value.keys)], returnSearch: `?${params}` };
}

export function createStudySession(targets: LearningTarget[], params: URLSearchParams): StudySession {
  const back = new URLSearchParams(params);
  back.set('view', 'learning'); back.delete('article'); back.delete('study');
  return parseStudySession(JSON.stringify({ version: 1, keys: targets.map(target => target.key), returnSearch: `?${back}` }));
}

// 只从当前公开目录生成标题与地址，不信任会话存储中的链接。
export function studyQueue(session: StudySession, targets: LearningTarget[]) {
  const byKey = new Map(targets.map(target => [target.key, target]));
  return session.keys.flatMap(key => { const target = byKey.get(key); return target ? [target] : []; });
}

export function studyHref(target: Pick<LearningTarget, 'href'>) {
  const url = new URL(target.href, 'https://study.local/');
  url.searchParams.set('study', '1');
  return `${url.search}${url.hash}`;
}

export function studyIndex(queue: LearningTarget[], route: URL) {
  const articleId = articleIdFromLocation(route.pathname, route.search);
  return queue.findIndex(target => {
    const url = new URL(target.href, 'https://study.local/');
    return url.searchParams.get('article') === articleId && (!target.key.startsWith('q:') || route.hash === url.hash);
  });
}
