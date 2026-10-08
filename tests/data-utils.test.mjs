import test from 'node:test';
import assert from 'node:assert/strict';
import { canonicalURL, validateResource, validateLibrary, parseArticle, filterItems } from '../src/data-utils.ts';

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
test('笔记列表搜索正文，与全站全文检索保持一致', () => {
  const result = filterItems([{ ...resource, content: '这段正文提到了事件循环' }], { query: '事件循环', category: '', tags: [], type: '', sort: 'newest', page: 1, pageSize: 6 });
  assert.equal(result.total, 1);
});
