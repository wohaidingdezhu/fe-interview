import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { build } from 'vite';
import { parseArticle, validateResource } from '../src/data-utils.ts';
import { inspectQuestions, selectPublished, validateContent, localImagePath } from '../scripts/publication.mjs';
import { publicationPlugin } from '../scripts/publication-plugin.mjs';

const resource = { id: 'resource', title: '资料', url: 'https://example.com', description: '简介', source: '示例', type: '文章', category: '测试', tags: [], addedAt: '2026-10-09' };
function markdown(id, body, extra = '') {
  return `---\nid: ${id}\ntitle: ${id}\ncategory: 测试\ndescription: 简介\nkind: 知识文章\ntags: []\naddedAt: "2026-10-09"\n${extra}\n---\n${body}`;
}
test('缺省状态安全地作为草稿，私人备注不能写入公开模型', () => {
  const article = parseArticle(markdown('draft', '草稿正文'), 'draft.md');
  assert.equal(article.status, 'draft'); assert.equal(article.quality, 'incomplete');
  assert.equal(validateResource(resource).status, 'draft');
  assert.throws(() => validateResource({ ...resource, privateNotes: '私人备注' }), /\.private/);
  assert.throws(() => parseArticle(markdown('note', '正文', 'privateNotes: 私人备注'), 'note.md'), /\.private/);
  assert.throws(() => validateResource({ ...resource, status: 'publised' }), /status/);
});
test('仅凭 published 不能绕过不完整质量和空答案的发布阻断', () => {
  const article = parseArticle(markdown('note', '## Q1｜空题\n答案：\n![](./images/a.png)', 'status: published\nquality: complete'), 'note.md');
  assert.equal(inspectQuestions(article)[0].issue, 'empty');
  assert.throws(() => selectPublished({ articles: [article], resources: [] }), /不能公开/);
  article.content = '完整的正文'; article.quality = 'incomplete';
  assert.throws(() => selectPublished({ articles: [article], resources: [] }), /不能公开/);
});
test('校验报告区分草稿告警与公开错误，检测图片和公开到草稿的链接', async () => {
  const draft = parseArticle(markdown('draft', '## Q1｜待补\n答案：'), 'draft.md');
  const published = parseArticle(markdown('published', '[草稿](?article=draft)\n![图](./images/missing.png)', 'status: published\nquality: complete'), 'published.md');
  const report = await validateContent({ articles: [draft, published], resources: [] }, tmpdir());
  assert.equal(report.summary.empty, 1);
  assert.ok(report.warnings.some((value) => value.includes('Q1')));
  assert.ok(report.errors.some((value) => value.includes('链接到了草稿')));
  assert.ok(report.errors.some((value) => value.includes('图片不存在')));
  assert.throws(() => localImagePath('../.private/secret.png', tmpdir()), /超出/);
  assert.throws(() => localImagePath('.private/secret.png', tmpdir()), /超出/);
});
test('实际生产构建排除草稿正文、搜索数据、私人文件及草稿专用图片', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'fe-publication-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  for (const directory of ['src/articles', 'src/data', 'public/images', '.private']) await mkdir(join(root, directory), { recursive: true });
  await writeFile(join(root, 'index.html'), '<div id="app"></div><script type="module" src="/main.js"></script>');
  await writeFile(join(root, 'main.js'), 'import library from "virtual:library"; document.getElementById("app").textContent=JSON.stringify(library);');
  await writeFile(join(root, 'src/articles/public.md'), markdown('public', 'PUBLIC_BODY_SENTINEL\n![公开图](./images/public.png)', 'status: published\nquality: complete'));
  await writeFile(join(root, 'src/articles/draft.md'), markdown('draft', 'DRAFT_BODY_SENTINEL\n![草稿图](./images/draft.png)'));
  await writeFile(join(root, 'src/data/resources.json'), JSON.stringify([{ ...resource, id: 'public-resource', status: 'published' }, { ...resource, id: 'draft-resource', url: 'https://example.com/draft', title: 'DRAFT_RESOURCE_SENTINEL' }]));
  await writeFile(join(root, '.private/resources.json'), 'PRIVATE_NOTES_SENTINEL');
  await writeFile(join(root, 'public/images/public.png'), 'PUBLIC_IMAGE_SENTINEL');
  await writeFile(join(root, 'public/images/draft.png'), 'DRAFT_IMAGE_SENTINEL');
  await writeFile(join(root, 'public/favicon.svg'), '<svg/>');
  await build({ root, configFile: false, base: './', plugins: [publicationPlugin()], logLevel: 'silent' });
  const assets = await readdir(join(root, 'dist/assets'));
  const code = (await Promise.all(assets.filter((file) => file.endsWith('.js')).map((file) => readFile(join(root, 'dist/assets', file), 'utf8')))).join('\n');
  assert.doesNotMatch(code, /PUBLIC_BODY_SENTINEL/);
  assert.doesNotMatch(code, /DRAFT_BODY_SENTINEL|DRAFT_RESOURCE_SENTINEL|PRIVATE_NOTES_SENTINEL/);
  const content = await readdir(join(root, 'dist/content'));
  assert.equal(content.length, 1);
  assert.match(await readFile(join(root, 'dist/content', content[0]), 'utf8'), /PUBLIC_BODY_SENTINEL/);
  const search = await readdir(join(root, 'dist/search'));
  assert.equal(search.length, 1);
  const index = await readFile(join(root, 'dist/search', search[0]), 'utf8');
  assert.match(index, /PUBLIC_BODY_SENTINEL/);
  assert.doesNotMatch(index, /DRAFT_BODY_SENTINEL|DRAFT_RESOURCE_SENTINEL|PRIVATE_NOTES_SENTINEL/);
  assert.deepEqual(await readdir(join(root, 'dist/images')), ['public.png']);
  assert.equal(await readFile(join(root, 'dist/favicon.svg'), 'utf8'), '<svg/>');
});
