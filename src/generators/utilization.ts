import { ti, tn } from '../lib/format';
import { rng } from '../lib/rng';
import type { ProblemDef } from './types';
import { rateTex } from './units';

export interface P {
  L: number;
  Lunit: 'bit' | 'byte' | 'Kbit';
  /** bps */
  R: number;
  /** ms */
  rtt: number;
  N: number;
  target: number;
}

export function lBits(p: Pick<P, 'L' | 'Lunit'>) {
  return p.Lunit === 'byte' ? p.L * 8 : p.Lunit === 'Kbit' ? p.L * 1e3 : p.L;
}

export function utilization(p: P) {
  const tr = (lBits(p) / p.R) * 1e3; // ms
  const cycle = p.rtt + tr;
  return {
    tr,
    usw: tr / cycle,
    un: Math.min(1, (p.N * tr) / cycle),
    nmin: Math.ceil((p.target * cycle) / tr - 1e-9),
  };
}

const def: ProblemDef<P> = {
  id: 'utilization',
  chapter: 3,
  section: '3.4',
  title: 'Hiệu suất stop-and-wait và pipelining',
  asks: 'Cho kích thước gói L, tốc độ R, RTT. Tính hiệu suất (utilization) của stop-and-wait, của pipelining N gói, và số gói tối thiểu cần pipelining để đạt mục tiêu.',
  formulas: [
    'U_{\\text{stop-and-wait}} = \\frac{L/R}{RTT + L/R}',
    'U_{\\text{pipelining } N} = \\frac{N \\cdot L/R}{RTT + L/R} \\ (\\le 1)',
    'N_{\\min} = \\left\\lceil \\frac{U_{\\text{mục tiêu}} (RTT + L/R)}{L/R} \\right\\rceil',
  ],
  generate(seed) {
    const g = rng(seed);
    for (;;) {
      const [L, Lunit] = g.pick([
        [1000, 'byte'],
        [1500, 'byte'],
        [8000, 'bit'],
        [12000, 'bit'],
        [10, 'Kbit'],
        [100, 'Kbit'],
      ] as const);
      const R = g.pick([1, 10, 100, 1000]) * 1e6;
      const rtt = g.pick([1, 2, 5, 10, 20, 30, 50, 80, 100]);
      const target = g.pick([0.5, 0.8, 0.9, 0.95]);
      const base = { L, Lunit, R, rtt, N: 1, target };
      const u = utilization(base);
      if (u.usw > 0.6 || u.nmin > 20000) continue;
      const N = g.int(2, Math.max(2, Math.min(u.nmin - 1, 50)));
      return { ...base, N };
    }
  },
  solve(p) {
    const u = utilization(p);
    return { tr: u.tr, usw: u.usw, un: u.un, nmin: u.nmin };
  },
  explain(p) {
    const u = utilization(p);
    const bits = lBits(p);
    return [
      `$\\frac{L}{R} = \\frac{${ti(bits)}}{${tn(p.R)}} = ${tn(u.tr)}$ ms${p.Lunit === 'byte' ? ` (nhớ đổi $${p.L}$ byte $= ${ti(bits)}$ bit)` : ''}.`,
      `**Stop-and-wait:** $U = \\frac{${tn(u.tr)}}{${p.rtt} + ${tn(u.tr)}} = ${tn(u.usw)}$.`,
      `**Pipelining ${p.N} gói:** $U = \\frac{${p.N} \\times ${tn(u.tr)}}{${tn(p.rtt + u.tr)}} = ${tn(u.un)}$${(p.N * u.tr) / (p.rtt + u.tr) > 1 ? ' (chặn trên ở 1)' : ''}.`,
      `**Để $U \\ge ${p.target}$:** $N \\ge \\frac{${p.target} \\times ${tn(p.rtt + u.tr)}}{${tn(u.tr)}} = ${tn((p.target * (p.rtt + u.tr)) / u.tr, 6)}$, tức ít nhất $${u.nmin}$ gói (làm tròn lên).`,
    ];
  },
  view(p) {
    const u = utilization(p);
    return {
      statement: [
        `Bên gửi phát các gói $L = ${ti(p.L)}$ ${p.Lunit} trên link $R = ${rateTex(p.R)}$, RTT $= ${p.rtt}$ ms. Bỏ qua thời gian truyền ACK.`,
      ],
      fields: [
        { key: 'tr', label: 'Thời gian đẩy một gói L/R', kind: 'number', unit: 'ms', mistakes: p.Lunit === 'byte' ? [{ value: u.tr / 8, msg: 'Có thể bạn quên nhân 8 khi đổi byte sang bit.' }] : [] },
        { key: 'usw', label: 'Hiệu suất bên gửi với stop-and-wait (dạng thập phân hoặc %)', kind: 'number', mistakes: [{ value: u.tr / p.rtt, msg: 'Mẫu số là RTT + L/R, không chỉ RTT.' }] },
        { key: 'un', label: `Hiệu suất khi pipelining ${p.N} gói`, kind: 'number' },
        { key: 'nmin', label: `Số gói tối thiểu cần pipelining để hiệu suất ≥ ${p.target * 100}%`, kind: 'number', exact: true, mistakes: [{ value: u.nmin - 1, msg: 'Phải làm tròn LÊN để đạt mục tiêu.' }] },
      ],
    };
  },
};

export default def;
