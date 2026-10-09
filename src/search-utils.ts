export type SearchDocument = { id: string; text: string; questionNumber?: number; questionTitle?: string; anchor?: string };
export type SearchHit = SearchDocument & { snippet: string };
const normalizedText = new WeakMap<SearchDocument, string>();
export function searchHits(documents: SearchDocument[], query: string): SearchHit[] {
  const terms = query.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
  const result: { hit: SearchHit; score: number }[] = [];
  if (!terms.length) return [];
  const questionTerms = terms.filter(term => /^q[1-9]\d*$/.test(term));
  const words = terms.filter(term => !questionTerms.includes(term));
  for (const document of documents) {
    if (!questionTerms.every(term => document.questionNumber === Number(term.slice(1)))) continue;
    let text = normalizedText.get(document);
    if (text === undefined) { text = document.text.toLocaleLowerCase(); normalizedText.set(document, text); }
    if (!words.every(term => text.includes(term))) continue;
    const start = Math.max(0, text.indexOf(words[0] ?? terms[0]) - 40), end = Math.min(document.text.length, start + 160);
    const snippet = `${start ? '…' : ''}${document.text.slice(start, end)}${end < document.text.length ? '…' : ''}`;
    const title = document.questionTitle?.toLocaleLowerCase() ?? '';
    result.push({ hit: { ...document, snippet }, score: words.filter(term => title.includes(term)).length });
  }
  return result.sort((a, b) => b.score - a.score).map(item => item.hit);
}
export function searchDocuments(documents: SearchDocument[], query: string) {
  const result = new Map<string, string>();
  for (const hit of searchHits(documents, query)) if (!result.has(hit.id)) result.set(hit.id, hit.snippet);
  return result;
}
