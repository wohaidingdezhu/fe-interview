import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { readLibrary } from '../scripts/library.mjs';
import { selectPublished } from '../scripts/publication.mjs';
import { readLinkReferences, createLinkReports } from '../scripts/link-report.mjs';
import { checkLinks } from '../scripts/link-utils.mjs';

const fixture = async t => {
  const root = await mkdtemp(join(tmpdir(), 'fe-link-report-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(join(root, 'src/articles/nested'), { recursive: true });
  await mkdir(join(root, 'src/data'), { recursive: true });
  const raw = `---
id: topic
title: 测试专题
category: React
description: 测试公开引用与原始行号
kind: 知识文章
tags: [测试]
addedAt: "2026-10-09"
status: draft
quality: complete
sources: ["https://example.com/shared#topic"]
---

导言 [来源](https://example.com/shared#intro)。

## Q1｜公开问题

这道题的解释包含足够长的中文正文，说明原理、适用范围和引用位置，以便满足公开发布校验。[参考][shared]

\`\`\`md
## Q999｜代码中的伪题号
[不检查](https://example.com/code)
\`\`\`

## Q2｜草稿问题

这道题仍是草稿，不应该出现在公开链接维护报告中。[草稿](https://example.com/draft)

[shared]: https://example.com/shared#reference
`;
  const resource = { id: 'resource', title: '公开资料', url: 'https://example.com/shared#resource', description: '参考资料', source: '官方', type: '文章', category: 'React', tags: [], addedAt: '2026-10-09', status: 'published' };
  const published = { status: 'published', quality: 'complete', sources: ['https://example.com/shared#question'], reviewedAt: '2026-10-09', technologyVersion: 'React 19' };
  await writeFile(join(root, 'src/articles/nested/topic.md'), raw);
  await writeFile(join(root, 'src/data/resources.json'), JSON.stringify([resource, { ...resource, id: 'draft-resource', status: 'draft', url: 'https://example.com/draft-resource' }], null, 2));
  await writeFile(join(root, 'src/data/question-publication.json'), JSON.stringify({ Q1: published, Q2: { ...published, status: 'draft', sources: ['https://example.com/draft-source'] }, Q3: { ...published, sources: ['https://example.com/orphan'] } }, null, 2));
  return { root, raw };
};

test('公开引用按原文件定位，保留同一网址的每个来源，排除草稿和代码伪链接', async t => {
  const { root, raw } = await fixture(t);
  const references = await readLinkReferences(selectPublished(await readLibrary(root)), root);
  assert.equal(references.length, 5);
  assert.ok(references.every(reference => reference.url === 'https://example.com/shared'));
  const body = references.find(reference => reference.kind === 'body-link' && reference.questionNumber === 1);
  assert.equal(body.path, 'src/articles/nested/topic.md');
  assert.equal(body.line, raw.split('\n').findIndex(line => line.startsWith('[shared]:')) + 1);
  assert.equal(body.usageLine, raw.split('\n').findIndex(line => line.includes('[参考][shared]')) + 1);
  const source = references.find(reference => reference.kind === 'question-source');
  assert.equal(source.questionNumber, 1);
  assert.equal(source.articleTitle, '测试专题');
  assert.equal(source.articleLine, raw.split('\n').findIndex(line => line.startsWith('## Q1')) + 1);
  for (const reference of references.filter(reference => reference.kind !== 'body-link')) {
    const text = await readFile(join(root, reference.path), 'utf8');
    assert.ok(text.split('\n')[reference.line - 1].includes(reference.originalURL));
  }
  let calls = 0;
  const results = await checkLinks(references.map(reference => reference.url), { fetchImpl: async () => { calls++; return new Response(null, { status: 404 }); } });
  assert.equal(calls, 1);
  assert.equal(createLinkReports(results, references).items[0].references.length, 5);
});

test('报告优先处理疑似失效并保留状态区别、全部文件位置与可操作建议', () => {
  const refs = [
    { url: 'https://example.com/dead', originalURL: 'https://example.com/dead#one', articleTitle: '专题 | <script>', title: '问题', questionNumber: 1, path: 'src/articles/folder name/topic.md', line: 23 },
    { url: 'https://example.com/dead', originalURL: 'https://example.com/dead#two', title: '资料', path: 'src/data/resources.json', line: 5 },
  ];
  const results = ['ok', 'restricted', 'temporary', 'dead', 'redirected'].map(state => ({ url: `https://example.com/${state}`, state, status: ({ ok: 200, restricted: 403, temporary: 429, dead: 404, redirected: 200 })[state] }));
  const report = createLinkReports(results, refs, { checkedAt: '2026-10-14T00:00:00Z', repositoryURL: 'https://github.com/example/repo', revision: 'abc123' });
  assert.deepEqual(report.items.map(item => item.state), ['dead', 'temporary', 'restricted', 'redirected', 'ok']);
  assert.equal(report.pending, 3);
  assert.equal(report.items[0].references.length, 2);
  assert.match(report.markdown, /blob\/abc123\/src\/articles\/folder%20name\/topic.md#L23/);
  assert.match(report.markdown, /Q1/);
  assert.match(report.markdown, /不按永久失效处理/);
  assert.doesNotMatch(report.markdown, /<script>/);
  assert.match(report.summary, /published-link-report/);
  const pipe = createLinkReports([{ url: 'https://example.com/?q=a|b', state: 'ok', status: 200 }], []);
  assert.match(pipe.markdown, /q=a%7Cb/);
});

test('Actions 摘要截断长清单但完整 JSON 和 Markdown 不丢引用，正常报告没有待办', () => {
  const results = Array.from({ length: 60 }, (_, index) => ({ url: `https://example.com/item-${index}`, state: 'dead', status: 404 }));
  const report = createLinkReports(results, []);
  assert.equal(report.items.length, 60);
  assert.equal(report.summary.match(/\| 1 · 疑似失效/g).length, 50);
  assert.equal(report.markdown.match(/\| 1 · 疑似失效/g).length, 120);
  assert.match(createLinkReports([{ url: 'https://example.com/', state: 'ok', status: 200 }], []).summary, /没有需要复核的地址/);
});
