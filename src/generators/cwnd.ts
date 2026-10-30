import { rng } from '../lib/rng';
import type { ProblemDef } from './types';

export type LossType = 'dup' | 'timeout';

export interface LossEvent {
  /** vòng mà cuối vòng đó phát hiện mất gói */
  round: number;
  type: LossType;
}

export interface P {
  ssthresh0: number;
  T: number;
  events: LossEvent[];
  k: number;
  askRound: number;
  /** quy ước khác: sau 3 ACK trùng cwnd = ssthresh (bỏ +3) */
  noPlus3: boolean;
}

export interface CwndRow {
  t: number;
  cwnd: number;
  ssthresh: number;
  phase: 'ss' | 'ca';
  event?: { type: LossType; newSsthresh: number; newCwnd: number };
}

export function simulateCwnd(p: Pick<P, 'ssthresh0' | 'T' | 'events' | 'noPlus3'>): CwndRow[] {
  let c = 1;
  let s = p.ssthresh0;
  const rows: CwndRow[] = [];
  for (let t = 1; t <= p.T; t++) {
    const row: CwndRow = { t, cwnd: c, ssthresh: s, phase: c < s ? 'ss' : 'ca' };
    const ev = p.events.find((e) => e.round === t);
    if (ev) {
      const ns = Math.max(1, Math.floor(c / 2));
      const nc = ev.type === 'timeout' ? 1 : p.noPlus3 ? ns : ns + 3;
      row.event = { type: ev.type, newSsthresh: ns, newCwnd: nc };
      s = ns;
      c = nc;
    } else c = c < s ? Math.min(2 * c, s) : c + 1;
    rows.push(row);
  }
  return rows;
}

/** Vòng mà segment thứ k được gửi (mỗi vòng gửi một đợt cwnd segment). */
export function roundOfSegment(rows: CwndRow[], k: number): number {
  let sum = 0;
  for (const r of rows) {
    sum += r.cwnd;
    if (sum >= k) return r.t;
  }
  return -1;
}

const ranges = (ts: number[]) => {
  if (!ts.length) return 'x';
  const out: string[] = [];
  let a = ts[0];
  let b = ts[0];
  for (const t of ts.slice(1)) {
    if (t === b + 1) b = t;
    else {
      out.push(a === b ? `${a}` : `${a}-${b}`);
      a = b = t;
    }
  }
  out.push(a === b ? `${a}` : `${a}-${b}`);
  return out.join(', ');
};

export function cwndAnswers(p: P) {
  const rows = simulateCwnd(p);
  const evs = rows.filter((r) => r.event);
  return {
    ss: ranges(rows.filter((r) => r.phase === 'ss').map((r) => r.t)),
    ca: ranges(rows.filter((r) => r.phase === 'ca').map((r) => r.t)),
    dup: ranges(evs.filter((r) => r.event!.type === 'dup').map((r) => r.t)),
    to: ranges(evs.filter((r) => r.event!.type === 'timeout').map((r) => r.t)),
    s0: p.ssthresh0,
    sAfter: evs.map((r) => r.event!.newSsthresh).join(', '),
    cAt: rows[p.askRound - 1].cwnd,
    kRound: roundOfSegment(rows, p.k),
  };
}

