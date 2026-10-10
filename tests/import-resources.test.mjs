import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, cp, symlink, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = fileURLToPath(new URL('../', import.meta.url));
const resource = { id: 'existing', title: '已有资料', url: 'https://example.com/article', description: '简介', source: '示例来源', type: '文章', category: 'React', tags: ['React'], addedAt: '2026-10-08' };
async function fixture(t) {
  const directory = await mkdtemp(join(tmpdir(), 'fe-library-import-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  await mkdir(join(directory, 'src/articles'), { recursive: true });
  await mkdir(join(directory, 'src/data'));
  await cp(join(root, 'scripts'), join(directory, 'scripts'), { recursive: true });
  await cp(join(root, 'src/data-utils.ts'), join(directory, 'src/data-utils.ts'));
  await cp(join(root, 'src/categories.ts'), join(directory, 'src/categories.ts'));
  await symlink(join(root, 'node_modules'), join(directory, 'node_modules'), 'dir');
  await writeFile(join(directory, 'package.json'), '{"type":"module"}');
  const target = join(directory, 'src/data/resources.json');
  await writeFile(target, JSON.stringify([resource]));
  return { directory, target, run: (...args) => spawnSync(process.execPath, [join(directory, 'scripts/import-resources.mjs'), ...args], { encoding: 'utf8' }) };
}
test('批量导入可预览，跳过已有和同批 URL，正式导入支持幂等重试', async (t) => {
  const f = await fixture(t); const input = join(f.directory, 'links.txt');
  await writeFile(input, 'https://example.com/article/?utm_source=a\nhttps://example.com/new\t新文章\t新的简介\nhttps://example.com/new#section\n');
  const before = await readFile(f.target, 'utf8');
  const dry = f.run(input, '--category', 'React', '--tags', 'React,性能', '--dry-run');
  assert.equal(dry.status, 0, dry.stderr); assert.match(dry.stdout, /新增 1 条，跳过重复 2 条/); assert.equal(await readFile(f.target, 'utf8'), before);
  const imported = f.run(input, '--category', 'React', '--tags', 'React,性能');
  assert.equal(imported.status, 0, imported.stderr);
  const records = JSON.parse(await readFile(f.target, 'utf8'));
  assert.equal(records.length, 2); assert.equal(records[1].title, '新文章'); assert.deepEqual(records[1].tags, ['React', '性能']);
  assert.equal(records[1].status, 'draft');
  assert.match(f.run(input).stdout, /新增 0 条，跳过重复 3 条/);
});
test('同批任何 URL 不合法时，不会写入之前解析成功的条目', async (t) => {
  const f = await fixture(t); const input = join(f.directory, 'bad.txt');
  await writeFile(input, 'https://example.com/valid\njavascript:alert(1)');
  const before = await readFile(f.target, 'utf8');
  assert.equal(f.run(input).status, 1); assert.equal(await readFile(f.target, 'utf8'), before);
});
test('JSON 导入重复 ID 会拒绝整批写入；显式字段优先于批次默认值', async (t) => {
  const f = await fixture(t); const input = join(f.directory, 'data.json');
  const before = await readFile(f.target, 'utf8');
  await writeFile(input, JSON.stringify([{ ...resource, url: 'https://example.com/new' }]));
  assert.equal(f.run(input).status, 1); assert.equal(await readFile(f.target, 'utf8'), before);
  await writeFile(input, JSON.stringify([{ ...resource, id: 'new', url: 'https://example.com/new', category: 'TypeScript' }]));
  assert.equal(f.run(input, '--category', 'React').status, 0);
  assert.equal(JSON.parse(await readFile(f.target, 'utf8'))[1].category, 'TypeScript');
});
