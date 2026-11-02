import { test, expect } from '@playwright/test';

const studyKey = 'fe-library-study-session-v1';
const notice = page => page.getByRole('region', { name: '学习清单保存', exact: true });
const retry = page => notice(page).getByRole('button', { name: '重试保存学习清单', exact: true });
const stored = page => page.evaluate(key => localStorage.getItem(key), studyKey);
const failWrites = page => page.evaluate(key => {
  window.originalStudyWrite = Storage.prototype.setItem;
  Storage.prototype.setItem = function (name, value) {
    if (name === key) {
      window.failedStudyWrite = value;
      throw new DOMException('Storage full', 'QuotaExceededError');
    }
    return window.originalStudyWrite.call(this, name, value);
  };
}, studyKey);
const restoreWrites = page => page.evaluate(() => { Storage.prototype.setItem = window.originalStudyWrite; });
const startUnsaved = async page => {
  await page.goto('/?view=questions&q=Q5', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('button', { name: '开始学习 →', exact: true })).toBeEnabled();
  await failWrites(page);
  await page.getByRole('button', { name: '开始学习 →', exact: true }).click();
  await expect(page.getByRole('region', { name: '连续学习' })).toContainText('学习清单 1 / 1');
  await expect(notice(page).getByRole('alert')).toContainText('无法保存');
};

test('未保存清单可重复重试，成功不改变位置，刷新后仍可恢复', async ({ page }) => {
  await startUnsaved(page);
  const href = page.url(), original = await page.evaluate(() => window.failedStudyWrite);
  await retry(page).click();
  await expect(notice(page).getByRole('alert')).toContainText('仍未保存');
  expect(await stored(page)).toBeNull();
  await expect(notice(page).getByRole('button', { name: '导出备份', exact: true })).toBeEnabled();
  await restoreWrites(page);
  await retry(page).click();
  await expect(notice(page).getByRole('status')).toContainText('学习清单已保存');
  await expect(notice(page).getByRole('status')).toBeFocused();
  expect(await stored(page)).toBe(original);
  await expect(page).toHaveURL(href);
  await expect(page.getByRole('dialog', { name: '本次清单结果' })).toHaveCount(0);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('region', { name: '连续学习' })).toContainText('学习清单 1 / 1');
  await expect(notice(page)).toHaveCount(0);
});

test('暂停后可保存临时清单，结束保存失败也能重试，刷新不复活旧清单', async ({ page }) => {
  await startUnsaved(page);
  await page.getByRole('link', { name: '暂停', exact: true }).click();
  await expect(page.getByRole('region', { name: '暂停的学习清单' })).toBeVisible();
  await restoreWrites(page);
  await retry(page).click();
  await expect(notice(page).getByRole('status')).toContainText('学习清单已保存');
  const original = await stored(page);
  await failWrites(page);
  await page.getByRole('button', { name: '查看结果 / 结束清单', exact: true }).click();
  await page.getByRole('dialog', { name: '本次清单结果' }).getByRole('button', { name: '结束清单并返回列表', exact: true }).click();
  await expect(page.getByRole('region', { name: '暂停的学习清单' })).toHaveCount(0);
  await expect(notice(page).getByRole('alert')).toBeVisible();
  expect(await stored(page)).toBe(original);
  await restoreWrites(page);
  await retry(page).click();
  await expect(notice(page).getByRole('status')).toBeFocused();
  expect(await stored(page)).toBe('null');
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: '全部题目', exact: true })).toBeVisible();
  await expect(page.getByRole('region', { name: '暂停的学习清单' })).toHaveCount(0);
});

for (const ended of [false, true]) test(`重试采用浏览器已${ended ? '结束' : '替换'}的清单，不覆盖尚未收到通知的新版本`, async ({ page }) => {
  await startUnsaved(page);
  await restoreWrites(page);
  const latest = ended ? 'null' : JSON.stringify({ version: 1, keys: ['q:6'], currentKey: 'q:6', returnSearch: '?view=questions&q=Q6' });
  // 同页写入不触发 storage 通知，复现其他页面已写入而本页尚未同步的窗口。
  await page.evaluate(({ key, raw }) => localStorage.setItem(key, raw), { key: studyKey, raw: latest });
  const href = page.url();
  await retry(page).click();
  await expect(notice(page).getByRole('status')).toContainText('已同步最新状态');
  await expect(notice(page).getByRole('status')).toBeFocused();
  expect(await stored(page)).toBe(latest);
  await expect(page).toHaveURL(href);
  await expect(page.getByRole('region', { name: '连续学习' })).toContainText(ended ? '当前没有可用清单' : '当前阅读内容不在这份清单中');
});

test('清单重试保留损坏原文和内存清单，恢复可读存储后才保存', async ({ page }) => {
  await startUnsaved(page);
  await restoreWrites(page);
  const original = await page.evaluate(() => window.failedStudyWrite);
  await page.evaluate(key => localStorage.setItem(key, '{broken'), studyKey);
  await retry(page).click();
  await expect(notice(page).getByRole('alert')).toContainText('保留本页清单和浏览器原数据');
  expect(await stored(page)).toBe('{broken');
  await expect(page.getByRole('region', { name: '连续学习' })).toContainText('学习清单 1 / 1');
  await expect(notice(page).getByRole('button', { name: '导出备份', exact: true })).toBeEnabled();
  await page.evaluate(key => localStorage.removeItem(key), studyKey);
  await retry(page).click();
  await expect(notice(page).getByRole('status')).toContainText('学习清单已保存');
  expect(await stored(page)).toBe(original);
});
