import { fetchResource } from './resource-metadata.mjs';
import { validateResource } from '../src/data-utils.ts';
try {
  if (process.argv.length !== 3) throw new Error('用法：npm run fetch:resource -- https://example.com/article');
  const resource = validateResource(await fetchResource(process.argv[2]));
  // 只输出待审核数据，由使用者检查后通过既有导入流程写入。
  console.log(JSON.stringify([resource], null, 2));
} catch (error) { console.error(error.message); process.exitCode = 1; }
