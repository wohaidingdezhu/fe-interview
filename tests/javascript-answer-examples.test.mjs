import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import * as example from '../examples/interview-javascript.mjs';

test('JavaScript 题解包含通过测试的实现源码', async () => {
  const article = await readFile(new URL('../src/articles/interview-javascript.md', import.meta.url), 'utf8');
  for (const value of Object.values(example)) assert.ok(article.includes(value.toString()), `文章缺少 ${value.name} 的测试版本`);
});
test('递归 setTimeout 倒计时按顺序执行并可取消', () => {
  const tasks = [], cancelled = new Set(), values = [];
  const schedule = (fn) => { const id = tasks.length; tasks.push(fn); return id; };
  const cancel = (id) => cancelled.add(id);
  const stop = example.countdown(2, (value) => values.push(value), schedule, cancel);
  while (tasks.length) tasks.shift()();
  assert.deepEqual(values, [2, 1, 0]);
  const secondTasks = [], secondValues = [];
  const cancelSecond = example.countdown(2, (value) => secondValues.push(value), (fn) => { secondTasks.push(fn); return 1; }, cancel);
  cancelSecond(); secondTasks.shift()(); assert.deepEqual(secondValues, [2]);
  stop();
});
test('闭包计数器与链式调用保持封装和返回自身', () => {
  const first = example.createCounter(1), second = example.createCounter(10);
  assert.equal(first.increment(), 2); assert.equal(first.current(), 2); assert.equal(second.current(), 10);
  const chain = new example.ChainCalculator(2);
  assert.equal(chain.add(3).multiply(4).result(), 20);
});
test('call/apply/bind 传递 this、参数，并保留构造调用语义', () => {
  function sum(a, b) { return this.base + a + b; }
  assert.equal(example.myCall(sum, { base: 1 }, 2, 3), 6);
  assert.equal(example.myApply(sum, { base: 2 }, [3, 4]), 9);
  assert.equal(example.myBind(sum, { base: 3 }, 4)(5), 12);
  function Person(name) { this.name = name; }
  Person.prototype.role = 'person';
  const BoundPerson = example.myBind(Person, { name: 'ignored' }, 'Ada');
  const person = new BoundPerson();
  assert.equal(person.name, 'Ada'); assert.equal(person.role, 'person'); assert.equal(person instanceof Person, true);
  assert.equal(person instanceof BoundPerson, true);
  assert.equal(new Person('Grace') instanceof BoundPerson, true);
  assert.equal({} instanceof BoundPerson, false);
  const ReboundPerson = example.myBind(BoundPerson, null);
  assert.equal(new ReboundPerson() instanceof ReboundPerson, true);
});
