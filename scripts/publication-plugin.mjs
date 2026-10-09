import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { readLibrary } from './library.mjs';
import { selectPublished, validateContent, imagePaths, localImagePath } from './publication.mjs';
import { contentAssets } from './content-assets.mjs';

// 在 Vite 模块图之外过滤源文件，草稿正文不会成为生产模块或静态资产。
export function publicationPlugin() {
  let production = false, root;
  const virtualId = '\0virtual:library';
  return {
    name: 'publication-boundary',
    config(_config, { command }) {
      production = command === 'build';
      return production ? { publicDir: false } : undefined;
    },
    configResolved(config) { root = config.root; },
    resolveId(id) { if (id === 'virtual:library') return virtualId; },
    async load(id) {
      if (id !== virtualId) return;
      const library = await readLibrary(root);
      if (production) {
        const report = await validateContent(library, resolve(root, 'public'));
        if (report.errors.length) throw new Error(report.errors.join('\n'));
      }
      const { catalog, assets } = contentAssets(production ? selectPublished(library) : library);
      if (production) for (const asset of assets) this.emitFile({ type: 'asset', ...asset });
      return `export default ${JSON.stringify(catalog)};`;
    },
    configureServer(server) {
      server.middlewares.use(async (request, response, next) => {
        const path = new URL(request.url, 'http://localhost').pathname.replace(/^\//, '');
        if (!/^(content|search)\/.+\.json$/.test(path)) return next();
        try {
          const asset = contentAssets(await readLibrary(root)).assets.find((asset) => asset.fileName === path);
          if (!asset) { response.statusCode = 404; response.end('Content not found'); return; }
          response.setHeader('Content-Type', 'application/json; charset=utf-8'); response.setHeader('Cache-Control', 'no-cache'); response.end(asset.source);
        } catch (error) { next(error); }
      });
      server.watcher.add([resolve(root, 'src/articles'), resolve(root, 'src/data/resources.json')]);
      const reload = (file) => {
        if (file.startsWith(resolve(root, 'src/articles') + '/') || file === resolve(root, 'src/data/resources.json')) {
          const module = server.moduleGraph.getModuleById(virtualId);
          if (module) server.moduleGraph.invalidateModule(module);
          server.ws.send({ type: 'full-reload' });
        }
      };
      server.watcher.on('add', reload).on('change', reload).on('unlink', reload);
      server.httpServer?.once('close', () => {
        server.watcher.off('add', reload).off('change', reload).off('unlink', reload);
      });
    },
    async generateBundle() {
      const directory = resolve(root, 'public');
      const library = selectPublished(await readLibrary(root));
      const images = new Set(library.articles.flatMap((article) => imagePaths(article.content).map((path) => localImagePath(path, directory))).filter(Boolean));
      const emit = async (path = '') => {
        for (const entry of await readdir(resolve(directory, path), { withFileTypes: true })) {
          const name = path ? `${path}/${entry.name}` : entry.name;
          if (entry.name.startsWith('.') || entry.isSymbolicLink()) continue;
          if (entry.isDirectory()) { await emit(name); continue; }
          if (!entry.isFile() || (name.startsWith('images/') && !images.has(name))) continue;
          this.emitFile({ type: 'asset', fileName: name, source: await readFile(resolve(directory, name)) });
        }
      };
      await emit();
    },
  };
}
