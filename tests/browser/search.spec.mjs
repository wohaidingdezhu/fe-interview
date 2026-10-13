import { test, expect } from '@playwright/test';

test('全局搜索优先笔记标题与别名，并保留精确题号', async ({ page }) => {
  await page.goto('/');
  const input = page.getByRole('searchbox', { name: '搜索题目和笔记' });
  const hits = page.locator('.search-results > a');
  for (const query of ['理解作用域与闭包', '词法作用域']) {
    await input.fill(query);
    await expect(hits.first()).toHaveAttribute('href', '?article=closure');
  }
  await input.fill('Q1');
  await expect(hits).toHaveCount(1);
  await expect(hits.first()).toHaveAttribute('href', /#q1$/);
});

test('笔记列表默认相关性，手动排序及刷新保持选择', async ({ page }) => {
  await page.goto('/?view=notes&q=词法作用域');
  const sort = page.getByRole('combobox', { name: '列表排序' });
  await expect(sort).toHaveValue('relevance');
  await expect(page.locator('.resource-card h2 a').first()).toHaveAttribute('href', '?article=closure');
  await sort.selectOption('title');
  await page.reload();
  await expect(sort).toHaveValue('title');
  await expect(page.locator('.resource-card').first()).toBeVisible();
  const titles = await page.locator('.resource-card h2').allTextContents();
  expect(titles).toEqual([...titles].sort((a, b) => a.localeCompare(b, 'zh-CN')));
  await sort.selectOption('relevance');
  await expect(page.locator('.resource-card h2 a').first()).toHaveAttribute('href', '?article=closure');
  await page.getByRole('searchbox', { name: '检索当前列表' }).fill('');
  await expect(sort).toHaveValue('newest');
});

test('题库按标题相关性展示并从首个结果开始学习', async ({ page }) => {
  await page.goto('/?view=questions&q=闭包');
  await expect(page.getByRole('button', { name: '开始学习 →', exact: true })).toBeEnabled();
  const first = page.locator('.question-row').first();
  await expect(first.getByRole('heading')).toContainText('闭包');
  const number = await first.locator('.question-number').innerText();
  await page.getByRole('button', { name: '开始学习 →', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText(`${number}｜`);
  await expect(page.getByRole('button', { name: /标记已读并/ })).toBeEnabled();
});
