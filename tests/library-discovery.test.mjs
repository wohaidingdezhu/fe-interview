import test from 'node:test';
import assert from 'node:assert/strict';
import { libraryCounts, questionPage, articleHref, articleIdFromLocation, publicView } from '../src/library-utils.ts';
import { contentAssets } from '../scripts/content-assets.mjs';
import { selectPublished } from '../scripts/publication.mjs';
import { learningTargets } from '../src/learning-view.ts';
import { createStudySession, studyQueue } from '../src/study-session.ts';
const questions = Array.from({ length: 30 }, (_, i) => ({ number: i + 1, title: `题目${i + 1}`, articleId: 'topic', category: i % 2 ? 'React' : 'JS', tags: i % 2 ? ['Hooks'] : ['基础'], status: 'published' }));
test('首页独立统计题目、专题、笔记和资料，不重复计数', () => {
  assert.deepEqual(libraryCounts([{ questionCount: 20, publishedQuestionCount: 15 }, { questionCount: 10, publishedQuestionCount: 10 }, { questionCount: 0 }], [1,2]), { questions:25, topics:2, notes:1, resources:2 });
});
test('题目筛选、精确 Q 编号、分页和全文命中保持正确', () => {
  const base = { query:'', category:'', tag:'', page:1, size:12 };
  assert.equal(questionPage(questions,base).pages,3);
  assert.equal(questionPage(questions,{...base,page:999}).items[0].number,25);
  assert.equal(questionPage(questions,{...base,page:-1}).page,1);
  assert.deepEqual(questionPage(questions,{...base,query:'Q1'}).items.map(q=>q.number),[1]);
  assert.equal(questionPage(questions,{...base,category:'React',tag:'基础'}).total,0);
  assert.deepEqual(questionPage(questions,{...base,ids:new Set([2,10])}).items.map(q=>q.number),[2,10]);
  assert.deepEqual(questionPage(questions,{...base,query:'闭包',documents:[{id:'topic',text:'闭包',questionNumber:8}]}).items.map(q=>q.number),[8]);
  assert.equal(questions[0].number,1);
});
test('静态文章路径和旧查询链接都可恢复，view 可以返回首页', () => {
  assert.equal(articleIdFromLocation('/fe-interview/articles/interview-react/',''),'interview-react');
  assert.equal(articleIdFromLocation('/articles/test/index.html',''),'test');
  assert.equal(articleIdFromLocation('/articles/test/','?view=home'),undefined);
  assert.equal(articleIdFromLocation('/','?article=welcome'),'welcome');
  assert.equal(articleHref('test','中文 标题'),'?article=test#%E4%B8%AD%E6%96%87%20%E6%A0%87%E9%A2%98');
  assert.equal(publicView('notes'),'notes');
  assert.equal(publicView('resources'),'home');
  assert.equal(publicView('unknown'),'home');
});
test('题库跨页清单与当前页严格共享全文、分类、标签和阅读筛选，保持题号顺序', () => {
  const options = { query: '答案关键词', category: 'React', tag: 'Hooks', ids: new Set([2, 4, 6, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30]), page: 2, size: 12,
    documents: questions.map(q => ({ id: 'topic', text: '答案关键词', questionNumber: q.number })) };
  const page = questionPage([...questions].reverse(), options);
  assert.equal(page.total, 14);
  assert.deepEqual(page.items.map(q => q.number), [28, 30]);
  assert.deepEqual(page.queue.map(q => q.number), [...options.ids]);
  const targets = learningTargets(page.queue, []), params = new URLSearchParams('view=questions&page=2&studyRange=page');
  assert.deepEqual(createStudySession(targets, params).keys, [...options.ids].map(id => `q:${id}`));
  const scoped = createStudySession(learningTargets(page.items, []), params);
  assert.deepEqual(scoped.keys, ['q:28', 'q:30']);
  assert.deepEqual(studyQueue(scoped, targets).map(target => target.href), ['?article=topic#q28', '?article=topic#q30']);
  assert.deepEqual(questionPage(questions, { ...options, query: '不存在' }).queue, []);
});
test('轻量题目目录不含正文，生产目录只包含可发布题目', () => {
  const article={id:'topic',title:'专题',category:'JS',tags:['基础'],description:'专题描述',status:'draft',quality:'incomplete',content:'## Q1｜公开题\n这是完整的参考答案，解释了相关的适用条件、实现思路以及需要注意的边界情况。\n\n## Q2｜私有题\nDRAFT_SECRET'};
  const publication={Q1:{status:'published',quality:'complete',sources:['https://example.com'],technologyVersion:'v1',reviewedAt:'2026-10-09'}};
  const {catalog,assets}=contentAssets(selectPublished({articles:[article],resources:[],questionPublication:publication}));
  const source=assets.find(a=>a.fileName===catalog.questionsPath).source;
  assert.doesNotMatch(source,/DRAFT_SECRET|私有题|完整的参考答案/);
  assert.deepEqual(JSON.parse(source).map(q=>q.number),[1]);
});
