import { ti, tn } from '../lib/format';
import { rng } from '../lib/rng';
import type { ProblemDef } from './types';
import { rateTex } from './units';

export interface P {
  F: number;
  Funit: 'Gbit' | 'GB' | 'Mbit';
  /** bps */
  us: number;
  dmin: number;
  N: number;
  u: number;
}

export function fileBits(p: Pick<P, 'F' | 'Funit'>): number {
  return p.Funit === 'Gbit' ? p.F * 1e9 : p.Funit === 'GB' ? p.F * 8e9 : p.F * 1e6;
}

export function p2p(p: P) {
  const F = fileBits(p);
  const cs = { a: (p.N * F) / p.us, b: F / p.dmin };
  const pp = { a: F / p.us, b: F / p.dmin, c: (p.N * F) / (p.us + p.N * p.u) };
  return { F, cs, pp, dcs: Math.max(cs.a, cs.b), dp2p: Math.max(pp.a, pp.b, pp.c) };
}

const def: ProblemDef<P> = {
  id: 'p2p',
  chapter: 2,
  section: '2.8',
  title: 'Phân phối file: client–server và P2P',
  asks: 'Phân phối file kích thước F cho N peer. Server upload u_s; mỗi peer upload u, download nhỏ nhất d_min. Tính thời gian phân phối tối thiểu với hai kiến trúc.',
  formulas: [
    'D_{c\\text{-}s} \\ge \\max\\left\\{ \\frac{NF}{u_s}, \\frac{F}{d_{\\min}} \\right\\}',
    'D_{P2P} \\ge \\max\\left\\{ \\frac{F}{u_s}, \\frac{F}{d_{\\min}}, \\frac{NF}{u_s + \\sum_{i=1}^{N} u_i} \\right\\}',
  ],
  generate(seed) {
    const g = rng(seed);
    const Funit = g.pick(['Gbit', 'Gbit', 'GB', 'Mbit'] as const);
    const F = Funit === 'Gbit' ? g.pick([1, 2, 5, 10, 15, 20]) : Funit === 'GB' ? g.pick([0.5, 1, 2, 4]) : g.pick([100, 200, 500, 800]);
    return {
      F,
      Funit,
      us: g.pick([10, 20, 30, 50, 100]) * 1e6,
      dmin: g.pick([1, 2, 5, 10, 20]) * 1e6,
      N: g.pick([10, 20, 50, 100, 200, 500, 1000]),
      u: g.pick([300, 500, 700, 1000, 2000]) * 1e3,
    };
  },
  solve(p) {
    const r = p2p(p);
    return { dcs: r.dcs, dp2p: r.dp2p };
  },
  explain(p) {
    const r = p2p(p);
    return [
      p.Funit === 'GB' ? `**Đổi đơn vị:** $F = ${p.F}\\text{ GB} = ${p.F} \\times 8 \\times 10^9 = ${tn(r.F)}$ bit.` : `$F = ${tn(r.F)}$ bit.`,
      `**Client–server:** $\\frac{NF}{u_s} = \\frac{${p.N} \\times ${tn(r.F)}}{${tn(p.us)}} = ${tn(r.cs.a)}$ s; $\\frac{F}{d_{\\min}} = \\frac{${tn(r.F)}}{${tn(p.dmin)}} = ${tn(r.cs.b)}$ s. Vậy $D_{c\\text{-}s} = ${tn(r.dcs)}$ s.`,
      `**P2P:** $\\frac{F}{u_s} = ${tn(r.pp.a)}$ s; $\\frac{F}{d_{\\min}} = ${tn(r.pp.b)}$ s; $\\frac{NF}{u_s + Nu} = \\frac{${tn(p.N * r.F)}}{${tn(p.us)} + ${tn(p.N * p.u)}} = ${tn(r.pp.c)}$ s. Vậy $D_{P2P} = ${tn(r.dp2p)}$ s.`,
      'Ở P2P server chỉ cần gửi ít nhất một bản ($F/u_s$), không phải $N$ bản; các peer cũng góp băng thông upload.',
    ];
  },
  view(p) {
    const r = p2p(p);
    return {
      statement: [
        `Phân phối một file kích thước $F = ${p.F}$ ${p.Funit} cho $N = ${ti(p.N)}$ peer. Server có tốc độ upload $u_s = ${rateTex(p.us)}$. Mỗi peer có tốc độ download $d_i = ${rateTex(p.dmin)}$ và upload $u_i = ${rateTex(p.u)}$.`,
      ],
      fields: [
        {
          key: 'dcs',
          label: 'Thời gian phân phối tối thiểu theo client–server',
          kind: 'number',
          unit: 's',
          mistakes: p.Funit === 'GB' ? [{ value: r.dcs / 8, msg: 'F cho bằng GB: phải nhân 8 để đổi ra bit.' }] : [],
        },
        {
          key: 'dp2p',
          label: 'Thời gian phân phối tối thiểu theo P2P',
          kind: 'number',
          unit: 's',
          mistakes: [
            ...(p.Funit === 'GB' ? [{ value: r.dp2p / 8, msg: 'F cho bằng GB: phải nhân 8 để đổi ra bit.' }] : []),
            { value: Math.max((p.N * r.F) / p.us, r.pp.b, r.pp.c), msg: 'Ở P2P server chỉ cần gửi một bản: dùng F/u_s, không phải NF/u_s.' },
          ],
        },
      ],
    };
  },
};

export default def;
