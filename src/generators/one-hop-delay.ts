import { ti, tn } from '../lib/format';
import { rng } from '../lib/rng';
import type { ProblemDef } from './types';
import { distTex, pickUnit, rateTex, sTex, unitFactor, unitTex, type TimeUnit } from './units';

export interface P {
  L: number;
  Lunit: 'byte' | 'bit';
  /** bps */
  R: number;
  /** m */
  d: number;
  /** m/s */
  s: number;
}

const ARRIVED = 'Đã tới đích';
const ON_LINK = 'Vẫn đang trên đường truyền';

export function oneHop({ L, Lunit, R, d, s }: P) {
  const bits = Lunit === 'byte' ? L * 8 : L;
  const trans = bits / R;
  const prop = d / s;
  const travelled = s * trans;
  return { bits, trans, prop, total: trans + prop, travelled, arrived: travelled >= d };
}

function unitOf(p: P): TimeUnit {
  return pickUnit(oneHop(p).total);
}

const def: ProblemDef<P> = {
  id: 'one-hop-delay',
  chapter: 1,
  section: '1.4',
  title: 'Trễ truyền qua một chặng',
  asks: 'Cho kích thước gói L, tốc độ link R, độ dài d, tốc độ lan truyền s. Tính trễ truyền, trễ lan truyền, tổng trễ và vị trí bit đầu tiên khi bit cuối vừa được đẩy ra.',
  formulas: [
    'd_{\\text{trans}} = \\frac{L}{R}, \\qquad d_{\\text{prop}} = \\frac{d}{s}',
    'd_{\\text{1 chặng}} = \\frac{L}{R} + \\frac{d}{s}',
    '\\text{Quãng bit đầu đã đi khi bit cuối rời máy gửi} = s \\cdot \\frac{L}{R}',
  ],
  generate(seed) {
    const g = rng(seed);
    for (;;) {
      const Lunit = g.bool(0.6) ? 'byte' : 'bit';
      const L = Lunit === 'byte' ? g.pick([500, 1000, 1200, 1500, 2000, 4000]) : g.pick([8000, 10000, 12000, 16000, 20000, 40000]);
      const R = g.pick([1, 2, 5, 10, 20, 50, 100, 1000]) * 1e6;
      const d = g.pick([1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2500, 4000]) * 1000;
      const s = g.pick([2e8, 2.5e8, 3e8]);
      const p: P = { L, Lunit, R, d, s };
      const o = oneHop(p);
      // tránh trường hợp bit đầu tới đích đúng lúc bit cuối rời máy (khó phân xử)
      if (Math.abs(o.travelled / d - 1) < 0.05) continue;
      return p;
    }
  },
  solve(p) {
    const o = oneHop(p);
    const f = unitFactor[unitOf(p)];
    return {
      trans: o.trans * f,
      prop: o.prop * f,
      total: o.total * f,
      arrived: o.arrived ? ARRIVED : ON_LINK,
      dist: Math.min(o.travelled, p.d) / 1000,
    };
  },
  explain(p) {
    const o = oneHop(p);
    const u = unitOf(p);
    const f = unitFactor[u];
    const U = unitTex[u];
    const steps = [
      p.Lunit === 'byte'
        ? `**Đổi đơn vị:** $L = ${ti(p.L)} \\times 8 = ${ti(o.bits)}$ bit; $d = ${ti(p.d)}$ m.`
        : `**Đổi đơn vị:** $L = ${ti(o.bits)}$ bit; $d = ${ti(p.d)}$ m.`,
      `$d_{\\text{trans}} = \\frac{L}{R} = \\frac{${ti(o.bits)}}{${tn(p.R)}} = ${tn(o.trans)}\\text{ s} = ${tn(o.trans * f)}${U}$.`,
      `$d_{\\text{prop}} = \\frac{d}{s} = \\frac{${tn(p.d)}}{${tn(p.s)}} = ${tn(o.prop)}\\text{ s} = ${tn(o.prop * f)}${U}$.`,
      `**Tổng:** $${tn(o.trans * f)} + ${tn(o.prop * f)} = ${tn(o.total * f)}${U}$.`,
    ];
    steps.push(
      o.arrived
        ? `Khi bit cuối vừa rời máy gửi ($t = ${tn(o.trans * f)}${U}$), bit đầu lẽ ra đi được $s \\cdot \\frac{L}{R} = ${tn(o.travelled / 1000)}$ km $\\ge d$, tức là **bit đầu đã tới đích** (ở vị trí $${tn(p.d / 1000)}$ km).`
        : `Khi bit cuối vừa rời máy gửi ($t = ${tn(o.trans * f)}${U}$), bit đầu đã đi được $s \\cdot \\frac{L}{R} = ${tn(p.s)} \\times ${tn(o.trans)} = ${tn(o.travelled)}$ m $= ${tn(o.travelled / 1000)}$ km $< d$, tức là **vẫn còn trên đường truyền**.`,
    );
    return steps;
  },
  view(p) {
    const o = oneHop(p);
    const u = unitOf(p);
    const f = unitFactor[u];
    return {
      statement: [
        `Một gói kích thước $L = ${ti(p.L)}$ ${p.Lunit} được gửi trên một link tốc độ $R = ${rateTex(p.R)}$, dài $d = ${distTex(p.d)}$, tốc độ lan truyền $s = ${sTex(p.s)}$.`,
      ],
      fields: [
        {
          key: 'trans',
          label: 'Trễ truyền',
          kind: 'number',
          unit: u,
          mistakes: p.Lunit === 'byte' ? [{ value: (p.L / p.R) * f, msg: 'Có thể bạn quên nhân 8 khi đổi byte sang bit.' }] : [],
        },
        { key: 'prop', label: 'Trễ lan truyền', kind: 'number', unit: u },
        { key: 'total', label: 'Tổng trễ (bỏ qua xử lý và hàng đợi)', kind: 'number', unit: u },
        { key: 'arrived', label: 'Khi bit cuối vừa được đẩy ra, bit đầu ở đâu?', kind: 'choice', options: [ON_LINK, ARRIVED] },
        {
          key: 'dist',
          label: 'Lúc đó bit đầu cách máy gửi bao xa? (nếu đã tới đích thì ghi độ dài link)',
          kind: 'number',
          unit: 'km',
          mistakes: o.arrived ? [{ value: o.travelled / 1000, msg: 'Bit đầu không thể đi quá độ dài link: nó đã tới đích.' }] : [],
        },
      ],
    };
  },
};

export default def;
