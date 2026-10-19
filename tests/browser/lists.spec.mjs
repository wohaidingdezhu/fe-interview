import { test, expect } from '@playwright/test';

test('三个列表翻页定位首条内容，搜索输入保留焦点', async ({ page }) => {
  for (const url of ['/?view=questions', '/?view=notes', '/?view=learning&filter=unread']) {
    await page.goto(url);
    const pagination = page.locator('.list-pagination');
    const next = pagination.getByRole('button', { name: '下一页 →' });
    await expect(next).toBeEnabled();
    await next.click();
    await expect(pagination).toContainText('2 /');
    await expect(page.locator('.question-list h2 a, .resource-list h2 a').first()).toBeFocused();
    const first = page.locator('.question-list h2 a, .resource-list h2 a').first();
    const box = await first.boundingBox();
    expect(box.y).toBeGreaterThanOrEqual(68);
    expect(box.y + box.height).toBeLessThan(page.viewportSize().height);
    await pagination.getByRole('button', { name: '← 上一页' }).click();
    await expect(pagination).toContainText('1 /');
    await expect(page.locator('.question-list h2 a, .resource-list h2 a').first()).toBeFocused();
    await next.click();
    await expect(first).toBeFocused();
    const input = page.getByRole('main').getByRole('searchbox').first();
    await input.fill('React');
    await expect(input).toBeFocused();
    expect(new URL(page.url()).searchParams.has('page')).toBe(false);
  }
  await page.goto('/?view=learning');
  await page.getByRole('link', { name: '查看 React 学习路径 →' }).click();
  await expect(page.getByRole('main')).toBeFocused();
});

test('无效筛选参数显示真实生效条件，未知分类和标签可清除', async ({ page }) => {
  await page.goto('/?view=questions&size=13&progress=unknown');
  const filters = page.getByRole('region', { name: '题目筛选' });
  await expect(filters.getByRole('combobox', { name: '每页', exact: true })).toHaveValue('12');
  await expect(filters.getByRole('combobox', { name: '学习状态', exact: true })).toHaveValue('');
  await expect(page.locator('.question-row')).toHaveCount(12);
  await page.goto('/?view=questions&category=未知分类&tag=未知标签');
  await expect(filters.getByRole('combobox', { name: '分类', exact: true })).toHaveValue('未知分类');
  await expect(filters.getByRole('combobox', { name: '标签', exact: true })).toHaveValue('未知标签');
  await expect(page.getByRole('heading', { name: '暂时没有匹配的题目' })).toBeVisible();
  await page.getByRole('button', { name: '清除筛选 ×' }).click();
  await expect(page.locator('.question-row')).toHaveCount(12);
  await page.goto('/?view=notes&collection=unknown');
  await expect(page.getByRole('navigation', { name: '笔记类型' }).getByRole('button', { name: '全部', exact: true })).toHaveAttribute('aria-pressed', 'true');
});
