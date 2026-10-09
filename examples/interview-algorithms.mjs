export function topologicalSort(dependencies) {
  const nodes = [...new Set([...Object.keys(dependencies), ...Object.values(dependencies).flat()])];
  const degree = new Map(nodes.map((node) => [node, 0]));
  const next = new Map(nodes.map((node) => [node, []]));
  for (const [node, deps] of Object.entries(dependencies)) for (const dep of new Set(deps)) {
    degree.set(node, degree.get(node) + 1); next.get(dep).push(node);
  }
  const queue = nodes.filter((node) => degree.get(node) === 0), result = [];
  for (let head = 0; head < queue.length; head++) {
    const node = queue[head]; result.push(node);
    for (const child of next.get(node)) { degree.set(child, degree.get(child) - 1); if (degree.get(child) === 0) queue.push(child); }
  }
  if (result.length !== nodes.length) throw new Error('存在循环依赖');
  return result;
}
export function cartesianProduct(groups) {
  return groups.reduce((result, group) => result.flatMap((prefix) => group.map((value) => [...prefix, value])), [[]]);
}
export async function limitRequests(tasks, concurrency) {
  if (!Number.isInteger(concurrency) || concurrency < 1) throw new RangeError('并发数必须是正整数');
  const results = new Array(tasks.length); let next = 0;
  async function worker() {
    while (next < tasks.length) {
      const index = next++;
      try { results[index] = { status: 'fulfilled', value: await tasks[index]() }; }
      catch (reason) { results[index] = { status: 'rejected', reason }; }
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, tasks.length) }, worker));
  return results;
}
export function shuffle(values, random = Math.random) {
  for (let i = values.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [values[i], values[j]] = [values[j], values[i]]; }
  return values;
}
export function clonePlain(value, seen = new WeakMap()) {
  if (value === null || typeof value !== 'object') return value;
  if (seen.has(value)) return seen.get(value);
  if (!Array.isArray(value) && Object.getPrototypeOf(value) !== Object.prototype && Object.getPrototypeOf(value) !== null) throw new TypeError('示例仅支持普通对象和数组');
  const copy = Array.isArray(value) ? [] : Object.create(Object.getPrototypeOf(value)); seen.set(value, copy);
  for (const key of Reflect.ownKeys(value)) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if ('value' in descriptor) descriptor.value = clonePlain(descriptor.value, seen);
    Object.defineProperty(copy, key, descriptor);
  }
  return copy;
}
export function hasCycle(value, visiting = new WeakSet(), finished = new WeakSet()) {
  if (!value || typeof value !== 'object') return false;
  if (visiting.has(value)) return true;
  if (finished.has(value)) return false;
  visiting.add(value);
  for (const key of Reflect.ownKeys(value)) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if ('value' in descriptor && hasCycle(descriptor.value, visiting, finished)) return true;
  }
  visiting.delete(value); finished.add(value); return false;
}
export function curry(fn, arity = fn.length) {
  function collect(previous) { return function (...args) { const all = [...previous, ...args]; return all.length >= arity ? fn.apply(this, all) : collect(all); }; }
  return collect([]);
}
export function add(...initialValues) {
  const sum = (values) => values.reduce((total, value) => {
    if (typeof value !== 'number' || !Number.isFinite(value)) throw new TypeError('add 只接受有限数字');
    return total + value;
  }, 0);
  let total = sum(initialValues);
  function collect(...values) { total += sum(values); return collect; }
  Object.defineProperties(collect, {
    valueOf: { value: () => total },
    toString: { value: () => String(total) },
    [Symbol.toPrimitive]: { value: () => total },
  });
  return collect;
}
export function debounce(fn, wait) {
  if (typeof fn !== 'function') throw new TypeError('fn 必须是函数');
  if (!Number.isFinite(wait) || wait < 0) throw new RangeError('wait 必须是非负有限数字');
  let timer, context, args, result;
  function invoke() {
    const currentContext = context, currentArgs = args;
    timer = context = args = undefined;
    result = fn.apply(currentContext, currentArgs);
    return result;
  }
  function debounced(...nextArgs) {
    context = this; args = nextArgs;
    if (timer !== undefined) clearTimeout(timer);
    timer = setTimeout(invoke, wait);
    return result;
  }
  debounced.cancel = () => { if (timer !== undefined) clearTimeout(timer); timer = context = args = undefined; };
  debounced.flush = () => { if (timer === undefined) return result; clearTimeout(timer); return invoke(); };
  return debounced;
}
export function throttle(fn, wait) {
  if (typeof fn !== 'function') throw new TypeError('fn 必须是函数');
  if (!Number.isFinite(wait) || wait < 0) throw new RangeError('wait 必须是非负有限数字');
  let last = 0, timer, context, args, result;
  function invoke(time) {
    last = time;
    const currentContext = context, currentArgs = args;
    timer = context = args = undefined;
    result = fn.apply(currentContext, currentArgs);
    return result;
  }
  function throttled(...nextArgs) {
    const now = Date.now(), remaining = wait - (now - last);
    context = this; args = nextArgs;
    if (remaining <= 0 || remaining > wait) {
      if (timer !== undefined) clearTimeout(timer);
      return invoke(now);
    }
    if (timer === undefined) timer = setTimeout(() => invoke(Date.now()), remaining);
    return result;
  }
  throttled.cancel = () => { if (timer !== undefined) clearTimeout(timer); last = 0; timer = context = args = undefined; };
  return throttled;
}
export function once(fn) {
  let called = false, value;
  return function (...args) {
    if (!called) { called = true; try { value = fn.apply(this, args); } catch (error) { called = false; throw error; } }
    return value;
  };
}
export function myInstanceOf(value, Constructor) {
  if (typeof Constructor !== 'function' || !Constructor.prototype || typeof Constructor.prototype !== 'object') throw new TypeError('右侧需要具有对象原型的构造函数');
  if (value === null || !['object', 'function'].includes(typeof value)) return false;
  let prototype = Object.getPrototypeOf(value);
  while (prototype !== null) { if (prototype === Constructor.prototype) return true; prototype = Object.getPrototypeOf(prototype); }
  return false;
}
export function toTree(items) {
  const map = new Map();
  for (const item of items) { if (map.has(item.id)) throw new Error('重复节点'); map.set(item.id, { ...item, children: [] }); }
  const roots = [];
  for (const item of items) {
    const node = map.get(item.id);
    if (item.parentId == null) roots.push(node);
    else { const parent = map.get(item.parentId); if (!parent) throw new Error('父节点不存在'); parent.children.push(node); }
  }
  const visited = new Set();
  const stack = [...roots];
  while (stack.length) { const node = stack.pop(); if (visited.has(node.id)) throw new Error('存在环'); visited.add(node.id); stack.push(...node.children); }
  if (visited.size !== items.length) throw new Error('存在循环父子关系');
  return roots;
}
export function climbStairs(n) {
  if (!Number.isInteger(n) || n < 0) throw new RangeError('n 必须是非负整数');
  let previous = 1n, current = 1n;
  for (let i = 2; i <= n; i++) [previous, current] = [current, previous + current];
  return current;
}
export function longestUniqueSubstring(text) {
  const values = Array.from(text), last = new Map(); let left = 0, maximum = 0;
  for (let right = 0; right < values.length; right++) { left = Math.max(left, (last.get(values[right]) ?? -1) + 1); last.set(values[right], right); maximum = Math.max(maximum, right - left + 1); }
  return maximum;
}
export function canPermutePalindrome(text) {
  const odd = new Set();
  for (const value of text) { if (odd.has(value)) odd.delete(value); else odd.add(value); }
  return odd.size <= 1;
}
export function reverseList(head) {
  let previous = null;
  while (head) { const next = head.next; head.next = previous; previous = head; head = next; }
  return previous;
}
export function traverseTree(root, order = 'in') {
  if (!['pre', 'in', 'post'].includes(order)) throw new Error('未知遍历顺序');
  const values = [], stack = root ? [[root, false]] : [];
  while (stack.length) {
    const [node, visited] = stack.pop();
    if (visited) { values.push(node.value); continue; }
    const work = order === 'pre' ? [[node, true], [node.left, false], [node.right, false]] : order === 'in' ? [[node.left, false], [node, true], [node.right, false]] : [[node.left, false], [node.right, false], [node, true]];
    for (const pair of work.reverse()) if (pair[0]) stack.push(pair);
  }
  return values;
}
