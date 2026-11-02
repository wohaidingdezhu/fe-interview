import { test, expect } from '@playwright/test';

const category = 'AI 与 Agent';
const ids = ['ai-fundamentals', 'rag-basics', 'ai-agent-basics', 'ai-evaluation'];

test('首页的纯笔记分类能进入 AI 内容，题目分类仍进入题库', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const menu = page.getByRole('button', { name: '打开导航', exact: true });
  if (await menu.isVisible()) await menu.click();
  const categories = page.getByRole('navigation', { name: '分类导航', exact: true });
  const ai = categories.getByRole('link', { name: category, exact: true });
  await expect(ai).toHaveAttribute('href', /view=notes&category=/);
  await expect(ai.locator('..')).toContainText(`${ids.length} 篇`);
  await expect(categories.getByRole('link', { name: 'JavaScript', exact: true })).toHaveAttribute('href', /view=questions&category=/);
  await ai.click();
  await expect(page.getByRole('heading', { name: '专题与笔记', exact: true })).toBeVisible();
  await expect(page.locator('.resource-card')).toHaveCount(ids.length);
  const links = await page.locator('.resource-card h2 a').evaluateAll(nodes => nodes.map(node => new URL(node.href).searchParams.get('article')));
  expect(links.sort()).toEqual([...ids].sort());
  expect(new URL(page.url()).searchParams.get('category')).toBe(category);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('.resource-card')).toHaveCount(ids.length);
});

test('AI 别名搜索、正文关联阅读与收藏复用现有流程', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const search = page.getByRole('searchbox', { name: '搜索题目和笔记' });
  await search.fill('evals');
  await expect(page.locator('.search-results > a').first()).toHaveAttribute('href', '?article=ai-evaluation');
  await page.locator('.search-results > a').first().click();
  await expect(page.getByRole('heading', { name: 'AI 应用评估：从示例演示到回归验证', exact: true })).toBeVisible();
  await expect(page.locator('.article-body')).toContainText('misleading:true');
  for (const [query, id] of [['ai-agent', 'ai-agent-basics'], ['人工智能入门', 'ai-fundamentals'], ['检索增强生成', 'rag-basics']]) {
    await search.fill(query);
    await expect(page.locator('.search-results > a').first()).toHaveAttribute('href', `?article=${id}`);
  }
  await page.locator('.search-results > a').first().click();
  await expect(page.getByRole('heading', { name: 'RAG：让回答有可核对的依据', exact: true })).toBeVisible();
  await page.locator('.article-body').getByRole('link', { name: 'AI 基础', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'AI 基础：从 Token 到模型输出', exact: true })).toBeVisible();
  await page.getByRole('main').getByRole('button', { name: '☆ 收藏', exact: true }).click();
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('main').getByRole('button', { name: '★ 已收藏', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.goto(`/?view=learning&filter=bookmarked&category=${encodeURIComponent(category)}`, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.resource-card')).toHaveCount(1);
  await expect(page.locator('.resource-card')).toContainText('AI 基础');
});

test('AI 笔记可组成学习清单，完成一篇后刷新保留位置与标记', async ({ page }) => {
  await page.goto(`/?view=learning&filter=unread&kind=notes&category=${encodeURIComponent(category)}&sort=title`, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.resource-card')).toHaveCount(ids.length);
  const ordered = await page.locator('.resource-card h2 a').evaluateAll(nodes => nodes.map(node => new URL(node.href).searchParams.get('article')));
  await page.getByRole('button', { name: '开始学习 →', exact: true }).click();
  await expect(page.getByRole('button', { name: '标记已读并继续', exact: true })).toBeEnabled();
  expect(new URL(page.url()).searchParams.get('article')).toBe(ordered[0]);
  await page.getByRole('button', { name: '标记已读并继续', exact: true }).click();
  await expect(page.getByRole('region', { name: '连续学习', exact: true })).toContainText(`学习清单 2 / ${ids.length}`);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('region', { name: '连续学习', exact: true })).toContainText(`学习清单 2 / ${ids.length}`);
  expect(new URL(page.url()).searchParams.get('article')).toBe(ordered[1]);
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('fe-library-learning-v1')));
  expect(saved.entries[`a:${ordered[0]}`].status).toBe('read');
  await page.getByRole('link', { name: '暂停', exact: true }).click();
  expect(new URL(page.url()).searchParams.get('category')).toBe(category);
  await expect(page.getByRole('region', { name: '暂停的学习清单', exact: true })).toContainText('已读 1');
});
