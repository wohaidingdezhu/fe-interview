import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';
import { publicationPlugin } from '../scripts/publication-plugin.mjs';
import { readLibrary } from '../scripts/library.mjs';
import { inspectQuestions } from '../scripts/publication.mjs';
const learning={data:{version:1,entries:{}},update(){},remember(){},restore(){},error:''};
test('首页提供四类独立入口和真实总数，手机目录保留原生 dialog', async () => {
 const server=await createServer({configFile:false,cacheDir:'.reports/vite-discovery-test-cache',optimizeDeps:{noDiscovery:true,include:[]},plugins:[react(),publicationPlugin()],server:{middlewareMode:true,hmr:false},appType:'custom'});
 try{
  const {HomePage}=await server.ssrLoadModule('/src/HomePage.tsx');
  const home=renderToStaticMarkup(createElement(HomePage,{navigate(){},learning}));
  const library=await readLibrary();const total=library.articles.reduce((sum,a)=>sum+inspectQuestions(a).length,0);
  assert.match(home,new RegExp(`<strong>${total}</strong>`));
  for(const path of ['?view=questions','?view=notes&amp;collection=topics','?view=notes&amp;collection=notes','?view=resources','?view=learning'])assert.ok(home.includes(path));
  const {LearningPage}=await server.ssrLoadModule('/src/LearningPage.tsx');
  const shelf=renderToStaticMarkup(createElement(LearningPage,{navigate(){},learning:{...learning,data:{version:1,entries:{'q:1':{bookmarked:true,status:'read',updatedAt:'2026-10-09T10:00:00.000Z'}}}}}));
  assert.match(shelf,/<button disabled="">清理失效记录<\/button>/);
  assert.match(shelf,/正在加载题目目录/);
  const {TableOfContents}=await server.ssrLoadModule('/src/TableOfContents.tsx');
  const toc=renderToStaticMarkup(createElement(TableOfContents,{headings:[{id:'q1',title:'Q1｜第一题',level:2},{id:'q2',title:'Q2｜第二题',level:2}],articleId:'test',hash:'#q2',navigate(){},onActive(){},learning}));
  assert.match(toc,/<dialog/);assert.match(toc,/aria-haspopup="dialog"/);assert.match(toc,/手机阅读导航/);assert.match(toc,/上一题/);assert.match(toc,/下一题/);assert.match(toc,/\?article=test#q2/);
 }finally{await server.close();}
});
