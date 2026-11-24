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

test('控制台保留 symbol 和函数的文本输出', async ({ page }) => {
  await page.goto('/?article=closure');
  const editor = page.getByRole('textbox', { name: 'JavaScript 代码编辑器' });
  await editor.fill("console.log(Symbol('token')); console.log(function example() {});");
  await page.getByRole('button', { name: /运行/ }).click();
  const output = page.locator('.console-log');
  await expect(output).toHaveCount(2);
  await expect(output.nth(0)).toContainText('Symbol(token)');
  await expect(output.nth(1)).toContainText('function example');
});

test('控制台正确显示特殊数值', async ({ page }) => {
  await page.goto('/?article=closure');
  const editor = page.getByRole('textbox', { name: 'JavaScript 代码编辑器' });
  await editor.fill('console.log(NaN, Infinity, -Infinity, -0, 0);');
  await page.getByRole('button', { name: /运行/ }).click();
  await expect(page.locator('.console-log')).toContainText('NaN Infinity -Infinity -0 0');
});

test('难以格式化的对象不会中断后续代码', async ({ page }) => {
  await page.goto('/?article=closure');
  const editor = page.getByRole('textbox', { name: 'JavaScript 代码编辑器' });
  await editor.fill(`const value = Object.create(null);
value.toJSON = () => { throw new Error('无法序列化'); };
console.log(value);
console.log('继续执行');`);
  await page.getByRole('button', { name: /运行/ }).click();
  const output = page.locator('.console-log');
  await expect(output).toHaveCount(2);
  await expect(output.nth(0)).toContainText('[无法格式化的值]');
  await expect(output.nth(1)).toContainText('继续执行');
});

test('异常代理对象不会中断控制台和后续执行', async ({ page }) => {
  await page.goto('/?article=closure');
  const editor = page.getByRole('textbox', { name: 'JavaScript 代码编辑器' });
  await editor.fill(`const value = new Proxy({}, {
  getPrototypeOf() { throw new Error('禁止读取原型'); },
  get() { throw new Error('禁止读取属性'); }
});
console.log(value);
console.log('继续执行');`);
  await page.getByRole('button', { name: /运行/ }).click();
  const output = page.locator('.console-log');
  await expect(output).toHaveCount(2);
  await expect(output.nth(0)).toContainText('[无法格式化的值]');
  await expect(output.nth(1)).toContainText('继续执行');
});

test('异常对象的自定义堆栈不会中断控制台和后续执行', async ({ page }) => {
  await page.goto('/?article=closure');
  const editor = page.getByRole('textbox', { name: 'JavaScript 代码编辑器' });
  await editor.fill(`const error = new Error('示例');
Object.defineProperty(error, 'stack', { value: () => 'custom stack' });
console.log(error);
console.log('继续执行');`);
  await page.getByRole('button', { name: /运行/ }).click();
  const output = page.locator('.console-log');
  await expect(output).toHaveCount(2);
  await expect(output.nth(0)).toContainText('custom stack');
  await expect(output.nth(1)).toContainText('继续执行');
});

test('异步抛出的自定义异常堆栈仍可显示', async ({ page }) => {
  await page.goto('/?article=closure');
  const editor = page.getByRole('textbox', { name: 'JavaScript 代码编辑器' });
  await editor.fill(`const error = new Error('异步示例');
Object.defineProperty(error, 'stack', { value: () => 'async custom stack' });
setTimeout(() => { throw error; }, 0);`);
  await page.getByRole('button', { name: /运行/ }).click();
  await expect(page.locator('.console-error')).toContainText('async custom stack');
});

test('运行代码中的 console.clear 只清除之前的输出', async ({ page }) => {
  await page.goto('/?article=closure');
  const editor = page.getByRole('textbox', { name: 'JavaScript 代码编辑器' });
  await editor.fill(`console.log('清除前');
console.warn('旧警告');
console.clear();
console.log('清除后');`);
  await page.getByRole('button', { name: /运行/ }).click();
  const consolePane = page.locator('.console-lines');
  await expect(consolePane.locator('.console-log')).toHaveCount(1);
  await expect(consolePane.locator('.console-log')).toContainText('清除后');
  await expect(consolePane.locator('.console-warn')).toHaveCount(0);
  await expect(consolePane).not.toContainText('清除前');
});
