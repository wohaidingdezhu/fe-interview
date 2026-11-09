import { test, expect } from '@playwright/test';

const control = page => page.getByRole('main').locator('.share-control');
const deferClipboard = page => page.addInitScript(() => {
  window.clipboardRequests = [];
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: {
    writeText: href => new Promise((resolve, reject) => window.clipboardRequests.push({ href, resolve, reject })),
  } });
});

for (const succeeds of [true, false]) test(`切换文章后忽略旧复制请求的${succeeds ? '成功' : '失败'}提示`, async ({ page }) => {
  await deferClipboard(page);
  await page.goto('/?article=closure', { waitUntil: 'domcontentloaded' });
  await control(page).getByRole('button', { name: '复制文章链接', exact: true }).click();
  await expect(control(page).getByRole('status')).toHaveText('正在复制链接…');
  await expect.poll(() => page.evaluate(() => window.clipboardRequests.length)).toBe(1);
  await page.getByRole('searchbox', { name: '搜索题目和笔记' }).fill('Q5');
  await page.locator('.search-results').getByRole('link', { name: /Q5/ }).click();
  await expect(page.getByRole('heading', { name: /HTML.*CSS.*面试题/ })).toBeVisible();
  await expect(control(page).getByRole('link')).toHaveAttribute('href', 'articles/interview-html-css/');
  await page.evaluate(success => {
    const old = window.clipboardRequests[0];
    if (success) old.resolve(); else old.reject(new Error('Clipboard denied'));
  }, succeeds);
  await expect(control(page).getByRole('status')).toHaveText('');
  await control(page).getByRole('button', { name: '复制文章链接', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.clipboardRequests.length)).toBe(2);
  expect(await page.evaluate(() => window.clipboardRequests[1].href)).toMatch(/\/articles\/interview-html-css\/$/);
  await page.evaluate(() => window.clipboardRequests[1].resolve());
  await expect(control(page).getByRole('status')).toHaveText('链接已复制');
});

test('同一专题切换学习题号后不显示上一题的复制反馈', async ({ page }) => {
  await deferClipboard(page);
  await page.addInitScript(() => localStorage.setItem('fe-library-study-session-v1', JSON.stringify({
    version: 1, keys: ['q:5', 'q:6'], currentKey: 'q:5', returnSearch: '?view=questions',
  })));
  await page.goto('/?article=interview-html-css&study=1&question=q5#q5', { waitUntil: 'domcontentloaded' });
  await control(page).getByRole('button', { name: '复制题目链接', exact: true }).click();
  const bar = page.getByRole('region', { name: '连续学习', exact: true });
  await bar.getByText('更多操作', { exact: true }).click();
  await bar.getByRole('link', { name: '跳过当前项 →', exact: true }).click();
  await expect(control(page).getByRole('link')).toHaveAttribute('href', 'articles/interview-html-css/#q6');
  await page.evaluate(() => window.clipboardRequests[0].resolve());
  await expect(control(page).getByRole('status')).toHaveText('');
  await control(page).getByRole('button', { name: '复制题目链接', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.clipboardRequests.length)).toBe(2);
  expect(await page.evaluate(() => window.clipboardRequests[1].href)).toMatch(/#q6$/);
  await page.evaluate(() => window.clipboardRequests[1].resolve());
  await expect(control(page).getByRole('status')).toHaveText('链接已复制');
});

test('连续复制只展示最后一次请求结果，失败后仍可重试', async ({ page }) => {
  await deferClipboard(page);
  await page.goto('/?article=closure', { waitUntil: 'domcontentloaded' });
  const copy = control(page).getByRole('button', { name: '复制文章链接', exact: true });
  await copy.click(); await copy.click();
  await expect.poll(() => page.evaluate(() => window.clipboardRequests.length)).toBe(2);
  await page.evaluate(() => window.clipboardRequests[1].resolve());
  await expect(control(page).getByRole('status')).toHaveText('链接已复制');
  await page.evaluate(() => window.clipboardRequests[0].reject(new Error('Late failure')));
  await expect(control(page).getByRole('status')).toHaveText('链接已复制');
  await copy.click();
  await page.evaluate(() => window.clipboardRequests[2].reject(new Error('Denied')));
  await expect(control(page).getByRole('status')).toContainText('复制失败');
  await copy.click();
  await page.evaluate(() => window.clipboardRequests[3].resolve());
  await expect(control(page).getByRole('status')).toHaveText('链接已复制');
});

for (const latestSucceeds of [true, false]) test(`题目链接连续复制只显示最后一次${latestSucceeds ? '成功' : '失败'}结果`, async ({ page }) => {
  await deferClipboard(page);
  await page.goto('/?article=interview-html-css#q5');
  const heading = page.getByRole('heading', { name: /Q5｜/ });
  const copy = heading.locator('.question-permalink');
  await copy.click();
  await copy.click();
  await expect.poll(() => page.evaluate(() => window.clipboardRequests.length)).toBe(2);
  expect(await page.evaluate(() => window.clipboardRequests[1].href)).toMatch(/\?article=interview-html-css#q5$/);
  await page.evaluate(success => {
    if (success) window.clipboardRequests[1].resolve();
    else window.clipboardRequests[1].reject(new Error('Denied'));
  }, latestSucceeds);
  await expect(copy).toHaveText(latestSucceeds ? '已复制' : '复制失败');
  await page.evaluate(success => {
    if (success) window.clipboardRequests[0].reject(new Error('Late failure'));
    else window.clipboardRequests[0].resolve();
  }, latestSucceeds);
  await expect(copy).toHaveText(latestSucceeds ? '已复制' : '复制失败');
  await copy.click();
  await page.evaluate(() => window.clipboardRequests[2].resolve());
  await expect(copy).toHaveText('已复制');
});

test('代码连续复制后旧失败不会覆盖结果或选中代码', async ({ page }) => {
  await deferClipboard(page);
  await page.goto('/?article=closure');
  const block = page.locator('.article-body .code-block').first();
  const copy = block.getByRole('button', { name: '复制代码' });
  await copy.click();
  await block.locator('.copy-button').click();
  await expect.poll(() => page.evaluate(() => window.clipboardRequests.length)).toBe(2);
  await page.evaluate(() => window.clipboardRequests[1].resolve());
  await expect(block.locator('.copy-button')).toHaveText('已复制');
  await page.evaluate(() => window.clipboardRequests[0].reject(new Error('Late failure')));
  await expect(block.locator('.copy-button')).toHaveText('已复制');
  expect(await page.evaluate(() => window.getSelection().toString())).toBe('');
});
