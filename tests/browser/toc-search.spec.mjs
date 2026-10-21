import { test, expect } from '@playwright/test';

const openDirectory = async page => {
  const desktop = page.getByRole('complementary', { name: '本篇目录', exact: true });
  if (await desktop.isVisible()) return desktop;
  await page.getByRole('navigation', { name: '手机阅读导航' }).getByRole('button', { name: /目录/ }).click();
  return page.getByRole('dialog', { name: /本页目录/ });
};

test('目录按题号精确查找、多词筛选、清空和跳转保持当前页', async ({ page }, testInfo) => {
  await page.goto('/?article=interview-html-css');
  await expect(page.locator('.article-body h2').first()).toBeVisible();
  let directory = await openDirectory(page);
  const input = directory.getByRole('searchbox', { name: '搜索本篇目录' });
  await input.fill(' q1 ');
  await expect(directory.locator('.toc-links a')).toHaveCount(1);
  await expect(directory.locator('.toc-links a')).toHaveAttribute('href', /#q1$/);
  await input.fill('找不到的标题');
  await expect(directory.getByRole('status')).toContainText('没有匹配');
  await expect(directory.locator('.toc-links a')).toHaveCount(0);
  await directory.getByRole('button', { name: '清空', exact: true }).click();
  await expect(input).toBeFocused();
  await expect(directory.locator('.toc-links a')).toHaveCount(39);
  await input.fill('overflow 不同');
  await expect(directory.locator('.toc-links a')).toHaveCount(1);
  await directory.screenshot({ path: testInfo.outputPath('filtered-toc.png') });
  await directory.locator('.toc-links a').click();
  await expect(page).toHaveURL(/article=interview-html-css#q5$/);
  await expect(page.getByRole('heading', { name: /Q5｜/ })).toBeFocused();
  expect(page.context().pages()).toHaveLength(1);
  directory = await openDirectory(page);
  await expect(directory.getByRole('searchbox', { name: '搜索本篇目录' })).toHaveValue('overflow 不同');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('fe-library-learning-v1') ?? '{"entries":{}}').entries)).toEqual({});
});

test('目录可搜索未展开章节的小标题，切换文章清除旧筛选', async ({ page }) => {
  await page.route('**/content/closure-*.json', async route => {
    const response = await route.fetch(), body = await response.json();
    body.content = body.content.replace('## 常见用途与边界', '### 延迟回调检查\n\n目录搜索回归示例。\n\n## 常见用途与边界');
    await route.fulfill({ response, json: body });
  });
  await page.goto('/?article=closure');
  await expect(page.locator('.article-body h2').first()).toBeVisible();
  const directory = await openDirectory(page);
  await directory.getByRole('searchbox', { name: '搜索本篇目录' }).fill('回调 检查');
  await expect(directory.locator('.toc-links a')).toHaveCount(1);
  await directory.getByRole('link', { name: '延迟回调检查', exact: true }).click();
  await expect(page.getByRole('heading', { name: '延迟回调检查', exact: true })).toBeFocused();
  const search = page.getByRole('searchbox', { name: '搜索题目和笔记' });
  await search.fill('Q5');
  await page.locator('.search-results').getByRole('link', { name: /Q5/ }).click();
  await expect(page.getByRole('heading', { name: /Q5｜/ })).toBeFocused();
  await expect((await openDirectory(page)).getByRole('searchbox', { name: '搜索本篇目录' })).toHaveValue('');
});
