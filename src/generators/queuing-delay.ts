import { ti, tn } from '../lib/format';
import { rng } from '../lib/rng';
import type { ProblemDef } from './types';
import { rateTex } from './units';

export interface P {
  /** bps */
  R: number;
  /** bit */
  L: number;
  /** gói/giây */
  a: number;
}

export function queuing({ R, L, a }: P) {
  const I = (L * a) / R;
  const LR = L / R;
  const dq = I < 1 ? (I * LR) / (1 - I) : Infinity;
  return { I, LR, dq };
}

const def: ProblemDef<P> = {
  id: 'queuing-delay',
  chapter: 1,
  section: '1.5',
  title: 'Trễ hàng đợi',
  asks: 'Cho tốc độ link R, kích thước gói L, tốc độ gói đến trung bình a. Tính cường độ lưu lượng và trễ hàng đợi trung bình theo công thức xấp xỉ.',
  formulas: [
    'I = \\frac{L \\cdot a}{R}',
    'd_{\\text{queue}} \\approx \\frac{I \\cdot L}{R\\,(1 - I)} \\quad (I < 1)',
    'I \\ge 1 \\Rightarrow \\text{hàng đợi tăng không giới hạn}',
  ],
  generate(seed) {
    const g = rng(seed);
    for (;;) {
      const R = g.pick([1, 2, 5, 10]) * 1e6;
      const L = g.pick([1000, 2000, 4000, 5000, 8000, 10000]);
      const mu = R / L;
      const I = g.bool(0.15) ? g.pick([1.1, 1.2, 1.25, 1.5]) : g.pick([0.2, 0.25, 0.4, 0.5, 0.6, 0.75, 0.8, 0.9, 0.95]);
      const a = mu * I;
      if (Number.isInteger(a) && a > 0) return { R, L, a };
    }
  },
  solve(p) {
    const q = queuing(p);
    return { LR: q.LR * 1e3, I: q.I, dq: q.dq * 1e3 };
  },
  explain(p) {
    const q = queuing(p);
    const steps = [
      `$\\frac{L}{R} = \\frac{${ti(p.L)}}{${tn(p.R)}} = ${tn(q.LR * 1e3)}$ ms.`,
      `$I = \\frac{L a}{R} = \\frac{${ti(p.L)} \\times ${p.a}}{${tn(p.R)}} = ${tn(q.I)}$.`,
    ];
    if (q.I < 1)
      steps.push(
        `Vì $I < 1$: $d_{\\text{queue}} = \\frac{I}{1 - I} \\cdot \\frac{L}{R} = \\frac{${tn(q.I)}}{${tn(1 - q.I)}} \\times ${tn(q.LR * 1e3)} = ${tn(q.dq * 1e3)}$ ms.`,
        q.I >= 0.9 ? 'I đã gần 1 nên trễ hàng đợi tăng rất nhanh (“bùng nổ khi I → 1”).' : 'Lưu ý: công thức chỉ cho giá trị trung bình xấp xỉ; trong thực tế trễ hàng đợi thay đổi nhiều.',
      );
    else steps.push(`Vì $I = ${tn(q.I)} \\ge 1$: gói đến nhanh hơn tốc độ đẩy ra, hàng đợi tăng **không giới hạn** (thực tế là mất gói). Nhập “vô hạn” hoặc “∞”.`);
    return steps;
  },
  view(p) {
    const q = queuing(p);
    return {
      statement: [
        `Một router đẩy gói ra link tốc độ $R = ${rateTex(p.R)}$. Mỗi gói dài $L = ${ti(p.L)}$ bit, gói đến với tốc độ trung bình $a = ${p.a}$ gói/s.`,
        'Nếu hàng đợi tăng không giới hạn, nhập “vô hạn” hoặc “∞” vào ô trễ hàng đợi.',
      ],
      fields: [
        { key: 'LR', label: 'Thời gian đẩy một gói L/R', kind: 'number', unit: 'ms' },
        { key: 'I', label: 'Cường độ lưu lượng I', kind: 'number' },
        {
          key: 'dq',
          label: 'Trễ hàng đợi trung bình',
          kind: 'number',
          unit: 'ms',
          mistakes:
            q.I < 1
              ? [
                  { value: q.I * q.LR * (1 - q.I) * 1e3, msg: '“IL/R(1 − I)” nghĩa là IL / [R(1 − I)]: thừa số (1 − I) nằm dưới mẫu số.' },
                  { value: (q.LR / (1 - q.I)) * 1e3, msg: 'Thiếu thừa số I ở tử số: d = I·L / [R(1 − I)].' },
                ]
              : [],
        },
      ],
    };
  },
};

export default def;
