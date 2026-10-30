import { rng } from '../lib/rng';
import type { ProblemDef } from './types';

export type RdtEvent = 'lossPkt' | 'lossAck' | 'corruptPkt' | 'corruptAck' | 'premature';

export interface P {
  proto: 'rdt2.2' | 'rdt3.0';
  k: number;
  event: RdtEvent;
  at: number;
}

const EVENT_TEXT: Record<RdtEvent, (s: number) => string> = {
  lossPkt: (s) => `lần gửi đầu tiên của pkt${s} bị mất trên đường`,
  lossAck: (s) => `ACK${s} (trả lời lần gửi đầu của pkt${s}) bị mất trên đường về`,
  corruptPkt: (s) => `lần gửi đầu tiên của pkt${s} tới nơi nhưng bị lỗi bit`,
  corruptAck: (s) => `ACK${s} (trả lời lần gửi đầu của pkt${s}) tới bên gửi nhưng bị lỗi bit`,
  premature: (s) => `ACK${s} (trả lời lần gửi đầu của pkt${s}) bị trễ, về tới bên gửi sau khi timer đã hết giờ`,
};

export interface RdtTrace {
  pkts: string[];
  acks: string[];
  delivered: number;
  log: string[];
}

/** Mô phỏng stop-and-wait (rdt2.2 / rdt3.0) gửi k thông điệp với một sự kiện bất thường. */
export function simulateRdt(p: P): RdtTrace {
  const pkts: string[] = [];
  const acks: string[] = [];
  const log: string[] = [];
  let delivered = 0;
  for (let m = 0; m < p.k; m++) {
    const s = m % 2;
    const ev = m === p.at ? p.event : null;
    pkts.push(`pkt${s}`);
    if (!ev) {
      delivered++;
      acks.push(`ACK${s}`);
      log.push(`pkt${s} tới đúng → bên nhận đưa lên tầng trên, gửi ACK${s} → bên gửi chuyển sang thông điệp tiếp.`);
      continue;
    }
    switch (ev) {
      case 'lossPkt':
        log.push(`pkt${s} bị mất. Bên gửi không nhận được ACK, timer hết giờ → gửi lại pkt${s}.`);
        break;
      case 'corruptPkt':
        acks.push(`ACK${1 - s}`);
        log.push(
          `pkt${s} tới nhưng lỗi → bên nhận gửi ACK${1 - s} (ACK của gói đúng gần nhất). ` +
            (p.proto === 'rdt2.2' ? `Bên gửi thấy ACK trùng → gửi lại pkt${s} ngay.` : `Bên gửi bỏ qua ACK${1 - s}, chờ timer hết giờ → gửi lại pkt${s}.`),
        );
        break;
      case 'lossAck':
        delivered++;
        acks.push(`ACK${s}`);
        log.push(`pkt${s} tới đúng → đưa lên tầng trên, gửi ACK${s} nhưng ACK bị mất. Timer hết giờ → bên gửi gửi lại pkt${s}.`);
        break;
      case 'corruptAck':
        delivered++;
        acks.push(`ACK${s}`);
        log.push(`pkt${s} tới đúng → đưa lên tầng trên, gửi ACK${s} nhưng ACK tới bên gửi bị lỗi → bên gửi gửi lại pkt${s}.`);
        break;
      case 'premature':
        delivered++;
        acks.push(`ACK${s}`);
        log.push(`pkt${s} tới đúng → đưa lên tầng trên, gửi ACK${s} nhưng ACK bị trễ. Timer hết giờ trước → bên gửi gửi lại pkt${s}.`);
        break;
    }
    // lần gửi lại: luôn thành công
    pkts.push(`pkt${s}`);
    if (ev === 'lossPkt' || ev === 'corruptPkt') {
      delivered++;
      acks.push(`ACK${s}`);
      log.push(`pkt${s} gửi lại tới đúng → đưa lên tầng trên, gửi ACK${s}.`);
    } else {
      acks.push(`ACK${s}`);
      log.push(
        ev === 'premature'
          ? `ACK${s} (bị trễ) về tới → bên gửi chuyển sang thông điệp tiếp. Bên nhận thấy pkt${s} trùng → bỏ, gửi lại ACK${s}; bên gửi bỏ qua ACK${s} thứ hai.`
          : `Bên nhận thấy pkt${s} trùng → bỏ (không đưa lên lần nữa), gửi lại ACK${s} → bên gửi chuyển sang thông điệp tiếp.`,
      );
    }
  }
  return { pkts, acks, delivered, log };
}

interface Concept {
  label: string;
  options: string[];
  answer: string;
}

