import { useCallback, useEffect, useRef, useState } from 'react';
import { emptyLearning, importLearning, mergeLearning, type LearningData, type LearningEntry, type ReadingPosition } from './learning-utils';
const storageKey = 'fe-library-learning-v1';
function load() { const text = localStorage.getItem(storageKey); return text ? importLearning(text) : emptyLearning(); }
export function useLearning() {
  const [error, setError] = useState('');
  const [data, setData] = useState<LearningData>(() => { try { return load(); } catch { return emptyLearning(); } });
  const current = useRef(data);
  const commit = useCallback((change: (data: LearningData) => LearningData) => {
    let base = current.current;
    try { base = mergeLearning(base, load()); } catch { /* 当前会话记录仍可使用 */ }
    const next = change(base); current.current = next; setData(next);
    try { localStorage.setItem(storageKey, JSON.stringify(next)); setError(''); }
    catch { setError('浏览器无法保存，当前记录仅在本次访问有效，请导出备份。'); }
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
    [key]: { ...(base.entries[key] ?? { bookmarked: false, status: 'unread' }), ...patch, updatedAt: new Date().toISOString() } } })), [commit]);
  const remember = useCallback((position: Omit<ReadingPosition, 'updatedAt'>) => commit(base => ({ ...base, lastRead: { ...position, updatedAt: new Date().toISOString() } })), [commit]);
  const restore = useCallback((text: string) => { const incoming = importLearning(text); commit(base => mergeLearning(base, incoming)); }, [commit]);
  return { data, update, remember, restore, error };
}
export type Learning = ReturnType<typeof useLearning>;
