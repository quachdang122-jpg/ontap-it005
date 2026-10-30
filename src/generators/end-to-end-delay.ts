import { ti, tn } from '../lib/format';
import { rng } from '../lib/rng';
import type { FieldSpec, ProblemDef } from './types';
import { distTex, rateTex, sTex } from './units';

export interface Link {
  /** bps */
  R: number;
  /** m */
  d: number;
}

export interface P {
  /** bit */
  L: number;
  links: Link[];
  s: number;
}

/** Trễ đầu cuối (giây) qua các link nối tiếp, lưu và chuyển ở mỗi router. */
export function endToEnd({ L, links, s }: P) {
  const per = links.map((k) => {
    const trans = L / k.R;
    const prop = k.d / s;
    return { trans, prop, sum: trans + prop };
  });
  const trans = per.reduce((a, x) => a + x.trans, 0);
  const prop = per.reduce((a, x) => a + x.prop, 0);
  return { per, trans, prop, total: trans + prop };
}

const MS = 1e3;

const def: ProblemDef<P> = {
  id: 'end-to-end-delay',
  chapter: 1,
  section: '1.6',
  title: 'Trễ đầu cuối qua nhiều link',
  hot: true,
  asks: 'Gói kích thước L đi qua 3 link (lưu và chuyển ở mỗi router), mỗi link có tốc độ và độ dài riêng. Tính trễ truyền, trễ lan truyền của từng link và tổng trễ.',
  formulas: [
    'd_{\\text{tổng}} = \\sum_{i=1}^{3} \\left( \\frac{L}{R_i} + \\frac{d_i}{s} \\right)',
    '\\text{(bỏ qua trễ xử lý và hàng đợi)}',
  ],
  generate(seed) {
    const g = rng(seed);
    const rates = [10, 20, 50, 100, 1000];
    const dists = [1, 2, 3, 5, 10, 50, 100, 200, 500, 800, 1000, 1200, 2000];
    const links: Link[] = [0, 1, 2].map(() => ({ R: g.pick(rates) * 1e6, d: g.pick(dists) * 1000 }));
    return { L: g.pick([4000, 8000, 10000, 12000, 16000, 20000]), links, s: g.pick([2e8, 2.5e8, 3e8]) };
  },
  solve(p) {
    const e = endToEnd(p);
    const out: Record<string, number> = { total: e.total * MS };
    e.per.forEach((x, i) => {
      out[`t${i + 1}`] = x.trans * MS;
      out[`p${i + 1}`] = x.prop * MS;
    });
    return out;
  },
  explain(p) {
    const e = endToEnd(p);
    return [
      'Lưu và chuyển: mỗi router phải nhận đủ cả gói rồi mới đẩy ra link tiếp theo, nên trễ truyền được tính lại trên **từng** link.',
      ...p.links.map(
        (k, i) =>
          `**Link ${i + 1}:** $\\frac{L}{R_${i + 1}} = \\frac{${ti(p.L)}}{${tn(k.R)}} = ${tn(e.per[i].trans * MS)}$ ms; $\\frac{d_${i + 1}}{s} = \\frac{${tn(k.d)}}{${tn(p.s)}} = ${tn(e.per[i].prop * MS)}$ ms; cộng $${tn(e.per[i].sum * MS)}$ ms.`,
      ),
      {
        table: {
          head: ['Link', 'R', 'd', '$d_{\\text{trans}}$ (ms)', '$d_{\\text{prop}}$ (ms)', 'Cộng (ms)'],
          rows: p.links.map((k, i) => [
            String(i + 1),
            `$${rateTex(k.R)}$`,
            `$${distTex(k.d)}$`,
            `$${tn(e.per[i].trans * MS)}$`,
            `$${tn(e.per[i].prop * MS)}$`,
            `$${tn(e.per[i].sum * MS)}$`,
          ]),
        },
      },
      `**Tổng:** $${tn(e.trans * MS)} + ${tn(e.prop * MS)} = ${tn(e.total * MS)}$ ms $= ${tn(e.total)}$ s.`,
    ];
  },
  view(p) {
    const e = endToEnd(p);
    const fields: FieldSpec[] = p.links.flatMap((_, i): FieldSpec[] => [
      { key: `t${i + 1}`, label: `Trễ truyền trên link ${i + 1}`, kind: 'number', unit: 'ms' },
      { key: `p${i + 1}`, label: `Trễ lan truyền trên link ${i + 1}`, kind: 'number', unit: 'ms' },
    ]);
    fields.push({
      key: 'total',
      label: 'Tổng trễ đầu cuối',
      kind: 'number',
      unit: 'ms',
      mistakes: [
        { value: e.trans * MS, msg: 'Đó mới là tổng trễ truyền; còn phải cộng trễ lan truyền.' },
        { value: e.prop * MS, msg: 'Đó mới là tổng trễ lan truyền; còn phải cộng trễ truyền trên cả 3 link.' },
        { value: (p.L / Math.min(...p.links.map((k) => k.R)) + e.prop) * MS, msg: 'Lưu và chuyển: phải cộng trễ truyền của cả 3 link, không chỉ link chậm nhất.' },
      ],
    });
    return {
      statement: [
        `Một gói $L = ${ti(p.L)}$ bit đi từ host nguồn qua 2 router tới host đích, tức qua 3 link nối tiếp (lưu và chuyển ở mỗi router). Tốc độ lan truyền $s = ${sTex(p.s)}$. Bỏ qua trễ xử lý và hàng đợi.`,
        {
          table: {
            head: ['Link', 'Tốc độ', 'Độ dài'],
            rows: p.links.map((k, i) => [String(i + 1), `$${rateTex(k.R)}$`, `$${distTex(k.d)}$`]),
          },
        },
      ],
      fields,
    };
  },
};

export default def;
