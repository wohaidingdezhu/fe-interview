import test from 'node:test';
import assert from 'node:assert/strict';
import { readLibrary } from '../scripts/library.mjs';
import { selectPublished } from '../scripts/publication.mjs';
import { contentAssets } from '../scripts/content-assets.mjs';
import { learningTargets } from '../src/learning-view.ts';
import { findLearningPath, learningPaths, learningPathHref } from '../src/learning-paths.ts';
import { createStudySession, parseStudySession, studyQueue } from '../src/study-session.ts';

test('学习路径只引用已公开内容，React 与 AI 的顺序及暂停地址可持久化', async () => {
  const assets = contentAssets(selectPublished(await readLibrary()));
  const questions = JSON.parse(assets.assets.find(asset => asset.fileName === assets.catalog.questionsPath).source);
  const targets = learningTargets(questions, assets.catalog.articles);
  for (const path of learningPaths) {
    const keys = path.steps.map(step => step.key);
    assert.equal(new Set(keys).size, keys.length);
    const queue = keys.map(key => {
      const target = targets.find(target => target.key === key);
      assert.ok(target, `${key} 必须是公开内容`);
      return target;
    });
    const href = learningPathHref(path);
    const session = parseStudySession(JSON.stringify(createStudySession(queue, new URLSearchParams(href))));
    assert.equal(session.returnSearch, href);
    assert.deepEqual(studyQueue(session, targets).map(target => target.key), keys);
  }
  assert.deepEqual(findLearningPath('react-basics').steps.map(step => step.key), ['q:206', 'a:react-state', 'a:closure', 'q:204', 'q:226', 'q:227', 'a:use-persist-fn']);
  assert.deepEqual(findLearningPath('ai-basics').steps.map(step => step.key), ['a:ai-fundamentals', 'a:rag-basics', 'a:ai-agent-basics', 'a:ai-evaluation']);
  assert.equal(findLearningPath('unknown'), undefined);
});
