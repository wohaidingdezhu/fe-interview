import { test, expect } from '@playwright/test';

const learningKey = 'fe-library-learning-v1', studyKey = 'fe-library-study-session-v1';
const entry = (day, status = 'read') => ({ bookmarked: false, status, updatedAt: `2026-10-${day}T00:00:00.000Z` });
const learning = { version: 1, entries: { 'q:5': entry(10), 'q:6': entry(12), 'q:7': entry(10) } };
const session = { version: 1, keys: ['q:5', 'q:6'], currentKey: 'q:6', returnSearch: '?view=learning' };
const incoming = { version: 1, entries: { 'q:5': entry(11, 'review'), 'q:6': entry(11), 'q:8': entry(11) }, removed: { 'q:7': '2026-10-11T00:00:00.000Z' } };
const backup = { format: 'fe-library-backup', version: 1, learning: incoming, study: { ...session, keys: ['q:8'], currentKey: 'q:8' } };
const state = page => page.evaluate(([l, s]) => ({ learning: localStorage.getItem(l), study: localStorage.getItem(s) }), [learningKey, studyKey]);
const select = (page, data = backup) => page.locator('input[type=file]').setInputFiles({ name: '学习备份.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(data)) });
const open = async page => {
  await page.goto('/?view=learning', { waitUntil: 'domcontentloaded' });
  await page.evaluate(({ learningKey, studyKey, learning, session }) => {
    localStorage.setItem(learningKey, JSON.stringify(learning)); localStorage.setItem(studyKey, JSON.stringify(session));
  }, { learningKey, studyKey, learning, session });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('region', { name: '暂停的学习清单' })).toContainText('第 2 / 2 项');
  await page.getByText('记录管理 · 备份与清理', { exact: true }).click();
};

test('导入先预览，取消与 Escape 不写记录，可只合并记录并保留当前清单', async ({ page }, testInfo) => {
  await open(page);
  const before = await state(page), dialog = page.getByRole('dialog', { name: '导入备份预览' });
  await select(page);
  await expect(dialog).toContainText('预计合并后有 3 条记录');
  for (const label of ['新增', '更新', '移除', '保留']) await expect(dialog.locator('.backup-preview-counts > div').filter({ has: page.getByText(label, { exact: true }) })).toContainText('1');
  expect(await state(page)).toEqual(before);
  if (testInfo.project.name === 'mobile-webkit') await dialog.screenshot({ path: testInfo.outputPath('backup-import-preview-mobile.png') });
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole('button', { name: '导入备份', exact: true })).toBeFocused();
  expect(await state(page)).toEqual(before);
  await select(page); await dialog.getByRole('button', { name: '取消导入' }).click();
  expect(await state(page)).toEqual(before);
  await select(page); await dialog.getByRole('checkbox').uncheck();
  await expect(dialog).toContainText('保留当前学习清单');
  await dialog.getByRole('button', { name: '确认导入', exact: true }).click();
  const after = await state(page);
  expect(after.study).toBe(before.study);
  expect(JSON.parse(after.learning).entries).toEqual({ 'q:5': entry(11, 'review'), 'q:6': entry(12), 'q:8': entry(11) });
  await page.reload();
  await expect(page.getByRole('region', { name: '暂停的学习清单' })).toContainText('待复习 1');
});

test('旧版备份保留清单，空清单备份明确确认后才结束当前清单', async ({ page }) => {
  await open(page);
  const before = await state(page), dialog = page.getByRole('dialog', { name: '导入备份预览' });
  await select(page, incoming);
  await expect(dialog.getByRole('checkbox')).toHaveCount(0);
  await expect(dialog).toContainText('当前学习清单保持不变');
  await dialog.getByRole('button', { name: '确认导入', exact: true }).click();
  expect((await state(page)).study).toBe(before.study);
  await select(page, { ...backup, study: null });
  await expect(dialog.getByRole('checkbox', { name: '结束当前学习清单（备份中没有清单）' })).toBeChecked();
  expect((await state(page)).study).toBe(before.study);
  await dialog.getByRole('button', { name: '确认导入', exact: true }).click();
  expect((await state(page)).study).toBe('null');
  await expect(page.getByRole('region', { name: '暂停的学习清单' })).toHaveCount(0);
});

test('无效文件不改记录，保存失败保持预览并可重试恢复完整清单', async ({ page }) => {
  await open(page);
  const before = await state(page), dialog = page.getByRole('dialog', { name: '导入备份预览' });
  await select(page, { ...backup, study: { ...backup.study, keys: ['invalid'] } });
  await expect(page.locator('.backup-import').getByRole('alert')).toContainText('导入失败');
  await expect(dialog).toHaveCount(0); expect(await state(page)).toEqual(before);
  await select(page);
  await page.evaluate(key => {
    const original = Storage.prototype.setItem; let fail = true;
    Storage.prototype.setItem = function (name, value) {
      if (name === key && fail) { fail = false; throw new DOMException('Full', 'QuotaExceededError'); }
      return original.call(this, name, value);
    };
  }, learningKey);
  await dialog.getByRole('button', { name: '确认导入', exact: true }).click();
  await expect(dialog.getByRole('alert')).toContainText('清单未替换');
  expect(await state(page)).toEqual(before);
  await dialog.getByRole('button', { name: '重试导入' }).click();
  await expect(dialog).toHaveCount(0);
  expect(JSON.parse((await state(page)).study)).toEqual(backup.study);
  expect(JSON.parse((await state(page)).learning).entries['q:8']).toEqual(entry(11));
});

