// 双向依赖链接教学版；不实现 computed、批处理、异步跟踪或循环写入调度。
export function createSignalSystem() {
  let active;
  function unlink(link) {
    const { dep, sub, prevDep, nextDep, prevSub, nextSub } = link;
    if (prevDep) prevDep.nextDep = nextDep; else sub.deps = nextDep;
    if (nextDep) nextDep.prevDep = prevDep;
    if (prevSub) prevSub.nextSub = nextSub; else dep.subs = nextSub;
    if (nextSub) nextSub.prevSub = prevSub;
  }
  function clear(sub) { while (sub.deps) unlink(sub.deps); }
  function track(dep) {
    if (!active || active.stopped) return;
    for (let link = active.deps; link; link = link.nextDep) if (link.dep === dep) return;
    const link = { dep, sub: active, prevDep: undefined, nextDep: active.deps,
      prevSub: undefined, nextSub: dep.subs };
    if (active.deps) active.deps.prevDep = link;
    if (dep.subs) dep.subs.prevSub = link;
    active.deps = dep.subs = link;
  }
  function signal(value) {
    const dep = { subs: undefined };
    return {
      get() { track(dep); return value; },
      set(next) {
        if (Object.is(value, next)) return;
        value = next;
        const subscribers = [];
        for (let link = dep.subs; link; link = link.nextSub) subscribers.push(link.sub);
        let firstError, failed = false;
        for (const sub of subscribers) {
          try { sub.run(); } catch (error) { if (!failed) { failed = true; firstError = error; } }
        }
        if (failed) throw firstError;
      },
    };
  }
  function effect(fn) {
    if (typeof fn !== 'function') throw new TypeError('effect requires a function');
    const sub = { deps: undefined, stopped: false, running: false, run() {
      if (sub.stopped || sub.running) return;
      clear(sub);
      const previous = active;
      active = sub; sub.running = true;
      try { fn(); } finally { active = previous; sub.running = false; }
    } };
    const stop = () => { sub.stopped = true; clear(sub); };
    try { sub.run(); } catch (error) { stop(); throw error; }
    return stop;
  }
  return { signal, effect };
}
