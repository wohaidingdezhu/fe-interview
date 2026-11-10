import { test, expect } from '@playwright/test';

test.use({ timezoneId: 'Asia/Shanghai' });

test('导出备份文件名使用本地日期', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-01-01T16:30:00Z'));
  await page.goto('/?view=learning');
  await page.getByText('记录管理 · 备份与清理', { exact: true }).click();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: '导出备份', exact: true }).click();
  expect((await download).suggestedFilename()).toBe('前端资料库-学习记录-2026-01-02.json');
});
