import { useCallback, useEffect, useRef, useState } from 'react';
import { clearLearning, emptyLearning, importLearning, learningTimestamp, mergeLearning, persistLearning, pruneLearning, type LearningData, type LearningEntry, type ReadingPosition } from './learning-utils';
const storageKey = 'fe-library-learning-v1';
function load() { const text = localStorage.getItem(storageKey); return text ? importLearning(text) : emptyLearning(); }
export function useLearning() {
  const [error, setError] = useState('');
  const [data, setData] = useState<LearningData>(() => { try { return load(); } catch { return emptyLearning(); } });
  const current = useRef(data);
  const commit = useCallback((change: (data: LearningData) => LearningData, recover = false) => {
    // 获取 localStorage 本身也可能被浏览器权限策略拒绝。
    const storage = { getItem: (key: string) => localStorage.getItem(key), setItem: (key: string, value: string) => localStorage.setItem(key, value) };
    const result = persistLearning(storage, storageKey, current.current, change, recover);
    current.current = result.data; setData(result.data); setError(result.error);
  }, []);
  useEffect(() => {
    try { load(); } catch { setError('本地记录无法读取，请导入备份恢复；新记录仍可在本次访问使用。'); }
    const sync = (event: StorageEvent) => {
      if (event.key !== storageKey || !event.newValue) return;
      try { const next = mergeLearning(current.current, importLearning(event.newValue)); current.current = next; setData(next); } catch { /* 忽略无效跨标签页输入 */ }
    };
    window.addEventListener('storage', sync); return () => window.removeEventListener('storage', sync);
  }, []);
  const update = useCallback((key: string, patch: Partial<Pick<LearningEntry, 'bookmarked' | 'status'>>) => commit(base => ({ ...base, entries: { ...base.entries,
    [key]: { ...(base.entries[key] ?? { bookmarked: false, status: 'unread' }), ...patch, updatedAt: learningTimestamp(base) } } })), [commit]);
  const remember = useCallback((position: Omit<ReadingPosition, 'updatedAt'>) => commit(base => ({ ...base, lastRead: { ...position, updatedAt: learningTimestamp(base) } })), [commit]);
  const restore = useCallback((text: string) => { const incoming = importLearning(text); commit(base => mergeLearning(base, incoming), true); }, [commit]);
  const prune = useCallback((validKeys: ReadonlySet<string>, validArticles: ReadonlySet<string>) => commit(base => pruneLearning(base, validKeys, validArticles)), [commit]);
  const clear = useCallback(() => commit(clearLearning, true), [commit]);
  return { data, update, remember, restore, prune, clear, error };
}
export type Learning = ReturnType<typeof useLearning>;
