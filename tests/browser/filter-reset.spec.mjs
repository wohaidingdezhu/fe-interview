import { test, expect } from '@playwright/test';

const cases = [
  { view: 'questions', extra: '&progress=review&tag=未知标签', input: '搜索题目', query: 'Q5', result: '.question-row', title: 'Q5' },
  { view: 'notes', extra: '&collection=notes&type=未知类型&tag=未知标签', input: '检索当前列表', query: '闭包', result: '.resource-card', title: '闭包' },
  { view: 'resources', extra: '&type=未知类型&tag=未知标签', input: '检索当前列表', query: '', result: '.resource-card', title: '' },
  { view: 'learning', extra: '&filter=unread&kind=questions&sort=title&size=24', input: '搜索学习记录', query: 'Q5', result: '.resource-card', title: 'Q5' },
];

for (const entry of cases) test(`${entry.view} 清除组合筛选后可直接继续输入，保留原有记录和栏目`, async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('fe-library-learning-v1', JSON.stringify({ version: 1, entries: {
    'q:6': { status: 'read', bookmarked: true, updatedAt: '2026-10-28T00:00:00.000Z' },
  } })));
  await page.goto(`/?view=${entry.view}&category=未知分类${entry.extra}`, { waitUntil: 'domcontentloaded' });
  const before = await page.evaluate(() => localStorage.getItem('fe-library-learning-v1'));
  const reset = page.getByRole('button', { name: '清除筛选 ×', exact: true });
  await reset.focus();
  await page.keyboard.press('Enter');
  const input = page.getByRole('searchbox', { name: entry.input, exact: true });
  await expect(reset).toHaveCount(0);
  await expect(input).toBeFocused();
  await expect(input).toHaveValue('');
  await expect(page.locator(entry.result).first()).toBeVisible();
  const params = new URL(page.url()).searchParams;
  expect(params.get('view')).toBe(entry.view);
  for (const key of ['q', 'category', 'tag', 'kind', 'type', 'progress', 'page']) expect(params.has(key)).toBe(false);
  if (entry.view === 'notes') expect(params.get('collection')).toBe('notes');
  if (entry.view === 'learning') {
    expect(params.get('filter')).toBe('unread');
    expect(params.get('sort')).toBe('title');
    expect(params.get('size')).toBe('24');
  }
  // 直接输入，不再通过 fill 隐式重新聚焦搜索框。
  const query = entry.query || (await page.locator(`${entry.result} h2 a`).first().innerText()).replace('→', '').trim();
  await page.keyboard.insertText(query);
  await expect(input).toHaveValue(query);
  await expect(input).toBeFocused();
  await expect(page.locator(entry.result).first()).toContainText(entry.title || query);
  expect(await page.evaluate(() => localStorage.getItem('fe-library-learning-v1'))).toBe(before);
});

test('清除后回到第一页时，翻页定位不会抢走搜索框焦点', async ({ page }) => {
  await page.goto('/?view=learning&filter=unread&kind=questions&page=2', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('navigation', { name: '学习记录分页' })).toContainText('2 /');
  await page.getByRole('button', { name: '清除筛选 ×', exact: true }).click();
  const input = page.getByRole('searchbox', { name: '搜索学习记录', exact: true });
  await expect(page.getByRole('navigation', { name: '学习记录分页' })).toContainText('1 /');
  await expect(input).toBeFocused();
  await page.keyboard.insertText('Q5');
  await expect(page.locator('.resource-card')).toHaveCount(1);
  await expect(input).toHaveValue('Q5');
});
