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
  await expect(page.getByRole('combobox', { name: '每页', exact: true })).toHaveValue('12');
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

test('首页最近新增入口按题号降序，阅读返回和连续学习沿用排序', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: '最近新增的题目 →', exact: true }).click();
  const sort = page.getByRole('combobox', { name: '题目排序' });
  const numbers = page.locator('.question-row .question-number');
  await expect(sort).toHaveValue('number-desc');
  await expect(numbers).toHaveCount(12);
  const firstPage = (await numbers.allTextContents()).map(value => Number(value.slice(1)));
  expect(firstPage).toEqual(firstPage.toSorted((a, b) => b - a));
  await page.getByRole('button', { name: '下一页 →', exact: true }).click();
  await expect(page.getByRole('navigation', { name: '题目分页' })).toContainText('第 2 /');
  const first = page.locator('.question-row').first();
  const number = await first.locator('.question-number').innerText();
  expect(Number(number.slice(1))).toBeLessThan(firstPage.at(-1));
  await first.getByRole('link').click();
  await page.getByRole('link', { name: '← 返回原列表', exact: true }).click();
  await expect(sort).toHaveValue('number-desc');
  await expect(first.getByRole('link')).toBeFocused();
  await expect(first.locator('.question-number')).toHaveText(number);

  await sort.selectOption('number-asc');
  await expect(numbers.first()).toHaveText('Q1');
  expect(new URL(page.url()).searchParams.has('page')).toBe(false);
  await sort.selectOption('number-desc');
  await page.getByRole('searchbox', { name: '搜索题目', exact: true }).fill('Q5');
  await expect(numbers).toHaveText(['Q5']);
  await page.getByRole('button', { name: '清除筛选 ×' }).click();
  await expect(sort).toHaveValue('number-desc');
  await expect(numbers.first()).toHaveText(`Q${firstPage[0]}`);
  await page.getByRole('button', { name: '开始学习 →', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText(`Q${firstPage[0]}｜`);
  await page.getByRole('link', { name: '暂停', exact: true }).click();
  await expect(sort).toHaveValue('number-desc');
});
