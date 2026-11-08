import { test, expect } from '@playwright/test';

const holdRetry = async (page, articleId, failures = 1) => {
  let requests = 0, release;
  const retry = new Promise(resolve => { release = resolve; });
  await page.route(`**/content/${articleId}-*.json`, async route => {
    const attempt = ++requests;
    if (attempt === 2) await retry;
    if (attempt <= failures) await route.fulfill({ status: 503, body: 'Service unavailable' });
    else await route.continue();
  });
  return release;
};

test('正文再次加载失败时可原地用键盘重试，成功后恢复题目锚点', async ({ page }) => {
  const release = await holdRetry(page, 'interview-html-css', 2);
  await page.goto('/?article=interview-html-css#q5');
  const retry = page.getByRole('button', { name: '重新加载正文' });
  await retry.focus();
  await page.keyboard.press('Enter');
  try {
    await expect(retry).toBeFocused();
    await expect(retry).toBeDisabled();
    await expect(page.getByText('正在重新加载正文…', { exact: true })).toBeVisible();
  } finally {
    release();
  }
  await expect(retry).toBeEnabled();
  await expect(retry).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: /Q5｜/ })).toBeFocused();
  expect(new URL(page.url()).hash).toBe('#q5');
});

test('无锚点文章重试成功后可从正文开始阅读', async ({ page }) => {
  const release = await holdRetry(page, 'closure');
  await page.goto('/?article=closure');
  try {
    await page.getByRole('button', { name: '重新加载正文' }).click();
  } finally {
    release();
  }
  const reader = page.getByRole('region', { name: '文章正文' });
  await expect(reader.getByRole('heading', { name: '保存的是变量，不是快照' })).toBeVisible();
  await expect(reader).toBeFocused();
});

test('正文重试时切回搜索，加载成功后保留搜索焦点和关键词', async ({ page }) => {
  const release = await holdRetry(page, 'interview-html-css');
  await page.goto('/?article=interview-html-css#q5');
  const input = page.getByRole('searchbox', { name: '搜索题目和笔记' });
  try {
    await page.getByRole('button', { name: '重新加载正文' }).click();
    await input.fill('闭包');
  } finally {
    release();
  }
  await expect(page.getByRole('heading', { name: /Q5｜/ })).toBeAttached();
  await expect(input).toBeFocused();
  await expect(input).toHaveValue('闭包');
  await expect(page.locator('.search-results')).toBeVisible();
});
