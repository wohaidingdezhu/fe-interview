import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

const studyKey = 'fe-library-study-session-v1';
const session = number => ({ version: 1, keys: [`q:${number}`], currentKey: `q:${number}`, returnSearch: `?view=questions&q=Q${number}` });

test('首次渲染与订阅之间更新的清单可以恢复', async ({ page }) => {
  await page.addInitScript(({ key, value }) => {
    const add = window.addEventListener;
    window.addEventListener = function (type, ...args) {
      if (type === 'storage') {
        localStorage.setItem(key, JSON.stringify(value));
        window.addEventListener = add;
      }
      return add.call(this, type, ...args);
    };
  }, { key: studyKey, value: session(5) });
  await page.goto('/?view=learning');
  await expect(page.getByRole('region', { name: '暂停的学习清单' })).toContainText('Q5');
});

test('切回页面补齐遗漏的清单替换与结束，损坏数据保留原清单', async ({ page, context }) => {
  await page.addInitScript(({ key, value }) => {
    localStorage.setItem(key, JSON.stringify(value));
    window.addEventListener('storage', event => event.stopImmediatePropagation());
  }, { key: studyKey, value: session(5) });
  await page.goto('/?view=learning');
  const card = page.getByRole('region', { name: '暂停的学习清单' });
  await expect(card).toContainText('Q5');
  const other = await context.newPage();
  await other.goto('/');
  await other.evaluate(({ key, value }) => localStorage.setItem(key, JSON.stringify(value)), { key: studyKey, value: session(6) });
  await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true })));
  await expect(card).toContainText('Q6');
  await other.evaluate(key => localStorage.setItem(key, '{broken'), studyKey);
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await expect(card).toContainText('Q6');
  await expect(card.getByRole('alert')).toContainText('保留');
  await other.evaluate(key => localStorage.setItem(key, 'null'), studyKey);
  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  // WebKit 后台标签可能仍为 hidden；模拟切回时的窗口焦点。
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await expect(card).toHaveCount(0);
  expect(await page.evaluate(key => localStorage.getItem(key), studyKey)).toBe('null');
});

test('切回页面不会用未改变的旧存储覆盖临时清单，备份包含临时内容', async ({ page }, testInfo) => {
  await page.addInitScript(({ key, value }) => localStorage.setItem(key, JSON.stringify(value)), { key: studyKey, value: session(5) });
  await page.goto('/?view=questions&q=Q6');
  await expect(page.getByRole('button', { name: '开始学习 →', exact: true })).toBeEnabled();
  await page.evaluate(key => {
    const setItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function (name, value) {
      if (name === key) throw new DOMException('Storage full', 'QuotaExceededError');
      return setItem.call(this, name, value);
    };
  }, studyKey);
  page.on('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: '开始学习 →', exact: true }).click();
  const bar = page.getByRole('region', { name: '连续学习' });
  await expect(bar.getByRole('alert')).toContainText('无法保存');
  await page.evaluate(() => {
    window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }));
    window.dispatchEvent(new Event('focus'));
  });
  await expect(bar).toContainText('Q6');
  await expect(bar.getByRole('alert')).toContainText('无法保存');
  const download = page.waitForEvent('download');
  await bar.getByRole('button', { name: '导出备份', exact: true }).click();
  const path = testInfo.outputPath('unsaved-study.json');
  await (await download).saveAs(path);
  expect(JSON.parse(await readFile(path, 'utf8')).study.keys).toEqual(['q:6']);
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)).keys, studyKey)).toEqual(['q:5']);
});
