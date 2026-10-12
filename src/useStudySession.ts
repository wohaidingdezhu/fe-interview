import { useCallback, useEffect, useRef, useState } from 'react';
import { moveStudySession, parseStudySession, type StudySession } from './study-session';
import { readStudyStorage, saveStudyStorage, studyStorageKey, loadStudyStorage, storageWarning } from './study-storage';

export function useStudySession() {
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
    const sync = (event: StorageEvent) => {
      if (event.storageArea !== localStorage || (event.key !== studyStorageKey && event.key !== null)) return;
      try { apply({ ...readStudyStorage(localStorage), error: '' }); }
      catch { apply({ ...current.current, error: '另一个标签页的清单无效，已保留本页清单。' }); }
    };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, [apply]);
  const move = useCallback((key: string) => {
    const next = moveStudySession(current.current.session, key);
    if (next && next !== current.current.session) save(next, true);
  }, [save]);
  const start = useCallback((session: StudySession) => save(session), [save]);
  const end = useCallback(() => save(undefined), [save]);
  return { session: state.session, start, move, end, error: state.error };
}
export type Study = ReturnType<typeof useStudySession>;
