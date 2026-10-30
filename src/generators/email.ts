import { rng } from '../lib/rng';
import type { ProblemDef } from './types';

export type Step6 = 'POP3' | 'IMAP' | 'HTTP';

export interface P {
  step6: Step6;
  client: string;
}

const CLIENTS: Record<Step6, string[]> = {
  POP3: ['Bob dùng Outlook cấu hình POP3, tải thư về máy rồi xóa trên server.', 'Bob dùng Thunderbird cấu hình POP3 để tải thư về máy.'],
  IMAP: ['Bob dùng Thunderbird cấu hình IMAP, thư vẫn được giữ và sắp xếp thư mục trên server.', 'Bob dùng ứng dụng Mail trên điện thoại cấu hình IMAP.'],
  HTTP: ['Bob đọc thư bằng Gmail trên trình duyệt (webmail).', 'Bob mở webmail của trường trên trình duyệt để đọc thư.'],
};

const PORT6: Record<Step6, number[]> = { POP3: [110], IMAP: [143], HTTP: [80, 443] };
const PROTOS = ['SMTP', 'POP3', 'IMAP', 'HTTP', 'DNS'];

export function emailAnswers(p: P) {
  return { p2: 'SMTP', p4: 'SMTP', p6: p.step6, kind6: 'Kéo (pull)', kind4: 'Đẩy (push)', port4: 25, transport: 'TCP', port6: PORT6[p.step6] };
}

const def: ProblemDef<P> = {
  id: 'email',
  chapter: 2,
  section: '2.7',
  title: 'Thư điện tử và SMTP',
  asks: 'Alice gửi thư cho Bob qua hình 6 bước. Hỏi giao thức ở bước 2, 4, 6; SMTP dùng TCP hay UDP; giao thức nào kéo, giao thức nào đẩy; số cổng.',
  formulas: ['\\text{SMTP: TCP 25 (đẩy)} \\quad \\text{POP3: 110} \\quad \\text{IMAP: 143} \\quad \\text{HTTP: 80/443 (kéo)}'],
  generate(seed) {
    const g = rng(seed);
    const step6 = g.pick(['POP3', 'IMAP', 'HTTP'] as const);
    return { step6, client: g.pick(CLIENTS[step6]) };
  },
  solve: emailAnswers,
  explain(p) {
    return [
      '**Bước 2** (UA của Alice → mail server của Alice): SMTP, đẩy thư đi.',
      '**Bước 4** (mail server của Alice → mail server của Bob): SMTP qua TCP cổng 25, cũng là đẩy.',
      `**Bước 6** (Bob lấy thư về): ${p.step6}${p.step6 === 'HTTP' ? ' (webmail: trình duyệt nói HTTP với server webmail)' : ''}, cổng ${PORT6[p.step6].join(' hoặc ')}. Đây là giao thức **kéo**: client chủ động yêu cầu.`,
      'SMTP chạy trên TCP (cần truyền tin cậy). Bước 4 không đổi dù Bob đọc thư bằng cách nào.',
    ];
  },
  view(p) {
    return {
      statement: [
        'Alice soạn thư trong ứng dụng thư (UA) và gửi cho Bob. Thư đi theo 6 bước: (1) Alice soạn thư; (2) UA của Alice gửi thư tới mail server của Alice; (3) thư nằm trong hàng đợi; (4) mail server của Alice chuyển thư tới mail server của Bob; (5) thư vào hộp thư của Bob; (6) Bob lấy thư về để đọc.',
        p.client,
      ],
      figure: { type: 'email', step6: p.step6 },
      fields: [
        { key: 'p2', label: 'Giao thức ở bước 2', kind: 'choice', options: PROTOS },
        { key: 'p4', label: 'Giao thức ở bước 4', kind: 'choice', options: PROTOS },
        { key: 'p6', label: 'Giao thức ở bước 6', kind: 'choice', options: PROTOS, mistakes: [{ value: 'SMTP', msg: 'SMTP chỉ đẩy thư đi; Bob lấy thư về bằng giao thức kéo (POP3/IMAP/HTTP).' }] },
        { key: 'kind4', label: 'Bước 4 là giao thức đẩy hay kéo?', kind: 'choice', options: ['Đẩy (push)', 'Kéo (pull)'] },
        { key: 'kind6', label: 'Bước 6 là giao thức đẩy hay kéo?', kind: 'choice', options: ['Đẩy (push)', 'Kéo (pull)'] },
        { key: 'transport', label: 'SMTP chạy trên giao thức vận chuyển nào?', kind: 'choice', options: ['TCP', 'UDP'] },
        { key: 'port4', label: 'Cổng của mail server nhận ở bước 4', kind: 'number', exact: true },
        { key: 'port6', label: 'Cổng mặc định của server ở bước 6', kind: 'number', exact: true },
      ],
    };
  },
};

export default def;
