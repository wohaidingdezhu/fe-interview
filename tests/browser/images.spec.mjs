import { test, expect } from '@playwright/test';

test('正文图片预览支持放大滚动、键盘关闭并保留阅读位置', async ({ page }) => {
  await page.goto('/?article=interview-javascript#q46');
  const trigger = page.getByRole('button', { name: '放大图片：本轮修订图：JavaScript 对象引用值与局部重新赋值', exact: true });
  await trigger.scrollIntoViewIfNeeded();
  await expect.poll(() => trigger.locator('img').evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true);
  await trigger.evaluate(button => { button.scrollIntoView({ block: 'center', behavior: 'instant' }); button.focus({ preventScroll: true }); });
  const originalURL = page.url(), scrollY = await page.evaluate(() => window.scrollY);
  await page.keyboard.press('Enter');
  const modal = page.getByRole('dialog', { name: '图片预览' });
  await expect(modal).toBeVisible();
  await expect(modal.getByRole('button', { name: '关闭图片' })).toBeFocused();
  await expect.poll(() => modal.locator('img').evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true);
  await modal.getByRole('button', { name: '放大', exact: true }).click();
  const viewport = modal.getByRole('region');
  await expect.poll(() => viewport.evaluate(node => node.scrollWidth > node.clientWidth)).toBe(true);
  await viewport.focus(); await page.keyboard.down('ArrowRight');
  try { await expect.poll(() => viewport.evaluate(node => node.scrollLeft)).toBeGreaterThan(0); }
  finally { await page.keyboard.up('ArrowRight'); }
  await modal.getByRole('button', { name: '适应窗口' }).click();
  await expect.poll(() => viewport.evaluate(node => node.scrollWidth <= node.clientWidth + 1)).toBe(true);
  await page.keyboard.press('Escape');
  await expect(modal).not.toBeVisible(); await expect(trigger).toBeFocused();
  expect(page.url()).toBe(originalURL);
  expect(Math.abs(await page.evaluate(() => window.scrollY) - scrollY)).toBeLessThan(2);
  await trigger.click(); await expect(modal).toBeVisible();
  await modal.getByRole('button', { name: '关闭图片' }).click();
  await expect(trigger).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('图片链接保留原跳转，空说明图片可预览，加载失败可重试', async ({ page }) => {
  await page.route('**/content/closure-*.json', async route => {
    const response = await route.fetch(), body = await response.json();
    body.content += '\n\n[![外链配图](./images/preview-fixture.svg)](https://example.com/reference)\n\n![](./images/preview-fixture.svg)\n';
    await route.fulfill({ response, json: body });
  });
  await page.route('**/images/preview-fixture.svg', route => route.fulfill({ status: 404, body: '' }));
  await page.goto('/?article=closure');
  const link = page.getByRole('link', { name: '外链配图', exact: true });
  await expect(link).toHaveAttribute('target', '_blank');
  await expect(link.locator('button')).toHaveCount(0);
  const trigger = page.getByRole('button', { name: '放大图片：正文配图', exact: true });
  await trigger.click();
  const modal = page.getByRole('dialog', { name: '图片预览' });
  await expect(modal.getByRole('alert')).toContainText('图片加载失败');
  await modal.getByRole('button', { name: '关闭图片' }).click();
  await expect(trigger).toBeFocused();
  await page.unroute('**/images/preview-fixture.svg');
  await page.route('**/images/preview-fixture.svg', route => route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900"><rect width="1600" height="900" fill="green"/></svg>' }));
  await trigger.click();
  await expect.poll(() => modal.locator('img').evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true);
  await expect(modal.getByRole('alert')).toHaveCount(0);
});
