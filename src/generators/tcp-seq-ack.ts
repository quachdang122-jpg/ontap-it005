import { rng } from '../lib/rng';
import type { FieldSpec, ProblemDef } from './types';

export interface P {
  seq0: number;
  L: number;
  W: number;
  mode: 'seg' | 'ack';
  /** chỉ số (từ 1) của segment hoặc ACK bị mất */
  lost: number;
  policy: 'keep' | 'discard';
}

export const DELAY = 7;

export interface SenderAction {
  t: number;
  recv: string;
  sends: number[];
  note: string;
}

export function tcpSeqAck(p: P) {
  const { seq0, L, W, mode, lost } = p;
  const seqs = Array.from({ length: W }, (_, i) => seq0 + i * L);
  const acks: (number | null)[] = seqs.map((_, i) => {
    const n = i + 1;
    if (mode === 'ack') return seq0 + n * L;
    if (n < lost) return seq0 + n * L;
    if (n === lost) return null;
    return seq0 + (lost - 1) * L;
  });
  let nextSeq = seq0 + W * L;
  let acked = 0; // số segment đã được ACK tích lũy
  let lastAck: number | null = null;
  let dup = 0;
  let fastRetx: number | null = null;
  const actions: SenderAction[] = acks.map((a, i) => {
    const t = i + 1 + 2 * DELAY;
    const ackLost = mode === 'ack' && i + 1 === lost;
    if (a === null || ackLost) return { t, recv: '(không có)', sends: [], note: ackLost ? 'ACK bị mất trên đường về' : 'Segment bị mất nên không có ACK' };
    if (lastAck !== null && a === lastAck) {
      dup++;
      if (dup === 3) {
        fastRetx = t;
        return { t, recv: `ACK ${a} trùng lần ${dup}`, sends: [a], note: `Đủ 3 ACK trùng → gửi lại nhanh segment Seq ${a}` };
      }
      return { t, recv: `ACK ${a} trùng lần ${dup}`, sends: [], note: 'Không gửi gì' };
    }
    const newly = (a - seq0) / L - acked;
    acked += newly;
    lastAck = a;
    dup = 0;
    const sends = Array.from({ length: newly }, () => {
      const s = nextSeq;
      nextSeq += L;
      return s;
    });
    return { t, recv: `ACK ${a} (mới)`, sends, note: `Cửa sổ trượt ${newly} segment: gửi ${newly} segment mới` };
  });
  let finalAck: number | null = null;
  if (fastRetx !== null) {
    const fr = fastRetx;
    if (p.policy === 'discard') finalAck = seq0 + lost * L;
    else {
      // các segment mới gửi trước lúc gửi lại đều đã tới bên nhận khi segment gửi lại tới
      const newBefore = actions.filter((x) => x.t < fr && x.sends.length && !x.sends.includes(seq0 + (lost - 1) * L)).reduce((s, x) => s + x.sends.length, 0);
      finalAck = seq0 + (W + newBefore) * L;
    }
  }
  return { seqs, acks, actions, fastRetx, finalAck };
}

const fmtAcks = (acks: (number | null)[]) => acks.map((a) => (a === null ? 'x' : String(a))).join(', ');
const fmtSends = (s: number[]) => (s.length ? s.join(', ') : 'x');

