import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { parseArticle, validateLibrary } from '../src/data-utils.ts';

export const resourcesPath = fileURLToPath(new URL('../src/data/resources.json', import.meta.url));
export async function readLibrary(root = fileURLToPath(new URL('../', import.meta.url))) {
  const directory = join(root, 'src/articles');
  const files = (await readdir(directory)).filter((file) => file.endsWith('.md'));
  const articles = await Promise.all(files.map(async (file) => parseArticle(await readFile(join(directory, file), 'utf8'), file)));
  const resources = validateLibrary(JSON.parse(await readFile(join(root, 'src/data/resources.json'), 'utf8')), articles);
  return { articles, resources };
}
