import { test, expect } from '@playwright/test';

const learningKey = 'fe-library-learning-v1', studyKey = 'fe-library-study-session-v1';
const failWrites = page => page.evaluate(key => {
  window.originalStorageWrite = Storage.prototype.setItem;
  Storage.prototype.setItem = function (name, value) {
    if (name === key) {
      window.failedLearningWrite = JSON.parse(value);
      throw new DOMException('Storage full', 'QuotaExceededError');
    }
    return window.originalStorageWrite.call(this, name, value);
  };
}, learningKey);
const restoreWrites = page => page.evaluate(key => {
  window.recoveryEvents = [];
  for (const type of ['mousedown', 'mouseup', 'click', 'focusin']) document.addEventListener(type, event => {
    window.recoveryEvents.push({ type, target: event.target?.textContent?.slice(0, 90), at: performance.now() });
  }, true);
  Storage.prototype.setItem = function (name, value) {
    if (name === key) window.recoveryEvents.push({ type: 'save', data: JSON.parse(value), stack: new Error().stack, at: performance.now() });
    return window.originalStorageWrite.call(this, name, value);
  };
}, learningKey);
const savedLearning = page => page.evaluate(key => JSON.parse(localStorage.getItem(key) ?? 'null'), learningKey);
const notice = page => page.getByRole('region', { name: '阅读记录保存', exact: true });

test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.status === testInfo.expectedStatus || page.isClosed()) return;
  const diagnostics = await page.evaluate(key => ({ events: window.recoveryEvents, stored: localStorage.getItem(key), href: location.href }), learningKey);
  await testInfo.attach('save-recovery-diagnostics', { body: JSON.stringify(diagnostics, null, 2), contentType: 'application/json' });
});

test('保存重试保留原标记时间并合并其他标签页修改，失败可再次重试', async ({ page, context }) => {
  await page.goto('/?view=learning&filter=unread&q=Q5', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.resource-card')).toHaveCount(1);
  await failWrites(page);
  await page.locator('.resource-card').getByRole('button', { name: '☆ 收藏', exact: true }).click();
  const original = await page.evaluate(() => window.failedLearningWrite.entries['q:5']);
  await expect(notice(page).getByRole('alert')).toContainText('尚未保存');
  await notice(page).getByRole('button', { name: '重试保存阅读记录', exact: true }).click();
  await expect(notice(page).getByRole('alert')).toBeVisible();
  expect(await savedLearning(page)).toBeNull();
  expect(await page.evaluate(() => window.failedLearningWrite.entries['q:5'])).toEqual(original);
  const other = await context.newPage();
  await other.goto('/?view=questions&q=Q6', { waitUntil: 'domcontentloaded' });
  await other.locator('.question-row').getByRole('button', { name: '☆ 收藏', exact: true }).click();
  const incoming = (await savedLearning(other)).entries['q:6'];
  await restoreWrites(page);
  await notice(page).getByRole('button', { name: '重试保存阅读记录', exact: true }).click();
  await expect(notice(page).getByRole('status')).toContainText('阅读记录已保存');
  await expect(notice(page).getByRole('status')).toBeFocused();
  await expect(notice(page).getByRole('alert')).toHaveCount(0);
  expect((await savedLearning(page)).entries).toEqual({ 'q:5': original, 'q:6': incoming });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('.resource-card').getByRole('button', { name: '★ 已收藏', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(notice(page)).toHaveCount(0);
  await other.close();
});

test('连续学习重试只保存阅读记录，不推进清单或重复标记', async ({ page }) => {
  await page.goto('/?view=questions&q=Q5', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: '开始学习 →', exact: true }).click();
  await expect(page.getByRole('button', { name: '标记已读并查看结果', exact: true })).toBeEnabled();
  await expect.poll(async () => (await savedLearning(page))?.lastRead?.anchor).toBe('q5');
  const href = page.url(), session = await page.evaluate(key => localStorage.getItem(key), studyKey);
  await page.clock.install();
  await failWrites(page);
  await page.getByRole('button', { name: '标记已读并查看结果', exact: true }).click();
  await expect(notice(page).getByRole('alert')).toContainText('尚未保存');
  const original = await page.evaluate(() => window.failedLearningWrite.entries['q:5']);
  await restoreWrites(page);
  // 给后台定位计时器执行机会，错误提示必须保留到用户主动保存。
  await page.clock.runFor(1000);
  await expect(notice(page).getByRole('alert')).toContainText('尚未保存');
  expect((await savedLearning(page)).entries['q:5']).toBeUndefined();
  await notice(page).getByRole('button', { name: '重试保存阅读记录', exact: true }).click();
  await expect(notice(page).getByRole('status')).toContainText('学习清单位置保持不变');
  await expect(notice(page).getByRole('status')).toBeFocused();
  expect((await savedLearning(page)).entries['q:5']).toEqual(original);
  expect(await page.evaluate(key => localStorage.getItem(key), studyKey)).toBe(session);
  await expect(page).toHaveURL(href);
  await expect(page.getByRole('dialog', { name: '本次清单结果' })).toHaveCount(0);
  await page.getByRole('button', { name: '标记已读并查看结果', exact: true }).click();
  await expect(page.getByRole('dialog', { name: '本次清单结果' })).toBeVisible();
});

test('损坏记录重试不会覆盖原数据，读取恢复后再保存内存修改', async ({ page }) => {
  await page.goto('/?view=learning&filter=unread&q=Q5', { waitUntil: 'domcontentloaded' });
  await page.evaluate(key => localStorage.setItem(key, '{broken backup'), learningKey);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(notice(page).getByRole('alert')).toContainText('无法读取');
  await page.locator('.resource-card').getByRole('button', { name: '☆ 收藏', exact: true }).click();
  await notice(page).getByRole('button', { name: '重试保存阅读记录', exact: true }).click();
  expect(await page.evaluate(key => localStorage.getItem(key), learningKey)).toBe('{broken backup');
  await expect(notice(page).getByRole('alert')).toContainText('原数据已保留');
  await expect(notice(page).getByRole('button', { name: '导出备份', exact: true })).toBeEnabled();
  // 模拟存储恢复为可读版本，重试继续合并本次访问中的修改。
  await page.evaluate(key => localStorage.setItem(key, JSON.stringify({ version: 1, entries: {} })), learningKey);
  await notice(page).getByRole('button', { name: '重试保存阅读记录', exact: true }).click();
  await expect(notice(page).getByRole('status')).toContainText('阅读记录已保存');
  expect((await savedLearning(page)).entries['q:5'].bookmarked).toBe(true);
});
