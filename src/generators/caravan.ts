import { ti } from '../lib/format';
import { rng } from '../lib/rng';
import type { ProblemDef } from './types';

export interface P {
  n: number;
  /** giây phục vụ mỗi xe */
  t: number;
  /** km */
  d: number;
  /** km/h */
  v: number;
}

export function caravan({ n, t, d, v }: P) {
  const travel = (d / v) * 3600;
  return {
    service: n * t,
    travel,
    firstServed: (n - 1) * t + travel,
    total: n * t + travel,
  };
}

const def: ProblemDef<P> = {
  id: 'caravan',
  chapter: 1,
  section: '1.3',
  title: 'Ví dụ đoàn xe (Car–Caravan)',
  asks: 'Đoàn xe đi qua các trạm thu phí; mỗi trạm phục vụ một xe mất một khoảng thời gian và cả đoàn phải tập trung đủ ở trạm thì xe đầu mới được phục vụ. Tính các mốc thời gian.',
  formulas: [
    'd_{\\text{trans}} \\leftrightarrow n \\cdot t \\quad (\\text{phục vụ cả đoàn})',
    'd_{\\text{prop}} \\leftrightarrow \\frac{d}{v} \\quad (\\text{xe chạy giữa hai trạm})',
    't_{\\text{xe đầu được phục vụ ở trạm sau}} = (n-1)\\,t + \\frac{d}{v}',
    't_{\\text{tổng}} = n\\,t + \\frac{d}{v}',
  ],
  generate(seed) {
    const g = rng(seed);
    for (;;) {
      const v = g.pick([60, 72, 80, 90, 100, 120]);
      const d = g.int(4, 30) * 10;
      const travel = (d / v) * 3600;
      if (Number.isInteger(travel)) return { n: g.int(5, 12), t: g.pick([6, 8, 10, 12, 15, 20]), d, v };
    }
  },
  solve(p) {
    return caravan(p);
  },
  explain(p) {
    const c = caravan(p);
    return [
      `**Phục vụ cả đoàn** (giống trễ truyền): $${p.n} \\times ${p.t} = ${c.service}$ s.`,
      `**Một xe chạy giữa hai trạm** (giống trễ lan truyền): $\\frac{${p.d}}{${p.v}}$ giờ $= ${ti(c.travel)}$ s. Xe nào cũng mất đúng khoảng này.`,
      `**Từ lúc xe đầu rời trạm 1 tới lúc nó được phục vụ ở trạm 2:** xe đầu tới nơi nhưng phải chờ xe cuối. Xe cuối rời trạm 1 chậm hơn xe đầu $(${p.n} - 1) \\times ${p.t} = ${(p.n - 1) * p.t}$ s, rồi chạy $${ti(c.travel)}$ s, nên đáp án là $${(p.n - 1) * p.t} + ${ti(c.travel)} = ${ti(c.firstServed)}$ s.`,
      `**Từ lúc bắt đầu phục vụ ở trạm 1 tới lúc cả đoàn tập trung đủ ở trạm 2:** $${c.service} + ${ti(c.travel)} = ${ti(c.total)}$ s, đúng bằng $d_{\\text{trans}} + d_{\\text{prop}}$.`,
    ];
  },
  view(p) {
    const c = caravan(p);
    return {
      statement: [
        `Một đoàn $${p.n}$ xe đi qua hai trạm thu phí. Mỗi trạm phục vụ một xe mất $${p.t}$ s. Hai trạm cách nhau $${p.d}$ km, xe chạy $${p.v}$ km/h. Cả đoàn phải tập trung đủ ở trạm thì xe đầu mới được phục vụ.`,
      ],
      fields: [
        { key: 'service', label: 'Thời gian trạm phục vụ cả đoàn', kind: 'number', unit: 's' },
        { key: 'travel', label: 'Thời gian một xe chạy giữa hai trạm', kind: 'number', unit: 's' },
        {
          key: 'firstServed',
          label: 'Từ lúc xe đầu rời trạm 1 tới lúc nó được phục vụ ở trạm 2',
          kind: 'number',
          unit: 's',
          mistakes: [{ value: c.travel, msg: 'Quên điều kiện “phải đủ đoàn”: xe đầu tới nơi nhưng phải đứng chờ xe cuối.' }],
        },
        {
          key: 'total',
          label: 'Từ lúc bắt đầu phục vụ ở trạm 1 tới lúc cả đoàn tập trung đủ ở trạm 2',
          kind: 'number',
          unit: 's',
          mistakes: [{ value: c.firstServed, msg: 'Tính từ lúc BẮT ĐẦU phục vụ xe đầu ở trạm 1, nên phải cộng đủ n·t, không phải (n−1)·t.' }],
        },
      ],
    };
  },
};

export default def;
