import { rng } from '../lib/rng';
import type { ProblemDef } from './types';

interface Host {
  ip: string;
  port: number;
}

export interface P {
  proto: 'UDP' | 'TCP';
  A: Host;
  B: Host;
  C: Host;
  tf: number;
}

export const STATEMENTS: [string, boolean, string][] = [
  ['Nhiều client UDP gửi tới cùng cổng đích của một host thì các segment luôn vào cùng một socket.', true, 'UDP phân kênh chỉ theo (IP đích, cổng đích).'],
  ['Nhiều client TCP gửi tới cùng cổng đích của một server thì các segment luôn vào cùng một socket.', false, 'TCP phân kênh theo bộ 4: mỗi kết nối một socket riêng.'],
  ['Một socket UDP có thể gửi hai segment cùng cổng nguồn tới hai client khác nhau.', true, 'Một socket UDP gửi tới bất kỳ đích nào, cổng nguồn là cổng của socket đó.'],
  ['Một host có thể gửi hai segment TCP cùng cổng nguồn 80 tới hai client khác nhau.', true, 'Hai kết nối khác nhau ở IP/cổng của client nên bộ 4 khác nhau.'],
  ['UDP phân kênh theo bộ 4 (IP nguồn, cổng nguồn, IP đích, cổng đích).', false, 'Bộ 4 là của TCP; UDP chỉ dùng (IP đích, cổng đích).'],
  ['Hai segment TCP cùng IP đích và cổng đích nhưng khác IP nguồn sẽ vào hai socket khác nhau.', true, 'Khác bộ 4 nên khác socket.'],
];

const ip = (g: ReturnType<typeof rng>) => `${g.int(11, 223)}.${g.int(0, 255)}.${g.int(0, 255)}.${g.int(1, 254)}`;

export function muxAnswers(p: P) {
  return {
    s1src: p.A.port,
    s1dst: p.C.port,
    s2src: p.C.port,
    s2dst: p.B.port,
    s2srcIp: p.C.ip,
    s2dstIp: p.B.ip,
    sockets: p.proto === 'UDP' ? 1 : 2,
    tf: STATEMENTS[p.tf][1] ? 'Đúng' : 'Sai',
  };
}

const def: ProblemDef<P> = {
  id: 'mux-demux',
  chapter: 3,
  section: '3.1',
  title: 'Ghép kênh và phân kênh UDP/TCP',
  asks: 'Cho hình các host, tiến trình và cổng. Điền cổng nguồn, cổng đích, IP nguồn, IP đích của các segment; trả lời đúng/sai về cách phân kênh.',
  formulas: [
    '\\text{UDP phân kênh theo } (IP_{\\text{đích}}, \\text{cổng}_{\\text{đích}})',
    '\\text{TCP phân kênh theo } (IP_{\\text{nguồn}}, \\text{cổng}_{\\text{nguồn}}, IP_{\\text{đích}}, \\text{cổng}_{\\text{đích}})',
    '\\text{Segment trả lời: đảo ngược nguồn và đích}',
  ],
  generate(seed) {
    const g = rng(seed);
    const proto = g.pick(['UDP', 'TCP'] as const);
    const pa = g.int(1024, 65000);
    const pb = g.bool(0.4) ? pa : g.int(1024, 65000);
    const pc = proto === 'TCP' ? g.pick([80, 443, 25, g.int(1024, 9999)]) : g.pick([53, 123, g.int(1024, 9999)]);
    return { proto, A: { ip: ip(g), port: pa }, B: { ip: ip(g), port: pb }, C: { ip: ip(g), port: pc }, tf: g.int(0, STATEMENTS.length - 1) };
  },
  solve: muxAnswers,
  explain(p) {
    const [st, truth, why] = STATEMENTS[p.tf];
    return [
      `**Segment 1 (A → C):** cổng nguồn ${p.A.port} (tiến trình ở A), cổng đích ${p.C.port} (tiến trình server ở C).`,
      `**Segment 2 (C trả lời B):** đảo ngược nguồn và đích của segment B gửi tới: cổng nguồn ${p.C.port}, cổng đích ${p.B.port}; IP nguồn ${p.C.ip}, IP đích ${p.B.ip}.`,
      p.proto === 'UDP'
        ? `**Số socket ở C:** UDP phân kênh theo (IP đích, cổng đích), nên segment từ A và B cùng tới cổng ${p.C.port} vào **1** socket.`
        : `**Số socket ở C:** TCP phân kênh theo bộ 4; A và B khác IP nguồn${p.A.port === p.B.port ? ' (dù cùng cổng nguồn)' : ''} nên vào **2** socket kết nối khác nhau (chưa kể socket chào đón).`,
      `**“${st}”** ${truth ? 'Đúng' : 'Sai'}. ${why}`,
    ];
  },
  view(p) {
    const [st] = STATEMENTS[p.tf];
    return {
      statement: [
        `Hai client A (${p.A.ip}) và B (${p.B.ip}) liên lạc với server C (${p.C.ip}) bằng **${p.proto}**. Tiến trình ở A dùng cổng ${p.A.port}, tiến trình ở B dùng cổng ${p.B.port}, tiến trình server ở C dùng cổng ${p.C.port}.`,
        'Segment 1 do A gửi tới C. Segment 2 là segment C trả lời cho B.',
      ],
      figure: {
        type: 'mux',
        proto: p.proto,
        hosts: [
          { name: 'A', ip: p.A.ip, ports: [p.A.port] },
          { name: 'C', ip: p.C.ip, ports: [p.C.port], server: true },
          { name: 'B', ip: p.B.ip, ports: [p.B.port] },
        ],
        arrows: [
          { from: 'A', to: 'C', label: '1' },
          { from: 'C', to: 'B', label: '2' },
        ],
      },
      fields: [
        { key: 's1src', label: 'Segment 1: cổng nguồn', kind: 'number', exact: true },
        { key: 's1dst', label: 'Segment 1: cổng đích', kind: 'number', exact: true },
        { key: 's2src', label: 'Segment 2: cổng nguồn', kind: 'number', exact: true },
        { key: 's2dst', label: 'Segment 2: cổng đích', kind: 'number', exact: true },
        { key: 's2srcIp', label: 'Segment 2: IP nguồn', kind: 'text', norm: 'lower', mistakes: [{ value: p.B.ip, msg: 'Segment trả lời đảo ngược nguồn và đích: IP nguồn là của C.' }] },
        { key: 's2dstIp', label: 'Segment 2: IP đích', kind: 'text', norm: 'lower', mistakes: [{ value: p.C.ip, msg: 'Segment trả lời đảo ngược nguồn và đích: IP đích là của B.' }] },
        {
          key: 'sockets',
          label: 'Ở C, segment từ A và từ B vào bao nhiêu socket khác nhau?',
          kind: 'number',
          exact: true,
          mistakes: p.proto === 'TCP' ? [{ value: 1, msg: 'TCP phân kênh theo bộ 4: mỗi kết nối một socket.' }] : [{ value: 2, msg: 'UDP chỉ xét (IP đích, cổng đích): cùng một socket.' }],
        },
        { key: 'tf', label: `Đúng hay sai: “${st}”`, kind: 'choice', options: ['Đúng', 'Sai'] },
      ],
    };
  },
};

export default def;
