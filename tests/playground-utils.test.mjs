import test from 'node:test';
import assert from 'node:assert/strict';
import { createRunnerDocument, nextRunner } from '../src/playground-utils.ts';

test('运行文档绑定消息通道并转义用户代码中的 script 结束标签', () => {
  const code = 'console.log("ok"); </script><script>window.parent.hacked = true</script>';
  const document = createRunnerDocument(code, 'channel-123');
  assert.match(document, /channel-123/);
  assert.match(document, /sandbox-ready/);
  assert.doesNotMatch(document, /<script>window\.parent\.hacked/);
  assert.match(document, /\\u003c\/script/);
});

test('运行文档代理 console、同步错误和未处理的 Promise 错误', () => {
  const document = createRunnerDocument('throw new Error("boom")', 'errors');
  assert.match(document, /console\[level\]/);
  assert.match(document, /unhandledrejection/);
  assert.match(document, /new Function/);
});

test('再次运行使用最新编辑代码并递增 iframe key', () => {
  const first=nextRunner(0,'console.log("first")','channel');
  const second=nextRunner(first.key,'console.log("edited")','channel');
  assert.equal(first.key,1);assert.equal(second.key,2);
  assert.match(second.document,/edited/);assert.doesNotMatch(second.document,/first/);
  assert.throws(()=>nextRunner(-1,'','channel'),RangeError);
});
