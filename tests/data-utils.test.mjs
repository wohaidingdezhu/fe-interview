import test from 'node:test';
import assert from 'node:assert/strict';
import { canonicalURL, validateResource, validateLibrary, parseArticle, filterItems } from '../src/data-utils.ts';
import { normalizeCategory } from '../src/categories.ts';

const resource = { id: 'react-guide', title: 'React 指南', url: 'https://react.dev/learn', description: '状态与渲染', source: 'React 官方', type: '官方文档', category: 'React', tags: ['React', '面试'], addedAt: '2026-10-08' };
test('URL 去重移除定位片段、默认端口、跟踪参数，并保留业务查询参数', () => {
  assert.equal(canonicalURL('https://REACT.dev:443/learn/?b=2&utm_source=test&a=1#state'), 'https://react.dev/learn?a=1&b=2');
  assert.notEqual(canonicalURL('https://react.dev/?id=1'), canonicalURL('https://react.dev/?id=2'));
  assert.notEqual(canonicalURL('https://example.com/#/react'), canonicalURL('https://example.com/#/vue'));
});
test('拒绝危险协议、带凭据 URL、缺失字段和无效日期', () => {
  for (const url of ['javascript:alert(1)', 'https://user:pass@example.com', 'not-a-url']) assert.throws(() => validateResource({ ...resource, url }));
  assert.throws(() => validateResource({ ...resource, source: '' }));
  assert.throws(() => validateResource({ ...resource, addedAt: '2026-02-30' }));
  assert.throws(() => validateResource({ ...resource, tags: 'React' }));
});
test('跨资料与笔记校验重复 ID，校验规范化 URL', () => {
  assert.throws(() => validateLibrary([resource], [{ id: resource.id }]), /重复 ID/);
  assert.throws(() => validateLibrary([resource, { ...resource, id: 'other', url: `${resource.url}/?utm_source=test#title` }]), /重复 URL/);
});
test('Markdown 元数据自动解析，支持 CRLF 与包含冒号的标题', () => {
  const raw = '---\r\nid: note\r\ntitle: "React: 状态"\r\ncategory: React\r\ndescription: 说明\r\nkind: 知识文章\r\ntags: [React, React]\r\naddedAt: "2026-10-08"\r\n---\r\n\r\n## 正文';
  const result = parseArticle(raw, 'note.md');
  assert.equal(result.title, 'React: 状态'); assert.deepEqual(result.tags, ['React']); assert.equal(result.content, '## 正文');
  assert.throws(() => parseArticle('## 无元数据', 'bad.md'), /缺少 YAML/);
});
test('文章元数据支持搜索别名、相关文章和保鲜日期', () => {
  const raw = `---
id: chrome-devtools
title: Chrome 调试
category: 浏览器
description: 调试流程
kind: 知识文章
tags: [Chrome]
aliases: [Google 浏览器调试, F12 调试, F12 调试]
related: [http-cache, http-cache]
addedAt: "2026-10-08"
updatedAt: "2026-10-09"
reviewedAt: "2026-10-09"
---
## 正文`;
  const article = parseArticle(raw, 'chrome.md');
  assert.deepEqual(article.aliases, ['Google 浏览器调试', 'F12 调试']);
  assert.deepEqual(article.related, ['http-cache']);
  assert.equal(article.updatedAt, '2026-10-09'); assert.equal(article.reviewedAt, '2026-10-09');
  assert.throws(() => parseArticle(raw.replace('related: [http-cache, http-cache]', 'related: [Bad_ID]'), 'bad-related.md'), /相关文章 ID/);
  assert.throws(() => parseArticle(raw.replace('updatedAt: "2026-10-09"', 'updatedAt: "2026-10-07"'), 'bad-date.md'), /早于 addedAt/);
  assert.throws(() => parseArticle(raw.replace('reviewedAt: "2026-10-09"', 'reviewedAt: "2026-02-30"'), 'bad-review.md'), /有效的 YYYY-MM-DD/);
});
test('组合筛选对多个标签取交集，分页越界可恢复，并且不修改源数据', () => {
  const items = [resource, { ...resource, id: 'old', addedAt: '2026-10-01', tags: ['React'] }, { ...resource, id: 'network', category: '网络', tags: ['面试'], title: '缓存' }];
  const filters = { query: 'react 状态', category: 'React', tags: ['React', '面试'], type: '官方文档', sort: 'newest', page: 99, pageSize: 1 };
  assert.equal(filterItems(items, filters).total, 1);
  assert.equal(filterItems(items, filters).page, 1);
  const result = filterItems(items, { ...filters, query: '', category: '', tags: [], type: '', page: 2 });
  assert.equal(result.pages, 3); assert.equal(result.items[0].id, 'react-guide');
  assert.equal(items[0].id, 'react-guide');
});
test('空结果及异常页码不会产生空分页范围', () => {
  const result = filterItems([resource], { query: '不存在', category: '', tags: [], type: '', sort: 'title', page: -3, pageSize: 0 });
  assert.equal(result.page, 1); assert.equal(result.pages, 1); assert.deepEqual(result.items, []);
});
test('维护状态筛选区分待补充、待审核、草稿和已公开内容', () => {
  const items = [
    { ...resource, id: 'incomplete', status: 'draft', quality: 'incomplete' },
    { ...resource, id: 'ready', status: 'draft', quality: 'complete' },
    { ...resource, id: 'published', status: 'published', quality: 'complete' },
    { ...resource, id: 'external-draft', status: 'draft' },
  ];
  const base = { query: '', category: '', tags: [], type: '', sort: 'title', page: 1, pageSize: 20 };
  const ids = (maintenance) => filterItems(items, { ...base, maintenance }).items.map((item) => item.id);
  assert.deepEqual(ids('incomplete'), ['incomplete']);
  assert.deepEqual(ids('ready'), ['ready']);
  assert.deepEqual(ids('draft'), ['incomplete', 'ready', 'external-draft']);
  assert.deepEqual(ids('published'), ['published']);
  const partial = { ...resource, id: 'partial', status: 'draft', quality: 'incomplete', questionCount: 36, publishedQuestionCount: 3 };
  const emptyTopic = { ...partial, id: 'empty-topic', publishedQuestionCount: 0 };
  assert.deepEqual(filterItems([partial, emptyTopic], { ...base, maintenance: 'published' }).items.map(item => item.id), ['partial']);
});
test('笔记列表搜索正文，与全站全文检索保持一致', () => {
  const result = filterItems([{ ...resource, content: '这段正文提到了事件循环' }], { query: '事件循环', category: '', tags: [], type: '', sort: 'newest', page: 1, pageSize: 6 });
  assert.equal(result.total, 1);
});

