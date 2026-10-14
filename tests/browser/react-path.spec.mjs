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
  await expect(page.getByText('这条路径已全部标记已读。', { exact: false })).toBeVisible();
  await expect(page.getByRole('button', { name: '只学未读（0 步）' })).toBeDisabled();
  await expect(page.getByRole('button', { name: '复习待复习（0 步）' })).toBeDisabled();
});

test('路径目录请求失败可重试，内容缺失不能静默生成不完整清单', async ({ page }) => {
  const pattern = '**/content/questions-*.json';
  await page.route(pattern, route => route.fulfill({ status: 503, body: 'Unavailable' }));
  await page.goto(pathURL);
  await expect(page.getByRole('button', { name: '按顺序开始学习 →' })).toBeDisabled();
  await expect(page.getByRole('button', { name: /^只学未读/ })).toBeDisabled();
  await expect(page.getByRole('button', { name: /^复习待复习/ })).toBeDisabled();
  await expect(page.getByRole('button', { name: '从第 1 步开始学习', exact: true })).toBeDisabled();
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
  await expect(page.getByRole('button', { name: /^只学未读/ })).toBeDisabled();
  await expect(page.getByRole('button', { name: /^复习待复习/ })).toBeDisabled();
  await expect(page.getByRole('button', { name: '从第 4 步开始学习', exact: true })).toBeDisabled();
});

