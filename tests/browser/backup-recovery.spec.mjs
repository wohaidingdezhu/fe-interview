import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

const learningKey = 'fe-library-learning-v1';
const startUnsaved = async page => {
  await page.goto('/?view=questions&q=Q5');
  await page.getByRole('button', { name: '开始学习 →', exact: true }).click();
  await expect(page.getByRole('button', { name: '标记已读并查看结果' })).toBeEnabled();
  // 先完成自动记录位置，再注入故障，避免定时保存提示恰好移动正在点击的底栏。
  await expect.poll(() => page.evaluate(key => JSON.parse(localStorage.getItem(key) ?? '{}').lastRead?.anchor, learningKey)).toBe('q5');
  await page.evaluate(key => {
    const setItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function (name, value) {
      if (name === key) throw new DOMException('Storage full', 'QuotaExceededError');
      return setItem.call(this, name, value);
    };
  }, learningKey);
  await page.getByRole('button', { name: '标记已读并查看结果' }).click();
  await expect(page.getByRole('region', { name: '连续学习' }).getByRole('alert')).toContainText('尚未保存');
};

const exportBackup = async (page, region, path) => {
  const download = page.waitForEvent('download');
  await region.getByRole('button', { name: '导出备份', exact: true }).click();
  await (await download).saveAs(path);
  return JSON.parse(await readFile(path, 'utf8'));
};

test('保存失败直接导出内存记录与清单，长底栏不会遮住正文末尾', async ({ page }, testInfo) => {
  await startUnsaved(page);
  const bar = page.getByRole('region', { name: '连续学习' });
  const persisted = await page.evaluate(key => JSON.parse(localStorage.getItem(key) ?? '{"entries":{}}'), learningKey);
  expect(persisted.entries['q:5']?.status).not.toBe('read');
  const backup = await exportBackup(page, bar, testInfo.outputPath('unsaved-backup.json'));
  expect(backup.format).toBe('fe-library-backup');
  expect(backup.learning.entries['q:5'].status).toBe('read');
  expect(backup.study.keys).toEqual(['q:5']);
  expect(backup.study.currentKey).toBe('q:5');
  await expect(bar.getByRole('status')).toContainText('请确认文件已保存');
  // 此处验收底栏占位，避免后台 WebKit 暂停平滑滚动导致尚未抵达页底。
  await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }));
  await expect.poll(async () => {
    const footer = await page.locator('.page-footer').boundingBox(), bounds = await bar.boundingBox();
    return footer.y + footer.height <= bounds.y;
  }).toBe(true);
  if (testInfo.project.name === 'mobile-webkit') await bar.screenshot({ path: testInfo.outputPath('backup-save-warning-mobile.png') });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await expect(page.getByRole('dialog', { name: '本次清单结果' })).toHaveCount(0);
});

test('内容加载失败可先备份未保存修改，再在新页面导入恢复', async ({ page, browser }, testInfo) => {
  await startUnsaved(page);
  await page.route('**/content/interview-react-*.json', route => route.fulfill({ status: 404, body: 'Missing' }));
  await page.getByRole('searchbox', { name: '搜索题目和笔记' }).fill('Q206');
  await page.locator('.search-results').getByRole('link', { name: /Q206/ }).click();
  const notice = page.getByRole('alert', { name: '内容加载恢复' });
  await expect(notice).toContainText('建议先导出备份再刷新');
  const path = testInfo.outputPath('recovery-backup.json');
  const backup = await exportBackup(page, notice, path);
  expect(backup.learning.entries['q:5'].status).toBe('read');
  expect(backup.study.keys).toEqual(['q:5']);
  await expect(notice).toBeVisible();
  const restoredContext = await browser.newContext({ baseURL: testInfo.project.use.baseURL });
  try {
    const restored = await restoredContext.newPage();
    await restored.goto('/?view=learning');
    await restored.getByText('记录管理 · 备份与清理', { exact: true }).click();
    await restored.locator('input[type=file]').setInputFiles(path);
    await expect(restored.getByRole('region', { name: '暂停的学习清单' })).toContainText('已读 1');
    await restored.getByRole('link', { name: '继续清单 →' }).click();
    await expect(restored.getByRole('region', { name: '连续学习' })).toContainText('当前项已读');
  } finally { await restoredContext.close(); }
});

test('导出失败保留当前页和记录，并允许原地重试', async ({ page }, testInfo) => {
  await startUnsaved(page);
  await page.evaluate(() => {
    const create = URL.createObjectURL; let attempts = 0;
    URL.createObjectURL = blob => { if (!attempts++) throw new Error('Download unavailable'); return create.call(URL, blob); };
  });
  const bar = page.getByRole('region', { name: '连续学习' }), url = page.url();
  await bar.getByRole('button', { name: '导出备份', exact: true }).click();
  await expect(bar.locator('.backup-export').getByRole('alert')).toContainText('导出失败');
  await expect(page).toHaveURL(url);
  const backup = await exportBackup(page, bar, testInfo.outputPath('retried-backup.json'));
  expect(backup.learning.entries['q:5'].status).toBe('read');
  await expect(bar.locator('.backup-export').getByRole('alert')).toHaveCount(0);
});

test('横屏长提示保留正文空间，备份和更多操作仍可到达', async ({ page }, testInfo) => {
  for (const viewport of [{ width: 667, height: 375 }, { width: 844, height: 390 }]) {
    await page.setViewportSize(viewport);
    await startUnsaved(page);
    const bar = page.getByRole('region', { name: '连续学习' });
    const header = await page.locator('.header').boundingBox(), bounds = await bar.boundingBox();
    expect(bounds.y - header.y - header.height).toBeGreaterThanOrEqual(100);
    const backup = await exportBackup(page, bar, testInfo.outputPath(`landscape-${viewport.width}.json`));
    expect(backup.learning.entries['q:5'].status).toBe('read');
    await bar.getByText('更多操作', { exact: true }).click();
    await bar.getByRole('button', { name: '查看结果 / 结束清单' }).click();
    const result = page.getByRole('dialog', { name: '本次清单结果' });
    await expect(result).toBeVisible();
    await result.getByRole('button', { name: '关闭结果', exact: true }).click();
    await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }));
    await expect.poll(async () => {
      const footer = await page.locator('.page-footer').boundingBox(), barBounds = await bar.boundingBox();
      return footer.y + footer.height <= barBounds.y;
    }).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    if (testInfo.project.name === 'mobile-webkit') await page.screenshot({ path: testInfo.outputPath(`landscape-${viewport.width}.png`) });
    await bar.getByRole('link', { name: '暂停', exact: true }).click();
    await expect(page.getByRole('region', { name: '暂停的学习清单' })).toBeVisible();
  }
});
