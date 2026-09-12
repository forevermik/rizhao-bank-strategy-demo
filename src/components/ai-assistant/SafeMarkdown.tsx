import type { ReactNode } from 'react';

export function SafeMarkdown({ content }: { content: string }) {
  const sections = content.replace(/\r\n/g, '\n').split(/\n{2,}/);
  return <div className="ai-markdown">{sections.map((section, index) => renderBlock(section, index))}</div>;
}

function renderBlock(section: string, key: number) {
  if (/^```/.test(section.trim())) return <pre key={key}><code>{section.replace(/^```[^\n]*\n?|```$/g, '')}</code></pre>;
  const lines = section.split('\n');
  if (lines.every((line) => /^\s*[-*]\s+/.test(line))) return <ul key={key}>{lines.map((line, index) => <li key={index}>{inline(line.replace(/^\s*[-*]\s+/, ''))}</li>)}</ul>;
  const heading = section.match(/^#{1,3}\s+(.+)/);
  if (heading) return <h3 key={key}>{inline(heading[1])}</h3>;
  return <p key={key}>{inline(lines.join(' '))}</p>;
}

function inline(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  const matcher = /(\*\*([^*]+)\*\*|`([^`]+)`|\[([^\]]+)\]\((https?:\/\/[^)\s]+)\))/g;
  let cursor = 0;
  for (const match of text.matchAll(matcher)) {
    if ((match.index ?? 0) > cursor) parts.push(text.slice(cursor, match.index));
    if (match[2]) parts.push(<strong key={cursor}>{match[2]}</strong>);
    else if (match[3]) parts.push(<code key={cursor}>{match[3]}</code>);
    else if (match[4] && match[5]) parts.push(<a key={cursor} href={match[5]} target="_blank" rel="noreferrer">{match[4]}</a>);
    cursor = (match.index ?? 0) + match[0].length;
  }
  if (cursor < text.length) parts.push(text.slice(cursor));
  return parts;
}
