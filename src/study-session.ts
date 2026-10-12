import type { LearningTarget } from './learning-view';
import { articleIdFromLocation } from './library-utils.ts';
import type { LearningData, LearningStatus } from './learning-utils';

export type StudySession = { version: 1; keys: string[]; returnSearch: string; currentKey: string };
const keyPattern = /^(q:[1-9]\d*|a:[a-z0-9]+(?:-[a-z0-9]+)*)$/;

export function parseStudySession(text: string): StudySession {
  if (text.length > 100_000) throw new Error('学习清单过大');
  const value = JSON.parse(text);
  if (!value || value.version !== 1 || !Array.isArray(value.keys) || !value.keys.length || value.keys.length > 1000
    || value.keys.some((key: unknown) => typeof key !== 'string' || !keyPattern.test(key))
    || typeof value.returnSearch !== 'string' || value.returnSearch.length > 10_000 || !value.returnSearch.startsWith('?')) throw new Error('学习清单无效');
  const params = new URLSearchParams(value.returnSearch);
  if (!['learning', 'questions'].includes(params.get('view') ?? '') || params.has('article')) throw new Error('学习清单返回地址无效');
  const keys = [...new Set<string>(value.keys)];
  if (value.currentKey !== undefined && (typeof value.currentKey !== 'string' || !keys.includes(value.currentKey))) throw new Error('学习清单位置无效');
  return { version: 1, keys, returnSearch: `?${params}`, currentKey: value.currentKey ?? keys[0] };
}

export function createStudySession(targets: LearningTarget[], params: URLSearchParams, currentKey = targets[0]?.key): StudySession {
  const back = new URLSearchParams(params);
  back.set('view', params.get('view') === 'questions' ? 'questions' : 'learning'); back.delete('article'); back.delete('study');
  return parseStudySession(JSON.stringify({ version: 1, keys: targets.map(target => target.key), returnSearch: `?${back}`, currentKey }));
}

export function shuffleStudyTargets(targets: LearningTarget[], random = Math.random) {
  const shuffled = [...targets];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function studyQuestion(route: URL) {
  const anchor = route.searchParams.get('question') || route.hash.slice(1);
  return /^q[1-9]\d*$/.test(anchor) ? anchor : '';
}

export function readingInStudy(session: StudySession | undefined, position: { articleId: string; anchor: string } | undefined) {
  if (!session || !position) return false;
  if (session.keys.includes(`a:${position.articleId}`)) return true;
  if (/^q[1-9]\d*$/.test(position.anchor)) return session.keys.includes(`q:${position.anchor.slice(1)}`);
  return false;
}

export function moveStudySession(session: StudySession | undefined, key: string) {
  return !session || !session.keys.includes(key) || session.currentKey === key ? session : { ...session, currentKey: key };
}

export function studyResumeTarget(session: StudySession, queue: LearningTarget[]) {
  return queue.find(target => target.key === session.currentKey) ?? queue[0];
}

export function studyProgress(queue: LearningTarget[], data: LearningData) {
  const counts = { total: queue.length, read: 0, review: 0, unread: 0 };
  for (const target of queue) counts[data.entries[target.key]?.status ?? 'unread']++;
  return counts;
}

export function studyDirectory(queue: LearningTarget[], data: LearningData, query: string, status: LearningStatus | '') {
  const words = query.trim().toLocaleLowerCase(), exact = /^q([1-9]\d*)$/.exec(words);
  return queue.map((target, index) => ({ ...target, index, status: data.entries[target.key]?.status ?? 'unread' })).filter(target =>
    (!status || target.status === status) && (!words || (exact ? target.key === `q:${exact[1]}` : words.split(/\s+/).every(word => `${target.title} ${target.category}`.toLocaleLowerCase().includes(word)))));
}

// 只从当前公开目录生成标题与地址，不信任会话存储中的链接。
export function studyQueue(session: StudySession, targets: LearningTarget[]) {
  const byKey = new Map(targets.map(target => [target.key, target]));
  return session.keys.flatMap(key => { const target = byKey.get(key); return target ? [target] : []; });
}

export function studyHref(target: Pick<LearningTarget, 'href'>, question = '') {
  const url = new URL(target.href, 'https://study.local/');
  url.searchParams.set('study', '1');
  const anchor = /^#q[1-9]\d*$/.test(url.hash) ? url.hash.slice(1) : question;
  if (anchor) url.searchParams.set('question', anchor);
  return `${url.search}${url.hash}`;
}

export function studyIndex(queue: LearningTarget[], route: URL) {
  const articleId = articleIdFromLocation(route.pathname, route.search);
  return queue.findIndex(target => {
    const url = new URL(target.href, 'https://study.local/');
    return url.searchParams.get('article') === articleId && (!target.key.startsWith('q:') || studyQuestion(route) === url.hash.slice(1));
  });
}
