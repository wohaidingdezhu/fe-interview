import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, symlink, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { readLibrary } from '../scripts/library.mjs';

function article(id, title = id) {
  return `---
id: ${id}
title: ${title}
category: 测试
description: 测试文章
kind: 知识文章
tags: [测试]
addedAt: "2026-10-09"
status: draft
quality: incomplete
---

## 正文

测试内容。
`;
}

async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), 'fe-library-recursive-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(join(root, 'src/articles/browser'), { recursive: true });
  await mkdir(join(root, 'src/articles/react/hooks'), { recursive: true });
  await mkdir(join(root, 'src/articles/.hidden'), { recursive: true });
  await mkdir(join(root, 'src/data'), { recursive: true });
  await writeFile(join(root, 'src/data/resources.json'), '[]');
  await writeFile(join(root, 'src/data/question-publication.json'), '{}');
  return root;
}

test('递归读取分类子目录，并忽略隐藏目录和符号链接', async (t) => {
  const root = await fixture(t);
  await writeFile(join(root, 'src/articles/browser/chrome.md'), article('chrome', 'Chrome 调试'));
  await writeFile(join(root, 'src/articles/react/hooks/persist.md'), article('persist', '持久函数'));
  await writeFile(join(root, 'src/articles/.hidden/private.md'), article('private'));
  await symlink(join(root, 'src/articles/browser/chrome.md'), join(root, 'src/articles/browser/linked.md'));
  const library = await readLibrary(root);
  assert.deepEqual(library.articles.map((item) => item.id), ['chrome', 'persist']);
});

test('嵌套目录中的重复文章 ID 仍会阻断加载', async (t) => {
  const root = await fixture(t);
  await writeFile(join(root, 'src/articles/browser/one.md'), article('duplicate'));
  await writeFile(join(root, 'src/articles/react/hooks/two.md'), article('duplicate'));
  await assert.rejects(() => readLibrary(root), /重复 ID/);
});
