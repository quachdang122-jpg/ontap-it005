import { tn } from '../lib/format';
import { rng } from '../lib/rng';
import type { ProblemDef } from './types';

export interface P {
  /** Mbps */
  R: number;
  /** yêu cầu/giây */
  lambda: number;
  /** Kbit */
  size: number;
  h: number;
  /** giây */
  dI: number;
  dL: number;
}

export function webCache({ R, lambda, size, h, dI, dL }: P) {
  const before = (lambda * size * 1e3) / (R * 1e6);
  return { before, after: (1 - h) * before, delay: (1 - h) * (dI + dL) + h * dL };
}

const def: ProblemDef<P> = {
  id: 'web-cache',
  chapter: 2,
  section: '2.6',
  title: 'Web cache của tổ chức',
  asks: 'Mạng tổ chức nối Internet qua một link truy cập. Tính utilization của link trước và sau khi đặt web cache với hit rate h, và trễ trung bình.',
  formulas: [
    'U_{\\text{trước}} = \\frac{\\lambda \\cdot L}{R_{\\text{truy cập}}}',
    'U_{\\text{sau}} = (1-h)\\, U_{\\text{trước}}',
    '\\bar{d} \\approx (1-h)(d_{\\text{Internet}} + d_{LAN}) + h \\cdot d_{LAN}',
  ],
  generate(seed) {
    const g = rng(seed);
    for (;;) {
      const R = g.pick([1.54, 2, 5, 10, 15, 20, 100]);
      const size = g.pick([100, 200, 500, 1000]);
      const lambda = g.int(1, 400);
      const u = (lambda * size * 1e3) / (R * 1e6);
      if (u >= 0.6 && u <= 0.98) {
        return { R, lambda, size, h: g.pick([0.2, 0.25, 0.3, 0.4, 0.5, 0.6]), dI: g.pick([1, 1.5, 2, 2.5, 3]), dL: g.pick([0.01, 0.02, 0.05]) };
      }
    }
  },
  solve(p) {
    return webCache(p);
  },
  explain(p) {
    const w = webCache(p);
    return [
      `**Không có cache:** lưu lượng qua link $= ${p.lambda} \\times ${p.size}\\text{ Kbit} = ${tn(p.lambda * p.size * 1e3)}$ bps, nên $U = \\frac{${tn(p.lambda * p.size * 1e3)}}{${tn(p.R * 1e6)}} = ${tn(w.before, 3)}$.${w.before > 0.9 ? ' Gần 1 nên trễ hàng đợi rất lớn.' : ''}`,
      `**Có cache:** chỉ phần $1 - h = ${tn(1 - p.h)}$ yêu cầu phải đi qua link: $U = ${tn(1 - p.h)} \\times ${tn(w.before, 3)} = ${tn(w.after, 3)}$.`,
      `**Trễ trung bình:** yêu cầu trượt cache đi ra Internet ($${p.dI} + ${p.dL}$ s), yêu cầu trúng chỉ tốn trễ LAN: $${tn(1 - p.h)} \\times ${tn(p.dI + p.dL)} + ${p.h} \\times ${p.dL} = ${tn(w.delay)}$ s.`,
    ];
  },
  view(p) {
    const w = webCache(p);
    return {
      statement: [
        `Mạng của một tổ chức nối ra Internet qua link truy cập $${p.R}$ Mbps. Trình duyệt trong mạng gửi trung bình $${p.lambda}$ yêu cầu/s, mỗi đối tượng $${p.size}$ Kbit. Trễ từ router phía Internet tới server gốc và về là $${p.dI}$ s; trễ trong LAN là $${p.dL}$ s. Tổ chức đặt một web cache với hit rate $h = ${p.h}$.`,
        'Bỏ qua trễ hàng đợi trên link truy cập khi tính trễ trung bình (sau khi có cache utilization đã thấp).',
      ],
      fields: [
        { key: 'before', label: 'Utilization link truy cập khi chưa có cache', kind: 'number' },
        { key: 'after', label: 'Utilization link truy cập khi có cache', kind: 'number', mistakes: [{ value: p.h * w.before, msg: 'Chỉ phần (1 − h) yêu cầu trượt cache mới đi qua link truy cập.' }] },
        {
          key: 'delay',
          label: 'Trễ trung bình khi có cache',
          kind: 'number',
          unit: 's',
          mistakes: [{ value: (1 - p.h) * p.dI + p.h * p.dL, msg: 'Yêu cầu trượt cache cũng phải đi qua LAN: trễ là d_Internet + d_LAN.' }],
        },
      ],
    };
  },
};

export default def;
