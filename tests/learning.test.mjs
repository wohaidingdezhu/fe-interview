import test from 'node:test';
import assert from 'node:assert/strict';
import { clearLearning, emptyLearning, parseLearning, importLearning, learningTimestamp, mergeLearning, persistLearning, pruneLearning, updateLearningBatch, undoLearningBatch } from '../src/learning-utils.ts';
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
test('清理只移除已不存在的题目、文章和继续阅读位置', () => {
  const data=parseLearning({version:1,entries:{'q:1':entry,'q:999':entry,'a:closure':entry},lastRead:{articleId:'removed',anchor:'q1',title:'旧文章',updatedAt:entry.updatedAt}});
  const clean=pruneLearning(data,new Set(['q:1','a:closure']),new Set(['closure']));
  assert.deepEqual(Object.keys(clean.entries).sort(),['a:closure','q:1']);assert.equal(clean.lastRead,undefined);
  assert.equal(Object.keys(data.entries).length,3);
  assert.deepEqual(mergeLearning(clean,data),clean);
  assert.deepEqual(mergeLearning(data,clean),clean);
  assert.deepEqual(importLearning(JSON.stringify(clean)),clean);
});
test('清空后跨标签页与旧备份不能复活记录，仍可创建新记录', () => {
  const old=parseLearning({version:1,entries:{'q:1':entry},lastRead:{articleId:'closure',anchor:'',title:'闭包',updatedAt:entry.updatedAt}});
  const cleared=clearLearning(old);
  assert.deepEqual(mergeLearning(old,cleared),cleared);
  assert.deepEqual(mergeLearning(cleared,old),cleared);
  const newer={...cleared,entries:{'q:1':{...entry,updatedAt:learningTimestamp(cleared)}}};
  assert.equal(mergeLearning(cleared,newer).entries['q:1'].bookmarked,true);
  const unknownOld={version:1,entries:{'q:2':entry}};
  assert.deepEqual(mergeLearning(cleared,unknownOld),cleared);
  assert.deepEqual(importLearning(JSON.stringify(cleared)),cleared);
});
test('损坏或未知版本的本地数据不会被自动阅读写入覆盖，显式恢复可替换', () => {
  for(const original of ['{invalid',JSON.stringify({version:2,entries:{}})]){
    let value=original;
    const storage={getItem(){return value;},setItem(_key,next){value=next;}};
    const change=()=>({version:1,entries:{'q:1':entry}});
    const result=persistLearning(storage,'test',emptyLearning(),change);
    assert.equal(value,original);assert.match(result.error,/原数据已保留/);
    assert.equal(result.data.entries['q:1'].bookmarked,true);
    const restored=persistLearning(storage,'test',result.data,change,true);
    assert.equal(restored.error,'');assert.deepEqual(importLearning(value),restored.data);
  }
});
test('浏览器拒绝读取或写入时保留会话记录并提示导出', () => {
  const change=()=>({version:1,entries:{'q:1':entry}});
  const readFailure=persistLearning({getItem(){throw new Error('denied');},setItem(){assert.fail('不应覆盖');}},'test',emptyLearning(),change);
  assert.match(readFailure.error,/原数据已保留/);assert.equal(readFailure.data.entries['q:1'].bookmarked,true);
  const writeFailure=persistLearning({getItem(){return null;},setItem(){throw new Error('quota');}},'test',emptyLearning(),change);
  assert.match(writeFailure.error,/请导出备份/);assert.equal(writeFailure.data.entries['q:1'].bookmarked,true);
});
test('删除标记校验与操作时间保持严格递增', () => {
  for(const value of [{resetAt:'bad'},{removed:{bad:entry.updatedAt}},{removed:{'q:1':'bad'}},{removed:[]}])assert.throws(()=>parseLearning({version:1,entries:{},...value}));
  const data={version:1,entries:{'q:1':{...entry,updatedAt:'2099-01-01T00:00:00.000Z'}}};
  const cleared=clearLearning(data);assert.ok(cleared.resetAt>data.entries['q:1'].updatedAt);
  assert.ok(learningTimestamp(cleared)>cleared.resetAt);
});

