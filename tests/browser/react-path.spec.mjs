import { test, expect } from '@playwright/test';

const pathURL = '/?view=learning&path=react-basics';

test('首页路径入口、混合内容顺序、暂停恢复和完成进度', async ({ page }, testInfo) => {
  await page.goto('/');
  await page.getByRole('link', { name: '查看 React 学习路径 →' }).click();
  await expect(page).toHaveTitle('React 基础学习路径 · 前端资料库');
  const steps = page.getByRole('list', { name: 'React 学习步骤' }).getByRole('listitem');
  await expect(steps).toHaveCount(7);
  await expect(page.getByRole('button', { name: '按顺序开始学习 →' })).toBeEnabled();
  const hrefs = await steps.getByRole('link').evaluateAll(links => links.map(link => link.getAttribute('href')));
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  if (testInfo.project.name === 'mobile-webkit') await page.screenshot({ path: testInfo.outputPath('react-path-mobile.png'), fullPage: true });
  await page.getByRole('button', { name: '按顺序开始学习 →' }).click();
  for (let index = 0; index < hrefs.length; index++) {
    await expect(page.getByRole('button', { name: /标记已读并/ })).toBeEnabled();
    const expected = new URL(hrefs[index], page.url()), current = new URL(page.url());
    expect(current.searchParams.get('article')).toBe(expected.searchParams.get('article'));
    if (expected.hash) expect(current.searchParams.get('question')).toBe(expected.hash.slice(1));
    if (index === 1) {
      const currentURL = page.url();
      await page.getByRole('link', { name: '暂停', exact: true }).click();
      await expect(page).toHaveURL(new URL(pathURL, page.url()).href);
      await expect(page.getByRole('progressbar', { name: 'React 路径已读进度' })).toHaveAttribute('value', '1');
      await page.reload();
      await page.getByRole('link', { name: '继续清单 →' }).click();
      await expect(page).toHaveURL(currentURL);
      await expect(page.getByRole('button', { name: /标记已读并/ })).toBeEnabled();
    }
    await page.getByRole('button', { name: /标记已读并/ }).click();
  }
  await page.getByRole('dialog', { name: '本次清单结果' }).getByRole('button', { name: '结束清单并返回列表' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('React 基础学习路径');
  await expect(page.getByRole('progressbar', { name: 'React 路径已读进度' })).toHaveAttribute('value', '7');
  await expect(page.getByRole('region', { name: '暂停的学习清单' })).toHaveCount(0);
});

test('路径目录请求失败可重试，内容缺失不能静默生成不完整清单', async ({ page }) => {
  const pattern = '**/content/questions-*.json';
  await page.route(pattern, route => route.fulfill({ status: 503, body: 'Unavailable' }));
  await page.goto(pathURL);
  await expect(page.getByRole('button', { name: '按顺序开始学习 →' })).toBeDisabled();
  await page.unroute(pattern);
  await page.route(pattern, async route => {
    const response = await route.fetch();
    const questions = await response.json();
    await route.fulfill({ response, json: questions.filter(question => question.number !== 206) });
  });
  await page.getByRole('button', { name: '重试路径内容' }).click();
  await expect(page.getByRole('alert')).toContainText('部分路径内容暂不可用');
  await expect(page.getByRole('button', { name: '按顺序开始学习 →' })).toBeDisabled();
  await expect(page.getByRole('list', { name: 'React 学习步骤' }).getByRole('link')).toHaveCount(6);
});
