import test from 'node:test';
import assert from 'node:assert/strict';
import { contentAssets } from '../scripts/content-assets.mjs';
import { searchDocuments } from '../src/search-utils.ts';

test('目录不携带正文，正文变更只改变对应资产地址；搜索保留正文关键词', () => {
  const article = { id: 'test', title: 'React 笔记', category: '框架', tags: ['性能'], aliases: ['状态管理快照', '旧闭包'], description: '介绍', content: '## 依赖\n介绍 AbortController 与取消请求。' };
  const first = contentAssets({ articles: [article], resources: [] });
  assert.equal(first.catalog.resources, undefined);
  assert.equal(first.catalog.articles[0].content, undefined);
  const changed = contentAssets({ articles: [{ ...article, content: `${article.content}\n补充` }], resources: [] });
  assert.notEqual(changed.catalog.articles[0].bodyPath, first.catalog.articles[0].bodyPath);
  assert.notEqual(changed.catalog.searchPath, first.catalog.searchPath);
  const documents = JSON.parse(first.assets.find(item => item.fileName === first.catalog.searchPath).source);
  assert.ok(searchDocuments(documents, 'react 取消').has('test'));
  assert.equal(searchDocuments(documents, 'react 不存在').size, 0);
  assert.match(searchDocuments(documents, 'AbortController').get('test'), /取消请求/);
  assert.ok(searchDocuments(documents, '状态管理快照').has('test'));
});

test('题库索引按题分开，精确题号不命中前缀或其他题的引用', async () => {
  const { searchHits } = await import('../src/search-utils.ts');
  const article = { id: 'topic', title: 'JavaScript', category: 'JavaScript', tags: ['面试'], description: '两道题', content: '## Q1｜Promise 组合\n讲述 Promise.all，参见 Q10。\n\n## Q10｜防抖函数\n实现 debounce，参见 Q1。' };
  const assets = contentAssets({ articles: [article], resources: [] });
  const docs = JSON.parse(assets.assets.find(item => item.fileName === assets.catalog.searchPath).source);
  assert.equal(docs.filter(doc => doc.questionNumber).length, 2);
  assert.deepEqual(searchHits(docs, 'q1').map(hit => hit.questionNumber), [1]);
  assert.deepEqual(searchHits(docs, 'Q10 防抖').map(hit => hit.anchor), ['q10']);
  assert.equal(searchHits(docs, 'Promise debounce').length, 0);
  assert.equal(searchHits(docs, 'Q999').length, 0);
  assert.equal(searchDocuments(docs, 'JavaScript').size, 1);
});
test('题目结果排序优先标题，普通文章保持关键词搜索', async () => {
  const { searchHits } = await import('../src/search-utils.ts');
  const docs = [{ id: 'a', text: '介绍闭包', questionNumber: 1, questionTitle: '其他内容', anchor: 'q1' }, { id: 'b', text: '闭包的定义', questionNumber: 2, questionTitle: '闭包', anchor: 'q2' }, { id: 'note', text: '单独笔记稳定引用' }];
  assert.deepEqual(searchHits(docs, '闭包').map(hit => hit.id), ['b', 'a']);
  assert.deepEqual(searchHits(docs, '稳定引用').map(hit => hit.id), ['note']);
  assert.deepEqual(searchHits(docs, '   '), []);
});
