import katex from 'katex';
import { Fragment, type ReactNode } from 'react';
import type { Block } from '../generators/types';

const cache = new Map<string, string>();
const VN_TEXT = /\\text\{([^{}\\]*[^\x00-\x7f][^{}\\]*)\}/g;
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * Render TeX bằng KaTeX (có cache). KaTeX tự tách dấu của chữ tiếng Việt trong \text{}
 * thành các dấu chồng (hiển thị lệch), nên ta thay chữ đó bằng một mã ASCII tạm,
 * render, rồi chèn lại nguyên văn để trình duyệt dùng font hệ thống.
 */
export function texHtml(tex: string, display = false): string {
  const key = `${display ? 'D' : 'I'}${tex}`;
  let html = cache.get(key);
  if (html === undefined) {
    const pieces: string[] = [];
    const prepared = tex.replace(VN_TEXT, (_, inner: string) => {
      pieces.push(inner);
      return `\\text{QZVN${LETTERS[pieces.length - 1] ?? 'Z'}QZ}`;
    });
    html = katex.renderToString(prepared, { displayMode: display, throwOnError: false, strict: 'ignore', output: 'html' });
    pieces.forEach((p, i) => {
      html = html!.split(`QZVN${LETTERS[i] ?? 'Z'}QZ`).join(`<span class="vn">${esc(p)}</span>`);
    });
    cache.set(key, html);
  }
  return html;
}

export function Tex({ tex, display }: { tex: string; display?: boolean }) {
  return <span className={display ? 'tex-display' : 'tex'} dangerouslySetInnerHTML={{ __html: texHtml(tex, display) }} />;
}

const TOKEN = /(\$\$[\s\S]+?\$\$|\$[^$]+?\$|\*\*[^*]+\*\*|`[^`]+`)/g;

/** Đoạn văn có $TeX$, $$TeX$$, **đậm** và `mã`. */
export function Inline({ text }: { text: string }) {
  const parts = text.split(TOKEN);
  return (
    <>
      {parts.map((p, i): ReactNode => {
        if (!p) return null;
        if (p.startsWith('$$')) return <Tex key={i} tex={p.slice(2, -2)} display />;
        if (p.startsWith('$') && p.length > 1) return <Tex key={i} tex={p.slice(1, -1)} />;
        if (p.startsWith('**')) return <strong key={i}><Inline text={p.slice(2, -2)} /></strong>;
        if (p.startsWith('`')) return <code key={i}>{p.slice(1, -1)}</code>;
        return <Fragment key={i}>{p}</Fragment>;
      })}
    </>
  );
}

export function Blocks({ blocks, ordered }: { blocks: Block[]; ordered?: boolean }) {
  const items = blocks.map((b, i) => {
    if (typeof b === 'string') return <p key={i}><Inline text={b} /></p>;
    if ('code' in b) return <pre key={i} className="code">{b.code}</pre>;
    return (
      <div key={i} className="table-wrap">
        <table>
          <thead>
            <tr>{b.table.head.map((h, j) => <th key={j}><Inline text={h} /></th>)}</tr>
          </thead>
          <tbody>
            {b.table.rows.map((r, j) => (
              <tr key={j}>{r.map((c, k) => <td key={k}><Inline text={c} /></td>)}</tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  });
  return <div className={ordered ? 'blocks steps' : 'blocks'}>{items}</div>;
}
