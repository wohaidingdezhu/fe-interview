export function countdown(seconds, onTick, schedule = setTimeout, cancelSchedule = clearTimeout) {
  if (!Number.isInteger(seconds) || seconds < 0) throw new RangeError('seconds 必须是非负整数');
  if (typeof onTick !== 'function') throw new TypeError('onTick 必须是函数');
  let remaining = seconds, timer, cancelled = false;
  function tick() {
    if (cancelled) return;
    onTick(remaining);
    if (remaining === 0) return;
    remaining--;
    timer = schedule(tick, 1000);
  }
  tick();
  return () => { cancelled = true; if (timer !== undefined) cancelSchedule(timer); };
}
export function createCounter(initial = 0) {
  let value = initial;
  return { increment() { return ++value; }, current() { return value; } };
}
export class ChainCalculator {
  constructor(value = 0) { this.value = value; }
  add(value) { this.value += value; return this; }
  multiply(value) { this.value *= value; return this; }
  result() { return this.value; }
}
export function myCall(fn, thisArg, ...args) {
  if (typeof fn !== 'function') throw new TypeError('fn 必须是函数');
  return Reflect.apply(fn, thisArg, args);
}
export function myApply(fn, thisArg, args = []) {
  if (typeof fn !== 'function') throw new TypeError('fn 必须是函数');
  if (args == null || typeof args[Symbol.iterator] !== 'function') throw new TypeError('args 必须可迭代');
  return Reflect.apply(fn, thisArg, [...args]);
}
export function myBind(fn, thisArg, ...preset) {
  if (typeof fn !== 'function') throw new TypeError('fn 必须是函数');
  function bound(...later) {
    if (new.target) return Reflect.construct(fn, [...preset, ...later], new.target === bound ? fn : new.target);
    return Reflect.apply(fn, thisArg, [...preset, ...later]);
  }
  Object.setPrototypeOf(bound, Object.getPrototypeOf(fn));
  Object.defineProperty(bound, Symbol.hasInstance, { value: instance => instance instanceof fn });
  return bound;
}
