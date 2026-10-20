import { useCallback, useEffect, useRef, useState } from 'react';
import { moveStudySession, parseStudySession, type StudySession } from './study-session';
import { readStudyStorage, saveStudyStorage, studyStorageKey, loadStudyStorage, storageWarning } from './study-storage';

export const useStudySession = () => {
  const [state, setState] = useState(() => loadStudyStorage(
    { getItem: key => localStorage.getItem(key), setItem: (key, value) => localStorage.setItem(key, value) },
    { getItem: key => sessionStorage.getItem(key), setItem: (key, value) => sessionStorage.setItem(key, value) },
  ));
  const current = useRef(state);
  const apply = useCallback((next: typeof state) => { current.current = next; setState(next); }, []);
  const save = useCallback((session: StudySession | undefined, automatic = false) => {
    try {
      // 显式开始或导入允许恢复损坏的数据；自动定位必须先校验已保存版本。
      if (!automatic) {
        const raw = JSON.stringify(session ? parseStudySession(JSON.stringify(session)) : null);
        localStorage.setItem(studyStorageKey, raw);
        apply({ session, raw, error: '' });
      } else apply({ ...saveStudyStorage(localStorage, session, current.current.raw), error: '' });
      return { error: '' };
    } catch {
      apply({ ...current.current, session, error: storageWarning });
      return { error: storageWarning };
    }
  }, [apply]);
  useEffect(() => {
    const refresh = () => {
      try {
        const latest = readStudyStorage(localStorage);
        // 存储未改变时保留内存中的临时清单及保存失败提示。
        if (latest.raw !== current.current.raw) apply({ ...latest, error: '' });
      } catch { apply({ ...current.current, error: current.current.error || '清单无法同步，已保留本页清单，请导出备份后重试。' }); }
    };
    const visible = () => { if (document.visibilityState === 'visible') refresh(); };
    const sync = (event: StorageEvent) => {
      if (event.storageArea !== localStorage || (event.key !== studyStorageKey && event.key !== null)) return;
      refresh();
    };
    window.addEventListener('storage', sync);
    window.addEventListener('pageshow', refresh);
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', visible);
    refresh();
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('pageshow', refresh);
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', visible);
    };
  }, [apply]);
  const move = useCallback((key: string) => {
    const next = moveStudySession(current.current.session, key);
    if (next && next !== current.current.session) save(next, true);
  }, [save]);
  const start = useCallback((session: StudySession) => save(session), [save]);
  const end = useCallback(() => save(undefined), [save]);
  return { session: state.session, start, move, end, error: state.error };
};
export type Study = ReturnType<typeof useStudySession>;
