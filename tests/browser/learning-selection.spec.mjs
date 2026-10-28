import { test, expect } from '@playwright/test';

const storageKey = 'fe-library-learning-v1';
const selected = page => page.locator('.learning-select input:checked');
const feedback = page => page.locator('.learning-feedback [role=status]');
const begin = async page => {
  const panel = page.getByRole('region', { name: '学习与批量标记' });
  if (await panel.locator('.batch-management').getAttribute('open') === null) await panel.locator('.batch-management > summary').click();
  await panel.getByRole('button', { name: '选择部分内容', exact: true }).click();
  return panel;
};
const openShelf = async page => {
  await page.goto('/?view=learning&filter=unread&kind=questions&sort=title', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.resource-card')).toHaveCount(12);
};
const firstKey = async page => {
  const href = await page.locator('.resource-card h2 a').first().getAttribute('href');
  return `q:${href.match(/#q(\d+)/)[1]}`;
};

test('部分勾选只修改选中记录，保留收藏，批量标记后可撤销', async ({ page }, testInfo) => {
  await openShelf(page);
  const key = await firstKey(page);
  await page.locator('.resource-card').first().getByRole('button', { name: '☆ 收藏', exact: true }).click();
  const before = await page.evaluate(key => localStorage.getItem(key), storageKey);
  const panel = await begin(page);
  await expect(panel.getByRole('button', { name: '所选标记已读', exact: true })).toBeDisabled();
  const checkboxes = page.locator('.learning-select input');
  await checkboxes.first().focus();
  await page.keyboard.press('Space');
  await checkboxes.nth(2).check();
  await expect(selected(page)).toHaveCount(2);
  expect(await page.evaluate(key => localStorage.getItem(key), storageKey)).toBe(before);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  if (testInfo.project.name === 'mobile-webkit') {
    await page.locator('.resource-card').first().scrollIntoViewIfNeeded();
    await page.screenshot({ path: testInfo.outputPath('learning-selection-mobile.png') });
  }
  await panel.getByRole('button', { name: '所选标记已读', exact: true }).click();
  await expect(feedback(page)).toContainText('选中的 2 条内容标记为已读');
  await expect(feedback(page)).toBeFocused();
  await expect(selected(page)).toHaveCount(0);
  const saved = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), storageKey);
  expect(Object.values(saved.entries).filter(entry => entry.status === 'read')).toHaveLength(2);
  expect(saved.entries[key].bookmarked).toBe(true);
  await page.getByRole('button', { name: '撤销上次批量标记', exact: true }).click();
  await expect(feedback(page)).toContainText('已撤销 2 条标记');
  await expect(feedback(page)).toBeFocused();
  const restored = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), storageKey);
  expect(Object.values(restored.entries).filter(entry => entry.status === 'read')).toHaveLength(0);
  expect(restored.entries[key].bookmarked).toBe(true);
});

test('全选与清空不修改记录，切换页码、筛选及排序清除选择', async ({ page }) => {
  await openShelf(page);
  const panel = await begin(page);
  const before = await page.evaluate(key => localStorage.getItem(key), storageKey);
  await panel.getByRole('button', { name: '全选本页', exact: true }).click();
  await expect(selected(page)).toHaveCount(12);
  await panel.getByRole('button', { name: '清空选择', exact: true }).click();
  await expect(selected(page)).toHaveCount(0);
  await expect(panel.getByRole('button', { name: '所选标记待复习', exact: true })).toBeDisabled();
  for (const change of [
    () => page.getByRole('navigation', { name: '学习记录分页' }).getByRole('button', { name: '下一页 →' }).click(),
    () => page.getByRole('combobox', { name: '学习记录排序', exact: true }).selectOption('oldest'),
    () => page.getByRole('searchbox', { name: '搜索学习记录', exact: true }).fill('Q5'),
  ]) {
    await page.locator('.learning-select input').first().check();
    await change();
    await expect(page.locator('.learning-select input')).toHaveCount(0);
    await expect(panel.getByRole('button', { name: '选择部分内容', exact: true })).toBeVisible();
    await begin(page);
    await expect(selected(page)).toHaveCount(0);
  }
  await panel.getByRole('button', { name: '退出选择', exact: true }).click();
  await expect(page.locator('.learning-select input')).toHaveCount(0);
  expect(await page.evaluate(key => localStorage.getItem(key), storageKey)).toBe(before);
  // 原有整页标记仍然可用，并可撤销。
  await panel.getByRole('button', { name: '本页标记待复习', exact: true }).click();
  await expect(feedback(page)).toContainText('本页 1 条内容标记为待复习');
  await page.getByRole('button', { name: '撤销上次批量标记', exact: true }).click();
  await expect(page.locator('.resource-card')).toHaveCount(1);
});

