import test from 'node:test';
import assert from 'node:assert/strict';
import { checkLink, checkLinks, publicURL } from '../scripts/link-utils.mjs';
import { collectLinkReferences, createLinkReports } from '../scripts/link-report.mjs';
import { selectPublished } from '../scripts/publication.mjs';

const linkReferences = (library, files) => collectLinkReferences(selectPublished(library), {
  articleFiles: library.articles.map(article => ({ article, path: library.articlePaths[article.id], raw: files[library.articlePaths[article.id]] })),
  resourcesText: files['src/data/resources.json'] ?? '[]',
  questionText: files['src/data/question-publication.json'] ?? '{}',
});

test('HEAD 不支持时使用小流量 GET，记录重定向并取消响应正文', async () => {
  const calls = [];
  const fetchImpl = async (url, options) => {
    calls.push([url, options.method, options.headers.Range]);
    if (url.endsWith('/old')) return new Response('', { status: 301, headers: { location: '/new' } });
    return new Response('body', { status: options.method === 'HEAD' ? 405 : 206 });
  };
  const result = await checkLink('https://example.com/old#anchor', { fetchImpl });
  assert.equal(result.state, 'redirected'); assert.equal(result.finalURL, 'https://example.com/new');
  assert.deepEqual(calls.map(item => item[1]), ['HEAD', 'HEAD', 'GET']); assert.equal(calls[2][2], 'bytes=0-1023');
});

test('维护报告定位正文、引用定义及逐题来源，草稿不泄露，共享 URL 保留所有位置', () => {
  const content = '## Q1｜公开题\n这是一道完整的文字答案，用足够的说明解释问题，并保留参考资料链接。\n[正文](https://example.com/shared#one) 与 [定义][ref]。\n\n## Q2｜私人草稿\n这里的资料不公开。[秘密](https://example.com/private)\n\n[ref]: https://example.com/shared#two';
  const header = '---\nid: topic\n---\n';
  const article = { id: 'topic', title: '专题', content, sources: [], related: [], status: 'draft' };
  const publication = { status: 'published', quality: 'complete', technologyVersion: '现代浏览器', reviewedAt: '2026-10-14', sources: ['https://example.com/shared#source'] };
  const library = { articles: [article], resources: [], articlePaths: { topic: 'src/articles/topic.md' }, questionPublication: { Q1: publication, Q2: { status: 'draft' } } };
  const references = linkReferences(library, { 'src/articles/topic.md': header + content, 'src/data/question-publication.json': JSON.stringify(library.questionPublication, null, 2) });
  assert.equal(references.some(ref => ref.url === 'https://example.com/private'), false);
  const shared = references.filter(ref => ref.url === 'https://example.com/shared');
  assert.equal(shared.length, 3); // 同一行使用两个不同地址，分别定位正文和引用定义，再加来源清单。
  assert.equal(shared.find(ref => ref.originalURL.endsWith('#one')).line, 6);
  const definition = shared.find(ref => ref.originalURL.endsWith('#two'));
  assert.equal(definition.usageLine, 6);
  assert.ok(definition.line > definition.usageLine);
  assert.ok(shared.every(ref => ref.questionNumber === 1));
  const report = createLinkReports([{ url: 'https://example.com/ok', state: 'ok', status: 200 }, { url: 'https://example.com/shared', state: 'dead', status: 404 }], references, { checkedAt: '2026-10-14' });
  assert.equal(report.items[0].state, 'dead');
  assert.match(report.markdown, /专题.*Q1.*src\/articles\/topic.md:6/);
  assert.doesNotMatch(report.markdown, /私人草稿|example.com\/private/);
});

test('普通文章与外部资料的来源可定位，代码块中的 URL 不当作引用', () => {
  const content = '正文提供足够的说明，让这篇知识文章满足完整度要求，并且附上实际参考资料。\n[参考](https://example.com/shared)\n\n```js\nconst url = "https://example.com/code";\n```';
  const article = { id: 'note', title: '笔记|测试', content, sources: ['https://example.com/source'], related: [], status: 'published', quality: 'complete', technologyVersion: '测试版本' };
  const resource = { id: 'resource', title: '外部资料', url: 'https://example.com/shared#anchor', status: 'published' };
  const source = '---\nid: note\nsources: ["https://example.com/source"]\n---\n';
  const references = linkReferences({ articles: [article], resources: [resource], articlePaths: { note: 'src/articles/nested/note.md' } }, {
    'src/articles/nested/note.md': source + content, 'src/data/resources.json': JSON.stringify([resource], null, 2),
  });
  assert.equal(references.some(ref => ref.url === 'https://example.com/code'), false);
  assert.equal(references.find(ref => ref.url === 'https://example.com/source').line, 3);
  assert.equal(references.filter(ref => ref.url === 'https://example.com/shared').length, 2);
  const report = createLinkReports([{ url: 'https://example.com/shared', state: 'restricted', status: 403 }], references);
  assert.match(report.markdown, /笔记.*测试/);
  assert.match(report.markdown, /src\/articles\/nested\/note.md:6/);
  assert.equal(report.items[0].references.find(ref => ref.kind === 'resource').path, 'src/data/resources.json');
});
test('区别永久失效、访问限制、限流和临时错误，不追踪危险重定向', async () => {
  for (const [status, state] of [[404, 'dead'], [410, 'dead'], [403, 'restricted'], [429, 'temporary'], [503, 'temporary']]) {
    assert.equal((await checkLink('https://example.com', { fetchImpl: async () => new Response(null, { status }) })).state, state);
  }
  const redirected = await checkLink('https://example.com', { fetchImpl: async () => new Response(null, { status: 302, headers: { location: 'file:///secret' } }) });
  assert.equal(redirected.state, 'temporary'); assert.match(redirected.error, /HTTP/);
  assert.throws(() => publicURL('https://user:pass@example.com'));
});
test('重复锚点只检查一次，并发上限以及异常回收', async () => {
  let running = 0, peak = 0;
  const results = await checkLinks(['https://example.com/a', 'https://example.com/a#test', 'https://example.com/b', 'https://example.com/c'], { concurrency: 2, fetchImpl: async url => {
    running++; peak = Math.max(peak, running); await new Promise(resolve => setTimeout(resolve, 5)); running--;
    if (url.endsWith('/b')) throw new Error('网络不可达'); return new Response(null, { status: 200 });
  } });
  assert.equal(results.length, 3); assert.ok(peak <= 2); assert.equal(results[1].state, 'temporary');
});
