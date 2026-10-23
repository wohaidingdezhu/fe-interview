import test from 'node:test';
import assert from 'node:assert/strict';
import { previewLearningImport } from '../src/learning-backup.ts';

const entry = (day, status = 'read') => ({ bookmarked: false, status, updatedAt: `2026-10-${day}T00:00:00.000Z` });

test('导入预览按实际合并规则统计新增、较新更新、保留与删除，不改动当前记录', () => {
  const current = { version: 1, entries: { 'q:1': entry(10), 'q:2': entry(12), 'q:3': entry(10) } };
  const incoming = { version: 1, entries: { 'q:1': entry(11, 'review'), 'q:2': entry(11), 'q:4': entry(11) }, removed: { 'q:3': '2026-10-11T00:00:00.000Z' } };
  const before = structuredClone(current);
  assert.deepEqual(previewLearningImport(current, incoming).counts, { added: 1, updated: 1, removed: 1, retained: 1, total: 3 });
  assert.deepEqual(previewLearningImport(current, incoming).changes, [
    { key: 'q:1', kind: 'updated', before: entry(10), after: entry(11, 'review') },
    { key: 'q:2', kind: 'retained', before: entry(12), after: entry(12) },
    { key: 'q:3', kind: 'removed', before: entry(10), after: undefined },
    { key: 'q:4', kind: 'added', before: undefined, after: entry(11) },
  ]);
  assert.deepEqual(current, before);
});

test('导入预览尊重双方清空时间和删除记录，重复导入保留既有状态', () => {
  const current = { version: 1, entries: { 'q:1': entry(10), 'q:2': entry(12) }, removed: { 'q:3': '2026-10-12T00:00:00.000Z' } };
  const incoming = { version: 1, entries: { 'q:3': entry(11) }, resetAt: '2026-10-11T00:00:00.000Z' };
  assert.deepEqual(previewLearningImport(current, incoming).counts, { added: 0, updated: 0, removed: 1, retained: 1, total: 1 });
  assert.deepEqual(previewLearningImport(current, current).counts, { added: 0, updated: 0, removed: 0, retained: 2, total: 2 });
});

test('导入明细保留未知内容标识，并区分收藏变化、仅时间更新和重复记录', () => {
  const current = { version: 1, entries: { 'a:old-note': entry(10), 'q:9999': entry(10), 'q:5': entry(12) } };
  const incoming = { version: 1, entries: { 'a:old-note': { ...entry(11), bookmarked: true }, 'q:9999': entry(11), 'q:5': entry(11, 'review') } };
  const preview = previewLearningImport(current, incoming);
  assert.deepEqual(preview.counts, { added: 0, updated: 2, removed: 0, retained: 1, total: 3 });
  assert.equal(preview.changes[0].after.bookmarked, true);
  assert.equal(preview.changes[1].key, 'q:9999');
  assert.equal(preview.changes[1].before.status, preview.changes[1].after.status);
  assert.deepEqual(preview.changes[2].after, current.entries['q:5']);
});
