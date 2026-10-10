import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, readFile, rm, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { prerender } from '../scripts/prerender.mjs';
test('静态预渲染保留真实正文与分享元信息，排除草稿且可重复生成', async () => {
  const output=await mkdtemp(join(tmpdir(),'fe-prerender-'));
  try {
    await writeFile(join(output,'index.html'),'<html><head><title>旧标题</title><meta name="description" content="old"><script src="./assets/app.js"></script></head><body><div id="root"></div></body></html>');
    const full={id:'visible',title:'标题 <script>',description:'描述 "内容"',category:'JS',tags:[],addedAt:'2026-10-09',status:'published',quality:'complete',sources:['https://example.com'],technologyVersion:'ES2024',content:'这是完整的公开正文，包含详细概念解释、使用方法、适用场景以及注意事项等知识。'};
    const library={articles:[full,{...full,id:'secret',status:'draft',content:'PRIVATE_SENTINEL'}],resources:[]};
    const run=()=>prerender({output,library,siteURL:'https://example.com/notes/',renderArticle:a=>`<p>${a.content}</p><a href="#q1">定位</a><a href="?article=visible#q1">链接</a>`});
    await run();await run();
    const html=await readFile(join(output,'articles/visible/index.html'),'utf8');
    assert.match(html,/完整的公开正文/);assert.match(html,/<base href="\.\.\/\.\.\/">/);
    assert.match(html,/rel="canonical" href="https:\/\/example.com\/notes\/articles\/visible\/"/);
    assert.match(html,/property="og:description"/);assert.match(html,/标题 &lt;script&gt;/);
    assert.match(html,/href="articles\/visible\/#q1"/);
    assert.doesNotMatch(html,/PRIVATE_SENTINEL/);
    const sitemap=await readFile(join(output,'sitemap.xml'),'utf8');assert.match(sitemap,/articles\/visible/);assert.doesNotMatch(sitemap,/secret/);
    assert.deepEqual(await readdir(join(output,'articles')),['visible']);
    const home=await readFile(join(output,'index.html'),'utf8');assert.equal((home.match(/rel="canonical"/g)||[]).length,1);assert.match(home,/articles\/visible\//);
  } finally { await rm(output,{recursive:true,force:true}); }
});
