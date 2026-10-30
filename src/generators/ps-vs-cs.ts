import { tn } from '../lib/format';
import { rng } from '../lib/rng';
import type { ProblemDef } from './types';

export interface P {
  /** tốc độ link, kbps */
  R: number;
  /** tốc độ mỗi người khi hoạt động, kbps */
  r: number;
  p: number;
  N: number;
}

function logChoose(n: number, k: number): number {
  let s = 0;
  for (let i = 1; i <= k; i++) s += Math.log(n - k + i) - Math.log(i);
  return s;
}

export function binomPmf(N: number, n: number, p: number): number {
  if (n < 0 || n > N) return 0;
  return Math.exp(logChoose(N, n) + n * Math.log(p) + (N - n) * Math.log(1 - p));
}

/** P(X > m) = 1 − Σ_{n=0}^{m} P(X = n), tính bằng tổng phần đuôi để tránh mất chính xác. */
export function binomTail(N: number, m: number, p: number): number {
  let s = 0;
  for (let n = m + 1; n <= N; n++) s += binomPmf(N, n, p);
  return s;
}

export function psVsCs({ R, r, p, N }: P) {
  const m = Math.floor(R / r);
  return { users: m, pk: binomPmf(N, m + 1, p), tail: binomTail(N, m, p) };
}

const rate = (kbps: number) => (kbps >= 1000 ? `${kbps / 1000}\\text{ Mbps}` : `${kbps}\\text{ kbps}`);

const def: ProblemDef<P> = {
  id: 'ps-vs-cs',
  chapter: 1,
  section: '1.2',
  title: 'So sánh chuyển mạch gói và chuyển mạch kênh',
  asks: 'Link tốc độ R chia cho nhiều người dùng, mỗi người cần r khi hoạt động và hoạt động với xác suất p. Chuyển mạch kênh phục vụ được bao nhiêu người? Với chuyển mạch gói và N người, xác suất quá tải là bao nhiêu?',
  formulas: [
    'N_{CS} = \\frac{R}{r}',
    'P(X = n) = \\binom{N}{n} p^n (1-p)^{N-n}',
    'P\\left(X > \\tfrac{R}{r}\\right) = 1 - \\sum_{n=0}^{R/r} \\binom{N}{n} p^n (1-p)^{N-n}',
  ],
  generate(seed) {
    const g = rng(seed);
    for (;;) {
      const R = g.pick([1000, 2000, 3000, 5000, 10000]);
      const r = g.pick([100, 150, 200, 250, 500, 1000]);
      const m = R / r;
      if (!Number.isInteger(m) || m < 5 || m > 25) continue;
      const p = g.pick([0.05, 0.1, 0.15, 0.2]);
      const cands: number[] = [];
      for (let N = m + 5; N <= 300; N += 5) {
        const t = binomTail(N, m, p);
        if (t > 1e-4 && t < 0.05) cands.push(N);
      }
      if (cands.length) return { R, r, p, N: g.pick(cands) };
    }
  },
  solve(p) {
    return psVsCs(p);
  },
  explain(p) {
    const { users: m, pk, tail } = psVsCs(p);
    return [
      `**Chuyển mạch kênh:** mỗi người được giữ chỗ $r$ dù không dùng, nên số người tối đa là $\\frac{R}{r} = \\frac{${rate(p.R)}}{${rate(p.r)}} = ${m}$.`,
      `**Đúng ${m + 1} người hoạt động:** $\\binom{${p.N}}{${m + 1}} (${p.p})^{${m + 1}} (${+(1 - p.p).toFixed(2)})^{${p.N - m - 1}} \\approx ${tn(pk)}$.`,
      `**Quá tải (hơn ${m} người cùng hoạt động, tức từ ${m + 1} trở lên):** $P(X > ${m}) = 1 - \\sum_{n=0}^{${m}} \\binom{${p.N}}{n} (${p.p})^n (${+(1 - p.p).toFixed(2)})^{${p.N}-n} \\approx ${tn(tail)}$.`,
      `Kết luận: chuyển mạch gói phục vụ $${p.N}$ người mà xác suất quá tải chỉ khoảng $${tn(tail, 3)}$, trong khi chuyển mạch kênh chỉ phục vụ $${m}$ người.`,
    ];
  },
  view(p) {
    const { users: m } = psVsCs(p);
    const atLeastM = binomTail(p.N, m - 1, p.p);
    return {
      statement: [
        `Một link tốc độ $R = ${rate(p.R)}$ được chia cho nhiều người dùng. Mỗi người khi hoạt động cần $r = ${rate(p.r)}$ và hoạt động với xác suất $p = ${p.p}$ (độc lập với nhau).`,
        `Với chuyển mạch gói, có $N = ${p.N}$ người dùng chung link.`,
      ],
      fields: [
        { key: 'users', label: 'Số người tối đa với chuyển mạch kênh', kind: 'number', exact: true },
        { key: 'pk', label: `Xác suất có đúng ${m + 1} người cùng hoạt động`, kind: 'number' },
        {
          key: 'tail',
          label: `Xác suất có hơn ${m} người cùng hoạt động`,
          kind: 'number',
          mistakes: [{ value: atLeastM, msg: `“Hơn ${m}” nghĩa là từ ${m + 1} trở lên: tổng Σ phải chạy từ 0 tới ${m} (bao gồm ${m}).` }],
        },
      ],
    };
  },
};

export default def;
