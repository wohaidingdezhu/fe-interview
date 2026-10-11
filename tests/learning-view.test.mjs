import test from 'node:test';
import assert from 'node:assert/strict';
import { learningOverview, learningShelf, learningTargets } from '../src/learning-view.ts';

const targets = [
  { key: 'q:1', title: 'Q1｜React 状态', category: 'React', href: '?article=react#q1' },
  { key: 'q:10', title: 'Q10｜React 闭包', category: 'React 生态', href: '?article=react#q10' },
  { key: 'a:closure', title: '理解闭包', category: 'JavaScript', href: '?article=closure' },
];
const entry = { bookmarked: true, status: 'read', updatedAt: '2026-10-11T00:00:00.000Z' };
const data = { version: 1, entries: { 'q:1': entry, 'q:10': { ...entry, status: 'review' }, 'q:999': entry } };

test('学习统计区分已读、待复习和未读，排除失效记录并归一化分类', () => {
  const overview = learningOverview(targets, data);
  assert.deepEqual(overview.total, { total: 3, read: 1, review: 1, unread: 1, bookmarked: 2 });
  assert.equal(overview.categories.length, 2);
  assert.deepEqual(overview.categories[0], { category: 'React', total: 2, read: 1, review: 1, unread: 0, bookmarked: 2 });
  assert.equal(overview.categories[1].unread, 1);
  assert.deepEqual(learningOverview([], data), { total: { total: 0, read: 0, review: 0, unread: 0, bookmarked: 0 }, categories: [] });
});

test('学习目录按题与独立笔记统计，不把整个专题再次计入进度', () => {
  const questions = [{ number: 1, title: '状态', articleId: 'react', category: 'React' }];
  const articles = [{ id: 'react', title: 'React 专题', questionCount: 1, category: 'React' }, { id: 'closure', title: '闭包', questionCount: 0, category: 'JavaScript' }];
  const result = learningTargets(questions, articles);
  assert.deepEqual(result.map(item => item.key), ['q:1', 'a:closure']);
  assert.equal(result[0].href, '?article=react#q1');
});

test('学习页组合筛选与精确题号可从 URL 还原，不误命中 Q10', () => {
  const original = JSON.stringify(data);
  assert.deepEqual(learningShelf(targets, data, new URLSearchParams('q=Q1')).items.map(item => item.key), ['q:1']);
  const params = new URLSearchParams('filter=review&category=React+生态&q=React+闭包&page=99');
  const result = learningShelf(targets, data, params);
  assert.equal(result.category, 'React');
  assert.equal(result.page, 1);
  assert.deepEqual(result.items.map(item => item.key), ['q:10']);
  assert.equal(learningShelf(targets, data, new URLSearchParams('filter=review&category=JavaScript')).total, 0);
  assert.equal(learningShelf(targets, data, new URLSearchParams('filter=bad')).filter, 'bookmarked');
  assert.equal(JSON.stringify(data), original);
  assert.equal(params.get('page'), '99');
});

test('没有记录与显式取消已读的项目都列入未读，分页越界安全回退', () => {
  const items = Array.from({ length: 25 }, (_, i) => ({ key: `q:${i + 1}`, title: `Q${i + 1}`, category: 'JS', href: '' }));
  const state = { version: 1, entries: { 'q:1': { ...entry, status: 'unread' } } };
  const second = learningShelf(items, state, new URLSearchParams('filter=unread&page=2'));
  assert.equal(second.total, 25);
  assert.equal(second.page, 2);
  assert.equal(second.items.length, 12);
  assert.equal(learningShelf(items, state, new URLSearchParams('filter=unread&page=999')).page, 3);
  for (const page of ['-1', 'NaN', 'Infinity', '0']) assert.equal(learningShelf(items, state, new URLSearchParams(`filter=unread&page=${page}`)).page, 1);
});

test('复习队列默认较早标记优先，显式排序覆盖默认并支持自然题号顺序', () => {
  const state = { version: 1, entries: { 'q:1': { ...entry, status: 'review', updatedAt: '2026-10-11T02:00:00.000Z' }, 'q:10': { ...entry, status: 'review', updatedAt: '2026-10-11T01:00:00.000Z' } } };
  assert.deepEqual(learningShelf(targets, state, new URLSearchParams('filter=review')).queue.map(item => item.key), ['q:10', 'q:1']);
  assert.deepEqual(learningShelf(targets, state, new URLSearchParams('filter=review&sort=recent')).queue.map(item => item.key), ['q:1', 'q:10']);
  assert.deepEqual(learningShelf(targets, state, new URLSearchParams('filter=review&sort=title')).queue.map(item => item.key), ['q:1', 'q:10']);
  assert.equal(learningShelf(targets, state, new URLSearchParams('filter=review&sort=bad')).sort, 'oldest');
});

test('内容类型、每页数量与队列遵循同一组筛选，异常参数回退', () => {
  const items = Array.from({ length: 50 }, (_, i) => ({ key: `q:${i + 1}`, title: `Q${i + 1}`, category: 'JS', href: `?article=js#q${i + 1}` }));
  items.push({ key: 'a:note', title: '笔记', category: 'JS', href: '?article=note' });
  const result = learningShelf(items, { version: 1, entries: {} }, new URLSearchParams('filter=unread&kind=questions&size=24&page=2'));
  assert.equal(result.total, 50);
  assert.equal(result.queue.length, 50);
  assert.equal(result.pages, 3);
  assert.equal(result.items.length, 24);
  assert.equal(result.items[0].key, 'q:25');
  assert.deepEqual(learningShelf(items, { version: 1, entries: {} }, new URLSearchParams('filter=unread&kind=notes')).queue.map(item => item.key), ['a:note']);
  assert.equal(learningShelf(items, { version: 1, entries: {} }, new URLSearchParams('filter=unread&size=48')).items.length, 48);
  for (const size of ['0', '13', '-1', 'Infinity', '100000']) assert.equal(learningShelf(items, data, new URLSearchParams(`kind=bad&size=${size}`)).size, 12);
  assert.equal(learningShelf(items, data, new URLSearchParams('kind=bad')).kind, '');
});
