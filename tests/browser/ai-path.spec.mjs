import { test, expect } from '@playwright/test';

const pathURL = '/?view=learning&path=ai-basics';
const ids = ['ai-fundamentals', 'rag-basics', 'ai-agent-basics', 'ai-evaluation'];
const session = page => page.evaluate(() => JSON.parse(localStorage.getItem('fe-library-study-session-v1')));

test('AI 路径四步按序学习、刷新恢复和完成返回，无需加载题库目录', async ({ page }, testInfo) => {
  const questionRequests = [];
  await page.route('**/content/questions-*.json', route => {
    questionRequests.push(route.request().url());
    return route.fulfill({ status: 503, body: 'Unavailable' });
  });
  await page.goto('/');
  await page.getByRole('link', { name: '查看 AI 学习路径 →', exact: true }).click();
  await expect(page).toHaveTitle('AI 应用学习路径 · 前端资料库');
  const steps = page.getByRole('list', { name: 'AI 学习步骤' }).getByRole('link');
  await expect(steps).toHaveCount(4);
  expect(await steps.evaluateAll(links => links.map(link => link.getAttribute('href')))).toEqual(ids.map(id => `?article=${id}`));
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  if (testInfo.project.name === 'mobile-webkit') await page.screenshot({ path: testInfo.outputPath('ai-path-mobile.png'), fullPage: true });

  const rag = steps.nth(1);
  await rag.click();
  await page.getByRole('link', { name: '← 返回原列表', exact: true }).click();
  await expect(rag).toBeFocused();
  expect(await session(page)).toBeNull();

  await page.getByRole('button', { name: '按顺序开始学习 →', exact: true }).click();
  expect(await session(page)).toMatchObject({ keys: ids.map(id => `a:${id}`), returnSearch: pathURL.slice(1) });
  const progress = page.getByRole('progressbar', { name: 'AI 路径已读进度' });
  for (const id of ids) {
    await expect(page).toHaveURL(new RegExp(`article=${id}&study=1$`));
    if (id === 'rag-basics') {
      await page.getByRole('link', { name: '暂停', exact: true }).click();
      await expect(progress).toHaveAttribute('value', '1');
      await page.reload();
      await page.getByRole('link', { name: '继续清单 →', exact: true }).click();
      await expect(page).toHaveURL(/article=rag-basics&study=1$/);
    }
    await page.getByRole('button', { name: /标记已读并/ }).click();
  }
  await page.getByRole('button', { name: '结束清单并返回列表', exact: true }).click();
  await expect(page).toHaveURL(new URL(pathURL, page.url()).href);
  await expect(progress).toHaveAttribute('value', '4');
  await expect(page.getByRole('button', { name: '只学未读（0 步）', exact: true })).toBeDisabled();
  expect(await session(page)).toBeNull();
  expect(questionRequests).toEqual([]);
});

test('我的学习可进入 AI 路径，未读和待复习使用已有笔记标记', async ({ page }) => {
  await page.goto('/?view=learning');
  await page.getByRole('link', { name: '查看 AI 学习路径 →', exact: true }).click();
  const steps = page.getByRole('list', { name: 'AI 学习步骤' }).getByRole('listitem');
  await steps.nth(0).getByRole('button', { name: '○ 已读', exact: true }).click();
  await steps.nth(1).getByRole('button', { name: '↻ 复习', exact: true }).click();
  await page.getByRole('button', { name: '只学未读（2 步）', exact: true }).click();
  await expect(page).toHaveURL(/article=ai-agent-basics&study=1$/);
  expect((await session(page)).keys).toEqual(['a:ai-agent-basics', 'a:ai-evaluation']);
  await page.getByRole('link', { name: '暂停', exact: true }).click();
  await page.getByRole('button', { name: '复习待复习（1 步）', exact: true }).click();
  await expect(page).toHaveURL(/article=rag-basics&study=1$/);
  expect((await session(page)).keys).toEqual(['a:rag-basics']);
  await expect(page.getByRole('button', { name: '标记已读并查看结果', exact: true })).toBeEnabled();
});
