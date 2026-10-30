import { rng } from '../lib/rng';
import type { ProblemDef } from './types';

export interface Item {
  q: string;
  options: string[];
  answer: string;
  why: string;
}

export interface P {
  items: Item[];
}

const LAYERS = ['Application', 'Transport', 'Network', 'Link', 'Physical'] as const;
const UNITS: Record<string, string> = { Application: 'Message', Transport: 'Segment', Network: 'Datagram', Link: 'Frame', Physical: 'Bit' };
const FUNCS: [string, string][] = [
  ['Hỗ trợ các ứng dụng mạng (web, email, DNS)', 'Application'],
  ['Truyền dữ liệu giữa các tiến trình trên hai host', 'Transport'],
  ['Định tuyến datagram từ host nguồn tới host đích', 'Network'],
  ['Truyền frame giữa hai nút kề nhau', 'Link'],
  ['Truyền từng bit trên môi trường vật lý', 'Physical'],
];
const PROTOS: [string, string][] = [
  ['HTTP', 'Application'],
  ['SMTP', 'Application'],
  ['DNS', 'Application'],
  ['TCP', 'Transport'],
  ['UDP', 'Transport'],
  ['IP', 'Network'],
  ['Ethernet', 'Link'],
  ['WiFi (802.11)', 'Link'],
];
const ORDERS = ['Hl, Hn, Ht, M', 'Ht, Hn, Hl, M', 'M, Ht, Hn, Hl', 'Hn, Hl, Ht, M'];

export function buildItems(seed: number): Item[] {
  const g = rng(seed);
  const items: Item[] = [];
  const L = g.pick(LAYERS);
  items.push({
    q: `Đơn vị dữ liệu của tầng ${L} gọi là gì?`,
    options: Object.values(UNITS),
    answer: UNITS[L],
    why: `Application: message; Transport: segment; Network: datagram; Link: frame; Physical: bit.`,
  });
  const [fn, fl] = g.pick(FUNCS);
  items.push({ q: `Chức năng “${fn}” thuộc tầng nào?`, options: [...LAYERS], answer: fl, why: `“${fn}” là việc của tầng ${fl}.` });
  const [pr, pl] = g.pick(PROTOS);
  items.push({ q: `Giao thức ${pr} thuộc tầng nào?`, options: [...LAYERS], answer: pl, why: `${pr} là giao thức tầng ${pl}.` });
  const extra = g.pick(['order', 'last', 'nohdr'] as const);
  if (extra === 'order')
    items.push({
      q: 'Frame chứa một segment mang thông điệp M. Thứ tự các phần từ ngoài vào trong là:',
      options: g.shuffle(ORDERS),
      answer: ORDERS[0],
      why: 'Mỗi tầng thêm header của mình vào ngoài dữ liệu nhận từ tầng trên, nên header link nằm ngoài cùng: [Hl | Hn | Ht | M].',
    });
  else if (extra === 'last')
    items.push({
      q: 'Trong frame [Hl | Hn | Ht | M], header nào được máy nhận bóc ra cuối cùng?',
      options: ['Hl', 'Hn', 'Ht', 'Không header nào'],
      answer: 'Ht',
      why: 'Máy nhận bóc Hl ở tầng liên kết, Hn ở tầng mạng, Ht ở tầng vận chuyển (cuối cùng); M là dữ liệu, không phải header.',
    });
  else
    items.push({
      q: 'Tầng nào KHÔNG thêm header (theo cách đếm của bài)?',
      options: [...LAYERS],
      answer: 'Physical',
      why: 'Physical chỉ truyền bit, không có header. Application là phần dữ liệu M.',
    });
  const dev = g.pick([
    ['Router', 'Network', 'Router xử lý 3 tầng dưới: Physical, Link, Network.'],
    ['Switch (link-layer switch)', 'Link', 'Switch chỉ xử lý 2 tầng: Physical, Link.'],
    ['Host', 'Application', 'Host xử lý đủ 5 tầng.'],
  ] as const);
  items.push({ q: `${dev[0]} xử lý tới tầng cao nhất nào?`, options: [...LAYERS], answer: dev[1], why: dev[2] });
  return items;
}

const def: ProblemDef<P> = {
  id: 'layering',
  chapter: 1,
  section: '1.8',
  title: 'Chồng giao thức IP và phân tầng',
  asks: 'Ghép chức năng với tầng, tầng với tên đơn vị dữ liệu, gọi tên và sắp thứ tự các header trong một frame.',
  formulas: ['\\text{Frame} = [\\,H_l \\mid H_n \\mid H_t \\mid M\\,]'],
  generate(seed) {
    return { items: buildItems(seed) };
  },
  solve(p) {
    return Object.fromEntries(p.items.map((it, i) => [`q${i}`, it.answer]));
  },
  explain(p) {
    return p.items.map((it) => `**${it.q}** ${it.answer}. ${it.why}`);
  },
  view(p) {
    return {
      statement: ['Chọn đáp án cho từng câu về chồng giao thức 5 tầng của Internet.'],
      fields: p.items.map((it, i) => ({ key: `q${i}`, label: it.q, kind: 'choice', options: it.options })),
    };
  },
};

export default def;
