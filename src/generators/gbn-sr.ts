import { rng } from '../lib/rng';
import type { ProblemDef } from './types';

export interface P {
  N: number;
  mode: 'pkt' | 'ack';
  lost: number;
  bits: number;
}

const list = (xs: string[]) => (xs.length ? xs.join(', ') : 'x');

export function gbnSr({ N, mode, lost }: P) {
  const all = Array.from({ length: N }, (_, i) => i);
  if (mode === 'pkt') {
    return {
      gbnAcks: all.filter((i) => i !== lost).map((i) => `ACK${Math.min(i, lost - 1)}`),
      gbnResend: all.filter((i) => i >= lost).map((i) => `pkt${i}`),
      srAcks: all.filter((i) => i !== lost).map((i) => `ACK${i}`),
      srResend: [`pkt${lost}`],
    };
  }
  return {
    gbnAcks: all.map((i) => `ACK${i}`),
    // ACK tích lũy về sau đã xác nhận luôn gói bị mất ACK
    gbnResend: lost === N - 1 ? [`pkt${lost}`] : [],
    srAcks: all.map((i) => `ACK${i}`),
    srResend: [`pkt${lost}`],
  };
}

export const maxWindow = (k: number) => ({ gbn: 2 ** k - 1, sr: 2 ** (k - 1) });

const def: ProblemDef<P> = {
  id: 'gbn-sr',
  chapter: 3,
  section: '3.5',
  title: 'Go-Back-N và Selective Repeat',
  hot: true,
  asks: 'Bên gửi phát một cửa sổ N gói; một gói hoặc một ACK bị mất. Liệt kê ACK bên nhận gửi và những gói được gửi lại khi timeout, với GBN và SR; tính cửa sổ lớn nhất theo số bit số thứ tự.',
  formulas: [
    '\\text{GBN: ACK tích lũy; bỏ gói sai thứ tự; timeout} \\Rightarrow \\text{gửi lại gói đó và mọi gói sau}',
    '\\text{SR: ACK riêng; lưu đệm gói sai thứ tự; mỗi gói một timer}',
    'N_{GBN} \\le 2^k - 1, \\qquad N_{SR} \\le 2^{k-1}',
  ],
  generate(seed) {
    const g = rng(seed);
    const N = g.int(4, 6);
    const mode = g.bool(0.7) ? 'pkt' : 'ack';
    const lost = mode === 'pkt' ? g.int(1, N - 2) : g.int(0, N - 1);
    return { N, mode, lost, bits: g.int(2, 5) };
  },
  solve(p) {
    const r = gbnSr(p);
    const w = maxWindow(p.bits);
    return { gbnAcks: list(r.gbnAcks), gbnResend: list(r.gbnResend), srAcks: list(r.srAcks), srResend: list(r.srResend), wGbn: w.gbn, wSr: w.sr };
  },
  explain(p) {
    const r = gbnSr(p);
    const w = maxWindow(p.bits);
    const steps =
      p.mode === 'pkt'
        ? [
            `**GBN:** pkt0…pkt${p.lost - 1} tới đúng thứ tự → ACK0…ACK${p.lost - 1}. Các gói sau pkt${p.lost} tới sai thứ tự nên bị **bỏ**, bên nhận gửi lại ACK của gói đúng thứ tự cuối (ACK${p.lost - 1}). ACK gửi: ${list(r.gbnAcks)}.`,
            `Timer (cho gói cũ nhất chưa ACK, pkt${p.lost}) hết giờ → gửi lại pkt${p.lost} và **mọi gói sau**: ${list(r.gbnResend)}.`,
            `**SR:** mỗi gói tới đúng được ACK riêng, gói sai thứ tự được **lưu đệm**. ACK gửi: ${list(r.srAcks)}.`,
            `Chỉ timer của pkt${p.lost} hết giờ → chỉ gửi lại ${list(r.srResend)}.`,
          ]
        : [
            `Mọi gói đều tới, nên cả GBN và SR đều gửi ACK cho từng gói: ${list(r.gbnAcks)} (ACK${p.lost} bị mất trên đường về).`,
            p.lost === p.N - 1
              ? `**GBN:** ACK${p.lost} là ACK cuối cùng, không có ACK tích lũy nào về sau → timer hết giờ, gửi lại pkt${p.lost}.`
              : `**GBN:** ACK tích lũy ACK${p.lost + 1} (về sau) xác nhận luôn pkt${p.lost} nên **không phải gửi lại gì** (nếu ACK sau về trước khi hết giờ). Ghi “x”.`,
            `**SR:** ACK riêng từng gói; timer riêng của pkt${p.lost} hết giờ → gửi lại pkt${p.lost}. Bên nhận đã có gói đó nhưng vẫn phải ACK lại, nếu không cửa sổ bên gửi không bao giờ trượt.`,
          ];
    steps.push(`**Cửa sổ lớn nhất với ${p.bits} bit số thứ tự:** GBN $2^{${p.bits}} - 1 = ${w.gbn}$; SR $2^{${p.bits} - 1} = ${w.sr}$.`);
    return steps;
  },
  view(p) {
    const w = maxWindow(p.bits);
    const r = gbnSr(p);
    return {
      statement: [
        `Cửa sổ $N = ${p.N}$. Bên gửi phát liền pkt0 … pkt${p.N - 1}. ${
          p.mode === 'pkt' ? `**pkt${p.lost} bị mất**, các gói khác tới đủ; mọi ACK đều về tới.` : `Mọi gói tới đủ, nhưng **ACK${p.lost} bị mất**; các ACK khác về tới trước khi hết giờ.`
        }`,
        'Ghi chuỗi cách nhau bởi dấu phẩy (ví dụ `ACK0, ACK1, ACK1`); ghi `x` nếu không có gì.',
      ],
      fields: [
        { key: 'gbnAcks', label: 'GBN: các ACK bên nhận gửi', kind: 'text', norm: 'seq', mistakes: p.mode === 'pkt' ? [{ value: list(r.srAcks), msg: 'Đó là cách của SR. GBN gửi ACK tích lũy: gói sai thứ tự bị bỏ và lặp lại ACK của gói đúng thứ tự cuối.' }] : [] },
        { key: 'gbnResend', label: 'GBN: các gói gửi lại khi timeout', kind: 'text', norm: 'seq', mistakes: p.mode === 'pkt' ? [{ value: `pkt${p.lost}`, msg: 'GBN gửi lại gói bị mất và MỌI gói sau nó.' }] : [] },
        { key: 'srAcks', label: 'SR: các ACK bên nhận gửi', kind: 'text', norm: 'seq' },
        { key: 'srResend', label: 'SR: các gói gửi lại khi timeout', kind: 'text', norm: 'seq', mistakes: p.mode === 'pkt' ? [{ value: list(r.gbnResend), msg: 'SR chỉ gửi lại đúng gói hết giờ.' }] : [] },
        { key: 'wGbn', label: `Cửa sổ lớn nhất của GBN với số thứ tự ${p.bits} bit`, kind: 'number', exact: true, mistakes: [{ value: 2 ** p.bits, msg: `Cửa sổ GBN tối đa là 2^k − 1, không phải 2^k.` }] },
        { key: 'wSr', label: `Cửa sổ lớn nhất của SR với số thứ tự ${p.bits} bit`, kind: 'number', exact: true, mistakes: [{ value: w.gbn, msg: 'Đó là giới hạn của GBN. SR: N ≤ 2^(k−1).' }] },
      ],
    };
  },
};

export default def;
