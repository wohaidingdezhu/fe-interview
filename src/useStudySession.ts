import { useCallback, useRef, useState } from 'react';
import { moveStudySession, parseStudySession, type StudySession } from './study-session';

const storageKey = 'fe-library-study-session-v1';
const storageWarning = '浏览器无法保存学习清单，清单仅在本次访问有效。';
export function useStudySession() {
  const [session, setSession] = useState<StudySession | undefined>(() => {
    try { const text = sessionStorage.getItem(storageKey); return text ? parseStudySession(text) : undefined; }
    catch { return undefined; }
  });
  const [error, setError] = useState('');
  const current = useRef(session);
  const save = useCallback((next: StudySession) => {
    current.current = next;
    setSession(next);
    try { sessionStorage.setItem(storageKey, JSON.stringify(next)); setError(''); }
    catch { setError(storageWarning); }
  }, []);
  const move = useCallback((key: string) => {
    const next = moveStudySession(current.current, key);
    if (next && next !== current.current) save(next);
  }, [save]);
  const end = useCallback(() => {
    current.current = undefined;
    setSession(undefined);
    try { sessionStorage.removeItem(storageKey); setError(''); }
    catch { setError('浏览器无法清除保存的清单，本次访问已结束清单。'); }
  }, []);
  return { session, start: save, move, end, error };
}
export type Study = ReturnType<typeof useStudySession>;
