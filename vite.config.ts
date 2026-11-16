import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { publicationPlugin } from './scripts/publication-plugin.mjs';

export default defineConfig({
  plugins: [react(), publicationPlugin()], base: './',
  // WebKit 可能缓存失败的模块预加载，跳过入口本身，让动态 import 支持刷新恢复。
  build: { modulePreload: { resolveDependencies: (filename, dependencies, context) =>
    context.hostType === 'js' ? dependencies.filter(dependency => dependency !== filename) : dependencies } },
});