test('预览期间其他标签页的较新标记会更新预览并在导入时保留', async ({ page, context }) => {
  await open(page); await select(page);
  const dialog = page.getByRole('dialog', { name: '导入备份预览' });
  await expect(dialog).toBeVisible();
  await dialog.getByText('查看记录变更明细', { exact: true }).click();
  await dialog.getByRole('combobox', { name: '变更类型' }).selectOption('updated');
  await expect(dialog.getByRole('list', { name: '备份记录变更明细' }).getByRole('listitem')).toContainText(['已读 · 未收藏 → 待复习 · 未收藏']);
  const other = await context.newPage();
  await other.goto('/?view=learning');
  await other.evaluate(({ learningKey, learning }) => localStorage.setItem(learningKey, JSON.stringify(learning)), { learningKey, learning: { ...learning, entries: { ...learning.entries, 'q:5': entry(13, 'unread') } } });
  await expect(dialog.locator('.backup-preview-counts > div').filter({ has: page.getByText('更新', { exact: true }) })).toContainText('0');
  await expect(dialog).toContainText('没有匹配的记录');
  await dialog.getByRole('combobox', { name: '变更类型' }).selectOption('retained');
  await dialog.getByRole('searchbox', { name: '搜索导入记录' }).fill('Q5');
  await expect(dialog.getByRole('list', { name: '备份记录变更明细' }).getByRole('listitem')).toContainText(['未读 · 未收藏 → 未读 · 未收藏']);
  await dialog.getByRole('checkbox').uncheck();
  await dialog.getByRole('button', { name: '确认导入', exact: true }).click();
  expect(JSON.parse((await state(page)).learning).entries['q:5']).toEqual(entry(13, 'unread'));
  await other.close();
});

test('明细显示状态与收藏变化，可搜索精确题号、查看移除及较新保留记录', async ({ page }, testInfo) => {
  await open(page);
  const before = await state(page);
  await select(page, { ...backup, learning: { ...incoming, entries: { ...incoming.entries, 'q:8': { ...entry(11), bookmarked: true }, 'q:50': entry(11) } } });
  const dialog = page.getByRole('dialog', { name: '导入备份预览' });
  await dialog.getByText('查看记录变更明细', { exact: true }).click();
  const list = dialog.getByRole('list', { name: '备份记录变更明细' }), filter = dialog.getByRole('combobox', { name: '变更类型' });
  await expect(list.getByRole('listitem')).toHaveCount(4);
  await dialog.getByRole('searchbox', { name: '搜索导入记录' }).fill('Q5');
  await expect(list.getByRole('listitem')).toHaveCount(1);
  await expect(list).toContainText('overflow');
  await expect(list).toContainText('已读 · 未收藏 → 待复习 · 未收藏');
  await dialog.getByRole('searchbox', { name: '搜索导入记录' }).fill('');
  await filter.selectOption('added');
  await expect(list).toContainText('无记录 → 已读 · 已收藏');
  await filter.selectOption('removed');
  await expect(list.getByRole('listitem')).toHaveCount(1);
  await expect(list).toContainText('已读 · 未收藏 → 无记录');
  await filter.selectOption('retained');
  await expect(list.getByRole('listitem')).toHaveCount(1);
  await expect(list).toContainText('已读 · 未收藏 → 已读 · 未收藏');
  if (testInfo.project.name === 'mobile-webkit') await dialog.screenshot({ path: testInfo.outputPath('backup-change-details-mobile.png') });
  expect(await state(page)).toEqual(before);
  await dialog.getByRole('button', { name: '取消导入' }).click();
  expect(await state(page)).toEqual(before);
});

test('大量导入记录按页核对，未知内容标识可搜索，筛选恢复首页且不写入', async ({ page }) => {
  await open(page);
  const before = await state(page);
  const entries = Object.fromEntries(Array.from({ length: 22 }, (_, i) => [`q:${i + 1}`, entry(13)]));
  entries['a:retired-note'] = entry(13); entries['q:9999'] = entry(13);
  await select(page, { ...backup, learning: { version: 1, entries } });
  const dialog = page.getByRole('dialog', { name: '导入备份预览' });
  await dialog.getByText('查看记录变更明细', { exact: true }).click();
  const list = dialog.getByRole('list', { name: '备份记录变更明细' }), search = dialog.getByRole('searchbox', { name: '搜索导入记录' });
  await expect(list.getByRole('listitem')).toHaveCount(8);
  await dialog.getByRole('button', { name: '下一页明细' }).click();
  await expect(dialog.getByRole('status')).toContainText('第 2 / 3 页');
  await expect(dialog.getByRole('status')).toBeFocused();
  await search.fill('retired-note');
  await expect(list.getByRole('listitem')).toHaveCount(1);
  await expect(list).toContainText('a:retired-note（当前目录未匹配）');
  await expect(search).toBeFocused();
  await search.fill('Q9999');
  await expect(list).toContainText('Q9999（当前目录未匹配）');
  await search.fill('');
  await expect(dialog.getByRole('status')).toContainText('第 1 / 3 页');
  expect(await state(page)).toEqual(before);
  await page.keyboard.press('Escape');
  expect(await state(page)).toEqual(before);
});
