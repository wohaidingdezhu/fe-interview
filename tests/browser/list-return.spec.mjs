import { test, expect } from '@playwright/test';

test('界面使用系统字体，渲染和正文阅读不请求外部字体服务', async ({ page }) => {
  const requests = [];
  page.on('request', request => { if (/fonts\.(googleapis|gstatic)\.com/.test(request.url())) requests.push(request.url()); });
  await page.goto('/?view=notes', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { level: 1, name: '专题与笔记' })).toBeVisible();
  await page.locator('.resource-card h2 a').first().click();
  await expect(page.locator('.article-body')).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  expect(requests).toEqual([]);
});

test('各列表打开正文后可恢复筛选、排序和分页，刷新与浏览器历史均保留入口', async ({ page }, testInfo) => {
  const sources = ['/?view=questions&category=HTML+%2B+CSS&size=12&page=2', '/?view=notes&collection=notes&q=React&sort=title&size=12', '/?view=resources&category=工程实践&sort=title', '/?view=learning&filter=unread&kind=questions&sort=title&page=2&size=12'];
  for (const source of sources) {
    await page.goto(source, { waitUntil: 'domcontentloaded' });
    const expected = new URL(page.url()).search;
    const first = page.locator('.question-list h2 a, .resource-list h2 a').first();
    await expect(first).toBeVisible();
    const targetHref = await first.getAttribute('href');
    await first.click();
    const back = page.getByRole('link', { name: '← 返回原列表', exact: true });
    await expect(back).toHaveAttribute('href', expected);
    const reader = page.url();
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(back).toHaveAttribute('href', expected);
    if (source.includes('resources') && testInfo.project.name === 'mobile-webkit') await page.screenshot({ path: testInfo.outputPath('list-return-mobile.png') });
    await back.click();
    expect(new URL(page.url()).search).toBe(expected);
    await expect(page.locator('.question-list h2 a, .resource-list h2 a').first()).toHaveAttribute('href', targetHref);
    await page.goBack({ waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(reader);
    await expect(back).toHaveAttribute('href', expected);
    await back.click();
  }
});

test('正文锚点和继续阅读保留原列表，独立分享与直接访问不带筛选记录', async ({ page, context }) => {
  await page.goto('/?view=notes&q=闭包&sort=title', { waitUntil: 'domcontentloaded' });
  const expected = new URL(page.url()).search;
  await page.locator('.resource-card h2 a').first().click();
  const back = page.getByRole('link', { name: '← 返回原列表', exact: true });
  await expect(back).toHaveAttribute('href', expected);
  const next = page.getByRole('navigation', { name: '上一篇和下一篇' }).getByRole('link').first();
  await next.click();
  await expect(back).toHaveAttribute('href', expected);
  await expect(page.locator('.article-body h2').first()).toBeVisible();
  if (await page.getByRole('button', { name: /^☰ 目录/ }).isVisible()) {
    await page.getByRole('button', { name: /^☰ 目录/ }).click();
    await page.getByRole('dialog', { name: /^本页目录/ }).getByRole('link').first().click();
  } else await page.getByRole('complementary', { name: '本篇目录' }).getByRole('link').first().click();
  await expect(back).toHaveAttribute('href', expected);
  const independent = page.getByRole('link', { name: '独立文章链接 →' });
  const href = await independent.getAttribute('href');
  expect(href).not.toContain('view=');
  const direct = await context.newPage();
  await direct.goto(new URL(href, new URL('/', page.url())).href, { waitUntil: 'domcontentloaded' });
  await expect(direct.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(direct.getByRole('link', { name: '← 返回原列表', exact: true })).toHaveCount(0);
  await direct.close();
});

test('React 路径阅读可回到路径，学习模式沿用清单暂停入口', async ({ page }) => {
  await page.goto('/?view=learning&path=react-basics', { waitUntil: 'domcontentloaded' });
  await page.locator('.learning-path-steps > li').first().getByRole('link').first().click();
  const back = page.getByRole('link', { name: '← 返回原列表', exact: true });
  await expect(back).toHaveAttribute('href', '?view=learning&path=react-basics');
  await back.click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('React 基础学习路径');
  await page.goto('/?view=questions&q=Q5', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: '开始学习 →', exact: true }).click();
  await expect(page.getByRole('region', { name: '连续学习' })).toBeVisible();
  await expect(back).toHaveCount(0);
  await page.getByRole('link', { name: '暂停', exact: true }).click();
  expect(new URL(page.url()).search).toBe('?view=questions&q=Q5');
});
