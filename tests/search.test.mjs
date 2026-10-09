import test from 'node:test';
import assert from 'node:assert/strict';
import { contentAssets } from '../scripts/content-assets.mjs';
import { searchDocuments } from '../src/search-utils.ts';

test('目录不携带正文，正文变更只改变对应资产地址；搜索保留正文关键词', () => {
  const article = { id: 'test', title: 'React 笔记', category: '框架', tags: ['性能'], aliases: ['状态管理快照', '旧闭包'], description: '介绍', content: '## 依赖\n介绍 AbortController 与取消请求。' };
  const first = contentAssets({ articles: [article], resources: [] });
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
