import { test, expect } from '@playwright/test';

test('输入法组合期间快捷键不会运行代码，完成输入后仍可运行', async ({ page }) => {
  await page.goto('/?article=closure');
  const editor = page.getByRole('textbox', { name: 'JavaScript 代码编辑器' });
  await editor.fill("console.log('组合完成后运行');");
  const frame = page.getByTitle('JavaScript 运行结果');
  await frame.evaluate(element => { element.dataset.original = 'true'; });
  await editor.evaluate(element => element.dispatchEvent(new KeyboardEvent('keydown', {
    key: 'Enter', ctrlKey: true, isComposing: true, bubbles: true, cancelable: true,
  })));
  await expect(frame).toHaveAttribute('data-original', 'true');
  await editor.press('Control+Enter');
  await expect(page.locator('.console-log')).toContainText('组合完成后运行');
});
