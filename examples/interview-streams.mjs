// 教学用 SSE 文本消费器；调用方负责鉴权、业务事件 schema 和 UI 批量更新。
export async function consumeSSE(stream, onEvent, { maxEventChars = 1_000_000 } = {}) {
  if (!Number.isSafeInteger(maxEventChars) || maxEventChars < 1) throw new RangeError('invalid event limit');
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let line = '', data = [], event = '', id = '', skipLF = false, size = 0;
  function processLine() {
    if (line === '') {
      if (data.length) onEvent({ data: data.join('\n'), event: event || 'message', id });
      data = []; event = ''; size = 0;
    } else if (!line.startsWith(':')) {
      const colon = line.indexOf(':');
      const field = colon < 0 ? line : line.slice(0, colon);
      let value = colon < 0 ? '' : line.slice(colon + 1);
      if (value.startsWith(' ')) value = value.slice(1);
      if (field === 'data') data.push(value);
      else if (field === 'event') event = value;
      else if (field === 'id' && !value.includes('\0')) id = value;
    }
    line = '';
  }
  function consume(text) {
    for (const char of text) {
      if (skipLF) { skipLF = false; if (char === '\n') continue; }
      if (++size > maxEventChars) throw new RangeError('SSE event too large');
      if (char === '\r') { processLine(); skipLF = true; }
      else if (char === '\n') processLine();
      else line += char;
    }
  }
  let ended = false;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) { consume(decoder.decode()); ended = true; break; }
      consume(decoder.decode(value, { stream: true }));
    }
    // SSE 只分发由空行结束的事件；EOF 不补发未完成事件。
  } finally {
    if (!ended) { try { await reader.cancel(); } catch { /* 保留原始失败 */ } }
    reader.releaseLock();
  }
}
