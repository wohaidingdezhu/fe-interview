import test from 'node:test';
import assert from 'node:assert/strict';
import { createStudySession, parseStudySession, studyQueue, studyHref, studyIndex } from '../src/study-session.ts';

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
