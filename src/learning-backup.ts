import { parseLearning, type LearningData } from './learning-utils.ts';
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
