import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { readLibrary } from './library.mjs';
import { checkLinks } from './link-utils.mjs';
import { linkReferences, linkReport } from './link-report.mjs';

const library = await readLibrary();
const paths = [...Object.values(library.articlePaths), 'src/data/resources.json', 'src/data/question-publication.json'];
const files = Object.fromEntries(await Promise.all(paths.map(async file => [file, await readFile(file, 'utf8')])));
const references = linkReferences(library, files);
const report = linkReport(await checkLinks([...references.keys()]), references);
await mkdir('.reports', { recursive: true });
await writeFile('.reports/links.json', JSON.stringify(report.results, null, 2) + '\n');
await writeFile('.reports/links.md', report.markdown);
console.log(`检查 ${report.results.length} 个链接，${report.results.filter(item => !['ok', 'redirected'].includes(item.state)).length} 个需要复核。报告：.reports/links.md`);