const def: ProblemDef<P> = {
  id: 'cwnd',
  chapter: 3,
  section: '3.9',
  title: 'Diễn biến cửa sổ tắc nghẽn TCP',
  toggles: [{ key: 'noPlus3', label: 'Quy ước: sau 3 ACK trùng cwnd = ssthresh (bỏ +3)' }],
  asks: 'Cho đồ thị cwnd theo vòng truyền (mỗi vòng = 1 RTT, đầu mỗi vòng gửi một đợt cwnd segment). Xác định các khoảng slow start, tránh tắc nghẽn, thời điểm và loại mất gói, giá trị ssthresh.',
  formulas: [
    '\\text{Slow start } (cwnd < ssthresh): cwnd \\leftarrow \\min(2\\,cwnd,\\ ssthresh)',
    '\\text{Tránh tắc nghẽn } (cwnd \\ge ssthresh): cwnd \\leftarrow cwnd + 1',
    '\\text{3 ACK trùng (Reno): } ssthresh = \\tfrac{cwnd}{2},\\ cwnd = ssthresh + 3',
    '\\text{Timeout: } ssthresh = \\tfrac{cwnd}{2},\\ cwnd = 1',
  ],
  generate(seed) {
    const g = rng(seed);
    for (;;) {
      const ssthresh0 = g.pick([6, 8, 10, 12, 16, 20, 24]);
      const T = g.int(18, 26);
      const events: LossEvent[] = [];
      let c = 1;
      let s = ssthresh0;
      let reached = false;
      let last = 0;
      for (let t = 1; t <= T - 3; t++) {
        if (c >= ssthresh0) reached = true;
        const can = reached && c % 2 === 0 && c >= 6 && t - last >= 3 && events.length < 3 && t > 4;
        if (can && g.bool(0.3)) {
          const type: LossType = g.bool() ? 'dup' : 'timeout';
          events.push({ round: t, type });
          last = t;
          s = Math.floor(c / 2);
          c = type === 'timeout' ? 1 : s + 3;
        } else c = c < s ? Math.min(2 * c, s) : c + 1;
      }
      const types = new Set(events.map((e) => e.type));
      if (events.length < 2 || types.size < 2) continue;
      const rows = simulateCwnd({ ssthresh0, T, events, noPlus3: false });
      let cum = 0;
      const cums = rows.map((r) => (cum += r.cwnd));
      const k = g.int(cums[2] + 1, cums[T - 3]);
      return { ssthresh0, T, events, k, askRound: g.int(2, T), noPlus3: false };
    }
  },
  solve: cwndAnswers,
  explain(p) {
    const rows = simulateCwnd(p);
    const a = cwndAnswers(p);
    let cum = 0;
    const steps = [
      'Vòng $t$ thuộc slow start nếu đầu vòng $cwnd < ssthresh$, thuộc tránh tắc nghẽn nếu $cwnd \\ge ssthresh$ (vòng mà cwnd vừa chạm ssthresh tính là tránh tắc nghẽn).',
      {
        table: {
          head: ['Vòng', 'cwnd', 'ssthresh', 'Pha', 'Cộng dồn', 'Sự kiện cuối vòng'],
          rows: rows.map((r) => {
            cum += r.cwnd;
            return [
              String(r.t),
              String(r.cwnd),
              String(r.ssthresh),
              r.phase === 'ss' ? 'Slow start' : 'Tránh tắc nghẽn',
              String(cum),
              r.event
                ? `${r.event.type === 'dup' ? '3 ACK trùng' : 'Timeout'}: ssthresh = ⌊${r.cwnd}/2⌋ = ${r.event.newSsthresh}, cwnd = ${r.event.newCwnd}`
                : '',
            ];
          }),
        },
      },
      `**Slow start:** ${a.ss}. **Tránh tắc nghẽn:** ${a.ca}.`,
      `**3 ACK trùng** (cwnd rơi khoảng một nửa): vòng ${a.dup}. **Timeout** (cwnd rơi về 1): vòng ${a.to}.`,
      `**ssthresh ban đầu:** ${p.ssthresh0} (cwnd ngừng nhân đôi khi chạm giá trị này). **ssthresh sau các sự kiện:** ${a.sAfter}.`,
      `**Segment thứ ${p.k}:** cộng dồn cwnd tới khi vượt ${p.k}: được gửi ở vòng ${a.kRound}.`,
    ];
    const capped = rows.find((r, i) => i > 0 && rows[i - 1].phase === 'ss' && rows[i - 1].cwnd * 2 > rows[i - 1].ssthresh && rows[i - 1].event === undefined && r.cwnd === rows[i - 1].ssthresh);
    if (capped) steps.push(`Ở vòng ${capped.t}, slow start không nhân đôi được vì $2 \\times ${rows[capped.t - 2].cwnd} > ssthresh = ${capped.cwnd}$, nên cwnd chỉ lên ${capped.cwnd} rồi tăng tuyến tính.`);
    return steps;
  },
  view(p) {
    const rows = simulateCwnd(p);
    const a = cwndAnswers(p);
    return {
      statement: [
        `Đồ thị dưới đây cho cwnd (đơn vị segment) của một kết nối TCP Reno ở đầu mỗi vòng truyền $t = 1 … ${p.T}$. Ban đầu cwnd = 1. Mất gói (nếu có) được phát hiện ở cuối vòng và có hiệu lực từ vòng sau.`,
        'Nhập các khoảng dạng `1-3, 12-14`; ghi `x` nếu không có.',
      ],
      figure: { type: 'cwnd', rounds: rows.map((r) => r.cwnd) },
      fields: [
        { key: 'ss', label: 'Các vòng TCP ở slow start', kind: 'text', norm: 'intset' },
        { key: 'ca', label: 'Các vòng TCP ở tránh tắc nghẽn', kind: 'text', norm: 'intset' },
        { key: 'dup', label: 'Mất gói phát hiện bằng 3 ACK trùng ở cuối vòng nào?', kind: 'text', norm: 'intset', mistakes: [{ value: a.to, msg: 'Đó là các vòng timeout (cwnd rơi về 1). 3 ACK trùng thì cwnd rơi khoảng một nửa.' }] },
        { key: 'to', label: 'Mất gói do timeout ở cuối vòng nào?', kind: 'text', norm: 'intset', mistakes: [{ value: a.dup, msg: 'Đó là các vòng 3 ACK trùng. Timeout thì cwnd rơi về 1.' }] },
        { key: 's0', label: 'ssthresh ban đầu', kind: 'number', exact: true },
        { key: 'sAfter', label: 'ssthresh sau từng sự kiện mất gói (theo thứ tự, cách nhau bởi dấu phẩy)', kind: 'text', norm: 'seq' },
        { key: 'cAt', label: `cwnd ở vòng ${p.askRound}`, kind: 'number', exact: true },
        { key: 'kRound', label: `Segment thứ ${p.k} được gửi ở vòng nào?`, kind: 'number', exact: true },
      ],
    };
  },
};

export default def;