test('分类别名合并主题，旧书签仍匹配新旧内容且保留其他筛选条件', () => {
  const items = [
    { ...resource, id: 'note', category: 'React', tags: ['Hooks'] },
    { ...resource, id: 'topic', category: 'React 生态', tags: ['面试'] },
    { ...resource, id: 'vue', category: 'Vue', tags: ['面试'] },
  ];
  const filters = { query: '', category: 'React 生态', tags: [], type: '', sort: 'title', page: 1, pageSize: 6 };
  assert.deepEqual(filterItems(items, filters).items.map(item => item.id), ['note', 'topic']);
  assert.deepEqual(filterItems(items, { ...filters, category: 'React', tags: ['面试'] }).items.map(item => item.id), ['topic']);
  assert.equal(normalizeCategory('浏览器与网络'), '网络');
  assert.equal(normalizeCategory('计算机网络'), '网络');
  assert.equal(normalizeCategory('浏览器'), '浏览器');
  assert.equal(normalizeCategory(' 新主题 '), '新主题');
  assert.equal(normalizeCategory('constructor'), 'constructor');
  assert.equal(items[1].category, 'React 生态');
});

test('文章与外部资料录入统一分类，不改变稳定 ID 和标签', () => {
  const parsedResource = validateResource({ ...resource, category: 'React 生态' });
  assert.equal(parsedResource.category, 'React');
  assert.equal(parsedResource.id, resource.id);
  assert.deepEqual(parsedResource.tags, resource.tags);
  const article = parseArticle('---\nid: coding\ntitle: 编程题\ncategory: 代码编程\ndescription: 说明\nkind: 手写题解\ntags: [JavaScript, 手写题]\naddedAt: "2026-10-09"\n---\n## Q134｜实现函数\n正文', 'coding.md');
  assert.equal(article.category, '算法与手写');
  assert.equal(article.id, 'coding');
  assert.deepEqual(article.tags, ['JavaScript', '手写题']);
  assert.match(article.content, /Q134/);
});
