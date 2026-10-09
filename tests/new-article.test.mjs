import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createArticle } from '../scripts/new-article.mjs';
import { parseArticle } from '../src/data-utils.ts';
import { articlePublicationErrors } from '../scripts/publication.mjs';

test('脚手架在分类子目录生成可解析的安全草稿', async (t) => {
  const articlesDir = await mkdtemp(join(tmpdir(), 'new-article-'));
  t.after(() => rm(articlesDir, { recursive: true, force: true }));
  const target = await createArticle({
    relativePath: 'browser/chrome-devtools-workflow', articlesDir,
    title: 'Chrome DevTools 调试操作流程', category: '浏览器',
    description: '从复现问题到定位、验证和记录的完整调试流程。',
    tags: ['Chrome DevTools', '调试', '性能'], aliases: ['Google 浏览器调试', 'F12 调试'],
    related: ['http-cache'], addedAt: '2026-10-09', updatedAt: '2026-10-09', reviewedAt: '2026-10-09',
  });
  const raw = await readFile(target, 'utf8');
  const article = parseArticle(raw, target);
  assert.equal(article.id, 'chrome-devtools-workflow');
  assert.equal(article.status, 'draft'); assert.equal(article.quality, 'incomplete');
  assert.deepEqual(article.tags, ['Chrome DevTools', '调试', '性能']);
  assert.deepEqual(article.aliases, ['Google 浏览器调试', 'F12 调试']); assert.deepEqual(article.related, ['http-cache']);
  assert.equal(article.reviewedAt, '2026-10-09');
  assert.match(raw, /## 内容提纲/);
  const errors = articlePublicationErrors({ ...article, status: 'published', quality: 'complete', sources: ['https://example.com/source'], technologyVersion: '测试环境' });
  assert.ok(errors.some(error => error.includes('模板')));
});

test('脚手架拒绝目录穿越、隐藏目录、非法 ID 和覆盖已有文章', async (t) => {
  const articlesDir = await mkdtemp(join(tmpdir(), 'new-article-safe-'));
  t.after(() => rm(articlesDir, { recursive: true, force: true }));
  const base = { articlesDir, title: '文章', category: '测试', description: '文章简介', tags: ['测试'], addedAt: '2026-10-09' };
  for (const relativePath of ['../secret', '.private/note', 'browser/Bad_ID']) {
    await assert.rejects(() => createArticle({ ...base, relativePath }), /路径|ID/);
  }
  await createArticle({ ...base, relativePath: 'browser/existing' });
  await assert.rejects(() => createArticle({ ...base, relativePath: 'browser/existing' }), /已存在/);
});
