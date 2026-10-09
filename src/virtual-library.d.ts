declare module 'virtual:library' {
  const library: { articles: import('./data-utils').Article[]; resources: import('./data-utils').Resource[] };
  export default library;
}
