import test from 'node:test';
import assert from 'node:assert/strict';
import { createStudySession, parseStudySession, studyQueue, studyHref, studyIndex, moveStudySession, studyResumeTarget, studyProgress, studyDirectory } from '../src/study-session.ts';

const targets = [
  { key: 'q:2', title: 'Q2', category: 'CSS', href: '?article=css#q2' },
  { key: 'q:10', title: 'Q10', category: 'React', href: '?article=react#q10' },
  { key: 'a:closure', title: '闭包', category: 'JS', href: '?article=closure' },
];

test('清单固定目录顺序，保存原筛选、排序、数量与分页，兼容重复键', () => {
  const params = new URLSearchParams('view=learning&filter=unread&kind=questions&sort=title&size=24&page=2&q=Q2');
  const original = params.toString();
  const session = createStudySession([...targets, targets[0]], params);
  assert.deepEqual(session.keys, ['q:2', 'q:10', 'a:closure']);
  assert.equal(session.returnSearch, `?${original}`);
  assert.equal(params.toString(), original);
  assert.deepEqual(parseStudySession(JSON.stringify(session)), session);
  const queue = studyQueue(session, [...targets].reverse());
  assert.deepEqual(queue, targets);
  assert.equal(studyIndex(queue, new URL(`https://example.com/${studyHref(targets[0])}`)), 0);
  assert.equal(studyIndex(queue, new URL(`https://example.com/${studyHref(targets[2])}`)), 2);
});

test('清单只解析当前目录中的键，忽略旧标题和外部链接', () => {
  const session = parseStudySession(JSON.stringify({ version: 1, keys: ['q:2', 'q:999', 'a:closure'], returnSearch: '?view=learning', href: 'https://evil.invalid/', title: '旧标题' }));
  assert.deepEqual(studyQueue(session, targets).map(item => item.key), ['q:2', 'a:closure']);
  assert.deepEqual(studyQueue(session, []), []);
  assert.equal(session.href, undefined);
});

test('地址保留题号且标明清单模式，跨文章与静态子路径正确定位', () => {
  assert.equal(studyHref(targets[0]), '?article=css&study=1#q2');
  assert.equal(studyHref(targets[2]), '?article=closure&study=1');
  assert.equal(studyIndex(targets, new URL('https://example.com/?article=css&study=1#q10')), -1);
  assert.equal(studyIndex(targets, new URL('https://example.com/articles/react/?study=1#q10')), 1);
  assert.equal(studyIndex(targets, new URL('https://example.com/articles/closure/?study=1#section')), 2);
});

test('非法清单和返回阅读地址被拒绝，返回链接始终为学习页查询参数', () => {
  const valid = { version: 1, keys: ['q:2'], returnSearch: '?view=learning' };
  for (const invalid of [null, [], { ...valid, version: 2 }, { ...valid, keys: [] }, { ...valid, keys: ['__proto__'] }, { ...valid, keys: [1] }, { ...valid, keys: Array.from({ length: 1001 }, () => 'q:2') }, { ...valid, returnSearch: 'https://evil.invalid/?view=learning' }, { ...valid, returnSearch: '//evil.invalid/' }, { ...valid, returnSearch: '?view=learning&article=css' }, { ...valid, returnSearch: '?view=home' }]) assert.throws(() => parseStudySession(JSON.stringify(invalid)));
  assert.throws(() => parseStudySession('x'.repeat(100_001)));
  assert.throws(() => parseStudySession('{bad'));
  const maliciousQuery = parseStudySession(JSON.stringify({ ...valid, returnSearch: '?view=learning&next=https://evil.invalid/' }));
  assert.ok(maliciousQuery.returnSearch.startsWith('?view=learning&'));
});

test('旧清单兼容默认位置，新清单保存随机或指定位置并拒绝清单外游标', () => {
  const legacy = { version: 1, keys: ['q:2', 'q:10'], returnSearch: '?view=learning' };
  assert.equal(parseStudySession(JSON.stringify(legacy)).currentKey, 'q:2');
  const selected = createStudySession(targets, new URLSearchParams(), 'a:closure');
  assert.equal(selected.currentKey, 'a:closure');
  assert.deepEqual(parseStudySession(JSON.stringify(selected)), selected);
  for (const key of ['q:999', '__proto__', '', 1, null]) assert.throws(() => parseStudySession(JSON.stringify({ ...legacy, currentKey: key })));
});

test('更新游标不修改顺序和原对象，重复或清单外导航不写入，结束后不恢复清单', () => {
  const session = createStudySession(targets, new URLSearchParams('page=2&size=24'));
  const moved = moveStudySession(session, 'q:10');
  assert.equal(moved.currentKey, 'q:10');
  assert.equal(session.currentKey, 'q:2');
  assert.deepEqual(moved.keys, session.keys);
  assert.equal(moved.returnSearch, session.returnSearch);
  assert.strictEqual(moveStudySession(moved, 'q:10'), moved);
  assert.strictEqual(moveStudySession(moved, 'q:999'), moved);
  assert.equal(moveStudySession(undefined, 'q:10'), undefined);
});

test('恢复使用保存位置，内容失效回退到首个有效项目，空清单不生成链接', () => {
  const session = createStudySession(targets, new URLSearchParams(), 'q:10');
  assert.equal(studyResumeTarget(session, studyQueue(session, targets)).key, 'q:10');
  assert.equal(studyResumeTarget(session, studyQueue(session, targets.filter(target => target.key !== 'q:10'))).key, 'q:2');
  assert.equal(studyResumeTarget(session, []), undefined);
});

test('清单目录按实际状态计数，组合搜索保留原序号，精确题号与外部记录隔离', () => {
  const entry = { bookmarked: false, status: 'read', updatedAt: '2026-10-11T00:00:00.000Z' };
  const data = { version: 1, entries: { 'q:2': entry, 'q:10': { ...entry, status: 'review' }, 'q:999': entry } };
  assert.deepEqual(studyProgress(targets, data), { total: 3, read: 1, review: 1, unread: 1 });
  assert.deepEqual(studyProgress([], data), { total: 0, read: 0, review: 0, unread: 0 });
  const filtered = studyDirectory(targets, data, 'React Q10', 'review');
  assert.deepEqual(filtered.map(target => [target.key, target.index, target.status]), [['q:10', 1, 'review']]);
  assert.equal(studyDirectory(targets, data, 'Q1', '').length, 0);
  assert.equal(studyDirectory(targets, data, 'Q10', 'unread').length, 0);
  assert.equal(studyDirectory(targets, data, 'Q10', '').length, 1);
  assert.deepEqual(studyDirectory(targets, data, '', 'unread').map(target => target.key), ['a:closure']);
});
