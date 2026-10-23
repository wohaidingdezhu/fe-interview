import { mergeLearning, parseLearning, type LearningData, type LearningEntry } from './learning-utils.ts';
import { parseStudySession, type StudySession } from './study-session.ts';

export const createLearningBackup = (learning: LearningData, study?: StudySession) => {
  return { format: 'fe-library-backup', version: 1, learning, study: study ?? null };
};

export const parseLearningBackup = (text: string) => {
  if (text.length > 4_000_000) throw new Error('备份不能超过 4 MB');
  const value = JSON.parse(text);
  if (value?.format !== 'fe-library-backup') return { learning: parseLearning(value), study: undefined };
  if (value.version !== 1) throw new Error('不支持的备份版本');
  return { learning: parseLearning(value.learning), study: value.study === null ? null : parseStudySession(JSON.stringify(value.study)) };
};

export type LearningImportChange = { key: string; kind: 'added' | 'updated' | 'removed' | 'retained'; before?: LearningEntry; after?: LearningEntry };

export const previewLearningImport = (current: LearningData, incoming: LearningData) => {
  const merged = mergeLearning(current, incoming);
  const counts = { added: 0, updated: 0, removed: 0, retained: 0, total: Object.keys(merged.entries).length };
  const changes: LearningImportChange[] = [];
  for (const key of new Set([...Object.keys(current.entries), ...Object.keys(merged.entries)])) {
    const before = current.entries[key], after = merged.entries[key];
    const kind = !before ? 'added' : !after ? 'removed' : before.status !== after.status || before.bookmarked !== after.bookmarked || before.updatedAt !== after.updatedAt ? 'updated' : 'retained';
    counts[kind]++;
    changes.push({ key, kind, before, after });
  }
  return { counts, changes };
};
