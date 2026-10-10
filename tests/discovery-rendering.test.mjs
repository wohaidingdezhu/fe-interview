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
test('首页提供题目、专题、笔记入口，手机目录保留原生 dialog', async () => {
 const server=await createServer({configFile:false,cacheDir:'.reports/vite-discovery-test-cache',optimizeDeps:{noDiscovery:true,include:[]},plugins:[react(),publicationPlugin()],server:{middlewareMode:true,hmr:false},appType:'custom'});
 try{
  const {HomePage}=await server.ssrLoadModule('/src/HomePage.tsx');
  const home=renderToStaticMarkup(createElement(HomePage,{navigate(){},learning}));
  const library=await readLibrary();const total=library.articles.reduce((sum,a)=>sum+inspectQuestions(a).length,0);
  assert.match(home,new RegExp(`<strong>${total}</strong>`));
  for(const path of ['?view=questions','?view=notes&amp;collection=topics','?view=notes&amp;collection=notes','?view=learning'])assert.ok(home.includes(path));
  assert.doesNotMatch(home,/\?view=resources/);
  const {LearningPage}=await server.ssrLoadModule('/src/LearningPage.tsx');
  const shelf=renderToStaticMarkup(createElement(LearningPage,{navigate(){},learning:{...learning,data:{version:1,entries:{'q:1':{bookmarked:true,status:'read',updatedAt:'2026-10-09T10:00:00.000Z'}}}}}));
  assert.match(shelf,/<button disabled="">清理失效记录<\/button>/);
  assert.match(shelf,/正在加载题目目录/);
  const {TableOfContents,visibleDesktopHeadings}=await server.ssrLoadModule('/src/TableOfContents.tsx');
  const articleHeadings=[{id:'overview',title:'概览',level:2},{id:'prepare',title:'准备工作',level:3},{id:'network',title:'网络调试',level:2},{id:'headers',title:'请求头',level:3}];
  assert.deepEqual(visibleDesktopHeadings(articleHeadings,'headers').map(heading=>heading.id),['overview','network','headers']);
  assert.deepEqual(visibleDesktopHeadings(articleHeadings,'').map(heading=>heading.id),['overview','prepare','network']);
  assert.deepEqual(visibleDesktopHeadings([{id:'q1',title:'Q1｜第一题',level:2},{id:'detail',title:'补充',level:3},{id:'q2',title:'Q2｜第二题',level:2}],'q2').map(heading=>heading.id),['q1','q2']);
  const toc=renderToStaticMarkup(createElement(TableOfContents,{headings:[{id:'q1',title:'Q1｜第一题',level:2},{id:'q2',title:'Q2｜第二题',level:2}],articleId:'test',hash:'#q2',navigate(){},onActive(){},learning}));
  assert.match(toc,/<dialog/);assert.match(toc,/aria-haspopup="dialog"/);assert.match(toc,/手机阅读导航/);assert.match(toc,/上一题/);assert.match(toc,/下一题/);assert.match(toc,/\?article=test#q2/);assert.match(toc,/toc-question-number">Q2/);assert.match(toc,/toc-question-title">第二题/);
  const noteToc=renderToStaticMarkup(createElement(TableOfContents,{headings:articleHeadings,articleId:'note',hash:'',navigate(){},onActive(){},learning}));
  assert.match(noteToc,/上一节/);assert.match(noteToc,/下一节/);assert.doesNotMatch(noteToc,/上一题|下一题/);
  const {QuestionList}=await server.ssrLoadModule('/src/QuestionList.tsx');
  const questionList=renderToStaticMarkup(createElement(QuestionList,{params:new URLSearchParams(),navigate(){},learning:{...learning,error:'浏览器无法保存，当前记录仅在本次访问有效，请导出备份。'}}));
  assert.match(questionList,/role="alert">浏览器无法保存/);
 }finally{await server.close();}
});
