import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

test('事件循环笔记示例在真实浏览器中输出与说明一致', async ({ page }) => {
  const article = await readFile(new URL('../../src/articles/event-loop.md', import.meta.url), 'utf8');
  const snippets = [...article.matchAll(/```javascript\n([\s\S]*?)```/g)].map(match => match[1]);
  expect(snippets).toHaveLength(2);
  await page.goto('/');
  for (const [index, source] of snippets.entries()) {
    const values = await page.evaluate(source => new Promise(resolve => {
      const values = [];
      new Function('console', source)({ log: value => values.push(value) });
      setTimeout(() => resolve(values), 30);
    }), source);
    expect(values).toEqual(index === 0 ? ['A', 'D', 'C', 'B'] : [1, 2, 3]);
  }
});

test('跨标签页收藏与阅读状态同步，清空后旧页面不恢复记录', async ({ page, context }) => {
  await page.goto('/?view=questions&q=Q5');
  const other = await context.newPage();
  await other.goto('/?view=questions&q=Q5');
  const controls = target => target.locator('.question-row .learning-controls');
  await controls(page).getByRole('button', { name: '☆ 收藏', exact: true }).click();
  await expect(controls(other).getByRole('button', { name: '★ 收藏', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await controls(other).getByRole('button', { name: '↻ 复习', exact: true }).click();
  await expect(controls(page).getByRole('button', { name: '↺ 复习', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await controls(page).getByRole('button', { name: '★ 收藏', exact: true }).click();
  await expect(controls(other).getByRole('button', { name: '☆ 收藏', exact: true })).toHaveAttribute('aria-pressed', 'false');
  await page.goto('/?view=learning');
  await page.getByText('记录管理 · 备份与清理', { exact: true }).click();
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: '清空全部记录' }).click();
  await expect(controls(other).getByRole('button', { name: '↻ 复习', exact: true })).toHaveAttribute('aria-pressed', 'false');
  await other.reload();
  await expect(controls(other).getByRole('button', { name: '↻ 复习', exact: true })).toHaveAttribute('aria-pressed', 'false');
});

test('跨标签页替换和结束清单，不被旧阅读页的自动定位复活', async ({ page, context }) => {
  await page.goto('/?view=questions&q=Q5');
  await page.getByRole('button', { name: '开始学习 →', exact: true }).click();
  await expect(page.getByRole('button', { name: '标记已读并查看结果' })).toBeEnabled();
  const other = await context.newPage();
  await other.goto('/?view=questions&q=Q6');
  await other.getByRole('button', { name: '开始学习 →', exact: true }).click();
  await expect(page.getByRole('region', { name: '连续学习' })).toContainText('当前阅读内容不在这份清单中');
  await expect(other.getByRole('button', { name: '标记已读并查看结果' })).toBeEnabled();
  await other.getByRole('button', { name: '标记已读并查看结果' }).click();
  await other.getByRole('button', { name: '结束清单并返回列表' }).click();
  await expect(page.getByRole('region', { name: '连续学习' })).toContainText('当前没有可用清单');
  await page.reload();
  await expect(page.getByRole('region', { name: '连续学习' })).toContainText('当前没有可用清单');
  expect(await page.evaluate(() => localStorage.getItem('fe-library-study-session-v1'))).toBe('null');
});

test('题内小节导航保留学习题号，目录 Escape 恢复键盘焦点', async ({ page }) => {
  await page.route('**/content/interview-react-*.json', async route => {
    const response = await route.fetch(), body = await response.json();
    body.content = body.content.replace('## Q207', '### 回归小节\n\n用于验证单题内的三级标题导航。\n\n## Q207');
    await route.fulfill({ response, json: body });
  });
  await page.goto('/?view=questions&q=Q206');
  await page.getByRole('button', { name: '开始学习 →', exact: true }).click();
  await expect(page.getByRole('button', { name: '标记已读并查看结果' })).toBeEnabled();
  const trigger = page.getByRole('button', { name: '清单目录', exact: true });
  await trigger.focus(); await page.keyboard.press('Enter');
  const queue = page.getByRole('dialog', { name: '学习清单目录' });
  await expect(queue).toBeVisible();
  await page.keyboard.press('Escape'); await expect(queue).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await page.getByText('更多操作', { exact: true }).click();
  const bodyTrigger = page.getByRole('button', { name: '正文目录', exact: true });
  await bodyTrigger.click();
  const body = page.getByRole('dialog', { name: /本页目录/ });
  await expect(body).toBeVisible();
  await page.keyboard.press('Escape'); await expect(body).not.toBeVisible();
  await expect(bodyTrigger).toBeFocused();
  await bodyTrigger.click();
  await body.getByRole('link', { name: '回归小节', exact: true }).click();
  await expect(page.getByRole('heading', { name: '回归小节', exact: true })).toBeFocused();
  expect(new URL(page.url()).searchParams.get('question')).toBe('q206');
  await page.getByRole('button', { name: '标记已读并查看结果' }).click();
  await expect(page.getByRole('dialog', { name: '本次清单结果' })).toBeVisible();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('fe-library-learning-v1')).entries['q:206'].status)).toBe('read');
  await page.getByRole('button', { name: '关闭结果', exact: true }).click();
  // 另外验证路径中的普通笔记章节跳转。
  await page.goto('/?view=learning&path=react-basics');
  await page.getByRole('button', { name: '按顺序开始学习 →' }).click();
  await page.getByRole('button', { name: '清单目录', exact: true }).click();
  await page.getByRole('dialog', { name: '学习清单目录' }).getByRole('link', { name: /理解作用域与闭包/ }).click();
  await expect(page.getByRole('button', { name: '标记已读并继续' })).toBeEnabled();
  await page.getByText('更多操作', { exact: true }).click();
  await page.getByRole('button', { name: '正文目录', exact: true }).click();
  await body.getByRole('link', { name: '保存的是变量，不是快照', exact: true }).click();
  await expect(body).not.toBeVisible();
  await expect(page.getByRole('heading', { name: '保存的是变量，不是快照', exact: true })).toBeFocused();
  expect(new URL(page.url()).searchParams.get('study')).toBe('1');
});

test('初始化注册监听期间发生的收藏更新不会遗漏', async ({ page }) => {
  await page.addInitScript(() => {
    const add = window.addEventListener;
    window.addEventListener = function (type, ...args) {
      if (type === 'storage') {
        // 模拟其他标签在首次读取之后、storage 监听就绪之前写入。
        localStorage.setItem('fe-library-learning-v1', JSON.stringify({ version: 1, entries: {
          'q:5': { bookmarked: true, status: 'review', updatedAt: new Date().toISOString() },
        } }));
        window.addEventListener = add;
      }
      return add.call(this, type, ...args);
    };
  });
  await page.goto('/?view=questions&q=Q5');
  const controls = page.locator('.question-row .learning-controls');
  await expect(controls.getByRole('button', { name: '★ 收藏', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(controls.getByRole('button', { name: '↺ 复习', exact: true })).toHaveAttribute('aria-pressed', 'true');
});

test('恢复页面时补齐遗漏的跨标签页更新，同时保留未保存的本地记录', async ({ page, context }) => {
  await page.addInitScript(() => window.addEventListener('storage', event => event.stopImmediatePropagation()));
  await page.goto('/?view=questions&q=Q6');
  await page.evaluate(() => {
    window.restoreStorageWrite = Storage.prototype.setItem;
    Storage.prototype.setItem = function () { throw new Error('quota'); };
  });
  await page.locator('.question-row').getByRole('button', { name: '☆ 收藏', exact: true }).click();
  await page.evaluate(() => { Storage.prototype.setItem = window.restoreStorageWrite; });
  const other = await context.newPage();
  await other.goto('/?view=questions&q=Q5');
  await other.locator('.question-row').getByRole('button', { name: '☆ 收藏', exact: true }).click();
  await expect(other.locator('.question-row').getByRole('button', { name: '★ 收藏', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true })));
  await page.getByRole('searchbox', { name: '搜索题目', exact: true }).fill('');
  for (const number of [5, 6]) {
    const row = page.locator('.question-row').filter({ has: page.locator('.question-number', { hasText: new RegExp(`^Q${number}$`) }) });
    await expect(row.getByRole('button', { name: '★ 收藏', exact: true })).toHaveAttribute('aria-pressed', 'true');
  }
  await expect(page.getByRole('alert')).toContainText('保存');
});
