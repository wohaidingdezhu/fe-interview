declare module 'virtual:library' {
  const library: { articles: import('./data-utils').ArticleMetadata[]; resources: import('./data-utils').Resource[]; searchPath: string };
  export default library;
}
