import test from 'node:test';
import assert from 'node:assert/strict';
import * as example from '../examples/interview-algorithms.mjs';
import { readFile } from 'node:fs/promises';
test('题解中算法代码与接受测试的示例保持一致', async () => {
  const article = await readFile(new URL('../src/articles/interview-coding.md', import.meta.url), 'utf8');
  for (const fn of Object.values(example)) assert.ok(article.includes(fn.toString()), `文章缺少 ${fn.name} 的测试版本`);
});
test('依赖拓扑排序处理缺省叶节点、重复依赖和循环依赖', () => {
  assert.deepEqual(example.topologicalSort({ app: ['api', 'api'], api: ['core'] }), ['core', 'api', 'app']);
  assert.throws(() => example.topologicalSort({ a: ['b'], b: ['a'] }), /循环/);
});
test('并发池限制峰值、保持输入顺序，并回收同步与异步失败任务的槽位', async () => {
  let running = 0, peak = 0;
  const tasks = Array.from({ length: 8 }, (_, index) => async () => { running++; peak = Math.max(peak, running); await new Promise((resolve) => setTimeout(resolve, 8 - index)); running--; if (index === 3) throw new Error('拒绝'); return index; });
  const results = await example.limitRequests([() => { throw new Error('同步失败'); }, ...tasks], 3);
  assert.ok(peak <= 3); assert.equal(results[0].status, 'rejected'); assert.equal(results[4].status, 'rejected'); assert.equal(results[8].value, 7);
  assert.deepEqual(await example.limitRequests([], 2), []); await assert.rejects(example.limitRequests(tasks, 0), RangeError);
});
test('克隆保留共享引用、循环和符号；检测共享节点不误报循环', () => {
  const shared = { value: 1 }, source = { a: shared, b: shared, [Symbol.for('key')]: shared }; source.self = source;
  const copy = example.clonePlain(source); assert.notEqual(copy, source); assert.equal(copy.self, copy); assert.equal(copy.a, copy.b); assert.equal(copy.a, copy[Symbol.for('key')]);
  assert.equal(example.hasCycle(source), true); assert.equal(example.hasCycle({ a: shared, b: shared }), false); assert.throws(() => example.clonePlain(new Map()), TypeError);
});
test('组合、柯里化、洗牌、once 和原型链边界', () => {
  assert.deepEqual(example.cartesianProduct([[1, 2], ['a']]), [[1, 'a'], [2, 'a']]); assert.deepEqual(example.cartesianProduct([[1], []]), []);
  assert.equal(example.curry((a, b, c) => a + b + c)(1)(2, 3), 6); assert.deepEqual(example.shuffle([1, 2, 3], () => 0), [2, 3, 1]);
  let calls = 0; const fn = example.once(() => ++calls); assert.equal(fn(), 1); assert.equal(fn(), 1);
  assert.equal(example.myInstanceOf([], Array), true); assert.equal(example.myInstanceOf(null, Object), false);
});
test('链式 add 支持题目中的三种调用并拒绝非有限数字', () => {
  assert.equal(example.add(1, 2, 3).valueOf(), 6);
  assert.equal(example.add(1, 2)(3)(4, 5).valueOf(), 15);
  assert.equal(example.add(1)(2)(3)(4, 5, 6)(7).valueOf(), 28);
  assert.equal(String(example.add(2)(3)), '5');
  assert.throws(() => example.add(1, Number.NaN), TypeError);
});
test('防抖保留最后参数和 this，并支持 cancel 与 flush', async () => {
  const calls = [];
  const debounced = example.debounce(function (value) { calls.push([this.name, value]); return value * 2; }, 15);
  const context = { name: 'context', run: debounced };
  context.run(1); context.run(2);
  await new Promise((resolve) => setTimeout(resolve, 30));
  assert.deepEqual(calls, [['context', 2]]);
  context.run(3); assert.equal(debounced.flush(), 6); assert.deepEqual(calls.at(-1), ['context', 3]);
  context.run(4); debounced.cancel(); await new Promise((resolve) => setTimeout(resolve, 25));
  assert.equal(calls.length, 2);
});
test('节流立即执行首个调用，并在窗口结束时执行最后一次调用', async () => {
  const calls = [];
  const throttled = example.throttle((value) => calls.push(value), 20);
  throttled(1); throttled(2); throttled(3);
  assert.deepEqual(calls, [1]);
  await new Promise((resolve) => setTimeout(resolve, 35));
  assert.deepEqual(calls, [1, 3]);
  throttled(4); throttled.cancel(); await new Promise((resolve) => setTimeout(resolve, 25));
  assert.deepEqual(calls, [1, 3]);
});
test('树构建、Unicode 窗口、阶梯计数、链表与三种遍历', () => {
  assert.equal(example.toTree([{ id: 2, parentId: 1 }, { id: 1, parentId: null }])[0].children[0].id, 2);
  assert.throws(() => example.toTree([{ id: 1, parentId: 2 }, { id: 2, parentId: 1 }]), /循环/);
  assert.equal(example.longestUniqueSubstring('🙂a🙂b'), 3); assert.equal(example.canPermutePalindrome('aab'), true); assert.equal(example.climbStairs(5), 8n);
  const tail = { value: 2, next: null }, head = { value: 1, next: tail }; assert.equal(example.reverseList(head), tail); assert.equal(tail.next, head);
  const tree = { value: 2, left: { value: 1 }, right: { value: 3 } }; assert.deepEqual(example.traverseTree(tree), [1, 2, 3]); assert.deepEqual(example.traverseTree(tree, 'pre'), [2, 1, 3]); assert.deepEqual(example.traverseTree(tree, 'post'), [1, 3, 2]);
});
test('回调转 Promise、路径赋值、全排列和链表中点处理边界', async () => {
  assert.equal(await example.fromCallback((resolve) => resolve(42)), 42);
  await assert.rejects(example.fromCallback(() => { throw new Error('失败'); }), /失败/);
  const target = {};
  assert.equal(example.setByPath(target, 'user.items[0].name', 'Ada'), target);
  assert.deepEqual(target, { user: { items: [{ name: 'Ada' }] } });
  assert.throws(() => example.setByPath({}, '__proto__.polluted', true), /危险路径/);
  assert.deepEqual(example.permutations([1, 1, 2]), [[1, 1, 2], [1, 2, 1], [2, 1, 1]]);
  const fourth = { value: 4, next: null }, third = { value: 3, next: fourth }, second = { value: 2, next: third }, first = { value: 1, next: second };
  assert.equal(example.middleNode(first), third); assert.equal(example.middleNode(null), null);
});

