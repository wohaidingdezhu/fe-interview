import test from 'node:test';
import assert from 'node:assert/strict';
import { contentAssets } from '../scripts/content-assets.mjs';
import { searchDocuments, searchHits } from '../src/search-utils.ts';
import { questionPage } from '../src/library-utils.ts';
import { filterItems } from '../src/data-utils.ts';

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
  assert.equal(documents[0].title, article.title);
  assert.deepEqual(documents[0].aliases, article.aliases);
});

test('题目与笔记使用相同标题权重，完整标题、别名优先于正文', () => {
  const docs = [
    { id: 'body', text: '正文解释 HTTP 缓存' },
    { id: 'partial', title: 'HTTP 缓存实践', text: 'HTTP 缓存实践' },
    { id: 'alias', title: '浏览器缓存指南', aliases: ['HTTP 缓存'], text: '浏览器缓存指南 HTTP 缓存' },
    { id: 'note', title: 'HTTP 缓存', text: 'HTTP 缓存' },
    { id: 'question', title: 'HTTP 缓存', questionTitle: 'Q8｜HTTP 缓存', questionNumber: 8, anchor: 'q8', text: 'HTTP 缓存' },
  ];
  assert.deepEqual(searchHits(docs, '  http   缓存 ').map(hit => hit.id), ['note', 'question', 'alias', 'partial', 'body']);
  assert.deepEqual(searchHits(docs, '缓存 HTTP').map(hit => hit.id), ['partial', 'note', 'question', 'alias', 'body']);
  assert.deepEqual(searchHits(docs, 'Q8 缓存').map(hit => hit.id), ['question']);
  assert.equal(searchHits(docs, 'HTTP 不存在').length, 0);
});

test('专题别名不会变成每一道题的独立别名', () => {
  const topic = { id: 'topic', title: 'JS 专题', aliases: ['闭包'], category: 'JS', tags: [], description: '示例', content: '## Q1｜其他题\n答案提到了闭包。' };
  const assets = contentAssets({ articles: [topic], resources: [] });
  const docs = JSON.parse(assets.assets.find(item => item.fileName === assets.catalog.searchPath).source);
  assert.equal(docs[0].title, '其他题');
  assert.equal(docs[0].aliases, undefined);
  assert.deepEqual(searchHits([...docs, { id: 'note', title: '闭包详解', text: '闭包详解' }], '闭包').map(hit => hit.id), ['note', 'topic']);
});

test('题库分页与学习清单保留相关性，空查询仍按题号', () => {
  const questions = [1, 2, 3].map(number => ({ number, title: number === 3 ? '闭包' : '其他题', articleId: 'topic', category: 'JS', tags: [] }));
  const documents = questions.map(q => ({ id: q.articleId, questionNumber: q.number, questionTitle: `Q${q.number}｜${q.title}`, title: q.title, text: `${q.title} 闭包` }));
  const options = { query: '闭包', category: 'JS', tag: '', page: 1, size: 12, documents };
  assert.deepEqual(questionPage(questions, options).queue.map(q => q.number), [3, 1, 2]);
  assert.deepEqual(questionPage(questions, { ...options, ids: new Set([1, 3]) }).items.map(q => q.number), [3, 1]);
  assert.deepEqual(questionPage(questions, { ...options, query: '' }).items.map(q => q.number), [1, 2, 3]);
});

test('相关性列表保留输入顺序，但显式日期排序仍生效', () => {
  const items = ['old', 'new'].map((id, index) => ({ id, title: id, description: '', source: '', category: 'JS', tags: [], type: '知识文章', addedAt: `2026-10-0${index + 1}` }));
  const filters = { query: '', category: '', tags: [], type: '', sort: 'relevance', page: 1, pageSize: 1 };
  assert.equal(filterItems(items, filters).items[0].id, 'old');
  assert.equal(filterItems(items, { ...filters, sort: 'newest' }).items[0].id, 'new');
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
