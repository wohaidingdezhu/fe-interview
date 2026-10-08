import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { parseArticle, validateLibrary } from '../src/data-utils.ts';

export const resourcesPath = fileURLToPath(new URL('../src/data/resources.json', import.meta.url));
export async function readLibrary() {
  const directory = new URL('../src/articles/', import.meta.url);
  const files = (await readdir(directory)).filter((file) => file.endsWith('.md'));
  const articles = await Promise.all(files.map(async (file) => parseArticle(await readFile(new URL(file, directory), 'utf8'), file)));
  const resources = validateLibrary(JSON.parse(await readFile(resourcesPath, 'utf8')), articles);
  return { articles, resources };
}
