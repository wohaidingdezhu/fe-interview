import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { importHandbook } from '../scripts/import-interview-content.mjs';

const definitions = [
  {
    sourceTitle: 'Javascript', id: 'interview-javascript', title: 'JavaScript 面试题',
    category: 'JavaScript', kind: '知识文章', range: [40, 40], tags: ['JavaScript', '面试'],
  },
  {
    sourceTitle: 'Typescript', id: 'interview-typescript', title: 'TypeScript 面试题',
    category: 'TypeScript', kind: '知识文章', range: [117, 117], tags: ['TypeScript', '面试'],
  },
];

async function fixture(t) {
  const directory = await mkdtemp(join(tmpdir(), 'interview-content-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const sourceImagesDir = join(directory, 'source-images');
  const articlesDir = join(directory, 'articles');
  const targetImagesDir = join(directory, 'public-images');
  await mkdir(sourceImagesDir, { recursive: true });
  await writeFile(join(sourceImagesDir, 'example.png'), 'image');
  return { directory, sourceImagesDir, articlesDir, targetImagesDir };
}

test('按专题拆分答案，规范分类并复制正文引用图片', async (t) => {
  const f = await fixture(t);
  const sourcePath = join(f.directory, 'handbook.md');
  await writeFile(sourcePath, `# 大前端面试宝典

# 📑 题目总览

## Javascript Q40–Q40

1. 不应被导入的目录

# 🧠 答案与解析

# Javascript

## Q40｜JS 数据类型

![示例](images/example.png)

# Typescript

## Q117｜TS 类型注解
`);

  const result = await importHandbook({
    sourcePath, sourceImagesDir: f.sourceImagesDir, articlesDir: f.articlesDir,
    targetImagesDir: f.targetImagesDir, definitions,
  });

  assert.deepEqual(result, { articles: 2, questions: 2, images: 1 });
  const javascript = await readFile(join(f.articlesDir, 'interview-javascript.md'), 'utf8');
  const typescript = await readFile(join(f.articlesDir, 'interview-typescript.md'), 'utf8');
  assert.match(javascript, /category: "JavaScript"/);
  assert.match(javascript, /## Q40｜JS 数据类型/);
  assert.match(javascript, /\.\/images\/interview\/example\.png/);
  assert.doesNotMatch(javascript, /Q117|不应被导入的目录/);
  assert.match(typescript, /category: "TypeScript"/);
  assert.match(typescript, /## Q117｜TS 类型注解/);
  assert.equal(await readFile(join(f.targetImagesDir, 'example.png'), 'utf8'), 'image');
});

test('题号越界、专题缺失或图片缺失时不生成文章', async (t) => {
  const f = await fixture(t);
  const sourcePath = join(f.directory, 'bad.md');
  await writeFile(sourcePath, `# 🧠 答案与解析

# Javascript

## Q41｜错误题号

![缺图](images/missing.png)
`);

  await assert.rejects(() => importHandbook({
    sourcePath, sourceImagesDir: f.sourceImagesDir, articlesDir: f.articlesDir,
    targetImagesDir: f.targetImagesDir, definitions,
  }), /Javascript.*Q40|缺少专题 Typescript/);
  await assert.rejects(readFile(join(f.articlesDir, 'interview-javascript.md'), 'utf8'));
});
