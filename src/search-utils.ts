export type SearchDocument = { id: string; text: string };
export function searchDocuments(documents: SearchDocument[], query: string) {
  const terms = query.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
  const result = new Map<string, string>();
  if (!terms.length) return result;
  for (const document of documents) {
    const text = document.text.toLocaleLowerCase();
    if (!terms.every((term) => text.includes(term))) continue;
    const start = Math.max(0, text.indexOf(terms[0]) - 40), end = Math.min(document.text.length, start + 160);
    result.set(document.id, `${start ? '…' : ''}${document.text.slice(start, end)}${end < document.text.length ? '…' : ''}`);
  }
  return result;
}
