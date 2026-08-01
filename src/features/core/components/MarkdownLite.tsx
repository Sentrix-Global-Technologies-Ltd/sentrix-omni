import type { ReactNode } from "react";

/**
 * Minimal renderer for the small markdown vocabulary Sentrix Core's persona
 * is instructed to use (see SentrixCore/sentrix_core/persona.py — STYLE:
 * "short paragraphs, bold key terms, lists when useful"). Assistant replies
 * were coming back with literal "**word**" / "- item" showing up verbatim in
 * the chat bubble because nothing parsed them — this renders straight to
 * React elements (never dangerouslySetInnerHTML), so it's safe by
 * construction without pulling in a full markdown dependency for a vocabulary
 * this bounded: **bold**, "- "/"* " bullet lines, and blank-line paragraph
 * breaks. Anything outside that (headings, tables, code fences) just prints
 * as plain text — the persona's VOICE_MODE already avoids markdown
 * altogether for the cases where that would matter (voice/TTS output).
 */
export function MarkdownLite({ text }: { text: string }): ReactNode {
  const lines = text.split("\n");
  const blocks: ReactNode[] = [];
  let listItems: ReactNode[] = [];
  let paraLines: string[] = [];

  const flushList = () => {
    if (listItems.length) {
      blocks.push(
        <ul key={`ul-${blocks.length}`} className="ml-4 list-disc space-y-0.5">
          {listItems}
        </ul>,
      );
      listItems = [];
    }
  };
  const flushPara = () => {
    if (paraLines.length) {
      blocks.push(<p key={`p-${blocks.length}`}>{renderInline(paraLines.join(" "))}</p>);
      paraLines = [];
    }
  };

  for (const line of lines) {
    const bulletMatch = /^\s*[-*]\s+(.*)$/.exec(line);
    if (bulletMatch) {
      flushPara();
      listItems.push(<li key={listItems.length}>{renderInline(bulletMatch[1])}</li>);
    } else if (line.trim() === "") {
      flushList();
      flushPara();
    } else {
      flushList();
      paraLines.push(line);
    }
  }
  flushList();
  flushPara();

  return <div className="space-y-1.5">{blocks}</div>;
}

/** Inline pass: only `**bold**` for now — matches the persona's actual vocabulary. */
function renderInline(text: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={i} className="font-semibold">
        {part.slice(2, -2)}
      </strong>
    ) : (
      part
    ),
  );
}
