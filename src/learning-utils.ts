export type LearningStatus = 'unread' | 'read' | 'review';
export type LearningEntry = { bookmarked: boolean; status: LearningStatus; updatedAt: string };
export type ReadingPosition = { articleId: string; anchor: string; title: string; updatedAt: string };
export type LearningData = { version: 1; entries: Record<string, LearningEntry>; lastRead?: ReadingPosition };
export const emptyLearning = (): LearningData => ({ version: 1, entries: {} });
const keyPattern = /^(q:[1-9]\d*|a:[a-z0-9]+(?:-[a-z0-9]+)*)$/;
const validDate = (value: unknown): value is string => typeof value === 'string' && /^\d{4}-\d\d-\d\dT/.test(value) && Number.isFinite(Date.parse(value));
export function parseLearning(value: unknown): LearningData {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('备份格式不正确');
  const raw = value as Record<string, unknown>;
  if (raw.version !== 1 || !raw.entries || typeof raw.entries !== 'object' || Array.isArray(raw.entries)) throw new Error('不支持的学习记录版本');
  const entries: Record<string, LearningEntry> = {};
  if (Object.keys(raw.entries).length > 20000) throw new Error('记录条数过多');
  for (const [key, item] of Object.entries(raw.entries)) {
    if (!keyPattern.test(key) || !item || typeof item !== 'object') throw new Error('记录标识不正确');
    const entry = item as LearningEntry;
    if (typeof entry.bookmarked !== 'boolean' || !['unread', 'read', 'review'].includes(entry.status) || !validDate(entry.updatedAt)) throw new Error('学习状态或时间不正确');
    entries[key] = { bookmarked: entry.bookmarked, status: entry.status, updatedAt: new Date(entry.updatedAt).toISOString() };
  }
  const result: LearningData = { version: 1, entries };
  if (raw.lastRead !== undefined) {
    const pos = raw.lastRead as ReadingPosition;
    if (!pos || typeof pos.articleId !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(pos.articleId)
      || typeof pos.anchor !== 'string' || pos.anchor.length > 500 || /[\u0000-\u001f]/.test(pos.anchor)
      || typeof pos.title !== 'string' || pos.title.length > 500 || !validDate(pos.updatedAt)) throw new Error('阅读位置不正确');
    result.lastRead = { articleId: pos.articleId, anchor: pos.anchor, title: pos.title, updatedAt: new Date(pos.updatedAt).toISOString() };
  }
  return result;
}
export function importLearning(text: string) {
  if (text.length > 4_000_000) throw new Error('备份不能超过 4 MB');
  return parseLearning(JSON.parse(text));
}
export function mergeLearning(current: LearningData, incoming: LearningData): LearningData {
  const entries = { ...current.entries };
  for (const [key, value] of Object.entries(incoming.entries)) if (!entries[key] || value.updatedAt > entries[key].updatedAt) entries[key] = value;
  const lastRead = incoming.lastRead && (!current.lastRead || incoming.lastRead.updatedAt > current.lastRead.updatedAt) ? incoming.lastRead : current.lastRead;
  return { version: 1, entries, ...(lastRead ? { lastRead } : {}) };
}
