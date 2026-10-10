export type LearningStatus = 'unread' | 'read' | 'review';
export type LearningEntry = { bookmarked: boolean; status: LearningStatus; updatedAt: string };
export type ReadingPosition = { articleId: string; anchor: string; title: string; updatedAt: string };
export type LearningData = { version: 1; entries: Record<string, LearningEntry>; lastRead?: ReadingPosition; resetAt?: string; removed?: Record<string, string> };
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
  if (raw.resetAt !== undefined) {
    if (!validDate(raw.resetAt)) throw new Error('清空时间不正确');
    result.resetAt = new Date(raw.resetAt).toISOString();
  }
  if (raw.removed !== undefined) {
    if (!raw.removed || typeof raw.removed !== 'object' || Array.isArray(raw.removed) || Object.keys(raw.removed).length > 20001) throw new Error('清理记录不正确');
    result.removed = {};
    for (const [key, time] of Object.entries(raw.removed)) {
      if ((key !== 'lastRead' && !keyPattern.test(key)) || !validDate(time)) throw new Error('清理记录不正确');
      result.removed[key] = new Date(time).toISOString();
    }
  }
  if (raw.lastRead !== undefined) {
    const pos = raw.lastRead as ReadingPosition;
    if (!pos || typeof pos.articleId !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(pos.articleId)
      || typeof pos.anchor !== 'string' || pos.anchor.length > 500 || /[\u0000-\u001f]/.test(pos.anchor)
      || typeof pos.title !== 'string' || pos.title.length > 500 || !validDate(pos.updatedAt)) throw new Error('阅读位置不正确');
    result.lastRead = { articleId: pos.articleId, anchor: pos.anchor, title: pos.title, updatedAt: new Date(pos.updatedAt).toISOString() };
  }
  return mergeLearning(emptyLearning(), result);
}
export function importLearning(text: string) {
  if (text.length > 4_000_000) throw new Error('备份不能超过 4 MB');
  return parseLearning(JSON.parse(text));
}
export function mergeLearning(current: LearningData, incoming: LearningData): LearningData {
  const resetAt = [current.resetAt, incoming.resetAt].filter((value): value is string => Boolean(value)).sort().at(-1);
  const removed = { ...current.removed };
  for (const [key, time] of Object.entries(incoming.removed ?? {})) if (!removed[key] || time > removed[key]) removed[key] = time;
  const entries = { ...current.entries };
  for (const [key, value] of Object.entries(incoming.entries)) if (!entries[key] || value.updatedAt > entries[key].updatedAt) entries[key] = value;
  for (const [key, value] of Object.entries(entries)) if (value.updatedAt <= (resetAt ?? '') || value.updatedAt <= (removed[key] ?? '')) delete entries[key];
  let lastRead = incoming.lastRead && (!current.lastRead || incoming.lastRead.updatedAt > current.lastRead.updatedAt) ? incoming.lastRead : current.lastRead;
  if (lastRead && (lastRead.updatedAt <= (resetAt ?? '') || lastRead.updatedAt <= (removed.lastRead ?? ''))) lastRead = undefined;
  return { version: 1, entries, ...(lastRead ? { lastRead } : {}), ...(resetAt ? { resetAt } : {}), ...(Object.keys(removed).length ? { removed } : {}) };
}

// 本次操作必须晚于已保存的操作，兼容同一毫秒连续点击及设备时钟回退。
export function learningTimestamp(data: LearningData): string {
  const times = [data.resetAt, data.lastRead?.updatedAt, ...Object.values(data.entries).map(entry => entry.updatedAt), ...Object.values(data.removed ?? {})];
  return new Date(Math.max(Date.now(), ...times.filter((time): time is string => Boolean(time)).map(time => Date.parse(time) + 1))).toISOString();
}

export function clearLearning(data: LearningData): LearningData {
  return { ...emptyLearning(), resetAt: learningTimestamp(data) };
}

export function pruneLearning(data: LearningData, validKeys: ReadonlySet<string>, validArticles: ReadonlySet<string>): LearningData {
  const time = learningTimestamp(data), removed: Record<string, string> = {};
  for (const key of Object.keys(data.entries)) if (!validKeys.has(key)) removed[key] = time;
  if (data.lastRead && !validArticles.has(data.lastRead.articleId)) removed.lastRead = time;
  return mergeLearning(data, { ...emptyLearning(), removed });
}

export function persistLearning(storage: Pick<Storage, 'getItem' | 'setItem'>, key: string, current: LearningData, change: (data: LearningData) => LearningData, recover = false) {
  let base = current, unreadable = false;
  try { const text = storage.getItem(key); if (text) base = mergeLearning(base, importLearning(text)); } catch { unreadable = true; }
  const data = change(base);
  if (unreadable && !recover) return { data, error: '本地记录无法读取，原数据已保留；新记录仅在本次访问有效，请导出备份或导入备份恢复。' };
  try { storage.setItem(key, JSON.stringify(data)); return { data, error: '' }; }
  catch { return { data, error: '浏览器无法保存，当前记录仅在本次访问有效，请导出备份。' }; }
}