test('批量标记只修改不同状态，保留收藏、位置与输入数据', () => {
  const data = { version: 1, entries: { 'q:1': entry }, lastRead: { articleId: 'react', anchor: 'q1', title: 'Q1', updatedAt: entry.updatedAt } };
  const original = JSON.stringify(data);
  const result = updateLearningBatch(data, ['q:1', 'q:2', 'q:1'], 'review');
  assert.equal(result.count, 1);
  assert.deepEqual(result.undo.previous, { 'q:2': undefined });
  assert.deepEqual(result.data.entries['q:1'], entry);
  assert.equal(result.data.entries['q:2'].bookmarked, false);
  assert.equal(result.data.entries['q:2'].status, 'review');
  assert.deepEqual(result.data.lastRead, data.lastRead);
  assert.equal(JSON.stringify(data), original);
  const noChange = updateLearningBatch(result.data, ['q:1', 'q:2'], 'review');
  assert.equal(noChange.count, 0);
  assert.strictEqual(noChange.data, result.data);
  assert.equal(updateLearningBatch(emptyLearning(), ['q:3'], 'unread').count, 0);
  const read = updateLearningBatch(data, ['q:1'], 'read');
  assert.equal(read.data.entries['q:1'].bookmarked, true);
  for (const keys of [['__proto__'], ['invalid'], Array.from({ length: 49 }, (_, i) => `q:${i + 1}`)]) assert.throws(() => updateLearningBatch(data, keys, 'read'));
  assert.throws(() => updateLearningBatch(data, ['q:1'], 'invalid'));
});

test('撤销恢复原状态且旧批量备份不能复活取消的记录', () => {
  const data = { version: 1, entries: { 'q:1': entry } };
  const batch = updateLearningBatch(data, ['q:1', 'q:2'], 'read');
  const restored = undoLearningBatch(batch.data, batch.undo);
  assert.equal(restored.count, 2);
  assert.equal(restored.data.entries['q:1'].status, 'review');
  assert.equal(restored.data.entries['q:1'].bookmarked, true);
  assert.ok(restored.data.entries['q:1'].updatedAt > batch.undo.appliedAt);
  assert.equal(restored.data.entries['q:2'], undefined);
  assert.ok(restored.data.removed['q:2'] > batch.undo.appliedAt);
  for (const merged of [mergeLearning(batch.data, restored.data), mergeLearning(restored.data, batch.data)]) assert.deepEqual(merged, restored.data);
  assert.deepEqual(importLearning(JSON.stringify(restored.data)), restored.data);
  assert.equal(undoLearningBatch(restored.data, batch.undo).count, 0);
  assert.equal(undoLearningBatch(clearLearning(batch.data), batch.undo).count, 0);
});

test('撤销不覆盖后续单项编辑或其他标签页较新的记录', () => {
  const batch = updateLearningBatch(emptyLearning(), ['q:1', 'q:2'], 'read');
  const remote = { version: 1, entries: { 'q:1': { bookmarked: true, status: 'review', updatedAt: learningTimestamp(batch.data) } } };
  const merged = mergeLearning(batch.data, remote);
  const result = undoLearningBatch(merged, batch.undo);
  assert.equal(result.count, 1);
  assert.deepEqual(result.data.entries['q:1'], remote.entries['q:1']);
  assert.equal(result.data.entries['q:2'], undefined);
});

test('批量保存前合并其他标签页，保存失败时仍可撤销会话记录', () => {
  const remote = { version: 1, entries: { 'q:1': entry } };
  let batch;
  const storage = { getItem: () => JSON.stringify(remote), setItem: () => { throw new Error('quota'); } };
  const saved = persistLearning(storage, 'learning', emptyLearning(), base => { batch = updateLearningBatch(base, ['q:1', 'q:2'], 'read'); return batch.data; });
  assert.ok(saved.error);
  assert.equal(saved.data.entries['q:1'].bookmarked, true);
  assert.deepEqual(batch.undo.previous['q:1'], entry);
  const restored = persistLearning(storage, 'learning', saved.data, base => undoLearningBatch(base, batch.undo).data);
  assert.ok(restored.error);
  assert.equal(restored.data.entries['q:1'].status, 'review');
  assert.equal(restored.data.entries['q:2'], undefined);
});