test('跨标签页更新移出本页的选择不会重新出现，撤销保留后续修改', async ({ page, context }) => {
  await openShelf(page);
  const key = await firstKey(page), panel = await begin(page);
  await page.locator('.learning-select input').first().check();
  const other = await context.newPage();
  await other.goto(`/?view=questions&q=Q${key.slice(2)}`, { waitUntil: 'domcontentloaded' });
  const controls = other.locator('.question-row .learning-controls');
  await controls.getByRole('button', { name: '○ 已读', exact: true }).click();
  await expect(selected(page)).toHaveCount(0);
  await expect(panel.getByRole('button', { name: '学习所选 0 项 →', exact: true })).toBeDisabled();
  await controls.getByRole('button', { name: '✓ 已读', exact: true }).click();
  await expect(page.locator('.resource-card h2 a').first()).toHaveAttribute('href', new RegExp(`#q${key.slice(2)}$`));
  await expect(selected(page)).toHaveCount(0);
  await page.locator('.learning-select input').first().check();
  await page.locator('.learning-select input').nth(1).check();
  await panel.getByRole('button', { name: '所选标记已读', exact: true }).click();
  await expect(controls.getByRole('button', { name: '✓ 已读', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await controls.getByRole('button', { name: '↻ 复习', exact: true }).click();
  await expect.poll(() => page.evaluate(key => JSON.parse(localStorage.getItem('fe-library-learning-v1')).entries[key].status, key)).toBe('review');
  await page.getByRole('button', { name: '撤销上次批量标记', exact: true }).click();
  await expect(feedback(page)).toContainText('已撤销 1 条标记。其余记录已有后续修改，已保留');
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem('fe-library-learning-v1')).entries[key].status, key)).toBe('review');
  await other.close();
});

test('勾选标记保存失败时明确提示且仍可撤销本次访问的修改', async ({ page }) => {
  await openShelf(page);
  const panel = await begin(page);
  await page.locator('.learning-select input').first().check();
  const before = await page.evaluate(key => localStorage.getItem(key), storageKey);
  await page.evaluate(key => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (name, value) {
      if (name === key) throw new DOMException('Storage full', 'QuotaExceededError');
      return original.call(this, name, value);
    };
  }, storageKey);
  await panel.getByRole('button', { name: '所选标记待复习', exact: true }).click();
  await expect(feedback(page)).toContainText('选中的 1 条内容标记为待复习。尚未保存到浏览器');
  expect(await page.evaluate(key => localStorage.getItem(key), storageKey)).toBe(before);
  await page.getByRole('button', { name: '撤销上次批量标记', exact: true }).click();
  await expect(feedback(page)).toContainText('已撤销 1 条标记');
  await expect(feedback(page)).toBeFocused();
});

test('独立笔记可单独勾选，刷新后只保留阅读标记，不恢复临时选择', async ({ page }) => {
  await page.goto('/?view=learning&filter=unread&kind=notes&sort=title', { waitUntil: 'domcontentloaded' });
  const panel = await begin(page);
  const href = await page.locator('.resource-card h2 a').first().getAttribute('href');
  const key = `a:${new URL(href, page.url()).searchParams.get('article')}`;
  await page.locator('.learning-select input').first().check();
  await panel.getByRole('button', { name: '所选标记待复习', exact: true }).click();
  await expect(feedback(page)).toContainText('选中的 1 条内容标记为待复习');
  const saved = await page.evaluate(key => JSON.parse(localStorage.getItem(key)).entries, storageKey);
  expect(Object.keys(saved)).toEqual([key]);
  expect(saved[key].status).toBe('review');
  await page.locator('.learning-select input').first().check();
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('.batch-management')).toBeVisible();
  await expect(page.locator('.learning-select input')).toHaveCount(0);
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)).entries, storageKey)).toEqual(saved);
});
