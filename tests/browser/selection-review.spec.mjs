import { test, expect } from '@playwright/test';

const learningKey = 'fe-library-learning-v1';
const open = async page => {
  await page.goto('/?view=learning&filter=unread&kind=questions&sort=title&size=48', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.resource-card')).toHaveCount(48);
  await page.getByRole('button', { name: '选择部分内容', exact: true }).click();
};

test('长列表核对已选项、定位末项、取消选择及返回操作保持键盘焦点与学习范围', async ({ page }, testInfo) => {
  await open(page);
  const boxes = page.locator('.learning-select input');
  const last = boxes.nth(47), key = await last.getAttribute('value');
  const before = await page.evaluate(key => localStorage.getItem(key), learningKey);
  const labels = [];
  for (const index of [3, 8, 47]) labels.push((await boxes.nth(index).getAttribute('aria-label')).slice(3));
  for (const index of [47, 8, 3]) await boxes.nth(index).check();
  const review = page.locator('.learning-selection-review'), summary = review.locator('summary');
  await summary.click();
  await expect(review.locator('li strong')).toHaveText(labels);
  await expect(page.getByRole('button', { name: '学习所选 3 项 →', exact: true })).toBeEnabled();
  if (testInfo.project.name === 'mobile-webkit') await review.screenshot({ path: testInfo.outputPath('selection-review-mobile.png') });
  await review.getByRole('button', { name: `定位 ${labels[2]}`, exact: true }).click();
  await expect(last).toBeFocused();
  await expect(last).toBeChecked();
  const bounds = await last.boundingBox(), header = await page.locator('.header').boundingBox();
  expect(bounds.y).toBeGreaterThanOrEqual(header.y + header.height);
  expect(bounds.y + bounds.height).toBeLessThan(page.viewportSize().height);
  const footer = page.getByRole('region', { name: '本页选择快捷操作' });
  await expect(footer).toContainText('本页已选择 3 条');
  await footer.getByRole('button', { name: '返回学习操作 ↑', exact: true }).click();
  await expect(page.getByRole('region', { name: '学习与批量标记' })).toBeFocused();
  expect((await page.getByRole('region', { name: '学习与批量标记' }).boundingBox()).y).toBeGreaterThanOrEqual(header.y + header.height);
  for (const [title, next] of [[labels[1], labels[2]], [labels[2], labels[0]], [labels[0], null]]) {
    await review.getByRole('button', { name: `取消选择 ${title}`, exact: true }).focus();
    await page.keyboard.press('Enter');
    await expect(next ? review.getByRole('button', { name: `取消选择 ${next}`, exact: true }) : summary).toBeFocused();
  }
  await expect(summary).toHaveText('查看已选内容（0 项）');
  await expect(review).toContainText('尚未选择内容');
  await expect(page.locator('.learning-select input:checked')).toHaveCount(0);
  await expect(page.getByRole('button', { name: '学习所选 0 项 →', exact: true })).toBeDisabled();
  expect(await page.evaluate(key => localStorage.getItem(key), learningKey)).toBe(before);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await last.check();
  await footer.getByRole('button', { name: '返回学习操作 ↑', exact: true }).click();
  await page.getByRole('button', { name: '学习所选 1 项 →', exact: true }).click();
  await expect(page.getByRole('region', { name: '连续学习' })).toBeVisible();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('fe-library-study-session-v1')).keys)).toEqual([key]);
});

test('已选核对清单随跨标签页更新移除失效选择，翻页后隐藏核对及快捷入口', async ({ page, context }) => {
  await open(page);
  const checkbox = page.locator('.learning-select input').first(), key = await checkbox.getAttribute('value');
  await checkbox.check();
  const review = page.locator('.learning-selection-review');
  await review.locator('summary').click();
  await expect(review.locator('li')).toHaveCount(1);
  const other = await context.newPage();
  await other.goto(`/?view=questions&q=Q${key.slice(2)}`, { waitUntil: 'domcontentloaded' });
  const controls = other.locator('.question-row .learning-controls');
  await controls.getByRole('button', { name: '○ 已读', exact: true }).click();
  await expect(review.locator('li')).toHaveCount(0);
  await expect(review.locator('summary')).toHaveText('查看已选内容（0 项）');
  await controls.getByRole('button', { name: '✓ 已读', exact: true }).click();
  await expect(page.locator('.learning-select input').first()).toHaveValue(key);
  await expect(review.locator('li')).toHaveCount(0);
  await page.getByRole('navigation', { name: '学习记录分页' }).getByRole('button', { name: '下一页 →' }).click();
  await expect(review).toHaveCount(0);
  await expect(page.getByRole('region', { name: '本页选择快捷操作' })).toHaveCount(0);
  await other.close();
});
