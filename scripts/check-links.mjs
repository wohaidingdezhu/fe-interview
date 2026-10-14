import { mkdir, writeFile } from 'node:fs/promises';
import { readLibrary } from './library.mjs';
import { selectPublished } from './publication.mjs';
import { checkLinks } from './link-utils.mjs';
import { readLinkReferences, createLinkReports } from './link-report.mjs';

const library = selectPublished(await readLibrary());
const references = await readLinkReferences(library);
const results = await checkLinks(references.map(reference => reference.url));
const report = createLinkReports(results, references, {
  repositoryURL: process.env.GITHUB_REPOSITORY ? `${process.env.GITHUB_SERVER_URL ?? 'https://github.com'}/${process.env.GITHUB_REPOSITORY}` : undefined,
  revision: process.env.GITHUB_SHA ?? 'main',
});
await mkdir('.reports', { recursive: true });
await writeFile('.reports/links.json', JSON.stringify(report.items, null, 2) + '\n');
await writeFile('.reports/links.md', report.markdown);
await writeFile('.reports/links-summary.md', report.summary);
console.log(`检查 ${results.length} 个链接，${report.pending} 个需要复核。报告：.reports/links.md`);
