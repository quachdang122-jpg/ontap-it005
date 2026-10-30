import { tn } from '../lib/format';
import { rng } from '../lib/rng';
import type { ProblemDef } from './types';

export interface P {
  /** Mbps */
  Rs: number;
  Rc: number;
  R: number;
  n: number;
}

export function throughput({ Rs, Rc, R, n }: P) {
  const tp = Math.min(Rs, Rc, R / n);
  return { tp, us: tp / Rs, uc: tp / Rc, ur: (n * tp) / R };
}

const def: ProblemDef<P> = {
  id: 'throughput',
  chapter: 1,
  section: '1.7',
  title: 'Thông lượng đầu cuối',
  asks: 'n cặp server–client cùng đi qua một link chung tốc độ R (chia đều). Mỗi server có link truy cập Rs, mỗi client có link Rc. Tính thông lượng mỗi cặp và mức sử dụng (utilization) của từng loại link.',
  formulas: [
    '\\text{Thông lượng mỗi cặp} = \\min\\left(R_s, R_c, \\frac{R}{n}\\right)',
    '\\text{Utilization} = \\frac{\\text{lưu lượng thực đi qua link}}{\\text{tốc độ link}}',
    'U_{\\text{chung}} = \\frac{n \\cdot \\text{thông lượng}}{R}',
  ],
  generate(seed) {
    const g = rng(seed);
    for (;;) {
      const p = { Rs: g.pick([10, 20, 30, 40, 50, 60, 80, 100]), Rc: g.pick([10, 20, 30, 40, 50, 60, 80, 90, 100]), R: g.pick([60, 100, 150, 200, 240, 300, 400, 500]), n: g.int(2, 6) };
      // tránh hòa nút cổ chai để câu hỏi “link nào là cổ chai” rõ ràng
      const vals = [p.Rs, p.Rc, p.R / p.n].sort((a, b) => a - b);
      if (vals[0] !== vals[1]) return p;
    }
  },
  solve(p) {
    const t = throughput(p);
    const bottleneck = t.tp === p.Rs ? 'Link truy cập của server' : t.tp === p.Rc ? 'Link truy cập của client' : 'Link chung';
    return { ...t, bottleneck };
  },
  explain(p) {
    const t = throughput(p);
    return [
      `**Thông lượng mỗi cặp:** $\\min(R_s, R_c, R/n) = \\min(${p.Rs}, ${p.Rc}, ${tn(p.R / p.n)}) = ${tn(t.tp)}$ Mbps.`,
      `**Utilization link server:** $\\frac{${tn(t.tp)}}{${p.Rs}} = ${tn(t.us, 3)}$.`,
      `**Utilization link client:** $\\frac{${tn(t.tp)}}{${p.Rc}} = ${tn(t.uc, 3)}$.`,
      `**Utilization link chung:** link chung chở $${p.n}$ luồng nên $\\frac{${p.n} \\times ${tn(t.tp)}}{${p.R}} = ${tn(t.ur, 3)}$.`,
      'Link có utilization bằng 1 chính là nút cổ chai.',
    ];
  },
  view(p) {
    const t = throughput(p);
    return {
      statement: [
        `Có $n = ${p.n}$ cặp server–client. Mỗi server nối vào mạng bằng link $R_s = ${p.Rs}$ Mbps, mỗi client bằng link $R_c = ${p.Rc}$ Mbps. Cả $${p.n}$ luồng cùng đi qua một link chung $R = ${p.R}$ Mbps, chia đều cho các luồng. Các link khác đủ nhanh.`,
      ],
      fields: [
        { key: 'tp', label: 'Thông lượng đầu cuối của mỗi cặp', kind: 'number', unit: 'Mbps', mistakes: [{ value: p.R, msg: 'Link chung được chia đều cho n luồng: dùng R/n.' }] },
        { key: 'bottleneck', label: 'Nút cổ chai là', kind: 'choice', options: ['Link truy cập của server', 'Link truy cập của client', 'Link chung'] },
        { key: 'us', label: 'Utilization link server', kind: 'number' },
        { key: 'uc', label: 'Utilization link client', kind: 'number' },
        { key: 'ur', label: 'Utilization link chung', kind: 'number', mistakes: [{ value: t.tp / p.R, msg: 'Link chung chở cả n luồng: lưu lượng là n × thông lượng mỗi cặp.' }] },
      ],
    };
  },
};

export default def;
