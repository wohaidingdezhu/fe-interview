declare module 'virtual:library' {
  const library: { articles: import('./data-utils').ArticleMetadata[]; searchPath: string; questionsPath: string };
  export default library;
}
