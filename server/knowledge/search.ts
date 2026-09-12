import { knowledgeDocuments, type KnowledgeDocument } from './documents';

export function searchKnowledge(query: string, currentRoute?: string, limit = 6): KnowledgeDocument[] {
  const terms = tokenize(query);
  return knowledgeDocuments.map((document) => ({ document, score: score(document, terms, currentRoute) }))
    .filter((item) => item.score > 0).sort((a, b) => b.score - a.score).slice(0, limit).map((item) => item.document);
}

function score(document: KnowledgeDocument, terms: string[], currentRoute?: string) {
  const title = `${document.title} ${document.section} ${document.keywords.join(' ')}`.toLowerCase();
  const content = document.content.toLowerCase();
  return terms.reduce((total, term) => total + (title.includes(term) ? 5 : 0) + (content.includes(term) ? 2 : 0), currentRoute && document.route === currentRoute ? 3 : 0);
}

function tokenize(input: string) {
  const normalized = input.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ');
  const words = normalized.split(/\s+/).filter((word) => word.length > 1);
  const han = Array.from(normalized.matchAll(/[\p{Script=Han}]{2,}/gu)).flatMap((match) => Array.from({ length: Math.max(0, match[0].length - 1) }, (_, index) => match[0].slice(index, index + 2)));
  return [...new Set([...words, ...han])].slice(0, 40);
}
