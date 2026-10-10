import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyLearning, parseLearning, importLearning, mergeLearning } from '../src/learning-utils.ts';
const entry = { bookmarked:true, status:'review', updatedAt:'2026-10-09T10:00:00.000Z' };
test('学习记录导出后可导入，保留取消标记和当前位置', () => {
  const value={version:1,entries:{'q:134':entry,'a:closure':{...entry,bookmarked:false,status:'unread'}},lastRead:{articleId:'interview-coding',anchor:'q134',title:'Q134',updatedAt:entry.updatedAt}};
  assert.deepEqual(importLearning(JSON.stringify(value)),value);
});
test('非法备份不会生成记录或可执行目标', () => {
  for(const value of [null,[],{version:2,entries:{}},{version:1,entries:{'__proto__':entry,'bad':entry}}, {version:1,entries:{'q:1':{...entry,status:'bad'}}}, {version:1,entries:{'q:1':{...entry,updatedAt:'bad'}}}, {version:1,entries:{},lastRead:{articleId:'../../evil',anchor:'',title:'',updatedAt:entry.updatedAt}}])assert.throws(()=>parseLearning(value));
  assert.throws(()=>importLearning('{invalid'));
  assert.throws(()=>importLearning(' '.repeat(4_000_001)),/4 MB/);
  assert.equal({}.polluted,undefined);
});
test('备份合并保留各项较新状态，旧备份不复活已取消收藏', () => {
  const old=parseLearning({version:1,entries:{'q:1':entry,'q:2':entry}});
  const current=parseLearning({version:1,entries:{'q:1':{...entry,bookmarked:false,updatedAt:'2026-10-09T11:00:00.000Z'}}});
  const merged=mergeLearning(current,old);
  assert.equal(merged.entries['q:1'].bookmarked,false);assert.equal(merged.entries['q:2'].bookmarked,true);
  assert.deepEqual(mergeLearning(emptyLearning(),old),old);assert.equal(Object.keys(current.entries).length,1);
});
