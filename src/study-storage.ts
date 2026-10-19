import { parseStudySession, type StudySession } from './study-session.ts';

export const studyStorageKey = 'fe-library-study-session-v1';
type Storage = Pick<globalThis.Storage, 'getItem' | 'setItem'>;
export const readStudyStorage = (storage: Storage) => {
  const raw = storage.getItem(studyStorageKey);
  return { raw, session: raw && raw !== 'null' ? parseStudySession(raw) : undefined };
};

export const saveStudyStorage = (storage: Storage, session: StudySession | undefined, expected?: string | null) => {
  const latest = readStudyStorage(storage);
  // 自动定位不得覆盖另一个标签页已经替换或结束的清单。
  if (expected !== undefined && latest.raw !== expected) return { ...latest, changed: false };
  const raw = JSON.stringify(session ? parseStudySession(JSON.stringify(session)) : null);
  storage.setItem(studyStorageKey, raw);
  return { raw, session, changed: true };
};

export const storageWarning = '浏览器无法保存学习清单，清单仅在本次访问有效，请导出备份。';
export const loadStudyStorage = (storage: Storage, legacyStorage: Storage) => {
  try {
    let saved = readStudyStorage(storage);
    if (saved.raw === null) {
      const legacy = legacyStorage.getItem(studyStorageKey);
      if (legacy) {
        const session = parseStudySession(legacy);
        try { saved = saveStudyStorage(storage, session); }
        catch { return { session, raw: null, error: storageWarning }; }
      }
    }
    return { ...saved, error: '' };
  } catch { return { session: undefined, raw: null, error: '保存的清单无法读取，请导入备份或重新开始；原数据未覆盖。' }; }
};
