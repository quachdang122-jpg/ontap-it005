import { rng } from '../lib/rng';
import type { ProblemDef } from './types';

export interface P {
  /** RTT tới từng DNS server (ms) */
  dns: number[];
  rtt: number;
  n: number;
  k: number;
}

export function dnsHttp({ dns, rtt, n, k }: P) {
  const T = dns.reduce((a, b) => a + b, 0);
  const base = T + 2 * rtt;
  const waves = Math.ceil(n / k);
  return {
    T,
    base,
    npSerial: base + n * 2 * rtt,
    npParallel: base + waves * 2 * rtt,
    pParallel: base + waves * rtt,
    pPipe: base + rtt,
    pNoPipe: base + n * rtt,
  };
}

const def: ProblemDef<P> = {
  id: 'dns-http-delay',
  chapter: 2,
  section: '2.3',
  title: 'Trễ DNS và HTTP',
  asks: 'Trình duyệt phân giải DNS (qua một số server) rồi tải trang web kèm n đối tượng nhỏ. Tính thời gian theo từng kiểu HTTP; bỏ qua thời gian truyền.',
  formulas: [
    '\\text{Chỉ HTML: } T_{DNS} + 2RTT',
    '\\text{Không bền vững, tuần tự: } T_{DNS} + 2RTT + n \\cdot 2RTT',
    '\\text{Không bền vững, } k \\text{ song song: } T_{DNS} + 2RTT + \\left\\lceil \\tfrac{n}{k} \\right\\rceil 2RTT',
    '\\text{Bền vững, } k \\text{ song song: } T_{DNS} + 2RTT + \\left\\lceil \\tfrac{n}{k} \\right\\rceil RTT',
    '\\text{Bền vững, pipelining: } T_{DNS} + 2RTT + RTT',
    '\\text{Bền vững, không pipelining: } T_{DNS} + 2RTT + n \\cdot RTT',
  ],
  generate(seed) {
    const g = rng(seed);
    const count = g.int(2, 3);
    const dns = [g.int(1, 5), ...Array.from({ length: count - 1 }, () => g.int(10, 60))];
    return { dns, rtt: g.pick([10, 12, 15, 18, 20, 25, 30, 40]), n: g.int(3, 12), k: g.int(2, 5) };
  },
  solve(p) {
    const d = dnsHttp(p);
    return { base: d.base, npSerial: d.npSerial, npParallel: d.npParallel, pParallel: d.pParallel, pPipe: d.pPipe, pNoPipe: d.pNoPipe };
  },
  explain(p) {
    const d = dnsHttp(p);
    const w = Math.ceil(p.n / p.k);
    return [
      `$T_{DNS} = ${p.dns.join(' + ')} = ${d.T}$ ms. Mỗi lần mở kết nối TCP mới tốn $2RTT$: 1 RTT bắt tay + 1 RTT gửi request, nhận response.`,
      `**Chỉ HTML gốc:** $${d.T} + 2(${p.rtt}) = ${d.base}$ ms.`,
      `**Không bền vững, tuần tự:** mỗi đối tượng một kết nối mới: $${d.base} + ${p.n} \\times ${2 * p.rtt} = ${d.npSerial}$ ms.`,
      `**Không bền vững, ${p.k} kết nối song song:** $${p.n}$ đối tượng chia $\\lceil ${p.n}/${p.k} \\rceil = ${w}$ đợt: $${d.base} + ${w} \\times ${2 * p.rtt} = ${d.npParallel}$ ms.`,
      `**Bền vững, ${p.k} kết nối song song:** không phải bắt tay lại, mỗi đợt 1 RTT: $${d.base} + ${w} \\times ${p.rtt} = ${d.pParallel}$ ms.`,
      `**Bền vững, pipelining:** gửi mọi request liền một lúc trên 1 kết nối: $${d.base} + ${p.rtt} = ${d.pPipe}$ ms.`,
      `**Bền vững, không pipelining:** mỗi đối tượng 1 RTT: $${d.base} + ${p.n} \\times ${p.rtt} = ${d.pNoPipe}$ ms.`,
      'Trang gốc luôn tốn 2RTT kể cả với HTTP bền vững, vì lần đầu vẫn phải bắt tay TCP.',
    ];
  },
  view(p) {
    const d = dnsHttp(p);
    const noDns = (x: number) => [{ value: x - d.T, msg: 'Quên cộng thời gian phân giải DNS (tổng các RTT DNS).' }];
    return {
      statement: [
        `Để phân giải tên web server, trình duyệt phải đi qua ${p.dns.length} DNS server với RTT lần lượt ${p.dns.map((x) => `$${x}$`).join(', ')} ms (server đầu là local DNS). RTT giữa máy và web server là $${p.rtt}$ ms. Trang web gồm 1 file HTML gốc tham chiếu $${p.n}$ đối tượng nhỏ trên cùng server. Bỏ qua thời gian truyền.`,
      ],
      fields: [
        { key: 'base', label: 'Từ lúc bấm link tới lúc nhận xong file HTML gốc', kind: 'number', unit: 'ms', mistakes: [...noDns(d.base), { value: d.T + p.rtt, msg: 'Trang gốc tốn 2RTT: 1 RTT bắt tay TCP + 1 RTT request/response.' }] },
        { key: 'npSerial', label: 'HTTP không bền vững, không song song (cả trang + đối tượng)', kind: 'number', unit: 'ms', mistakes: noDns(d.npSerial) },
        { key: 'npParallel', label: `HTTP không bền vững, tối đa ${p.k} kết nối song song`, kind: 'number', unit: 'ms', mistakes: noDns(d.npParallel) },
        { key: 'pParallel', label: `HTTP bền vững, tối đa ${p.k} kết nối song song`, kind: 'number', unit: 'ms', mistakes: noDns(d.pParallel) },
        { key: 'pPipe', label: 'HTTP bền vững có pipelining (1 kết nối)', kind: 'number', unit: 'ms', mistakes: noDns(d.pPipe) },
        { key: 'pNoPipe', label: 'HTTP bền vững không pipelining (1 kết nối)', kind: 'number', unit: 'ms', mistakes: noDns(d.pNoPipe) },
      ],
    };
  },
};

export default def;
