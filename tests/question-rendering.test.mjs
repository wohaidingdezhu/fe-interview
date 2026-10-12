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
    const permalink = nodes.find(node => String(attr(node, 'class') || '').includes('question-permalink'));
    assert.equal(attr(permalink, 'aria-label'), '复制 Q134 题目链接');
    assert.equal(permalink.childNodes[0].value, '复制链接');
    assert.equal(nodes.filter(node => attr(node, 'id') === 'q999').length, 0);
    assert.ok(nodes.some(node => attr(node, 'id') === '普通章节'));
    assert.match(html, /class="hljs language-js"/);
    assert.match(html, /hljs-keyword/);
    const image = nodes.find(node => node.tagName === 'img');
    assert.equal(attr(image, 'loading'), 'lazy');
    assert.equal(attr(image, 'decoding'), 'async');
  } finally { await server.close(); }
});

test('单题学习只显示选中题，保留小节、代码和引用定义，专题阅读不受影响', async () => {
  const server = await createServer({configFile:false,cacheDir:'.reports/vite-ssr-test-cache',optimizeDeps:{noDiscovery:true,include:[]},plugins:[react()],server:{middlewareMode:true,hmr:false},appType:'custom'});
  try {
    const {default:ArticleContent}=await server.ssrLoadModule('/src/ArticleContent.tsx');
    const content='## Q1｜第一题\n不要显示的答案\n\n## Q2｜第二题\n保留的答案 [来源][source]\n\n### 示例\n[跳到示例](#示例)\n\n```md\n## Q3｜只是代码\n```\n\n## Q4｜第四题\n其他答案\n\n[source]: https://example.com/source';
    const props={content,articleId:'test',navigate(){},onHeadings(){}};
    const selected=renderToStaticMarkup(createElement(ArticleContent,{...props,question:'q2',studyMode:true}));
    assert.doesNotMatch(selected,/不要显示的答案|其他答案|id="q1"|id="q4"/);
    assert.match(selected,/保留的答案/);assert.match(selected,/https:\/\/example.com\/source/);
    assert.match(selected,/<h1[^>]*>.*Q2｜第二题.*<\/h1>/);assert.doesNotMatch(selected,/<h2[^>]*>.*Q2｜第二题/);
    assert.ok(selected.includes(`question=q2#${encodeURIComponent('示例')}`));assert.match(selected,/只是代码/);
    const all=renderToStaticMarkup(createElement(ArticleContent,props));
    assert.match(all,/不要显示的答案/);assert.match(all,/其他答案/);assert.match(all,/<h2[^>]*>.*Q2｜第二题.*<\/h2>/);
    const missing=renderToStaticMarkup(createElement(ArticleContent,{...props,question:'q999'}));
    assert.match(missing,/未找到这道题/);assert.doesNotMatch(missing,/保留的答案/);
  } finally {await server.close();}
});
