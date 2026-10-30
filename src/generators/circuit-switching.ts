import { rng } from '../lib/rng';
import type { ProblemDef } from './types';

export interface P {
  ab: number;
  bc: number;
  cd: number;
  da: number;
}

export function circuitMax({ ab, bc, cd, da }: P) {
  return {
    total: ab + bc + cd + da,
    ac: Math.min(ab, bc) + Math.min(da, cd),
    bd: Math.min(bc, cd) + Math.min(ab, da),
  };
}

const def: ProblemDef<P> = {
  id: 'circuit-switching',
  chapter: 1,
  section: '1.1',
  title: 'Chuyển mạch kênh (vòng 4 switch)',
  asks: 'Mạng chuyển mạch kênh gồm 4 switch A, B, C, D nối thành vòng, mỗi link có một số kênh. Tính số kết nối đồng thời tối đa trong các tình huống.',
  formulas: [
    'N_{\\max} = n_{AB} + n_{BC} + n_{CD} + n_{DA}',
    'N_{A\\text{–}C} = \\min(n_{AB}, n_{BC}) + \\min(n_{AD}, n_{DC})',
    'N_{B\\text{–}D} = \\min(n_{BC}, n_{CD}) + \\min(n_{BA}, n_{AD})',
  ],
  generate(seed) {
    const r = rng(seed);
    for (;;) {
      const p = { ab: r.int(6, 25), bc: r.int(6, 25), cd: r.int(6, 25), da: r.int(6, 25) };
      // tránh đề mà A–C và B–D trùng đáp án quá dễ đoán
      const m = circuitMax(p);
      if (m.ac !== m.bd || r.bool(0.2)) return p;
    }
  },
  solve(p) {
    return circuitMax(p);
  },
  explain(p) {
    const m = circuitMax(p);
    return [
      `**Tối đa toàn mạng:** cho mọi kết nối chỉ đi qua 1 link (giữa hai switch kề nhau), nên tổng bằng tổng số kênh: $${p.ab} + ${p.bc} + ${p.cd} + ${p.da} = ${m.total}$.`,
      `**Giữa A và C:** có hai đường. Qua B bị chặn bởi link yếu nhất $\\min(${p.ab}, ${p.bc}) = ${Math.min(p.ab, p.bc)}$; qua D được $\\min(${p.da}, ${p.cd}) = ${Math.min(p.da, p.cd)}$. Tổng $${m.ac}$.`,
      `**Giữa B và D:** qua C được $\\min(${p.bc}, ${p.cd}) = ${Math.min(p.bc, p.cd)}$; qua A được $\\min(${p.ab}, ${p.da}) = ${Math.min(p.ab, p.da)}$. Tổng $${m.bd}$.`,
    ];
  },
  view(p) {
    const m = circuitMax(p);
    const sum = p.ab + p.bc + p.cd + p.da;
    const maxAC = Math.max(p.ab, p.bc) + Math.max(p.da, p.cd);
    const maxBD = Math.max(p.bc, p.cd) + Math.max(p.ab, p.da);
    return {
      statement: [
        `Bốn switch A, B, C, D nối thành vòng. Link AB có $${p.ab}$ kênh, BC có $${p.bc}$, CD có $${p.cd}$, DA có $${p.da}$. Mỗi kết nối chiếm một kênh trên mỗi link nó đi qua.`,
      ],
      figure: { type: 'ring', ...p },
      fields: [
        { key: 'total', label: 'Số kết nối đồng thời tối đa trên toàn mạng', kind: 'number', exact: true },
        {
          key: 'ac',
          label: 'Số kết nối tối đa giữa A và C',
          kind: 'number',
          exact: true,
          mistakes: [
            { value: sum, msg: 'Đừng cộng kênh của cả 4 link: mỗi đường bị chặn bởi link yếu nhất của nó.' },
            ...(maxAC !== m.ac ? [{ value: maxAC, msg: 'Mỗi đường bị giới hạn bởi link có ÍT kênh nhất (min), không phải max.' }] : []),
          ],
        },
        {
          key: 'bd',
          label: 'Số kết nối tối đa giữa B và D',
          kind: 'number',
          exact: true,
          mistakes: [
            { value: sum, msg: 'Đừng cộng kênh của cả 4 link: mỗi đường bị chặn bởi link yếu nhất của nó.' },
            ...(maxBD !== m.bd ? [{ value: maxBD, msg: 'Mỗi đường bị giới hạn bởi link có ÍT kênh nhất (min), không phải max.' }] : []),
          ],
        },
      ],
    };
  },
};

export default def;
