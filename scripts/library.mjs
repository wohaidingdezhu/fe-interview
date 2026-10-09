import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { parseArticle, validateLibrary, validateQuestionPublicationMap } from '../src/data-utils.ts';

export const resourcesPath = fileURLToPath(new URL('../src/data/resources.json', import.meta.url));
export const questionPublicationPath = fileURLToPath(new URL('../src/data/question-publication.json', import.meta.url));
async function markdownFiles(directory, prefix = '') {
  const entries = await readdir(join(directory, prefix), { withFileTypes: true });
  const files = [];
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name, 'en'))) {
    if (entry.name.startsWith('.') || entry.isSymbolicLink()) continue;
    const relativePath = prefix ? join(prefix, entry.name) : entry.name;
    if (entry.isDirectory()) files.push(...await markdownFiles(directory, relativePath));
    else if (entry.isFile() && entry.name.endsWith('.md')) files.push(relativePath);
  }
  return files;
}
export async function readLibrary(root = fileURLToPath(new URL('../', import.meta.url))) {
  const directory = join(root, 'src/articles');
  const files = await markdownFiles(directory);
  const articles = await Promise.all(files.map(async (file) => parseArticle(await readFile(join(directory, file), 'utf8'), file)));
  const resources = validateLibrary(JSON.parse(await readFile(join(root, 'src/data/resources.json'), 'utf8')), articles);
  let questionData = '{}';
  try { questionData = await readFile(join(root, 'src/data/question-publication.json'), 'utf8'); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  const questionPublication = validateQuestionPublicationMap(JSON.parse(questionData));
  return { articles, resources, questionPublication };
}