test('路径直接标记刷新可恢复、跨标签同步并更新未读与复习入口', async ({ page, context }, testInfo) => {
  await page.goto(pathURL);
  const steps = page.getByRole('list', { name: 'React 学习步骤' }).getByRole('listitem');
  const first = steps.nth(0), second = steps.nth(1);
  await first.getByRole('button', { name: '☆ 收藏', exact: true }).click();
  await first.getByRole('button', { name: '○ 已读', exact: true }).click();
  await expect(page.getByRole('progressbar', { name: 'React 路径已读进度' })).toHaveAttribute('value', '1');
  await expect(page.getByRole('button', { name: '只学未读（6 步）' })).toBeEnabled();
  await second.getByRole('button', { name: '↻ 复习', exact: true }).click();
  await expect(page.getByRole('button', { name: '复习待复习（1 步）' })).toBeEnabled();
  await expect(page).toHaveURL(new URL(pathURL, page.url()).href);
  expect(await page.evaluate(() => localStorage.getItem('fe-library-study-session-v1'))).toBeNull();
  await page.reload();
  await expect(first.getByRole('button', { name: '★ 收藏', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(first.getByRole('button', { name: '✓ 已读', exact: true })).toHaveAttribute('aria-pressed', 'true');
  const other = await context.newPage();
  await other.goto(pathURL);
  await other.getByRole('list', { name: 'React 学习步骤' }).getByRole('listitem').nth(0).getByRole('button', { name: '↻ 复习', exact: true }).click();
  await expect(first.getByRole('button', { name: '↺ 复习', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(first.getByRole('button', { name: '★ 收藏', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('button', { name: '复习待复习（2 步）' })).toBeEnabled();
  await other.close();
  if (testInfo.project.name === 'mobile-webkit') await first.screenshot({ path: testInfo.outputPath('path-step-controls-mobile.png') });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('从指定步骤开始保留后续顺序，末步只生成一项清单并可完成返回', async ({ page }) => {
  await page.goto(pathURL);
  await page.getByRole('button', { name: '从第 4 步开始学习', exact: true }).click();
  await expect(page.getByRole('button', { name: '标记已读并继续' })).toBeEnabled();
  const session = await page.evaluate(() => JSON.parse(localStorage.getItem('fe-library-study-session-v1')));
  expect(session.keys).toEqual(['q:204', 'q:226', 'q:227', 'a:use-persist-fn']);
  expect(session.returnSearch).toBe(pathURL.slice(1));
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Q204');
  await page.getByRole('button', { name: '标记已读并继续' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Q226');
  await page.getByRole('link', { name: '暂停', exact: true }).click();
  await expect(page).toHaveURL(new URL(pathURL, page.url()).href);
  await page.getByRole('button', { name: '从第 7 步开始学习', exact: true }).click();
  await expect(page.getByRole('button', { name: '标记已读并查看结果' })).toBeEnabled();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('fe-library-study-session-v1')).keys)).toEqual(['a:use-persist-fn']);
  await page.getByRole('button', { name: '标记已读并查看结果' }).click();
  await page.getByRole('button', { name: '结束清单并返回列表' }).click();
  await expect(page.getByRole('progressbar', { name: 'React 路径已读进度' })).toHaveAttribute('value', '2');
  const entries = await page.evaluate(() => JSON.parse(localStorage.getItem('fe-library-learning-v1')).entries);
  expect(entries['q:204'].status).toBe('read');
  expect(entries['a:use-persist-fn'].status).toBe('read');
  expect(entries['q:206']).toBeUndefined();
});

test('路径直接标记保存失败时明确提示且不创建学习清单', async ({ page }) => {
  await page.goto(pathURL);
  await expect(page.getByRole('button', { name: '按顺序开始学习 →' })).toBeEnabled();
  await page.evaluate(() => {
    const setItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === 'fe-library-learning-v1') throw new DOMException('Storage full', 'QuotaExceededError');
      return setItem.call(this, key, value);
    };
  });
  const first = page.getByRole('list', { name: 'React 学习步骤' }).getByRole('listitem').nth(0);
  await first.getByRole('button', { name: '○ 已读', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('当前记录仅在本次访问有效');
  await expect(first.getByRole('button', { name: '✓ 已读', exact: true })).toHaveAttribute('aria-pressed', 'true');
  expect(await page.evaluate(() => localStorage.getItem('fe-library-study-session-v1'))).toBeNull();
  expect(await page.evaluate(() => localStorage.getItem('fe-library-learning-v1'))).toBeNull();
});

test('未读与复习入口只生成对应步骤，保留路径顺序、已有标记和暂停地址', async ({ page }, testInfo) => {
  await page.addInitScript(() => {
    const key = 'fe-library-learning-v1';
    if (localStorage.getItem(key)) return;
    const statuses = { 'q:206': 'read', 'a:react-state': 'review', 'a:closure': 'read', 'q:204': 'unread', 'q:226': 'review', 'q:227': 'unread', 'a:use-persist-fn': 'unread' };
    const entries = Object.fromEntries(Object.entries(statuses).map(([id, status]) => [id, { status, bookmarked: id === 'q:206', updatedAt: '2026-10-14T00:00:00.000Z' }]));
    localStorage.setItem(key, JSON.stringify({ version: 1, entries }));
  });
  await page.goto(pathURL);
  await expect(page.getByRole('button', { name: '只学未读（3 步）' })).toBeEnabled();
  await expect(page.getByRole('button', { name: '复习待复习（2 步）' })).toBeEnabled();
  if (testInfo.project.name === 'mobile-webkit') await page.screenshot({ path: testInfo.outputPath('react-path-actions-mobile.png'), fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByRole('button', { name: '只学未读（3 步）' }).click();
  await expect(page.getByRole('button', { name: '标记已读并继续' })).toBeEnabled();
  const session = await page.evaluate(() => JSON.parse(localStorage.getItem('fe-library-study-session-v1')));
  expect(session.keys).toEqual(['q:204', 'q:227', 'a:use-persist-fn']);
  expect(session.returnSearch).toBe(pathURL.slice(1));
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Q204');
  await page.getByRole('button', { name: '标记已读并继续' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Q227');
  const currentURL = page.url();
  await page.getByRole('link', { name: '暂停', exact: true }).click();
  await expect(page).toHaveURL(new URL(pathURL, page.url()).href);
  await page.reload();
  await page.getByRole('link', { name: '继续清单 →' }).click();
  await expect(page).toHaveURL(currentURL);
  await page.getByText('更多操作', { exact: true }).click();
  await page.getByRole('button', { name: '查看结果 / 结束清单' }).click();
  await page.getByRole('button', { name: '结束清单并返回列表' }).click();
  await page.getByRole('button', { name: '复习待复习（2 步）' }).click();
  await expect(page.getByRole('button', { name: '标记已读并继续' })).toBeEnabled();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('fe-library-study-session-v1')).keys)).toEqual(['a:react-state', 'q:226']);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('React 状态为什么像快照');
  const entries = await page.evaluate(() => JSON.parse(localStorage.getItem('fe-library-learning-v1')).entries);
  expect(entries['q:206']).toMatchObject({ status: 'read', bookmarked: true });
  expect(entries['q:226'].status).toBe('review');
  expect(entries['q:204'].status).toBe('read');
});
