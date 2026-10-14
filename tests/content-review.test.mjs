import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';

test('闭包笔记的两个示例实际输出与文字一致', async () => {
  const raw = await readFile(new URL('../src/articles/closure.md', import.meta.url), 'utf8');
  const blocks = [...raw.matchAll(/```javascript\n([\s\S]*?)```/g)].map(match => match[1]);
  assert.equal(blocks.length, 2);
  const results = blocks.map(code => {
    const values = [];
    runInNewContext(code, { console: { log: value => values.push(value) } }, { timeout: 1000 });
    return values;
  });
  assert.deepEqual(results, [[1, 2], [2]]);
});
