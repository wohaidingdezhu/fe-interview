import test from 'node:test';
import assert from 'node:assert/strict';
import { readLibrary } from '../scripts/library.mjs';
import { selectPublished } from '../scripts/publication.mjs';
import { contentAssets } from '../scripts/content-assets.mjs';
import { learningTargets } from '../src/learning-view.ts';
import { reactPathHref, reactPathSteps } from '../src/react-path.ts';
import { createStudySession, parseStudySession, studyQueue } from '../src/study-session.ts';

test('React 路径只引用已公开题目与独立笔记，顺序与暂停地址可持久化', async () => {
  const assets = contentAssets(selectPublished(await readLibrary()));
  const questions = JSON.parse(assets.assets.find(asset => asset.fileName === assets.catalog.questionsPath).source);
  const targets = learningTargets(questions, assets.catalog.articles);
  const keys = reactPathSteps.map(step => step.key);
  assert.equal(new Set(keys).size, keys.length);
  const queue = keys.map(key => {
    const target = targets.find(target => target.key === key);
    assert.ok(target, `${key} 必须是公开内容`);
    return target;
  });
  const session = parseStudySession(JSON.stringify(createStudySession(queue, new URLSearchParams(reactPathHref))));
  assert.equal(session.returnSearch, reactPathHref);
  assert.deepEqual(studyQueue(session, targets).map(target => target.key), keys);
  assert.deepEqual(keys, ['q:206', 'a:react-state', 'a:closure', 'q:204', 'q:226', 'q:227', 'a:use-persist-fn']);
});
