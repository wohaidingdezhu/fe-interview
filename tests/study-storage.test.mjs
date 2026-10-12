import test from 'node:test';
import assert from 'node:assert/strict';
import { readStudyStorage, saveStudyStorage, loadStudyStorage, studyStorageKey } from '../src/study-storage.ts';
import { createLearningBackup, parseLearningBackup } from '../src/learning-backup.ts';
const session = {version:1,keys:['q:1','q:2'],currentKey:'q:2',returnSearch:'?view=questions&category=CSS'};
const learning = {version:1,entries:{'q:1':{bookmarked:true,status:'read',updatedAt:'2026-10-12T00:00:00.000Z'}}};
function memory(raw = null) { return {getItem:()=>raw,setItem:(_key,value)=>{raw=value;}}; }

test('持久清单在新页面恢复，旧会话迁移，已结束标记不会复活旧清单', () => {
  const storage=memory(), legacy=memory(JSON.stringify(session));
  const migrated=loadStudyStorage(storage,legacy);
  assert.deepEqual(migrated.session,session);
  assert.deepEqual(loadStudyStorage(storage,memory()).session,session);
  saveStudyStorage(storage,undefined);
  assert.equal(loadStudyStorage(storage,legacy).session,undefined);
});

test('其他标签页替换或结束后，旧页面定位不会覆盖最新清单', () => {
  const storage=memory(JSON.stringify(session)), expected=storage.getItem(studyStorageKey);
  saveStudyStorage(storage,{...session,currentKey:'q:1'});
  assert.equal(saveStudyStorage(storage,session,expected).changed,false);
  saveStudyStorage(storage,undefined);
  assert.equal(saveStudyStorage(storage,session,expected).session,undefined);
  assert.equal(readStudyStorage(storage).session,undefined);
});

test('损坏数据保留原文，迁移写入失败仍保留内存清单并提示', () => {
  const broken=memory('{broken');
  assert.ok(loadStudyStorage(broken,memory()).error);
  assert.throws(()=>saveStudyStorage(broken,session,'{broken'));
  assert.equal(broken.getItem(studyStorageKey),'{broken');
  const denied={getItem:()=>null,setItem(){throw new Error('denied');}};
  const result=loadStudyStorage(denied,memory(JSON.stringify(session)));
  assert.deepEqual(result.session,session);assert.ok(result.error);
});

test('完整备份恢复阅读记录与清单顺序，兼容旧备份且先验证全部数据', () => {
  assert.deepEqual(parseLearningBackup(JSON.stringify(createLearningBackup(learning,session))),{learning,study:session});
  assert.equal(parseLearningBackup(JSON.stringify(learning)).study,undefined);
  assert.equal(parseLearningBackup(JSON.stringify(createLearningBackup(learning))).study,null);
  assert.throws(()=>parseLearningBackup(JSON.stringify({...createLearningBackup(learning),study:{...session,keys:['invalid']}})));
  assert.throws(()=>parseLearningBackup(JSON.stringify({...createLearningBackup(learning),version:2})));
  assert.throws(()=>parseLearningBackup('x'.repeat(4_000_001)));
});
