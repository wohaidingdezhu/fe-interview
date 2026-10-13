import { test, expect } from '@playwright/test';

const studyKey = 'fe-library-study-session-v1';
const learningKey = 'fe-library-learning-v1';
async function start(page, query = 'Q5') {
  await page.goto(`/?view=questions&q=${query}`);
  await page.getByRole('button', { name: '开始学习 →', exact: true }).click();
  await expect(page.getByRole('button', { name: /标记已读并/ })).toBeEnabled();
}

test('单题标题、分享、暂停与关闭标签后恢复', async ({ page, context }) => {
  await start(page);
  const href = page.url();
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Q5');
  await expect(page.locator('.study-article-header')).not.toContainText('分钟阅读');
  await expect(page.getByRole('link', { name: '独立题目链接 →' })).toHaveAttribute('href', 'articles/interview-html-css/#q5');
  await expect(page).toHaveTitle(/Q5/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByRole('link', { name: '暂停', exact: true }).click();
  await expect(page.getByRole('region', { name: '暂停的学习清单' })).toBeVisible();
  const restored = await context.newPage();
  await page.close();
  await restored.goto('/');
  await restored.getByRole('link', { name: '继续清单 →' }).click();
  await expect(restored).toHaveURL(href);
  await expect(restored.getByRole('button', { name: '标记已读并查看结果' })).toBeEnabled();
});

test('随机清单逐项完整推进、历史导航、总结弹窗及继续未读', async ({ page }) => {
  await page.goto('/?view=questions&studyRange=page');
  await expect(page.getByRole('button', { name: '随机学习', exact: true })).toBeEnabled();
  const numbers = await page.locator('.question-number').allTextContents();
  expect(numbers).toHaveLength(12);
  await page.getByRole('button', { name: '随机学习', exact: true }).click();
  const visited = [];
  for (let i = 0; i < numbers.length; i++) {
    await expect(page.getByRole('button', { name: /标记已读并/ })).toBeEnabled();
    visited.push(new URL(page.url()).searchParams.get('question').toUpperCase());
    if (i === 0) {
      const first = page.url();
      await page.getByText('更多操作', { exact: true }).click();
      await page.getByRole('link', { name: '跳过当前项 →' }).click();
      const second = page.url();
      await page.goBack(); await expect(page).toHaveURL(first);
      await page.goForward(); await expect(page).toHaveURL(second);
    } else {
      await page.getByRole('button', { name: /标记已读并/ }).click();
    }
  }
  expect([...visited].sort()).toEqual([...numbers].sort());
  const summary = page.getByRole('dialog', { name: '本次清单结果' });
  await expect(summary).toBeVisible();
  await expect(summary.getByRole('button', { name: '继续剩余 1 项未读' })).toBeVisible();
  await page.keyboard.press('Escape'); await expect(summary).not.toBeVisible();
  await page.getByText('更多操作', { exact: true }).click();
  await page.getByRole('button', { name: '查看结果 / 结束清单' }).click();
  await summary.getByRole('button', { name: '继续剩余 1 项未读' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText(`${visited[0]}｜`);
  await page.getByRole('button', { name: '标记已读并查看结果' }).click();
  await summary.getByRole('button', { name: '结束清单并返回列表' }).click();
  await expect(page.getByRole('region', { name: '暂停的学习清单' })).toHaveCount(0);
});

test('正文资源失效可手动刷新恢复，保留清单与当前网址', async ({ page }, testInfo) => {
  await page.route('**/content/interview-html-css-*.json', route => route.fulfill({ status: 404, body: 'Not found' }));
  await page.goto('/?view=questions&q=Q5');
  await page.getByRole('button', { name: '开始学习 →', exact: true }).click();
  const notice = page.getByRole('alert', { name: '内容加载恢复' });
  await expect(notice).toBeVisible();
  await expect(page.getByRole('button', { name: '标记已读并查看结果' })).toBeDisabled();
  if (testInfo.project.name === 'mobile-webkit') await page.screenshot({ path: testInfo.outputPath('recovery-mobile.png'), fullPage: true });
  const href = page.url();
  const saved = await page.evaluate(key => localStorage.getItem(key), studyKey);
  await page.unroute('**/content/interview-html-css-*.json');
  await notice.getByRole('button', { name: '刷新并继续阅读' }).click();
  await expect(page.getByRole('button', { name: '标记已读并查看结果' })).toBeEnabled();
  await expect(page).toHaveURL(href);
  expect(await page.evaluate(key => localStorage.getItem(key), studyKey)).toBe(saved);
  await expect(notice).toHaveCount(0);
});

test('阅读模块失效不会自动刷新，刷新后可以恢复', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'chromium-dev', 'Vite preloadError 由生产构建产生');
  await page.route('**/assets/ArticleContent-*.js', route => route.fulfill({ status: 404, body: '' }));
  await page.goto('/?view=questions&q=Q5');
  await page.getByRole('button', { name: '开始学习 →', exact: true }).click();
  await expect(page.getByRole('alert', { name: '内容加载恢复' })).toBeVisible();
  await expect(page.getByRole('button', { name: '标记已读并查看结果' })).toBeDisabled();
  const href = page.url();
  await page.unroute('**/assets/ArticleContent-*.js');
  await page.getByRole('button', { name: '刷新并继续阅读' }).click();
  await expect(page.getByRole('button', { name: '标记已读并查看结果' })).toBeEnabled();
  await expect(page).toHaveURL(href);
});

test('导出与导入备份恢复阅读状态及学习清单', async ({ page, browser }, testInfo) => {
  await start(page);
  await page.getByRole('button', { name: '待复习并查看结果' }).click();
  await page.getByRole('button', { name: '关闭结果', exact: true }).click();
  await page.goto('/?view=learning');
  await page.getByText('记录管理 · 备份与清理', { exact: true }).click();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: '导出备份' }).click();
  const backup = testInfo.outputPath('learning-backup.json');
  await (await download).saveAs(backup);
  const context = await browser.newContext({ baseURL: testInfo.project.use.baseURL });
  try {
    const restored = await context.newPage();
    await restored.goto('/?view=learning');
    await restored.getByText('记录管理 · 备份与清理', { exact: true }).click();
    await restored.locator('input[type=file]').setInputFiles(backup);
    await expect(restored.getByRole('region', { name: '暂停的学习清单' })).toContainText('待复习 1');
    await restored.getByRole('link', { name: '继续清单 →' }).click();
    await expect(restored.getByRole('region', { name: '连续学习' })).toContainText('当前项待复习');
  } finally { await context.close(); }
});

