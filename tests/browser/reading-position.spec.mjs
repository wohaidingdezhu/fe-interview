import { test, expect } from '@playwright/test';

const learningKey = 'fe-library-learning-v1';
const readLearning = page => page.evaluate(key => JSON.parse(localStorage.getItem(key) ?? 'null'), learningKey);
const delayedPosition = page => page.addInitScript(() => {
  const schedule = window.setTimeout;
  window.readingPositions = [];
  window.setTimeout = function (callback, delay, ...args) {
    if (delay === 500 && typeof callback === 'function') {
      window.readingPositions.push(() => callback(...args));
      return schedule.call(this, callback, 120_000, ...args);
    }
    return schedule.call(this, callback, delay, ...args);
  };
});
const queuedPositions = page => page.evaluate(() => window.readingPositions.length);
const runLatestPosition = page => page.evaluate(() => window.readingPositions.at(-1)());
const jumpToQuestion = async (page, number) => {
  const queued = await queuedPositions(page);
  await page.getByRole('searchbox', { name: '搜索题目和笔记' }).fill(`Q${number}`);
  await page.locator('.search-results').getByRole('link', { name: new RegExp(`Q${number}`) }).click();
  await expect(page.getByRole('heading', { name: new RegExp(`Q${number}｜`) })).toBeFocused();
  await expect.poll(() => queuedPositions(page)).toBeGreaterThan(queued);
};

test('清空记录后旧标签页的定位任务不能恢复旧位置，新的阅读仍可记录', async ({ page, context }) => {
  await delayedPosition(page);
  await page.addInitScript(() => window.addEventListener('storage', event => event.stopImmediatePropagation()));
  await page.goto('/?article=interview-html-css#q5');
  await expect(page.getByRole('heading', { name: /Q5｜/ })).toBeFocused();
  await expect.poll(() => queuedPositions(page)).toBeGreaterThan(0);
  await runLatestPosition(page);
  expect((await readLearning(page)).lastRead.anchor).toBe('q5');
  await jumpToQuestion(page, 6);

  const manager = await context.newPage();
  await manager.goto('/?view=learning');
  await manager.getByText('记录管理 · 备份与清理', { exact: true }).click();
  manager.once('dialog', dialog => dialog.accept());
  await manager.getByRole('button', { name: '清空全部记录' }).click();
  const cleared = await readLearning(manager);
  expect(cleared).toMatchObject({ entries: {}, resetAt: expect.any(String) });
  expect(cleared.lastRead).toBeUndefined();

  await runLatestPosition(page);
  expect(await readLearning(manager)).toEqual(cleared);

  await jumpToQuestion(page, 7);
  await runLatestPosition(page);
  expect(await readLearning(manager)).toMatchObject({ resetAt: cleared.resetAt, lastRead: { anchor: 'q7' } });
});

test('旧标签页延迟写入时保留另一标签页较新的阅读位置', async ({ page, context }) => {
  await delayedPosition(page);
  await page.addInitScript(now => { Date.now = () => now; }, Date.parse('2026-01-01T00:00:00Z'));
  await page.goto('/?article=interview-html-css#q5');
  await expect(page.getByRole('heading', { name: /Q5｜/ })).toBeFocused();
  await expect.poll(() => queuedPositions(page)).toBeGreaterThan(0);

  const newer = await context.newPage();
  await newer.goto('/?article=interview-html-css#q6');
  await expect.poll(async () => (await readLearning(newer))?.lastRead?.anchor).toBe('q6');
  const latest = await readLearning(newer);

  await runLatestPosition(page);
  expect(await readLearning(newer)).toEqual(latest);
});
