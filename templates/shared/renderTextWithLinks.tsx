import React from 'react';


const MARKDOWN_LINK_PATTERN = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;

export function renderTextWithLinks(
  text: string | number | undefined | null
): React.ReactNode {
  if (typeof text !== 'string' || !text) {
    return text;
  }

  MARKDOWN_LINK_PATTERN.lastIndex = 0;
  if (!MARKDOWN_LINK_PATTERN.test(text)) {
    return text;
  }
  MARKDOWN_LINK_PATTERN.lastIndex = 0;

  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = MARKDOWN_LINK_PATTERN.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }
    const [, label, url] = match;
    nodes.push(
      <a key={key++} href={url} target="_blank" rel="noopener">
        {label}
      </a>
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
}
