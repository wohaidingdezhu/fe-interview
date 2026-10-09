export function createLatestLoader(load, commit) {
  let sequence = 0, controller;
  return {
    async run(input) {
      const current = ++sequence;
      controller?.abort();
      const ownController = new AbortController();
      controller = ownController;
      try {
        const value = await load(input, ownController.signal);
        if (current !== sequence) return { status: 'stale' };
        commit(value);
        return { status: 'committed', value };
      } catch (error) {
        if (current !== sequence) return { status: 'stale' };
        throw error;
      }
    },
    cancel() { ++sequence; controller?.abort(); },
  };
}

export function forEachIdle(count, visit, { signal, batchSize = 1000 } = {}) {
  if (!Number.isSafeInteger(count) || count < 0) throw new RangeError('invalid count');
  if (!Number.isSafeInteger(batchSize) || batchSize < 1) throw new RangeError('invalid batch size');
  if (typeof visit !== 'function') throw new TypeError('visit must be synchronous function');
  const nativeIdle = typeof globalThis.requestIdleCallback === 'function';
  const schedule = nativeIdle
    ? callback => globalThis.requestIdleCallback(callback, { timeout: 100 })
    : callback => setTimeout(() => {
      const end = performance.now() + 4;
      callback({ didTimeout: true, timeRemaining: () => Math.max(0, end - performance.now()) });
    }, 0);
  const unschedule = nativeIdle ? id => globalThis.cancelIdleCallback(id) : clearTimeout;
  return new Promise((resolve, reject) => {
    let index = 0, handle, settled = false;
    function finish(error) {
      if (settled) return;
      settled = true;
      if (handle !== undefined) unschedule(handle);
      signal?.removeEventListener('abort', abort);
      if (error !== undefined) reject(error); else resolve();
    }
    function abort() { finish(signal.reason ?? new DOMException('Aborted', 'AbortError')); }
    function step(deadline) {
      handle = undefined;
      let processed = 0;
      try {
        while (!settled && index < count && processed < batchSize &&
          (deadline.timeRemaining() > 0 || (deadline.didTimeout && processed === 0))) {
          visit(index++);
          processed++;
        }
        if (!settled) {
          if (index === count) finish(); else handle = schedule(step);
        }
      } catch (error) { finish(error ?? new Error('visit failed')); }
    }
    if (signal?.aborted) { abort(); return; }
    signal?.addEventListener('abort', abort, { once: true });
    try { if (count === 0) finish(); else handle = schedule(step); }
    catch (error) { finish(error ?? new Error('schedule failed')); }
  });
}
