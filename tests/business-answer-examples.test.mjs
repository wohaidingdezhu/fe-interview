import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createLatestLoader, forEachIdle } from '../examples/interview-business.mjs';
function deferred() { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; }
test('最新请求独占提交权，即使旧请求忽略取消或随后失败', async () => {
  const first = deferred(), second = deferred(), committed = [], signals = [];
  const loader = createLatestLoader((page, signal) => { signals.push(signal); return page === 1 ? first.promise : second.promise; }, value => committed.push(value));
  const a = loader.run(1), b = loader.run(2);
  assert.equal(signals[0].aborted, true);
  second.resolve({ page: 2 });
  assert.equal((await b).status, 'committed');
  first.resolve({ page: 1 });
  assert.equal((await a).status, 'stale');
  assert.deepEqual(committed, [{ page: 2 }]);
  const pending = deferred();
  const failing = createLatestLoader(() => pending.promise, () => assert.fail('cancelled commit'));
  const old = failing.run(1); failing.cancel(); pending.reject(new Error('late failure'));
  assert.equal((await old).status, 'stale');
});
test('最新请求失败传递，取消后的成功不提交', async () => {
  const loader = createLatestLoader(async () => { throw new Error('latest failed'); }, () => {});
  await assert.rejects(loader.run(1), /latest failed/);
  const pending = deferred(); const commits = [];
  const cancelled = createLatestLoader(() => pending.promise, value => commits.push(value));
  const result = cancelled.run(1); cancelled.cancel(); pending.resolve(1);
  assert.deepEqual(await result, { status: 'stale' }); assert.deepEqual(commits, []);
});
function idleHarness(t) {
  const tasks = new Map(); let next = 1;
  const originalRequest = Object.getOwnPropertyDescriptor(globalThis, 'requestIdleCallback');
  const originalCancel = Object.getOwnPropertyDescriptor(globalThis, 'cancelIdleCallback');
  Object.defineProperty(globalThis, 'requestIdleCallback', { configurable: true, value: callback => { const id = next++; tasks.set(id, callback); return id; } });
  Object.defineProperty(globalThis, 'cancelIdleCallback', { configurable: true, value: id => tasks.delete(id) });
  t.after(() => {
    for (const [key, descriptor] of [['requestIdleCallback', originalRequest], ['cancelIdleCallback', originalCancel]]) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key];
    }
  });
  return { tasks, run(deadline = { didTimeout: false, timeRemaining: () => 10 }) { const [id, fn] = tasks.entries().next().value; tasks.delete(id); fn(deadline); } };
}
test('空闲切片尊重批量/剩余时间并在超时后有限前进', async t => {
  const h = idleHarness(t), values = [];
  const work = forEachIdle(5, index => values.push(index), { batchSize: 2 });
  h.run({ didTimeout: false, timeRemaining: () => 0 }); assert.deepEqual(values, []);
  h.run({ didTimeout: true, timeRemaining: () => 0 }); assert.deepEqual(values, [0]);
  h.run(); assert.deepEqual(values, [0, 1, 2]);
  h.run(); await work; assert.deepEqual(values, [0, 1, 2, 3, 4]); assert.equal(h.tasks.size, 0);
});
test('空闲任务可在执行中取消，异常和空输入都释放调度', async t => {
  const h = idleHarness(t), controller = new AbortController(), values = [];
  const work = forEachIdle(10, index => { values.push(index); controller.abort(); }, { signal: controller.signal });
  const rejected = assert.rejects(work, { name: 'AbortError' }); h.run(); await rejected;
  assert.deepEqual(values, [0]); assert.equal(h.tasks.size, 0);
  const failed = forEachIdle(1, () => { throw new Error('visit failed'); });
  const failure = assert.rejects(failed, /visit failed/); h.run(); await failure;
  assert.equal(h.tasks.size, 0);
  await forEachIdle(0, () => assert.fail('empty')); assert.equal(h.tasks.size, 0);
  await assert.rejects(forEachIdle(2, () => {}, { signal: controller.signal }), { name: 'AbortError' });
  for (const n of [-1, 1.5, Infinity]) assert.throws(() => forEachIdle(n, () => {}), RangeError);
  assert.throws(() => forEachIdle(1, () => {}, { batchSize: 0 }), RangeError);
  assert.throws(() => forEachIdle(1, null), TypeError);
});
test('没有 requestIdleCallback 时使用定时器降级', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const values = []; const work = forEachIdle(3, i => values.push(i), { batchSize: 2 });
  t.mock.timers.runAll(); await work; assert.deepEqual(values, [0, 1, 2]);
});
test('业务题解与实际运行代码一致', async () => {
  const text = await readFile(new URL('../src/articles/interview-business.md', import.meta.url), 'utf8');
  for (const fn of [createLatestLoader, forEachIdle]) assert.ok(text.includes(fn.toString()), fn.name);
});