function concept(p: P): Concept {
  const s = p.at % 2;
  if (p.event === 'corruptPkt')
    return { label: `Khi nhận pkt${s} bị lỗi, bên nhận gửi gì?`, options: [`ACK${1 - s}`, `ACK${s}`, 'NAK', 'Không gửi gì'], answer: `ACK${1 - s}` };
  if (p.event === 'lossPkt')
    return { label: 'Bên gửi biết phải gửi lại nhờ đâu?', options: ['Timer hết giờ', 'Nhận ACK trùng', 'Nhận NAK', 'Checksum của ACK'], answer: 'Timer hết giờ' };
  return {
    label: `Khi nhận pkt${s} lần thứ hai (gói trùng), bên nhận làm gì?`,
    options: [`Bỏ gói, gửi lại ACK${s}`, `Đưa lên tầng trên lần nữa và gửi ACK${s}`, 'Bỏ gói, không gửi gì', `Gửi ACK${1 - s}`],
    answer: `Bỏ gói, gửi lại ACK${s}`,
  };
}

const seqAlt = (xs: string[]) => [xs.join(', '), xs.map((x) => x.replace(/\D/g, '')).join(', ')];

const def: ProblemDef<P> = {
  id: 'rdt',
  chapter: 3,
  section: '3.3',
  title: 'Truyền tin cậy: rdt2.2 và rdt3.0',
  asks: 'Cho giao thức stop-and-wait (rdt2.2 hoặc rdt3.0) và một sự kiện bất thường (mất gói, mất ACK, gói lỗi, timeout sớm). Liệt kê các gói, ACK được gửi và cách bên nhận xử lý.',
  formulas: [
    '\\text{rdt2.2: không có NAK; gói lỗi/trùng} \\Rightarrow \\text{gửi lại ACK của gói đúng gần nhất}',
    '\\text{rdt3.0: thêm timer; hết giờ mà chưa có ACK đúng} \\Rightarrow \\text{gửi lại}',
    '\\text{Gói trùng: bỏ đi nhưng vẫn gửi lại ACK}',
  ],
  generate(seed) {
    const g = rng(seed);
    const proto = g.pick(['rdt2.2', 'rdt3.0'] as const);
    const event = proto === 'rdt2.2' ? g.pick(['corruptPkt', 'corruptAck'] as const) : g.pick(['lossPkt', 'lossAck', 'corruptPkt', 'premature'] as const);
    const k = 3;
    return { proto, k, event, at: g.int(0, k - 1) };
  },
  solve(p) {
    const t = simulateRdt(p);
    return { pkts: seqAlt(t.pkts), acks: seqAlt(t.acks), count: t.pkts.length, delivered: t.delivered, concept: concept(p).answer };
  },
  explain(p) {
    const t = simulateRdt(p);
    return [
      ...t.log.map((x, i) => `${i + 1}. ${x}`),
      `**Các gói bên gửi phát:** ${t.pkts.join(', ')} (${t.pkts.length} lần).`,
      `**Các ACK bên nhận gửi:** ${t.acks.join(', ')}.`,
      `Nhờ số thứ tự 0/1, dữ liệu không bao giờ bị đưa lên trùng: tầng trên nhận đúng ${t.delivered} thông điệp.`,
    ];
  },
  view(p) {
    const c = concept(p);
    const s = p.at % 2;
    return {
      statement: [
        `Bên gửi dùng **${p.proto}** để gửi ${p.k} thông điệp liên tiếp (số thứ tự lần lượt 0, 1, 0). Mọi gói và ACK đều tới đúng, trừ một sự kiện: ${EVENT_TEXT[p.event](s)}${p.k > 1 ? ` (đó là thông điệp thứ ${p.at + 1})` : ''}. Lần gửi lại luôn thành công.`,
        'Ghi các chuỗi theo thứ tự thời gian, cách nhau bởi dấu phẩy, ví dụ: `pkt0, pkt1, pkt1` hoặc `ACK0, ACK1`.',
      ],
      fields: [
        { key: 'pkts', label: 'Chuỗi các gói bên gửi phát (kể cả gửi lại)', kind: 'text', norm: 'seq', placeholder: 'pkt0, pkt1, ...' },
        { key: 'acks', label: 'Chuỗi các ACK bên nhận gửi (kể cả ACK bị mất/lỗi)', kind: 'text', norm: 'seq', placeholder: 'ACK0, ...' },
        { key: 'count', label: 'Tổng số lần bên gửi phát gói dữ liệu', kind: 'number', exact: true },
        { key: 'delivered', label: 'Số thông điệp được đưa lên tầng trên ở bên nhận', kind: 'number', exact: true, mistakes: [{ value: p.k + 1, msg: 'Gói trùng bị bỏ, không đưa lên tầng trên lần nữa.' }] },
        { key: 'concept', label: c.label, kind: 'choice', options: c.options, shuffle: true },
      ],
    };
  },
};

export default def;
