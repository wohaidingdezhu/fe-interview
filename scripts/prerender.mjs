import { readFile, writeFile, mkdir, readdir, rm } from 'node:fs/promises';
import { resolve, join, dirname, parse as parsePath } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';
import { readLibrary } from './library.mjs';
import { selectPublished, inspectQuestions } from './publication.mjs';
const root = fileURLToPath(new URL('../', import.meta.url));
const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
function metadata(title, description, url, jsonld) {
  return `<title>${escape(title)}</title>\n<meta name="description" content="${escape(description)}">\n<link rel="canonical" href="${escape(url)}">\n<meta property="og:type" content="${jsonld ? 'article' : 'website'}">\n<meta property="og:title" content="${escape(title)}">\n<meta property="og:description" content="${escape(description)}">\n<meta property="og:url" content="${escape(url)}">\n<meta name="twitter:card" content="summary">${jsonld ? `\n<script type="application/ld+json">${JSON.stringify(jsonld).replace(/</g,'\\u003c')}</script>` : ''}`;
}
export async function prerender({ output = join(root, 'dist'), library, siteURL, renderArticle } = {}) {
  const outputRoot = resolve(output);
  if (outputRoot === parsePath(outputRoot).root) throw new Error('预渲染输出目录不能是文件系统根目录');
  const articlesRoot = resolve(outputRoot, 'articles');
  if (dirname(articlesRoot) !== outputRoot) throw new Error('文章输出目录必须位于预渲染输出目录内');
  library = selectPublished(library ?? await readLibrary(root));
  const site = JSON.parse(await readFile(join(root, 'site.config.json'), 'utf8'));
  const base = new URL(siteURL || process.env.SITE_URL || site.url);
  if (!['https:', 'http:'].includes(base.protocol) || base.search || base.hash || base.username || base.password) throw new Error('SITE_URL 必须是无查询参数和凭据的 HTTP(S) 根地址');
  if (!base.pathname.endsWith('/')) base.pathname += '/';
  let server;
  if (!renderArticle) {
    server = await createServer({ root, configFile:false, cacheDir:'.reports/vite-prerender-cache', optimizeDeps:{noDiscovery:true, include:[]}, plugins:[react()], server:{middlewareMode:true, hmr:false}, appType:'custom' });
    const { default: ArticleContent } = await server.ssrLoadModule('/src/ArticleContent.tsx');
    renderArticle = article => renderToStaticMarkup(createElement(ArticleContent, { content:article.content, onHeadings(){}, navigate(){} }));
  }
  try {
    const template = (await readFile(join(outputRoot,'index.html'),'utf8'))
      .replace(/<!--static-head:start-->[\s\S]*?<!--static-head:end-->/g,'')
      .replace(/<!--static-body:start-->[\s\S]*?<!--static-body:end-->/g,'<div id="root"></div>')
      .replace(/<title>[\s\S]*?<\/title>/,'').replace(/<meta name="description"[^>]*>/,'');
    const page = (body, head, depth = '') => template.replace('<head>', `<head><!--static-head:start-->${depth ? `\n<base href="${depth}">` : ''}\n${head}<!--static-head:end-->`)
      .replace('<div id="root"></div>', `<!--static-body:start--><div id="root">${body}</div><!--static-body:end-->`);
    const links = [], topicCount = library.articles.filter(a => inspectQuestions(a).length).length;
    const questionCount = library.articles.reduce((sum,a) => sum + inspectQuestions(a).length,0);
    for (const article of library.articles) {
      const path = `articles/${article.id}/`, url = new URL(path, base).href;
      // 旧 ?article 链接转换为静态路径，锚点只指向当前文章，不受 base 元素影响。
      let rendered = await renderArticle(article);
      rendered = rendered.replace(/href="\?article=([a-z0-9-]+)(#[^"]*)?"/g, (_m,id,hash='') => `href="articles/${id}/${hash}"`)
        .replace(/href="#([^"]+)"/g, (_m,hash) => `href="${path}#${hash}"`);
      const html = `<header class="header"><a class="brand" href="./">前端资料库</a><a href="?view=questions">全部题目</a></header><main class="static-reader"><nav class="breadcrumb"><a href="./">首页</a><span>/</span>${escape(article.category)}</nav><h1>${escape(article.title)}</h1><p class="description">${escape(article.description)}</p>${rendered}<nav class="static-related">${(article.related || []).map(id => { const related=library.articles.find(a=>a.id===id); return related ? `<a href="articles/${id}/">${escape(related.title)}</a>` : ''; }).join('')}</nav></main>`;
      const data = { '@context':'https://schema.org', '@type':'Article', headline:article.title, description:article.description, url, inLanguage:'zh-CN', datePublished:article.addedAt, dateModified:article.updatedAt || article.reviewedAt || article.addedAt };
      await mkdir(join(outputRoot,path),{recursive:true});
      await writeFile(join(outputRoot,path,'index.html'),page(html,metadata(`${article.title} · ${site.name}`,article.description,url,data),'../../'));
      links.push({ url, date: data.dateModified });
    }
    // 本轮全部文章成功写入后再清理下架目录，避免渲染中途失败先破坏现有产物。
    await mkdir(articlesRoot, { recursive: true });
    const publicIds = new Set(library.articles.map(article => article.id));
    for (const entry of await readdir(articlesRoot, { withFileTypes: true })) {
      if (publicIds.has(entry.name)) continue;
      const target = resolve(articlesRoot, entry.name);
      if (dirname(target) !== articlesRoot) throw new Error(`拒绝清理文章目录外的路径：${entry.name}`);
      await rm(target, { recursive: true, force: true });
    }
    const directory = `<header class="header"><a class="brand" href="./">前端资料库</a><a href="?view=questions">全部题目</a></header><main class="static-reader"><h1>知识有来处，学习有路径。</h1><p>${questionCount} 道题 · ${topicCount} 个专题 · ${library.articles.length-topicCount} 篇笔记 · ${library.resources.length} 条资料</p><nav class="static-directory">${library.articles.map(article => `<a href="articles/${article.id}/"><strong>${escape(article.title)}</strong><span>${escape(article.description)}</span></a>`).join('')}</nav></main>`;
    await writeFile(join(outputRoot,'index.html'),page(directory,metadata(site.name,'按题查找、按主题学习，收藏值得反复阅读的前端知识。',base.href)));
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${escape(base.href)}</loc></url>${links.map(link=>`<url><loc>${escape(link.url)}</loc><lastmod>${escape(link.date)}</lastmod></url>`).join('')}</urlset>\n`;
    await writeFile(join(outputRoot,'sitemap.xml'),sitemap);
    await writeFile(join(outputRoot,'robots.txt'),`User-agent: *\nAllow: /\nSitemap: ${new URL('sitemap.xml',base).href}\n`);
    console.log(`静态预渲染：${links.length} 篇公开文章、首页、sitemap 和分享元信息。`);
    return { articles:links.length, questionCount, urls:links.map(link=>link.url) };
  } finally { await server?.close(); }
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) await prerender();
