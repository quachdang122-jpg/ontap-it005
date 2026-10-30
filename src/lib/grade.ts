import type { AnswerValue, FieldSpec, Norm } from '../generators/types';

const INF_WORDS = new Set(['∞', 'inf', 'infinity', 'vôhạn', 'vohan', 'khônggiớihạn', 'khonggioihan', 'vôcùng', 'vocung']);

/**
 * Đọc số người dùng nhập: chấp nhận dấu phẩy hoặc chấm thập phân, 1.6e-4,
 * 1,6×10^-4, 1.6*10^(-4), phần trăm (25% = 0.25), và "vô hạn".
 */
export function parseNum(raw: string): number | null {
  let s = raw.trim().toLowerCase().replace(/[\s ]/g, '');
  if (!s) return null;
  if (INF_WORDS.has(s)) return Infinity;
  let pct = false;
  if (s.endsWith('%')) {
    pct = true;
    s = s.slice(0, -1);
  }
  s = s.replace(/−/g, '-');
  if (s.includes(',') && s.includes('.')) s = s.replace(/,/g, '');
  else s = s.replace(/,/g, '.');
  const m = s.match(/^([+-]?[\d.]+)(?:[x×*·]10\^?\(?([+-]?\d+)\)?)$/);
  if (m) s = `${m[1]}e${m[2]}`;
  if (!/^[+-]?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?$/.test(s)) return null;
  const v = Number(s);
  if (!isFinite(v)) return null;
  return pct ? v / 100 : v;
}

export function numClose(user: number, correct: number, rel = 0.01): boolean {
  if (correct === Infinity || user === Infinity) return user === correct;
  if (rel === 0) return Math.abs(user - correct) < 1e-9;
  if (correct === 0) return Math.abs(user) < 1e-9;
  return Math.abs(user - correct) <= rel * Math.abs(correct) + 1e-12;
}

function parseIntSet(s: string): string {
  const out = new Set<number>();
  for (const part of s.split(/[,;\s]+/)) {
    if (!part) continue;
    const r = part.match(/^(\d+)[-–—](\d+)$/);
    if (r) {
      const a = Number(r[1]);
      const b = Number(r[2]);
      for (let i = Math.min(a, b); i <= Math.max(a, b) && i - a < 500; i++) out.add(i);
    } else if (/^\d+$/.test(part)) out.add(Number(part));
    else if (!/^(x|không|khong|none|-)$/.test(part)) return `#invalid:${s}`;
  }
  return [...out].sort((a, b) => a - b).join(',');
}

export function normalize(s: string, norm: Norm | undefined): string {
  const t = s.trim().toLowerCase();
  switch (norm) {
    case 'bits':
      return t.replace(/[\s_]/g, '');
    case 'url':
      return t.replace(/^https?:\/\//, '').replace(/\/$/, '');
    case 'seq':
      return t
        .split(/[\s,;→>]+/)
        .filter(Boolean)
        .map((x) => (/^(không|khong|none|-|—)$/.test(x) ? 'x' : x))
        .join(',');
    case 'intset':
      return parseIntSet(t);
    default:
      return t.replace(/\s+/g, ' ');
  }
}

/** Gợi ý lỗi hay gặp dựa vào tỉ số giữa đáp án nhập và đáp án đúng. */
export function diagnose(user: number, correct: number): string | undefined {
  if (!isFinite(user) || !isFinite(correct) || correct === 0 || user === 0) return undefined;
  const r = user / correct;
  const near = (x: number) => Math.abs(r / x - 1) < 0.02;
  if (near(1 / 8)) return 'Kết quả nhỏ hơn 8 lần: có thể bạn quên nhân 8 khi đổi byte sang bit.';
  if (near(8)) return 'Kết quả lớn hơn 8 lần: kiểm tra lại việc đổi byte ↔ bit.';
  if (near(1000) || near(1 / 1000)) return 'Lệch đúng 1000 lần: kiểm tra đơn vị (ms ↔ s, km ↔ m, kbps ↔ Mbps).';
  if (near(1e6) || near(1e-6)) return 'Lệch 10⁶ lần: kiểm tra đơn vị (µs ↔ s, Mbps ↔ bps).';
  if (near(1.048576) || near(1 / 1.048576) || near(1.024) || near(1 / 1.024))
    return 'Trong mạng, 1 Mbps = 10⁶ bps và 1 kbps = 10³ bps, không phải 2²⁰ hay 2¹⁰.';
  if (near(100) || near(1 / 100)) return 'Lệch 100 lần: nếu nhập phần trăm, nhớ thêm ký hiệu %.';
  if (near(2) || near(0.5)) return 'Lệch đúng 2 lần: kiểm tra lại hệ số 2 (một chiều hay khứ hồi, RTT hay 2RTT).';
  return undefined;
}

export interface FieldResult {
  ok: boolean;
  hint?: string;
}

export function checkField(f: FieldSpec, answer: AnswerValue, input: string): FieldResult {
  const accepted = Array.isArray(answer) ? answer : [answer];
  if (!input.trim()) return { ok: false, hint: 'Chưa nhập.' };

  if (f.kind === 'number') {
    const v = parseNum(input);
    if (v === null) return { ok: false, hint: 'Không đọc được số. Ví dụ hợp lệ: 0,25 · 1.6e-4 · 1,6×10^-4 · 25%.' };
    const rel = f.exact ? 0 : f.tol ?? 0.01;
    if (accepted.some((a) => numClose(v, Number(a), rel))) return { ok: true };
    for (const m of f.mistakes ?? []) {
      if (typeof m.value === 'number' && numClose(v, m.value, Math.max(rel, 0.005))) return { ok: false, hint: m.msg };
    }
    return { ok: false, hint: diagnose(v, Number(accepted[0])) };
  }

  if (f.kind === 'choice') {
    if (accepted.some((a) => String(a) === input)) return { ok: true };
    return { ok: false, hint: f.mistakes?.find((m) => m.value === input)?.msg };
  }

  const u = normalize(input, f.norm);
  if (accepted.some((a) => normalize(String(a), f.norm) === u)) return { ok: true };
  for (const m of f.mistakes ?? []) {
    if (normalize(String(m.value), f.norm) === u) return { ok: false, hint: m.msg };
  }
  if (f.norm === 'bits' && !/^[01]{16}$/.test(u)) return { ok: false, hint: 'Cần nhập đúng 16 bit (0/1), có thể cách quãng.' };
  return { ok: false };
}

export function formatAnswer(f: FieldSpec, a: AnswerValue): string {
  const first = Array.isArray(a) ? a[0] : a;
  if (f.kind === 'number' && typeof first === 'number') {
    if (first === Infinity) return '∞ (không giới hạn)';
    if (f.exact) return String(first);
    const abs = Math.abs(first);
    if (abs !== 0 && (abs < 1e-3 || abs >= 1e7)) {
      const [m, e] = first.toExponential(3).split('e');
      return `${Number(m)}e${Number(e)}`;
    }
    return String(Number(first.toPrecision(5)));
  }
  return Array.isArray(a) ? a.join(' hoặc ') : String(a);
}
