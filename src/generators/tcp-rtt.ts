import { tn } from '../lib/format';
import { rng } from '../lib/rng';
import type { FieldSpec, ProblemDef } from './types';

export interface P {
  est0: number;
  dev0: number;
  samples: number[];
  alpha: number;
  beta: number;
  /** true: cập nhật DevRTT trước bằng EstimatedRTT cũ (RFC 6298) */
  rfc: boolean;
}

export interface RttRow {
  sample: number;
  est: number;
  dev: number;
  timeout: number;
}

export function tcpRtt({ est0, dev0, samples, alpha, beta, rfc }: P): RttRow[] {
  let est = est0;
  let dev = dev0;
  return samples.map((s) => {
    if (rfc) {
      dev = (1 - beta) * dev + beta * Math.abs(s - est);
      est = (1 - alpha) * est + alpha * s;
    } else {
      est = (1 - alpha) * est + alpha * s;
      dev = (1 - beta) * dev + beta * Math.abs(s - est);
    }
    return { sample: s, est, dev, timeout: est + 4 * dev };
  });
}

const def: ProblemDef<P> = {
  id: 'tcp-rtt',
  chapter: 3,
  section: '3.7',
  title: 'RTT và timeout của TCP',
  hot: true,
  toggles: [{ key: 'rfc', label: 'Theo RFC 6298 (cập nhật DevRTT trước, dùng EstimatedRTT cũ)' }],
  asks: 'Cho EstimatedRTT, DevRTT ban đầu và các mẫu SampleRTT. Tính EstimatedRTT, DevRTT và TimeoutInterval sau mỗi mẫu.',
  formulas: [
    '\\text{EstimatedRTT} = (1-\\alpha)\\,\\text{EstimatedRTT} + \\alpha \\cdot \\text{SampleRTT}',
    '\\text{DevRTT} = (1-\\beta)\\,\\text{DevRTT} + \\beta \\cdot |\\text{SampleRTT} - \\text{EstimatedRTT}|',
    '\\text{TimeoutInterval} = \\text{EstimatedRTT} + 4 \\cdot \\text{DevRTT}',
  ],
  generate(seed) {
    const g = rng(seed);
    const est0 = g.int(4, 30) * 5;
    const n = g.int(3, 5);
    const samples = Array.from({ length: n }, () => Math.max(1, est0 + g.int(-Math.round(est0 * 0.3), Math.round(est0 * 0.5))));
    return { est0, dev0: g.int(1, 10), samples, alpha: g.bool(0.75) ? 0.125 : 0.2, beta: 0.25, rfc: false };
  },
  solve(p) {
    const out: Record<string, number> = {};
    tcpRtt(p).forEach((r, i) => {
      out[`e${i}`] = r.est;
      out[`d${i}`] = r.dev;
      out[`t${i}`] = r.timeout;
    });
    return out;
  },
  explain(p) {
    const rows = tcpRtt(p);
    const a = p.alpha;
    const b = p.beta;
    const first = rows[0];
    return [
      p.rfc
        ? `Theo RFC 6298: cập nhật **DevRTT trước** bằng EstimatedRTT **cũ**, rồi mới cập nhật EstimatedRTT. $\\alpha = ${a}$, $\\beta = ${b}$.`
        : `Theo thứ tự trong giáo trình: cập nhật **EstimatedRTT trước**, rồi dùng giá trị vừa tính để cập nhật DevRTT. $\\alpha = ${a}$, $\\beta = ${b}$.`,
      p.rfc
        ? `**Mẫu 1:** $\\text{Dev} = ${1 - b}(${p.dev0}) + ${b}\\,|${first.sample} - ${p.est0}| = ${tn(first.dev, 6)}$; $\\text{Est} = ${1 - a}(${p.est0}) + ${a}(${first.sample}) = ${tn(first.est, 6)}$; $\\text{Timeout} = ${tn(first.est, 6)} + 4(${tn(first.dev, 6)}) = ${tn(first.timeout, 6)}$.`
        : `**Mẫu 1:** $\\text{Est} = ${1 - a}(${p.est0}) + ${a}(${first.sample}) = ${tn(first.est, 6)}$; $|${first.sample} - ${tn(first.est, 6)}| = ${tn(Math.abs(first.sample - first.est), 6)}$ nên $\\text{Dev} = ${1 - b}(${p.dev0}) + ${b}(${tn(Math.abs(first.sample - first.est), 6)}) = ${tn(first.dev, 6)}$; $\\text{Timeout} = ${tn(first.est, 6)} + 4(${tn(first.dev, 6)}) = ${tn(first.timeout, 6)}$.`,
      {
        table: {
          head: ['Lần', 'SampleRTT', 'EstimatedRTT', 'DevRTT', 'TimeoutInterval'],
          rows: rows.map((r, i) => [String(i + 1), String(r.sample), r.est.toFixed(4), r.dev.toFixed(4), r.timeout.toFixed(4)]),
        },
      },
      'EstimatedRTT là trung bình có trọng số nên phụ thuộc vào mọi mẫu trước đó, không chỉ mẫu gần nhất.',
    ];
  },
  view(p) {
    const rows = tcpRtt(p);
    const other = tcpRtt({ ...p, rfc: !p.rfc });
    const swapped = tcpRtt({ ...p, alpha: 1 - p.alpha });
    const fields: FieldSpec[] = rows.flatMap((_, i): FieldSpec[] => [
      { key: `e${i}`, label: `Sau mẫu ${i + 1}: EstimatedRTT`, kind: 'number', unit: 'ms', tol: 0.002, mistakes: [{ value: swapped[i].est, msg: 'α nhân với mẫu MỚI: Est = (1 − α)·Est + α·Sample.' }] },
      { key: `d${i}`, label: `Sau mẫu ${i + 1}: DevRTT`, kind: 'number', unit: 'ms', tol: 0.005, mistakes: [{ value: other[i].dev, msg: p.rfc ? 'Chế độ RFC 6298: tính DevRTT bằng EstimatedRTT CŨ.' : 'Theo giáo trình: dùng EstimatedRTT VỪA tính để cập nhật DevRTT.' }] },
      { key: `t${i}`, label: `Sau mẫu ${i + 1}: TimeoutInterval`, kind: 'number', unit: 'ms', tol: 0.002 },
    ]);
    return {
      statement: [
        `Ban đầu EstimatedRTT $= ${p.est0}$ ms, DevRTT $= ${p.dev0}$ ms. Lần lượt đo được các SampleRTT: ${p.samples.map((s) => `$${s}$`).join(', ')} ms. Dùng $\\alpha = ${p.alpha}$, $\\beta = ${p.beta}$.`,
        'Nhập kết quả với ít nhất 4 chữ số có nghĩa (sai số cho phép 0,2–0,5%).',
      ],
      fields,
    };
  },
};

export default def;
