import { access, copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { basename, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const sectionDefinitions = [
  { sourceTitle: 'HTML + CSS', id: 'interview-html-css', title: 'HTML + CSS 面试题', category: 'HTML + CSS', range: [1, 39], tags: ['HTML', 'CSS', '面试'] },
  { sourceTitle: 'Javascript', id: 'interview-javascript', title: 'JavaScript 面试题', category: 'JavaScript', range: [40, 116], tags: ['JavaScript', '面试'] },
  { sourceTitle: 'Typescript', id: 'interview-typescript', title: 'TypeScript 面试题', category: 'TypeScript', range: [117, 122], tags: ['TypeScript', '类型系统', '面试'] },
  { sourceTitle: '代码编程', id: 'interview-coding', title: '代码编程与算法题', category: '代码编程', kind: '手写题解', range: [123, 158], tags: ['JavaScript', '算法', '手写题'] },
  { sourceTitle: 'Vue 生态', id: 'interview-vue', title: 'Vue 生态面试题', category: 'Vue 生态', range: [159, 203], tags: ['Vue', '响应式', '面试'] },
  { sourceTitle: 'React 生态', id: 'interview-react', title: 'React 生态面试题', category: 'React 生态', range: [204, 227], tags: ['React', 'Hooks', '面试'] },
  { sourceTitle: '前端构建 & 工程化', id: 'interview-engineering', title: '前端构建与工程化面试题', category: '前端构建 & 工程化', range: [228, 244], tags: ['Webpack', 'Vite', '工程化'] },
  { sourceTitle: '浏览器', id: 'interview-browser', title: '浏览器原理面试题', category: '浏览器', range: [245, 246], tags: ['浏览器', 'V8', '存储'] },
  { sourceTitle: '前端性能', id: 'interview-performance', title: '前端性能面试题', category: '前端性能', range: [247, 260], tags: ['性能优化', '缓存', '渲染'] },
  { sourceTitle: '设计模式', id: 'interview-design-patterns', title: '设计模式面试题', category: '设计模式', range: [261, 289], tags: ['设计模式', '架构', '面试'] },
  { sourceTitle: '操作系统', id: 'interview-operating-system', title: '操作系统基础面试题', category: '操作系统', range: [290, 292], tags: ['操作系统', '进程', '内存'] },
  { sourceTitle: '计算机网络', id: 'interview-network', title: '计算机网络面试题', category: '计算机网络', range: [293, 329], tags: ['HTTP', 'TCP', '网络安全'] },
  { sourceTitle: 'DevOps', id: 'interview-devops', title: 'DevOps 面试题', category: 'DevOps', range: [330, 345], tags: ['Git', 'Docker', 'DevOps'] },
  { sourceTitle: '服务端', id: 'interview-server', title: '前端服务端面试题', category: '服务端', range: [346, 355], tags: ['Node.js', 'Nginx', '服务端'] },
  { sourceTitle: '数据库', id: 'interview-database', title: '数据库面试题', category: '数据库', range: [356, 367], tags: ['MySQL', 'Redis', '数据库'] },
  { sourceTitle: 'AI 全栈', id: 'interview-ai-fullstack', title: 'AI 全栈面试题', category: 'AI 全栈', range: [368, 396], tags: ['LLM', 'RAG', 'Agent'] },
  { sourceTitle: '业务场景', id: 'interview-business', title: '前端业务场景题', category: '业务场景', range: [397, 403], tags: ['业务场景', '性能', '并发控制'] },
];

function parseAnswerSections(markdown) {
  const marker = '# 🧠 答案与解析';
  const markerIndex = markdown.indexOf(marker);
  if (markerIndex < 0) throw new Error(`缺少“${marker}”章节`);
  const answerContent = markdown.slice(markerIndex + marker.length);
  const headings = [...answerContent.matchAll(/^# (.+)$/gm)];
  const sections = new Map();
  for (let index = 0; index < headings.length; index++) {
    const title = headings[index][1].trim();
    if (sections.has(title)) throw new Error(`重复专题 ${title}`);
    const start = headings[index].index + headings[index][0].length;
    const end = headings[index + 1]?.index ?? answerContent.length;
    sections.set(title, answerContent.slice(start, end).trim());
  }
  return sections;
}

function expectedNumbers([start, end]) {
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

function frontmatter(definition, body, order) {
  const [start, end] = definition.range;
  const kind = definition.kind ?? '知识文章';
  const description = `收录 Q${start}–Q${end} 的参考答案、原理说明与配图。`;
  return `---
id: ${JSON.stringify(definition.id)}
title: ${JSON.stringify(definition.title)}
category: ${JSON.stringify(definition.category)}
description: ${JSON.stringify(description)}
kind: ${JSON.stringify(kind)}
tags: ${JSON.stringify(definition.tags)}
addedAt: "2026-10-08"
order: ${order}
---

${body.trim()}
`;
}

export async function importHandbook({
  sourcePath,
  sourceImagesDir,
  articlesDir = resolve('src/articles'),
  targetImagesDir = resolve('public/images/interview'),
  definitions = sectionDefinitions,
}) {
  const markdown = await readFile(sourcePath, 'utf8');
  const sections = parseAnswerSections(markdown);
  const prepared = [];
  const allQuestions = new Set();
  const referencedImages = new Set();

  for (let index = 0; index < definitions.length; index++) {
    const definition = definitions[index];
    const body = sections.get(definition.sourceTitle);
    if (!body) throw new Error(`缺少专题 ${definition.sourceTitle}`);
    const actual = [...body.matchAll(/^## Q(\d+)｜/gm)].map((match) => Number(match[1]));
    const expected = expectedNumbers(definition.range);
    if (actual.length !== expected.length || actual.some((number, questionIndex) => number !== expected[questionIndex])) {
      throw new Error(`${definition.sourceTitle} 应包含 Q${definition.range[0]}–Q${definition.range[1]}，实际为 ${actual.length ? `Q${actual.join('、Q')}` : '空'}`);
    }
    for (const number of actual) {
      if (allQuestions.has(number)) throw new Error(`重复题号 Q${number}`);
      allQuestions.add(number);
    }

    const images = [...body.matchAll(/!\[[^\]]*\]\(images\/([^)]+)\)/g)].map((match) => match[1]);
    for (const fileName of images) {
      if (basename(fileName) !== fileName || fileName.includes('..')) throw new Error(`非法图片路径：${fileName}`);
      referencedImages.add(fileName);
    }
    const rewritten = body.replace(/(!\[[^\]]*\]\()images\/([^)]+)(\))/g, '$1./images/interview/$2$3');
    prepared.push({
      path: join(articlesDir, `${definition.id}.md`),
      content: frontmatter(definition, rewritten, 100 + index),
    });
  }

  for (const fileName of referencedImages) await access(join(sourceImagesDir, fileName));
  await mkdir(articlesDir, { recursive: true });
  await mkdir(targetImagesDir, { recursive: true });
  await Promise.all(prepared.map((article) => writeFile(article.path, article.content, 'utf8')));
  await Promise.all([...referencedImages].map((fileName) => copyFile(join(sourceImagesDir, fileName), join(targetImagesDir, fileName))));

  return { articles: prepared.length, questions: allQuestions.size, images: referencedImages.size };
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const [sourcePath, sourceImagesDir] = process.argv.slice(2);
  if (!sourcePath || !sourceImagesDir) {
    console.error('用法：node scripts/import-interview-content.mjs <优化版 Markdown> <源图片目录>');
    process.exitCode = 1;
  } else {
    try {
      const result = await importHandbook({ sourcePath: resolve(sourcePath), sourceImagesDir: resolve(sourceImagesDir) });
      console.log(`导入完成：${result.articles} 篇专题，${result.questions} 道题，${result.images} 张正文图片。`);
    } catch (error) {
      console.error(`导入失败，未生成内容：${error.message}`);
      process.exitCode = 1;
    }
  }
}
