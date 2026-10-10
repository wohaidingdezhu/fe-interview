import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { build } from 'vite';
import { parseArticle, validateQuestionPublicationMap, validateResource } from '../src/data-utils.ts';
import { inspectQuestions, selectPublished, validateContent, localImagePath, imagePaths, linkPaths } from '../scripts/publication.mjs';
import { contentAssets } from '../scripts/content-assets.mjs';
import { publicationPlugin } from '../scripts/publication-plugin.mjs';

const resource = { id: 'resource', title: '资料', url: 'https://example.com', description: '简介', source: '示例', type: '文章', category: '测试', tags: [], addedAt: '2026-10-09' };
function markdown(id, body, extra = '') {
  if (extra.includes('status: published')) extra += '\nsources: ["https://example.com/reference"]\ntechnologyVersion: 测试环境';
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
test('普通文章不能仅改状态发布空提纲，缺少来源或版本也会阻断', async () => {
  const content = '这是一篇完整的知识说明，解释实际问题、操作步骤、可观察结果、适用条件和常见的错误边界。';
  const article = parseArticle(markdown('note', content, 'status: published\nquality: complete'), 'note.md');
  assert.equal(selectPublished({ articles: [article], resources: [], questionPublication: {} }).articles.length, 1);
  for (const [field, value, expected] of [['sources', [], /来源/], ['technologyVersion', undefined, /版本/], ['content', '## 内容提纲\n\n> 维护状态：这是一篇新建草稿。', /模板|正文/]]) {
    const invalid = { ...article, [field]: value };
    assert.throws(() => selectPublished({ articles: [invalid], resources: [], questionPublication: {} }), expected);
    const report = await validateContent({ articles: [invalid], resources: [], questionPublication: {} }, tmpdir());
    assert.ok(report.errors.some(error => expected.test(error)));
    const draft = await validateContent({ articles: [{ ...invalid, status: 'draft' }], resources: [], questionPublication: {} }, tmpdir());
    assert.equal(draft.errors.length, 0); assert.ok(draft.warnings.some(warning => expected.test(warning)));
  }
});
test('代码围栏中的示例题号不会把普通文章误识别为题库', async () => {
  for (const fence of ['```', '````', '~~~']) {
    const body = `这是一篇完整的 Markdown 使用说明，解释格式、使用步骤、可观察结果和常见错误边界。\n\n${fence}md\n## Q999｜示例标题\n示例正文\n${fence}`;
    const article = parseArticle(markdown('note', body, 'status: published\nquality: complete'), 'note.md');
    const library = { articles: [article], resources: [], questionPublication: {} };
    assert.deepEqual(inspectQuestions(article), []);
    assert.equal(selectPublished(library).articles[0].content, body);
    const report = await validateContent(library, tmpdir());
    assert.equal(report.summary.questions, 0); assert.equal(report.errors.length, 0);
  }
});
test('真实题目中的示例题号不切断正文或改变逐题发布范围', () => {
  const body = '## Q1｜公开说明\n这是经过审核的完整说明，解释实际问题、使用步骤、可观察结果和常见错误边界。\n\n```md\n## Q999｜示例标题\n```\n\n## Q2｜草稿说明\nDRAFT_SENTINEL';
  const article = parseArticle(markdown('topic', body), 'topic.md');
  const questionPublication = { Q1: { status: 'published', quality: 'complete', sources: ['https://example.com/ref'], technologyVersion: '测试环境', reviewedAt: '2026-10-09' } };
  const questions = inspectQuestions(article);
  assert.deepEqual(questions.map(question => question.number), [1, 2]);
  assert.match(questions[0].body, /## Q999｜示例标题/);
  const published = selectPublished({ articles: [article], resources: [], questionPublication });
  assert.match(published.articles[0].content, /## Q999｜示例标题/);
  assert.doesNotMatch(published.articles[0].content, /DRAFT_SENTINEL/);
  const metadata = contentAssets(published).catalog.articles[0];
  assert.equal(metadata.questionCount, 2); assert.equal(metadata.publishedQuestionCount, 1);
});
test('图片说明、引用定义和地址不计入答案字数，图片空题无法公开', async () => {
  const alt = '这是一个很长的图片说明，它只是图片的替代文本，不能代替对题目的实质答案和原理解释';
  const url = 'https://example.com/images/long-reference-without-any-written-answer.png';
  const definition = `\n\n[answer]: ${url}\n[${alt}]: ${url}`;
  const forms = [`![${alt}](${url})`, `![${alt}][answer]`, `![${alt}][]`, `![${alt}]`];
  for (const form of forms) {
    const article = parseArticle(markdown('topic', `## Q1｜概念说明\n答案：\n${form}${definition}`), 'topic.md');
    const questionPublication = { Q1: { status: 'published', quality: 'complete', sources: ['https://example.com/ref'], technologyVersion: '测试环境', reviewedAt: '2026-10-09' } };
    const library = { articles: [article], resources: [], questionPublication };
    assert.equal(inspectQuestions(article)[0].characters, 0);
    assert.ok(inspectQuestions(article)[0].issues.includes('empty'));
    assert.throws(() => selectPublished(library), /empty/);
    const report = await validateContent(library, tmpdir());
    assert.equal(report.summary.empty, 1); assert.ok(report.errors.some(error => /Q1.*empty/.test(error)));
    const draft = await validateContent({ ...library, questionPublication: {} }, tmpdir());
    assert.equal(draft.errors.length, 0); assert.ok(draft.warnings.some(warning => /Q1.*empty/.test(warning)));
  }
});
test('跨题图片引用不掩盖空答案，真实文字和实现代码仍被统计', () => {
  const content = '## Q1｜草稿说明\n[shared]: https://example.com/images/long-reference-without-any-written-answer.png\n\n## Q2｜概念说明\n![很长的替代文本不能代表实际答案和原理说明，也不能作为完整度校验所需的实质文字内容][shared]\n\n## Q3｜实现一个函数\n```js\nfunction combineValues(firstValue, secondValue) { return firstValue + secondValue; }\n```';
  const article = parseArticle(markdown('topic', content), 'topic.md');
  const questions = inspectQuestions(article);
  assert.equal(questions[1].characters, 0); assert.ok(questions[1].issues.includes('empty'));
  assert.ok(questions[2].characters >= 30); assert.deepEqual(questions[2].issues, []);
});
test('跨草稿引用的图片和链接只保留公开题需要的定义，题目总数不丢失', () => {
  const topic = parseArticle(markdown('topic', '## Q1｜公开说明\n这是经过人工审核的完整说明，包含适用条件、使用边界、验证步骤和需要关注的错误情况。\n![流程][SHARED]\n[来源][source]\n\n## Q2｜草稿说明\nDRAFT_SENTINEL\n\n[shared]: ./images/public.png "流程图"\n[source]: https://example.com/public\n[unused]: https://example.com/DRAFT_URL_SENTINEL'), 'topic.md');
  const questionPublication = { Q1: { status: 'published', quality: 'complete', sources: ['https://example.com/public'], technologyVersion: '测试环境', reviewedAt: '2026-10-09' } };
  const library = selectPublished({ articles: [topic], resources: [], questionPublication });
  const content = library.articles[0].content;
  assert.deepEqual(imagePaths(content), ['./images/public.png']);
  assert.match(content, /\[source\]: https:\/\/example.com\/public/);
  assert.doesNotMatch(content, /DRAFT_SENTINEL|DRAFT_URL_SENTINEL|Q2｜/);
  const metadata = contentAssets(library).catalog.articles[0];
  assert.equal(metadata.questionCount, 2); assert.equal(metadata.publishedQuestionCount, 1);
});
test('代码示例中的图片写法不作为真实图片，定义以第一次为准', () => {
  assert.deepEqual(imagePaths('```md\n![示例](./missing.png)\n```\n\n![真实][pic]\n\n[pic]: ./first.png\n[pic]: ./second.png'), ['./first.png']);
});
test('引用式站内链接仍阻断公开到草稿，代码示例不会产生假链接', async () => {
  const draft = parseArticle(markdown('draft', '草稿正文'), 'draft.md');
  const content = '这是一篇经过审核的知识说明，包含使用步骤、适用条件、验证方法和需要注意的错误边界。\n[草稿][note]\n[不存在][missing]\n[来源][source]\n\n[note]: ?article=draft\n[missing]: ?article=absent\n[source]: https://example.com/reference\n\n```md\n[示例](?article=code-only)\n```';
  const article = parseArticle(markdown('published', content, 'status: published\nquality: complete'), 'published.md');
  assert.deepEqual(linkPaths(content), ['?article=draft', '?article=absent', 'https://example.com/reference']);
  const report = await validateContent({ articles: [draft, article], resources: [], questionPublication: {} }, tmpdir());
  assert.ok(report.errors.some(error => error.includes('链接到了草稿：draft')));
  assert.ok(report.errors.some(error => error.includes('不存在的笔记：absent')));
  assert.ok(report.errors.every(error => !error.includes('code-only')));
});
test('逐题发布清单只接受稳定 Q 编号、URL 来源和合法审核日期', () => {
  const result = validateQuestionPublicationMap({ Q134: { status: 'draft' } });
  assert.equal(result.Q134.status, 'draft'); assert.equal(result.Q134.quality, 'incomplete');
  assert.throws(() => validateQuestionPublicationMap({ question134: { status: 'published' } }), /Q数字/);
  assert.throws(() => validateQuestionPublicationMap({ Q134: { status: 'published', sources: ['javascript:bad'] } }), /HTTP/);
  assert.throws(() => validateQuestionPublicationMap({ Q134: { reviewedAt: '2026-02-30' } }), /日期/);
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
test('校验相关文章和内容保鲜日期', async () => {
  const publicArticle = parseArticle(markdown('public', '这是一篇已经公开并完整审核的知识文章正文，包含核心原理、操作步骤、验证结果、适用边界和异常处理说明。', 'status: published\nquality: complete\nrelated: [public, missing, draft]\nupdatedAt: "2026-10-09"\nreviewedAt: "2026-10-08"'), 'public.md');
  const draftArticle = parseArticle(markdown('draft', '草稿正文。'), 'draft.md');
  const report = await validateContent({ articles: [publicArticle, draftArticle], resources: [] }, tmpdir());
  assert.ok(report.errors.some((value) => value.includes('不能关联自身')));
  assert.ok(report.errors.some((value) => value.includes('不存在的相关文章：missing')));
  assert.ok(report.warnings.some((value) => value.includes('相关文章仍是草稿：draft')));
  assert.ok(report.warnings.some((value) => value.includes('更新晚于最近审核')));
  assert.equal(report.summary.staleReviews, 1);
  assert.deepEqual(selectPublished({ articles: [publicArticle, draftArticle], resources: [] }).articles[0].related, []);
});
test('逐题发布只输出审核通过的题目，并拒绝缺少来源和版本的题目', () => {
  const topic = parseArticle(markdown('topic', '## Q1｜概念一\n这是第一道题的完整解释，保留在草稿中，不应该进入生产正文。\n\n## Q2｜概念二\n这是第二道题经过审核的完整解释，说明了核心概念、适用条件、限制边界和实际使用时需要注意的异常情况，可以单独发布。'), 'topic.md');
  const questionPublication = validateQuestionPublicationMap({ Q2: { status: 'published', quality: 'complete', sources: ['https://example.com/q2'], technologyVersion: 'ES2022+', reviewedAt: '2026-10-09' } });
  const selected = selectPublished({ articles: [topic], resources: [], questionPublication });
  assert.equal(selected.articles.length, 1); assert.match(selected.articles[0].content, /Q2｜概念二/); assert.doesNotMatch(selected.articles[0].content, /Q1｜概念一/);
  assert.equal(selected.articles[0].status, 'published'); assert.match(selected.articles[0].description, /Q2/); assert.doesNotMatch(selected.articles[0].description, /Q1/);
  const invalid = validateQuestionPublicationMap({ Q2: { status: 'published', quality: 'complete' } });
  assert.throws(() => selectPublished({ articles: [topic], resources: [], questionPublication: invalid }), /来源|技术版本|审核日期/);
  assert.equal(selectPublished({ articles: [topic], resources: [], questionPublication: {} }).articles.length, 0);
});
test('实现题不能用调用要求或概念定义冒充答案', () => {
  const requirement = parseArticle(markdown('requirement', '## Q134｜实现一个柯里化函数 add\n1. add(1)(2).valueOf() // 3'), 'requirement.md');
  const definition = parseArticle(markdown('definition', '## Q137｜实现一个防抖函数\n定义：连续触发时延迟执行。\n![](./images/debounce.png)'), 'definition.md');
  assert.ok(inspectQuestions(requirement)[0].issues.includes('missing-code'));
  assert.ok(inspectQuestions(definition)[0].issues.includes('missing-code'));
  assert.ok(inspectQuestions(definition)[0].issues.includes('definition-only'));
});
test('实际生产构建排除草稿正文、搜索数据、私人文件及草稿专用图片', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'fe-publication-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  for (const directory of ['src/articles', 'src/data', 'public/images', '.private']) await mkdir(join(root, directory), { recursive: true });
  await writeFile(join(root, 'index.html'), '<div id="app"></div><script type="module" src="/main.js"></script>');
  await writeFile(join(root, 'main.js'), 'import library from "virtual:library"; document.getElementById("app").textContent=JSON.stringify(library);');
  await writeFile(join(root, 'src/articles/public.md'), markdown('public', 'PUBLIC_BODY_SENTINEL 这是一篇完整的公开说明，解释实际问题、操作步骤、验证结果和使用边界。\n![公开图](./images/public.png)\n\n~~~md\n## Q999｜示例标题\n~~~', 'status: published\nquality: complete'));
  await writeFile(join(root, 'src/articles/draft.md'), markdown('draft', 'DRAFT_BODY_SENTINEL\n![草稿图](./images/draft.png)'));
  await writeFile(join(root, 'src/articles/partial.md'), markdown('partial', '## Q10｜已审核概念\nPUBLIC_QUESTION_SENTINEL 这是经过逐题审核的完整解释，包含适用条件、限制边界和异常情况。\n![逐题公开图][public-pic]\n\n## Q11｜未审核概念\nDRAFT_QUESTION_SENTINEL 这道题仍然处于草稿。\n![逐题草稿图][draft-pic]\n\n[public-pic]: ./images/question-public.png\n[draft-pic]: ./images/question-draft.png'));
  await writeFile(join(root, 'src/data/resources.json'), JSON.stringify([{ ...resource, id: 'public-resource', status: 'published' }, { ...resource, id: 'draft-resource', url: 'https://example.com/draft', title: 'DRAFT_RESOURCE_SENTINEL' }]));
  await writeFile(join(root, 'src/data/question-publication.json'), JSON.stringify({ Q10: { status: 'published', quality: 'complete', sources: ['https://example.com/q10'], technologyVersion: '测试版本', reviewedAt: '2026-10-09' } }));
  await writeFile(join(root, '.private/resources.json'), 'PRIVATE_NOTES_SENTINEL');
  await writeFile(join(root, 'public/images/public.png'), 'PUBLIC_IMAGE_SENTINEL');
  await writeFile(join(root, 'public/images/draft.png'), 'DRAFT_IMAGE_SENTINEL');
  await writeFile(join(root, 'public/images/question-public.png'), 'PUBLIC_QUESTION_IMAGE_SENTINEL');
  await writeFile(join(root, 'public/images/question-draft.png'), 'DRAFT_QUESTION_IMAGE_SENTINEL');
  await writeFile(join(root, 'public/favicon.svg'), '<svg/>');
  await build({ root, configFile: false, base: './', plugins: [publicationPlugin()], logLevel: 'silent' });
  const assets = await readdir(join(root, 'dist/assets'));
  const code = (await Promise.all(assets.filter((file) => file.endsWith('.js')).map((file) => readFile(join(root, 'dist/assets', file), 'utf8')))).join('\n');
  assert.doesNotMatch(code, /PUBLIC_BODY_SENTINEL/);
  assert.doesNotMatch(code, /DRAFT_BODY_SENTINEL|DRAFT_RESOURCE_SENTINEL|PRIVATE_NOTES_SENTINEL|PUBLIC_QUESTION_SENTINEL|DRAFT_QUESTION_SENTINEL/);
  const content = await readdir(join(root, 'dist/content'));
  assert.equal(content.filter(file => !file.startsWith('questions-')).length, 2);
  const questionDirectory = JSON.parse(await readFile(join(root, 'dist/content', content.find(file => file.startsWith('questions-'))), 'utf8'));
  assert.deepEqual(questionDirectory.map(question => question.number), [10]);
  const bodies = (await Promise.all(content.map((file) => readFile(join(root, 'dist/content', file), 'utf8')))).join('\n');
  assert.match(bodies, /PUBLIC_BODY_SENTINEL/); assert.match(bodies, /PUBLIC_QUESTION_SENTINEL/);
  assert.match(bodies, /Q999｜示例标题/);
  assert.doesNotMatch(bodies, /DRAFT_QUESTION_SENTINEL/);
  const search = await readdir(join(root, 'dist/search'));
  assert.equal(search.length, 1);
  const index = await readFile(join(root, 'dist/search', search[0]), 'utf8');
  assert.match(index, /PUBLIC_BODY_SENTINEL/); assert.match(index, /PUBLIC_QUESTION_SENTINEL/);
  assert.doesNotMatch(index, /DRAFT_BODY_SENTINEL|DRAFT_RESOURCE_SENTINEL|PRIVATE_NOTES_SENTINEL|DRAFT_QUESTION_SENTINEL/);
  assert.deepEqual((await readdir(join(root, 'dist/images'))).sort(), ['public.png', 'question-public.png']);
  assert.equal(await readFile(join(root, 'dist/favicon.svg'), 'utf8'), '<svg/>');
});

test('全题完成的专题同步维护状态，部分完成仍保留草稿边界', () => {
  const body = Array.from({ length: 9 }, (_, i) => `## Q${i + 1}｜概念说明\n这是完整的参考答案，包含适用条件、行为语义、限制和验证方式，便于实际学习和复查。`).join('\n\n');
  const article = parseArticle(markdown('topic', body), 'topic.md');
  const questionPublication = Object.fromEntries(Array.from({ length: 9 }, (_, i) => [`Q${i + 1}`, { status: 'published', quality: 'complete', sources: ['https://example.com/ref'], technologyVersion: 'v1', reviewedAt: '2026-10-09' }]));
  const full = { articles: [article], resources: [], questionPublication };
  const metadata = contentAssets(full).catalog.articles[0];
  assert.equal(metadata.status, 'published'); assert.equal(metadata.quality, 'complete');
  assert.equal(metadata.reviewedAt, '2026-10-09');
  assert.equal(metadata.questionCount, 9); assert.equal(metadata.publishedQuestionCount, 9);
  assert.doesNotMatch(selectPublished(full).articles[0].description, /其余|其他|草稿/);
  const partial = { ...full, questionPublication: { ...questionPublication, Q9: { status: 'draft', quality: 'incomplete', sources: [] } } };
  const local = contentAssets(partial).catalog.articles[0];
  assert.equal(local.status, 'draft'); assert.equal(local.quality, 'incomplete');
  assert.equal(local.publishedQuestionCount, 8);
  const publicMetadata = contentAssets(selectPublished(partial)).catalog.articles[0];
  assert.equal(publicMetadata.questionCount, 9); assert.equal(publicMetadata.publishedQuestionCount, 8);
});
test('题库使用逐题审核日期，正文更新后能提示过期复核', async () => {
  const article = parseArticle(markdown('topic', '## Q1｜概念说明\n这是完整的参考答案，包含适用条件、行为语义、限制和验证方式，便于实际学习和复查。'), 'topic.md');
  const questionPublication = { Q1: { status: 'published', quality: 'complete', sources: ['https://example.com/ref'], technologyVersion: 'v1', reviewedAt: '2026-10-09' } };
  const library = { articles: [article], resources: [], questionPublication };
  const report = await validateContent(library, tmpdir());
  assert.equal(report.summary.missingReviewDates, 0);
  assert.equal(report.summary.staleReviews, 0);
  const changed = await validateContent({ ...library, articles: [{ ...article, updatedAt: '2026-10-10' }] }, tmpdir());
  assert.equal(changed.summary.staleReviews, 1);
  assert.ok(changed.warnings.some(warning => warning.includes('Q1') && warning.includes('重新复核')));
});

test('逐题发布只保留题目间一条分隔线，不改写代码中的横线', async () => {
  const { markdownNodes } = await import('../scripts/markdown.mjs');
  const body = '## Q1｜概念说明\n这是完整的参考答案，包含适用条件、行为语义、限制和验证方式，便于实际学习和复查。\n\n```text\n---\n```\n\n---\n\n## Q2｜另一个概念\n这是另一条完整答案，包含明确的原理解释、适用条件与边界说明，支持独立阅读。\n\n---\n';
  const questionPublication = Object.fromEntries([1, 2].map(n => [`Q${n}`, { status: 'published', quality: 'complete', sources: ['https://example.com/ref'], technologyVersion: 'v1', reviewedAt: '2026-10-09' }]));
  const library = selectPublished({ articles: [parseArticle(markdown('topic', body), 'topic.md')], resources: [], questionPublication });
  const content = library.articles[0].content;
  assert.equal(markdownNodes(content, ['thematicBreak']).length, 1);
  assert.match(content, /```text\n---\n```/);
});
