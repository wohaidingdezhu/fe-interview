function serialized(value: string) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

export function createRunnerDocument(code: string, channel: string) {
  const safeCode = serialized(code);
  const safeChannel = serialized(channel);
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    :root { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; color: #243b31; background: #fbfcf8; }
    body { margin: 0; min-height: 100vh; padding: 18px; background-image: linear-gradient(#dfe7df55 1px, transparent 1px), linear-gradient(90deg, #dfe7df55 1px, transparent 1px); background-size: 24px 24px; }
    #app { min-height: 100px; }
  </style>
</head>
<body>
  <div id="app"></div>
  <script>
    const CHANNEL = ${safeChannel};
    const post = (level, values) => parent.postMessage({ source: 'fe-js-playground', channel: CHANNEL, level, values }, '*');
    const format = (value) => {
      if (typeof value === 'string') return value;
      if (typeof value === 'bigint') return value + 'n';
      if (value instanceof Error) return value.stack || value.message;
      try {
        const seen = new WeakSet();
        return JSON.stringify(value, (_key, item) => {
          if (typeof item === 'bigint') return item + 'n';
          if (item && typeof item === 'object') {
            if (seen.has(item)) return '[Circular]';
            seen.add(item);
          }
          return item;
        }, 2);
      } catch { return String(value); }
    };
    for (const level of ['log', 'info', 'warn', 'error']) {
      const original = console[level].bind(console);
      console[level] = (...values) => {
        original(...values);
        post(level, values.map(format));
      };
    }
    window.addEventListener('error', (event) => post('error', [event.error?.stack || event.message]));
    window.addEventListener('unhandledrejection', (event) => post('error', [format(event.reason)]));
    post('system', ['sandbox-ready']);
    try {
      const execute = new Function('return (async () => {\\n' + ${safeCode} + '\\n})()');
      Promise.resolve(execute()).then(() => post('system', ['运行完成'])).catch((error) => console.error(error));
    } catch (error) { console.error(error); }
  <\/script>
</body>
</html>`;
}

export function nextRunner(currentKey: number, code: string, channel: string) {
  if (!Number.isSafeInteger(currentKey) || currentKey < 0) throw new RangeError('运行序号必须是非负安全整数');
  return { key: currentKey + 1, document: createRunnerDocument(code, channel) };
}
