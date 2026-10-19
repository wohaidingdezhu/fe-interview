export type SearchDocument = { id: string; text: string; title?: string; aliases?: string[]; questionNumber?: number; questionTitle?: string; anchor?: string };
export type SearchHit = SearchDocument & { snippet: string };
const normalizedText = new WeakMap<SearchDocument, string>();
export const searchHits = (documents: SearchDocument[], query: string): SearchHit[] => {
  const terms = [...new Set(query.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean))];
  const result: { hit: SearchHit; score: number }[] = [];
  if (!terms.length) return [];
  const questionTerms = terms.filter(term => /^q[1-9]\d*$/.test(term));
  const words = terms.filter(term => !questionTerms.includes(term));
  const phrase = words.join(' ');
  for (const document of documents) {
    if (!questionTerms.every(term => document.questionNumber === Number(term.slice(1)))) continue;
    let text = normalizedText.get(document);
    if (text === undefined) { text = document.text.toLocaleLowerCase(); normalizedText.set(document, text); }
    if (!words.every(term => text.includes(term))) continue;
    const start = Math.max(0, text.indexOf(words[0] ?? terms[0]) - 40), end = Math.min(document.text.length, start + 160);
    const snippet = `${start ? '…' : ''}${document.text.slice(start, end)}${end < document.text.length ? '…' : ''}`;
    const title = (document.title ?? document.questionTitle?.replace(/^Q[1-9]\d*\s*[｜|]\s*/i, '') ?? '').toLocaleLowerCase().trim().replace(/\s+/g, ' ');
    const aliases = (document.aliases ?? []).map(alias => alias.toLocaleLowerCase().trim().replace(/\s+/g, ' '));
    const titleMatches = words.filter(term => title.includes(term)).length;
    // 完整标题 > 完整别名 > 标题全词 > 别名全词 > 部分标题/别名 > 正文。
    const score = !words.length ? 0 : title === phrase ? 5 : aliases.includes(phrase) ? 4
      : titleMatches === words.length ? 3 : aliases.some(alias => words.every(term => alias.includes(term))) ? 2
        : titleMatches / words.length + words.filter(term => aliases.some(alias => alias.includes(term))).length / words.length / 2;
    result.push({ hit: { ...document, snippet }, score });
  }
  return result.sort((a, b) => b.score - a.score).map(item => item.hit);
};
export const searchDocuments = (documents: SearchDocument[], query: string) => {
  const result = new Map<string, string>();
  for (const hit of searchHits(documents, query)) if (!result.has(hit.id)) result.set(hit.id, hit.snippet);
  return result;
};
