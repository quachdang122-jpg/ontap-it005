import { rng } from '../lib/rng';
import type { ProblemDef } from './types';

export interface P {
  proto: 'TCP' | 'UDP';
  n: number;
  port: number;
  service: string;
}

const UDP_HOW = [
  'Đọc IP và cổng nguồn trong gói UDP vừa nhận',
  'Dùng kết nối đã thiết lập bằng bắt tay 3 bước',
  'Client đăng ký trước địa chỉ với server',
  'Server tra bảng DNS ngược',
];
const TCP_CONNECT = [
  'Client bắt đầu bắt tay 3 bước (gửi SYN)',
  'Client gửi ngay dữ liệu ứng dụng',
  'Server tạo socket chào đón mới',
  'Không có gói nào được gửi',
];

export function socketCount(p: Pick<P, 'proto' | 'n'>) {
  return p.proto === 'UDP' ? { total: 1, data: 1 } : { total: 1 + p.n, data: p.n };
}

const def: ProblemDef<P> = {
  id: 'sockets',
  chapter: 2,
  section: '2.9',
  title: 'Lập trình socket',
  asks: 'Đếm số socket một server UDP/TCP dùng khi có nhiều client; hiểu cách server UDP biết địa chỉ để trả lời và điều gì xảy ra khi client TCP gọi connect().',
  formulas: ['\\text{UDP: 1 socket cho mọi client}', '\\text{TCP với } n \\text{ kết nối: } 1 \\text{ (chào đón)} + n \\text{ socket}'],
  generate(seed) {
    const g = rng(seed);
    const proto = g.pick(['TCP', 'UDP'] as const);
    const svc = proto === 'TCP' ? g.pick([['Web server', 80], ['Web server HTTPS', 443], ['Mail server SMTP', 25], ['Server chat tự viết', 12000]] as const) : g.pick([['DNS server', 53], ['Server game tự viết', 9876], ['Server đo thời gian tự viết', 12000]] as const);
    return { proto, n: g.int(2, 12), port: svc[1], service: svc[0] };
  },
  solve(p) {
    const c = socketCount(p);
    return { ...c, concept: p.proto === 'UDP' ? UDP_HOW[0] : TCP_CONNECT[0] };
  },
  explain(p) {
    const c = socketCount(p);
    return p.proto === 'UDP'
      ? [
          `UDP không kết nối: server chỉ cần **1 socket** ở cổng ${p.port} cho cả ${p.n} client. Segment tới cùng (IP đích, cổng đích) đều vào cùng một socket.`,
          'Server biết trả lời về đâu bằng cách đọc IP và cổng nguồn của gói vừa nhận (recvfrom), rồi ghi rõ địa chỉ đó khi gửi (sendto).',
        ]
      : [
          `TCP có kết nối: server có 1 socket chào đón (listen/accept) ở cổng ${p.port}, cộng 1 socket riêng cho mỗi kết nối: $1 + ${p.n} = ${c.total}$ socket.`,
          `Dữ liệu từ ${p.n} client đi vào ${p.n} socket kết nối khác nhau (phân kênh theo bộ 4), dù cùng cổng đích ${p.port}.`,
          'Khi client gọi connect(), tầng vận chuyển bắt đầu bắt tay 3 bước bằng cách gửi SYN.',
        ];
  },
  view(p) {
    const c = socketCount(p);
    return {
      statement: [`${p.service} chạy trên ${p.proto} cổng ${p.port}. Hiện có ${p.n} client khác nhau đang trao đổi dữ liệu với server.`],
      fields: [
        {
          key: 'total',
          label: `Server đang dùng tổng cộng bao nhiêu socket ${p.proto} cho dịch vụ này?`,
          kind: 'number',
          exact: true,
          mistakes: p.proto === 'TCP' ? [{ value: p.n, msg: 'Còn socket chào đón (listen) nữa: 1 + n.' }] : [{ value: p.n, msg: 'UDP không kết nối: một socket nhận từ mọi client.' }],
        },
        { key: 'data', label: `Dữ liệu từ ${p.n} client đi vào bao nhiêu socket khác nhau?`, kind: 'number', exact: true, mistakes: c.data === 1 ? [] : [{ value: 1, msg: 'TCP phân kênh theo bộ 4: mỗi kết nối một socket.' }] },
        p.proto === 'UDP'
          ? { key: 'concept', label: 'Server UDP biết gửi trả lời về đâu bằng cách nào?', kind: 'choice', options: UDP_HOW, shuffle: true }
          : { key: 'concept', label: 'Khi client gọi connect() trên socket TCP thì:', kind: 'choice', options: TCP_CONNECT, shuffle: true },
      ],
    };
  },
};

export default def;
