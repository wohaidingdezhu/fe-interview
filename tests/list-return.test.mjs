import test from 'node:test';
import assert from 'node:assert/strict';
import { navigationListReturn, readListReturn } from '../src/list-return.ts';

const url = path => new URL(path, 'https://library.example/fe-interview/');

test('从各列表进入正文保留完整筛选，支持重复标签和 React 路径', () => {
  const queries = ['?view=questions&q=React&category=React&size=24&page=2', '?view=notes&collection=notes&tag=React&tag=Hooks&sort=title', '?view=resources&category=工程实践&q=服务', '?view=learning&filter=review&sort=oldest&page=3', '?view=learning&path=react-basics'];
  for (const query of queries) {
    const source = url(query), target = url('?article=closure#词法作用域');
    const context = navigationListReturn(source, target, null);
    assert.equal(context.href, source.search);
    assert.deepEqual(readListReturn({ listReturn: context.href }), context);
  }
  assert.equal(navigationListReturn(url(queries[4]), url('?article=react-state'), null).label, 'React 学习路径');
});

test('正文锚点和继续阅读沿用来源，切换列表或进入学习模式清除来源', () => {
  const state = { listReturn: '?view=questions&page=2&tag=CSS' };
  assert.equal(navigationListReturn(url('?article=closure'), url('?article=event-loop#任务'), state).href, state.listReturn);
  assert.equal(navigationListReturn(url('articles/closure/'), url('?article=closure#作用域'), state).href, state.listReturn);
  assert.equal(navigationListReturn(url('?article=closure'), url('?view=notes'), state), undefined);
  assert.equal(navigationListReturn(url('?view=questions'), url('?article=closure&study=1'), state), undefined);
  assert.equal(navigationListReturn(url('?article=closure&study=1'), url('?article=closure'), state), undefined);
  assert.equal(navigationListReturn(url('?view=home'), url('?article=closure'), state), undefined);
});

test('忽略无效或站外返回值，分享直达和其他站点不能继承列表来源', () => {
  for (const value of [null, 1, '?view=unknown', '?article=closure', '?view=questions&article=closure', '?view=learning&study=1', '?view=notes#other', 'https://evil.example/?view=questions', '//evil.example/?view=questions', 'javascript:alert(1)', '?view=notes&q=' + 'x'.repeat(10_000)]) assert.equal(readListReturn({ listReturn: value }), undefined);
  assert.equal(readListReturn(null), undefined);
  assert.equal(navigationListReturn(url('?view=questions'), url('?article=closure'), {} ).label, '题目列表');
  assert.equal(navigationListReturn(url('?article=closure'), url('?article=event-loop'), null), undefined);
  assert.equal(navigationListReturn(url('?view=questions'), new URL('https://other.example/?article=closure'), null), undefined);
});
