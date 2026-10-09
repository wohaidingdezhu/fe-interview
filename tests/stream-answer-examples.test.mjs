import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { consumeSSE } from '../examples/interview-streams.mjs';
const encoder = new TextEncoder();
function streamOf(chunks, cancel = () => {}) {
  return new ReadableStream({ start(controller) { for (const chunk of chunks) controller.enqueue(chunk); controller.close(); }, cancel });
}
test('SSE 消费在任意字节分块下保持事件、字符和 ID', async () => {
  const bytes = encoder.encode('\uFEFF: comment\r\nid: 7\r\nevent: delta\r\ndata: 你🙂\r\ndata: world\r\n\r\ndata:\n\nid: bad\0id\n\ndata: last\r\rdata: incomplete');
  const expected = [{ id: '7', event: 'delta', data: '你🙂\nworld' }, { id: '7', event: 'message', data: '' }, { id: '7', event: 'message', data: 'last' }];
  for (let split = 0; split <= bytes.length; split++) {
    const events = [];
    await consumeSSE(streamOf([bytes.slice(0, split), bytes.slice(split)]), event => events.push(event));
    assert.deepEqual(events, expected, `split=${split}`);
  }
  const events = [];
  await consumeSSE(streamOf([...bytes].map(byte => Uint8Array.of(byte))), event => events.push(event));
  assert.deepEqual(events, expected);
});
test('SSE 缺少终止空行不补发，非法上限拒绝', async () => {
  const events = [];
  await consumeSSE(streamOf([encoder.encode('data: pending\n')]), event => events.push(event));
  assert.deepEqual(events, []);
  await assert.rejects(consumeSSE(streamOf([]), () => {}, { maxEventChars: 0 }), RangeError);
});
test('SSE 超限和回调失败会取消流并释放读取锁', async t => {
  for (const [name, chunk, callback, options, message] of [
    ['超限', 'data: too long', () => {}, { maxEventChars: 5 }, /too large/],
    ['回调抛错', 'data: x\n\n', () => { throw new Error('consumer failed'); }, {}, /consumer failed/],
  ]) await t.test(name, async () => {
    let cancelled = false;
    const stream = new ReadableStream({ start(c) { c.enqueue(encoder.encode(chunk)); }, cancel() { cancelled = true; } });
    await assert.rejects(consumeSSE(stream, callback, options), message);
    assert.equal(cancelled, true); assert.equal(stream.locked, false);
  });
});
test('SSE 网络中断保留错误且释放锁', async () => {
  const stream = new ReadableStream({ start(c) { c.error(new Error('disconnected')); } });
  await assert.rejects(consumeSSE(stream, () => {}), /disconnected/);
  assert.equal(stream.locked, false);
});
test('流式题解与实际运行代码一致', async () => {
  const text = await readFile(new URL('../src/articles/interview-ai-fullstack.md', import.meta.url), 'utf8');
  assert.ok(text.includes(consumeSSE.toString()));
});
