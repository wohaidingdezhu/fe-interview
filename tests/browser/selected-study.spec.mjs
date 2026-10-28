import { test, expect } from '@playwright/test';

const learningKey = 'fe-library-learning-v1', studyKey = 'fe-library-study-session-v1';
const source = '/?view=learning&filter=review&sort=title&size=12&studyRange=page';
const entries = Object.fromEntries(['q:5', 'q:6', 'a:closure'].map(key => [key, { bookmarked: true, status: 'review', updatedAt: '2026-10-20T00:00:00.000Z' }]));
const open = async page => {
  await page.goto(source, { waitUntil: 'domcontentloaded' });
  await page.evaluate(({ learningKey, studyKey, entries }) => {
    localStorage.setItem(learningKey, JSON.stringify({ version: 1, entries }));
    localStorage.setItem(studyKey, JSON.stringify({ version: 1, keys: ['q:7'], currentKey: 'q:7', returnSearch: '?view=questions&q=Q7' }));
  }, { learningKey, studyKey, entries });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('.resource-card')).toHaveCount(3);
  await page.getByRole('button', { name: '选择部分内容', exact: true }).click();
};
const session = page => page.evaluate(key => JSON.parse(localStorage.getItem(key)), studyKey);

test('所选题目和笔记按列表顺序组成清单，暂停及刷新后继续同一清单', async ({ page }, testInfo) => {
  await open(page);
  const actions = page.getByRole('region', { name: '学习与批量标记' });
  await expect(actions.getByRole('combobox', { name: '学习清单范围' })).toHaveCount(0);
  await expect(actions.getByRole('button', { name: '复习所选 0 项 →', exact: true })).toBeDisabled();
  await expect(actions.getByRole('button', { name: '随机学习所选', exact: true })).toBeDisabled();
  const selectedRows = (await page.locator('.resource-card h2 a').evaluateAll(links => links.map(link => {
    const url = new URL(link.href);
    return { key: url.hash ? `q:${url.hash.slice(2)}` : `a:${url.searchParams.get('article')}`, title: link.textContent.replace(/\s*→\s*$/, '').trim() };
  }))).filter(item => ['q:5', 'a:closure'].includes(item.key));
  // 以相反的勾选顺序，验证最终清单仍按列表顺序排列。
  for (const item of [...selectedRows].reverse()) await page.getByRole('checkbox', { name: `选择 ${item.title}`, exact: true }).check();
  await expect(actions).toContainText('本次清单 2 项');
  await expect(actions).toContainText('开始学习会替换当前清单');
  expect((await session(page)).keys).toEqual(['q:7']);
  if (testInfo.project.name === 'mobile-webkit') await actions.screenshot({ path: testInfo.outputPath('selected-study-mobile.png') });
  await actions.getByRole('button', { name: '复习所选 2 项 →', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText(selectedRows[0].title);
  expect(await session(page)).toEqual({ version: 1, keys: selectedRows.map(item => item.key), currentKey: selectedRows[0].key, returnSearch: source.slice(1) });
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)).entries, learningKey)).toEqual(entries);
  await page.getByRole('button', { name: '清单目录', exact: true }).click();
  const directory = page.getByRole('dialog', { name: '学习清单目录' });
  await expect(directory.getByRole('link')).toHaveCount(2);
  await directory.getByRole('link').filter({ hasText: selectedRows[1].title }).click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText(selectedRows[1].title);
  await page.getByRole('link', { name: '暂停', exact: true }).click();
  expect(new URL(page.url()).search).toBe(source.slice(1));
  await expect(page.locator('.learning-select input')).toHaveCount(0);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('region', { name: '暂停的学习清单' })).toContainText('第 2 / 2 项');
  await page.getByRole('link', { name: '继续清单 →', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText(selectedRows[1].title);
});

test('随机学习只包含勾选项，退出选择恢复原范围并保留现有清单', async ({ page }) => {
  await open(page);
  await page.getByRole('checkbox', { name: /^选择 Q5｜/ }).check();
  await page.getByRole('button', { name: '退出选择', exact: true }).click();
  await expect(page.getByRole('combobox', { name: '学习清单范围' })).toHaveValue('page');
  expect((await session(page)).keys).toEqual(['q:7']);
  await page.getByRole('button', { name: '选择部分内容', exact: true }).click();
  await expect(page.locator('.learning-select input:checked')).toHaveCount(0);
  await page.getByRole('checkbox', { name: /^选择 Q6｜/ }).check();
  await page.getByRole('checkbox', { name: '选择 理解作用域与闭包', exact: true }).check();
  await page.getByRole('button', { name: '随机学习所选', exact: true }).click();
  await expect(page.getByRole('region', { name: '连续学习' })).toBeVisible();
  const saved = await session(page);
  expect([...saved.keys].sort()).toEqual(['a:closure', 'q:6']);
  expect(saved.currentKey).toBe(saved.keys[0]);
  expect(saved.returnSearch).toBe(source.slice(1));
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)).entries, learningKey)).toEqual(entries);
});

test('取消导入保留勾选，确认导入或清空记录后退出选择', async ({ page }) => {
  await open(page);
  await page.getByRole('checkbox', { name: /^选择 Q5｜/ }).check();
  await page.getByText('记录管理 · 备份与清理', { exact: true }).click();
  const upload = () => page.locator('input[type=file]').setInputFiles({ name: 'backup.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ version: 1, entries })) });
  await upload();
  await page.getByRole('dialog', { name: '导入备份预览' }).getByRole('button', { name: '取消导入', exact: true }).click();
  await expect(page.locator('.learning-select input:checked')).toHaveCount(1);
  await upload();
  await page.getByRole('dialog', { name: '导入备份预览' }).getByRole('button', { name: '确认导入', exact: true }).click();
  await expect(page.locator('.learning-select input')).toHaveCount(0);
  await page.getByRole('button', { name: '选择部分内容', exact: true }).click();
  await page.getByRole('checkbox', { name: /^选择 Q5｜/ }).check();
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: '清空全部记录', exact: true }).click();
  await expect(page.locator('.learning-select input')).toHaveCount(0);
  expect(await session(page)).toBeNull();
});
