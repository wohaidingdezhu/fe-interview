import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';
import { parse } from 'parse5';

test('题目渲染保留旧标题锚点并增加稳定链接，代码里的题号不生成锚点', async () => {
  const server = await createServer({ configFile: false, cacheDir: '.reports/vite-ssr-test-cache', optimizeDeps: { noDiscovery: true, include: [] }, plugins: [react()], server: { middlewareMode: true, hmr: false }, appType: 'custom' });
  try {
    const { default: ArticleContent } = await server.ssrLoadModule('/src/ArticleContent.tsx');
    const content = '## Q134｜链式调用\n\n答案正文。\n\n![流程](./images/flow.png)\n\n```js\nconst answer = 42;\n```\n\n## 普通章节\n\n```md\n## Q999｜代码示例\n```';
    const html = renderToStaticMarkup(createElement(ArticleContent, { content, navigate() {}, onHeadings() {} }));
    const nodes = [];
    function walk(node) { nodes.push(node); for (const child of node.childNodes ?? []) walk(child); }
    walk(parse(html));
    const attr = (node, name) => node.attrs?.find(value => value.name === name)?.value;
    const heading = nodes.find(node => node.tagName === 'h2');
    assert.ok(attr(heading, 'id').startsWith('q134'));
    assert.notEqual(attr(heading, 'id'), 'q134');
    assert.equal(nodes.filter(node => attr(node, 'id') === 'q134').length, 1);
    assert.equal(nodes.filter(node => attr(node, 'href') === '#q134').length, 1);
    assert.equal(nodes.filter(node => attr(node, 'id') === 'q999').length, 0);
    assert.ok(nodes.some(node => attr(node, 'id') === '普通章节'));
    assert.match(html, /class="hljs language-js"/);
    assert.match(html, /hljs-keyword/);
    const image = nodes.find(node => node.tagName === 'img');
    assert.equal(attr(image, 'loading'), 'lazy');
    assert.equal(attr(image, 'decoding'), 'async');
  } finally { await server.close(); }
});