test('存储失败时不自动推进并显示备份提示', async ({ page }) => {
  await start(page);
  const href = page.url();
  await page.evaluate(key => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (name, value) {
      if (name === key) throw new DOMException('Storage full', 'QuotaExceededError');
      return original.call(this, name, value);
    };
  }, learningKey);
  await page.getByRole('button', { name: '标记已读并查看结果' }).click();
  await expect(page.getByRole('region', { name: '连续学习' }).getByRole('alert')).toContainText('尚未保存');
  await expect(page.getByRole('dialog', { name: '本次清单结果' })).toHaveCount(0);
  await expect(page).toHaveURL(href);
});

test('目录失效可关闭恢复提示；临时服务错误仍可原地重试', async ({ page }) => {
  const pattern = '**/content/questions-*.json';
  await page.route(pattern, route => route.fulfill({ status: 410, body: 'Gone' }));
  await page.goto('/?view=questions');
  const notice = page.getByRole('alert', { name: '内容加载恢复' });
  await expect(notice).toBeVisible();
  await notice.getByRole('button', { name: '暂不刷新' }).click();
  await expect(notice).toHaveCount(0);
  await page.unroute(pattern);
  await page.route(pattern, route => route.fulfill({ status: 503, body: 'Unavailable' }));
  await page.getByRole('button', { name: '重试', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('503');
  await expect(notice).toHaveCount(0);
  await page.unroute(pattern);
  await page.getByRole('button', { name: '重试', exact: true }).click();
  await expect(page.getByRole('button', { name: '开始学习 →', exact: true })).toBeEnabled();
});
