// 旧分类作为别名保留，已有书签和导入资料仍能找到统一后的主题。
const aliases: Readonly<Record<string, string>> = {
  'React 生态': 'React',
  'Vue 生态': 'Vue',
  '前端构建 & 工程化': '工程化',
  '浏览器与网络': '网络',
  '计算机网络': '网络',
  '前端性能': '性能优化',
  '手写题': '算法与手写',
  '代码编程': '算法与手写',
};

export function normalizeCategory(category: string): string {
  const value = category.trim();
  return Object.hasOwn(aliases, value) ? aliases[value] : value;
}