const def: ProblemDef<P> = {
  id: 'tcp-seq-ack',
  chapter: 3,
  section: '3.6',
  title: 'Seq và ACK của TCP khi mất segment',
  hot: true,
  asks: 'Bên gửi phát một cửa sổ segment tại t = 1, 2, 3, …; trễ một chiều 7 đơn vị. Điền Seq các segment, ACK bên nhận gửi, và việc bên gửi làm khi các ACK về. Ký hiệu x cho “không có”.',
  formulas: [
    '\\text{Seq}_n = \\text{Seq}_1 + (n-1) \\cdot L',
    '\\text{ACK} = \\text{byte tiếp theo đang chờ}',
    '\\text{Gửi lúc } t \\Rightarrow \\text{tới lúc } t+7; \\ \\text{ACK về lúc } t+14',
    '3 \\text{ ACK trùng} \\Rightarrow \\text{gửi lại nhanh segment có Seq = ACK}',
  ],
  generate(seed) {
    const g = rng(seed);
    const W = g.int(4, 6);
    const mode = g.bool(0.75) ? 'seg' : 'ack';
    return {
      seq0: g.pick([100, 236, 500, 1000, g.int(1, 50) * 10, g.int(100, 999)]),
      L: g.pick([100, 200, 250, 500, 536, 540, 1000]),
      W,
      mode,
      lost: mode === 'seg' ? g.int(2, W - 1) : g.int(1, W),
      policy: g.bool(0.6) ? 'keep' : 'discard',
    };
  },
  solve(p) {
    const r = tcpSeqAck(p);
    const out: Record<string, string | number> = { seqs: r.seqs.join(', '), acks: fmtAcks(r.acks) };
    r.actions.forEach((a) => (out[`t${a.t}`] = fmtSends(a.sends)));
    if (r.finalAck !== null) out.finalAck = r.finalAck;
    return out;
  },
  explain(p) {
    const r = tcpSeqAck(p);
    const steps = [
      `**Bước 1, Seq:** $\\text{Seq}_n = ${p.seq0} + (n-1) \\times ${p.L}$: ${r.seqs.join(', ')} (gửi lúc t = 1…${p.W}). Mất gói không làm đổi Seq.`,
      {
        table: {
          head: ['Segment', 'Gửi lúc', 'Seq', 'Tới lúc', 'ACK gửi về'],
          rows: r.seqs.map((s, i) => [
            String(i + 1),
            String(i + 1),
            String(s),
            p.mode === 'seg' && i + 1 === p.lost ? 'mất' : String(i + 1 + DELAY),
            r.acks[i] === null ? 'x' : `${r.acks[i]}${p.mode === 'ack' && i + 1 === p.lost ? ' (ACK bị mất)' : p.mode === 'seg' && i + 1 > p.lost ? ' (trùng)' : ''}`,
          ]),
        },
      },
      p.mode === 'seg'
        ? `**Bước 2, ACK:** ACK là byte tiếp theo đang chờ. Từ segment ${p.lost + 1} trở đi, segment tới sai thứ tự (${p.policy === 'keep' ? 'được giữ lại' : 'bị bỏ'}) nên ACK kẹt ở ${p.seq0 + (p.lost - 1) * p.L}.`
        : '**Bước 2, ACK:** mọi segment tới đủ nên bên nhận gửi ACK cho từng segment; một ACK bị mất trên đường về nhưng ACK sau là ACK tích lũy, xác nhận luôn phần trước.',
      '**Bước 3, bên gửi phản ứng khi ACK về:**',
      { table: { head: ['t', 'Nhận', 'Bên gửi làm gì', 'Gửi Seq'], rows: r.actions.map((a) => [String(a.t), a.recv, a.note, fmtSends(a.sends)]) } },
    ];
    if (r.fastRetx !== null) {
      const arrive = r.fastRetx + DELAY;
      steps.push(
        p.policy === 'keep'
          ? `**Bước 4:** segment Seq ${p.seq0 + (p.lost - 1) * p.L} gửi lại tới bên nhận lúc t = ${arrive}. Bên nhận đã giữ các segment sai thứ tự và cả các segment mới (tới trước đó), nên ACK nhảy thẳng lên **${r.finalAck}**.`
          : `**Bước 4:** segment Seq ${p.seq0 + (p.lost - 1) * p.L} gửi lại tới lúc t = ${arrive}. Bên nhận đã **bỏ** các segment sai thứ tự (giống GBN), nên ACK chỉ tăng lên **${r.finalAck}**; các segment sau phải gửi lại.`,
      );
    } else if (p.mode === 'seg') steps.push('Không đủ 3 ACK trùng nên không có gửi lại nhanh: bên gửi phải chờ timer hết giờ mới gửi lại segment bị mất.');
    return steps;
  },
  view(p) {
    const r = tcpSeqAck(p);
    const fields: FieldSpec[] = [
      { key: 'seqs', label: `Seq của ${p.W} segment đầu (cách nhau bởi dấu phẩy)`, kind: 'text', norm: 'seq' },
      { key: 'acks', label: 'ACK bên nhận gửi khi lần lượt nhận các segment đó (x nếu không có)', kind: 'text', norm: 'seq' },
      ...r.actions.map(
        (a): FieldSpec => ({
          key: `t${a.t}`,
          label: `t = ${a.t}: bên gửi phát segment có Seq nào? (x nếu không gửi; nhiều segment thì cách nhau bởi dấu phẩy)`,
          kind: 'text',
          norm: 'seq',
        }),
      ),
    ];
    if (r.finalAck !== null)
      fields.push({
        key: 'finalAck',
        label: 'ACK bên nhận gửi khi segment được gửi lại nhanh tới nơi',
        kind: 'number',
        exact: true,
        mistakes: [
          p.policy === 'keep'
            ? { value: p.seq0 + p.lost * p.L, msg: 'Bên nhận GIỮ các segment sai thứ tự nên ACK nhảy qua cả những segment đó.' }
            : { value: r.seqs[p.W - 1] + p.L, msg: 'Bên nhận BỎ segment sai thứ tự: chỉ có thêm đúng segment vừa gửi lại.' },
        ],
      });
    return {
      statement: [
        `Bên gửi TCP có cửa sổ ${p.W} segment, mỗi segment ${p.L} byte, Seq của segment đầu là ${p.seq0}. Các segment được gửi lần lượt lúc t = 1, 2, …, ${p.W}. Trễ một chiều là 7 đơn vị; bên nhận gửi ACK ngay khi nhận segment. Timer đủ dài để không hết giờ trong khoảng xét.`,
        p.mode === 'seg' ? `**Segment thứ ${p.lost} bị mất.** Các segment và ACK khác tới đủ.` : `**ACK của segment thứ ${p.lost} bị mất.** Mọi segment đều tới đủ.`,
        ...(p.mode === 'seg' ? [p.policy === 'keep' ? 'Bên nhận **giữ lại** segment đến sai thứ tự.' : 'Bên nhận **bỏ** segment đến sai thứ tự (giống GBN).'] : []),
      ],
      fields,
    };
  },
};

export default def;
