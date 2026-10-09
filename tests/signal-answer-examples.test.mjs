import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createSignalSystem } from '../examples/interview-signals.mjs';
test('依赖链接随分支切换清理，重复读取不重复订阅，stop 可重复调用', () => {
  const { signal, effect } = createSignalSystem();
  const enabled = signal(true), a = signal(1), b = signal(10), output = [];
  const stop = effect(() => { output.push(enabled.get() ? a.get() + a.get() : b.get()); });
  a.set(2); enabled.set(false); a.set(3); b.set(11); b.set(11); stop(); stop(); b.set(12);
  assert.deepEqual(output, [2, 4, 10, 11]);
});
test('移除链表中间/两端订阅者不会影响其他订阅者', () => {
  const { signal, effect } = createSignalSystem(); const s = signal(0), values = [[], [], []];
  const stops = values.map(list => effect(() => list.push(s.get())));
  stops[1](); s.set(1); stops[2](); s.set(2); stops[0](); s.set(3);
  assert.deepEqual(values, [[0, 1, 2], [0], [0, 1]]);
});
test('嵌套 effect 恢复父级追踪，上次嵌套订阅显式清理', () => {
  const { signal, effect } = createSignalSystem();
  const innerValue = signal(0), outerValue = signal(0); let outerRuns = 0, innerRuns = 0, stopInner;
  const stopOuter = effect(() => {
    outerRuns++; stopInner?.();
    stopInner = effect(() => { innerRuns++; innerValue.get(); });
    outerValue.get();
  });
  innerValue.set(1); assert.equal(outerRuns, 1); assert.equal(innerRuns, 2);
  outerValue.set(1); assert.equal(outerRuns, 2); assert.equal(innerRuns, 3);
  stopOuter(); stopInner();
});
test('初始化失败不遗留订阅，更新错误传播且其他订阅者仍运行', () => {
  const { signal, effect } = createSignalSystem(); const source = signal(0); let failedRuns = 0;
  assert.throws(() => effect(() => { source.get(); failedRuns++; throw new Error('initial'); }), /initial/);
  source.set(1); assert.equal(failedRuns, 1);
  const output = []; const stopGood = effect(() => output.push(source.get()));
  const stopBad = effect(() => { if (source.get() === 2) throw new Error('update'); });
  assert.throws(() => source.set(2), /update/);
  assert.deepEqual(output, [1, 2]); stopBad(); stopGood();
  assert.throws(() => effect(null), TypeError);
});
test('Object.is 边界和执行中写入不重入', () => {
  const { signal, effect } = createSignalSystem(); const s = signal(NaN); let runs = 0;
  const stop = effect(() => { runs++; s.get(); });
  s.set(NaN); assert.equal(runs, 1); s.set(0); s.set(-0); assert.equal(runs, 3); stop();
  const count = signal(0);
  const stopSelf = effect(() => { const value = count.get(); count.set(value + 1); });
  assert.equal(count.get(), 1); stopSelf();
});
test('响应式题解与实际运行代码一致', async () => {
  const text = await readFile(new URL('../src/articles/interview-vue.md', import.meta.url), 'utf8');
  assert.ok(text.includes(createSignalSystem.toString()));
});
