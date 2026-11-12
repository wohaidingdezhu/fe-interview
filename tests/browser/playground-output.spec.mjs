import { test, expect } from '@playwright/test';

test('控制台区分共享引用与循环引用', async ({ page }) => {
  await page.goto('/?article=closure');
  const editor = page.getByRole('textbox', { name: 'JavaScript 代码编辑器' });
  await editor.fill(`const shared = { value: 42 };
const circular = { name: 'root' };
circular.self = circular;
console.log({ first: shared, second: shared, circular });`);
  await page.getByRole('button', { name: /运行/ }).click();
  const output = page.locator('.console-log');
  await expect(output).toContainText('"first": {');
  await expect(output).toContainText('"second": {');
  await expect(output).toContainText('"self": "[Circular]"');
  await expect(output).toContainText('"value": 42');
});