test('路径赋值只操作自有数据并保留括号中的完整字段名', async t => {
  await t.test('继承的对象不被修改', () => {
    const prototype = { settings: { theme: 'old' } };
    const target = Object.create(prototype);
    example.setByPath(target, 'settings.theme', 'new');
    assert.equal(prototype.settings.theme, 'old');
    assert.equal(Object.hasOwn(target, 'settings'), true);
    assert.equal(target.settings.theme, 'new');
  });
  await t.test('引号括号里的点不是路径分隔符', () => {
    const target = {};
    example.setByPath(target, 'a["x.y"].name', 'Ada');
    assert.deepEqual(target, { a: { 'x.y': { name: 'Ada' } } });
  });
  await t.test('非法路径拒绝且不产生字段', () => {
    for (const path of ['a..b', 'a[', '.a', 'a.', 'a[]']) {
      const target = {};
      assert.throws(() => example.setByPath(target, path, 1));
      assert.deepEqual(target, {});
    }
  });
});
test('唯一排列按值去重并保持不同类型的身份', () => {
  assert.equal(example.permutations([NaN, NaN, 1]).length, 3);
  assert.equal(example.permutations([1, '1', 1]).length, 3);
  assert.deepEqual(example.permutations([]), [[]]);
  const shared = {};
  assert.equal(example.permutations([shared, shared, {}]).length, 3);
});
test('节流在零时钟首调和取消后都立即执行', t => {
  t.mock.timers.enable({ apis: ['Date', 'setTimeout'], now: 0 });
  const calls = [];
  const throttled = example.throttle(value => calls.push(value), 20);
  throttled('first');
  assert.deepEqual(calls, ['first']);
  throttled('pending');
  t.mock.timers.tick(20);
  assert.deepEqual(calls, ['first', 'pending']);
  throttled.cancel();
  throttled('again');
  assert.deepEqual(calls, ['first', 'pending', 'again']);
});
