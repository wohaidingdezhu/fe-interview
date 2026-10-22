import { test, expect } from '@playwright/test';

for (const reading of [false, true]) {
  test(`${reading ? '阅读页' : '暂停页'}清单可清除组合筛选并定位末尾当前项`, async ({ page }, testInfo) => {
    const session = { version: 1, keys: Array.from({ length: 39 }, (_, i) => `q:${i + 1}`), currentKey: 'q:39', returnSearch: '?view=questions&category=HTML%2FCSS' };
    await page.addInitScript(value => localStorage.setItem('fe-library-study-session-v1', JSON.stringify(value)), session);
    await page.goto(reading ? '/?article=interview-html-css&study=1&question=q39#q39' : '/?view=learning');
    const trigger = page.getByRole('button', { name: reading ? '清单目录' : '查看清单', exact: true });
    await trigger.click();
    const dialog = page.getByRole('dialog', { name: '学习清单目录' });
    const search = dialog.getByRole('searchbox', { name: '搜索清单内容' });
    const status = dialog.getByRole('combobox', { name: '清单阅读状态' });
    const links = dialog.getByRole('navigation', { name: '选择清单内容' }).getByRole('link');
    const url = page.url();
    await search.fill('不存在的内容');
    await status.selectOption('read');
    await expect(links).toHaveCount(0);
    await dialog.getByRole('button', { name: '清除筛选', exact: true }).click();
    await expect(search).toBeFocused();
    await expect(search).toHaveValue('');
    await expect(status).toHaveValue('');
    await expect(links).toHaveCount(39);

    await search.fill('Q1');
    await status.selectOption('review');
    const locate = dialog.getByRole('button', { name: '定位当前项', exact: true });
    await locate.focus();
    await page.keyboard.press('Enter');
    await expect(search).toHaveValue('');
    await expect(status).toHaveValue('');
    await expect(links).toHaveCount(39);
    const current = dialog.locator('a[aria-current="location"]');
    await expect(current).toBeFocused();
    await expect(current).toContainText('Q39');
    const bounds = await current.evaluate(element => {
      const item = element.getBoundingClientRect(), list = element.parentElement.getBoundingClientRect();
      return { top: item.top, bottom: item.bottom, listTop: list.top, listBottom: list.bottom };
    });
    expect(bounds.top).toBeGreaterThanOrEqual(bounds.listTop - 1);
    expect(bounds.bottom).toBeLessThanOrEqual(bounds.listBottom + 1);
    await dialog.screenshot({ path: testInfo.outputPath('current-queue-item.png') });
    await expect(page).toHaveURL(url);
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('fe-library-study-session-v1')))).toEqual(session);
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('fe-library-learning-v1') ?? '{"entries":{}}').entries)).toEqual({});
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
    await expect(trigger).toBeFocused();
  });
}
