import { useCallback, useEffect, useRef, useState } from 'react';
import { clearLearning, emptyLearning, importLearning, learningTimestamp, mergeLearning, persistLearning, pruneLearning, updateLearningBatch, undoLearningBatch, type LearningBatchUndo, type LearningStatus, type LearningData, type LearningEntry, type ReadingPosition } from './learning-utils';
const storageKey = 'fe-library-learning-v1';
const load = () => { const text = localStorage.getItem(storageKey); return text ? importLearning(text) : emptyLearning(); };
export const useLearning = () => {
  const [error, setError] = useState('');
  const saveError = useRef(''); // 已排队的旧定位回调也必须读取当前错误，不能依赖渲染时的闭包。
  const [data, setData] = useState<LearningData>(() => { try { return load(); } catch { return emptyLearning(); } });
  const current = useRef(data);
  const commit = useCallback((change: (data: LearningData) => LearningData, recover = false) => {
    // 获取 localStorage 本身也可能被浏览器权限策略拒绝。
    const storage = { getItem: (key: string) => localStorage.getItem(key), setItem: (key: string, value: string) => localStorage.setItem(key, value) };
    const result = persistLearning(storage, storageKey, current.current, change, recover);
    current.current = result.data; saveError.current = result.error;
    setData(result.data); setError(result.error);
    return result;
  }, []);
  useEffect(() => {
    const refresh = () => {
      try { const next = mergeLearning(current.current, load()); current.current = next; setData(next); }
      catch { saveError.current = '本地记录无法读取，请导入备份恢复；新记录仍可在本次访问使用。'; setError(saveError.current); }
    };
    const visible = () => { if (document.visibilityState === 'visible') refresh(); };
    const sync = (event: StorageEvent) => {
      if (event.key !== storageKey || !event.newValue) return;
      try { const next = mergeLearning(current.current, importLearning(event.newValue)); current.current = next; setData(next); } catch { /* 忽略无效跨标签页输入 */ }
    };
    window.addEventListener('storage', sync);
    window.addEventListener('pageshow', refresh);
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', visible);
    // 先监听再补读，覆盖首次渲染与订阅之间的写入；合并保留尚未保存的本地修改。
    refresh();
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('pageshow', refresh);
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', visible);
    };
  }, []);
  const update = useCallback((key: string, patch: Partial<Pick<LearningEntry, 'bookmarked' | 'status'>>) => commit(base => ({ ...base, entries: { ...base.entries,
    [key]: { ...(base.entries[key] ?? { bookmarked: false, status: 'unread' }), ...patch, updatedAt: learningTimestamp(base) } } })), [commit]);
  const remember = useCallback((position: Omit<ReadingPosition, 'updatedAt'>) => {
    const change = (base: LearningData): LearningData => ({ ...base, lastRead: { ...position, updatedAt: learningTimestamp(base) } });
    // 保存失败后，后台阅读定位只更新内存，不能悄悄清除提示或移走重试按钮。
    if (saveError.current) {
      const next = change(current.current); current.current = next; setData(next);
      return { data: next, error: saveError.current };
    }
    return commit(change);
  }, [commit]);
  const restore = useCallback((text: string) => { const incoming = importLearning(text); return commit(base => mergeLearning(base, incoming), true); }, [commit]);
  const prune = useCallback((validKeys: ReadonlySet<string>, validArticles: ReadonlySet<string>) => commit(base => pruneLearning(base, validKeys, validArticles)), [commit]);
  const clear = useCallback(() => commit(clearLearning, true), [commit]);
  // 只重试持久化，沿用合并和损坏数据保护，不生成新的标记时间。
  const retrySave = useCallback(() => commit(base => base), [commit]);
  const updateMany = useCallback((keys: readonly string[], status: LearningStatus) => {
    let undo: LearningBatchUndo = { appliedAt: '', previous: {} }, count = 0;
    const saved = commit(base => { const batch = updateLearningBatch(base, keys, status); undo = batch.undo; count = batch.count; return batch.data; });
    return { ...saved, undo, count };
  }, [commit]);
  const undoMany = useCallback((undo: LearningBatchUndo) => {
    let count = 0;
    const saved = commit(base => { const result = undoLearningBatch(base, undo); count = result.count; return result.data; });
    return { ...saved, count };
  }, [commit]);
  return { data, update, updateMany, undoMany, remember, restore, prune, clear, retrySave, error };
};
export type Learning = ReturnType<typeof useLearning>;
