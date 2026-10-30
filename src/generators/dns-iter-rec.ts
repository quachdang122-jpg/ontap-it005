import { rng } from '../lib/rng';
import type { ProblemDef } from './types';

export interface P {
  /** trễ một chiều (ms) */
  hostLocal: number;
  localRoot: number;
  localTld: number;
  localAuth: number;
  rootTld: number;
  tldAuth: number;
  shape: 'star' | 'chain';
}

export function dnsIterRec(p: P) {
  return {
    iter: 2 * (p.hostLocal + p.localRoot + p.localTld + p.localAuth),
    rec: 2 * (p.hostLocal + p.localRoot + p.rootTld + p.tldAuth),
    msgs: 8,
    iterCached: 2 * (p.hostLocal + p.localTld + p.localAuth),
    msgsCached: 6,
  };
}

const ITER = 'Tuần tự (iterative)';
const REC = 'Đệ quy (recursive)';

const def: ProblemDef<P> = {
  id: 'dns-iter-rec',
  chapter: 2,
  section: '2.2',
  title: 'DNS: truy vấn tuần tự và đệ quy',
  hot: true,
  asks: 'Cho thời gian truyền một chiều giữa các server, tính thời gian phân giải với từng kiểu truy vấn, đếm số thông điệp, và nhận biết kiểu truy vấn từ hình.',
  formulas: [
    'T_{\\text{tuần tự}} = 2(d_{h\\ell} + d_{\\ell,root} + d_{\\ell,TLD} + d_{\\ell,auth})',
    'T_{\\text{đệ quy}} = 2(d_{h\\ell} + d_{\\ell,root} + d_{root,TLD} + d_{TLD,auth})',
    '\\text{Cache rỗng: cả hai đều dùng 8 thông điệp (kể cả host} \\leftrightarrow \\text{local)}',
  ],
  generate(seed) {
    const g = rng(seed);
    return {
      hostLocal: g.int(1, 5),
      localRoot: g.int(10, 40),
      localTld: g.int(10, 40),
      localAuth: g.int(10, 40),
      rootTld: g.int(5, 30),
      tldAuth: g.int(5, 30),
      shape: g.bool() ? 'star' : 'chain',
    };
  },
  solve(p) {
    return { ...dnsIterRec(p), shape: p.shape === 'star' ? ITER : REC };
  },
  explain(p) {
    const r = dnsIterRec(p);
    return [
      `**Tuần tự:** local lần lượt hỏi root, TLD, authoritative, mỗi lần một cặp hỏi–đáp: $2(${p.hostLocal}) + 2(${p.localRoot}) + 2(${p.localTld}) + 2(${p.localAuth}) = ${r.iter}$ ms.`,
      `**Đệ quy:** chuỗi host → local → root → TLD → auth rồi quay về theo đúng đường đó: $2(${p.hostLocal} + ${p.localRoot} + ${p.rootTld} + ${p.tldAuth}) = ${r.rec}$ ms.`,
      `**Số thông điệp:** cả hai kiểu đều 8 (4 cặp hỏi–đáp).`,
      `**Local đã có địa chỉ TLD (tuần tự):** bỏ cặp local↔root, còn 6 thông điệp, mất $2(${p.hostLocal}) + 2(${p.localTld}) + 2(${p.localAuth}) = ${r.iterCached}$ ms.`,
      `**Nhận dạng hình:** dạng ngôi sao quanh local DNS là tuần tự; dạng chuỗi local → root → TLD → auth rồi quay ngược là đệ quy. Hình trong đề có dạng ${p.shape === 'star' ? 'ngôi sao, nên là tuần tự' : 'chuỗi, nên là đệ quy'}.`,
    ];
  },
  view(p) {
    const r = dnsIterRec(p);
    return {
      statement: [
        'Host hỏi local DNS server để phân giải một tên; cache ban đầu rỗng. Trễ truyền một chiều (ms):',
        {
          table: {
            head: ['host–local', 'local–root', 'local–TLD', 'local–auth', 'root–TLD', 'TLD–auth'],
            rows: [[p.hostLocal, p.localRoot, p.localTld, p.localAuth, p.rootTld, p.tldAuth].map(String)],
          },
        },
        p.shape === 'star'
          ? 'Một hình vẽ cho thấy local DNS lần lượt gửi truy vấn tới root, TLD, authoritative và nhận trả lời trực tiếp từ từng server (các mũi tên tỏa ra từ local như ngôi sao).'
          : 'Một hình vẽ cho thấy truy vấn đi theo chuỗi local → root → TLD → authoritative, rồi câu trả lời quay ngược lại theo đúng chuỗi đó.',
      ],
      fields: [
        { key: 'iter', label: 'Thời gian phân giải với truy vấn tuần tự', kind: 'number', unit: 'ms', mistakes: [{ value: r.iter / 2, msg: 'Mỗi server là một cặp hỏi–đáp: nhân 2 trễ một chiều.' }, { value: r.rec, msg: 'Đó là thời gian đệ quy.' }] },
        { key: 'rec', label: 'Thời gian phân giải với truy vấn đệ quy', kind: 'number', unit: 'ms', mistakes: [{ value: r.rec / 2, msg: 'Câu trả lời phải quay ngược lại cả chuỗi: nhân 2.' }, { value: r.iter, msg: 'Đó là thời gian tuần tự.' }] },
        { key: 'msgs', label: 'Số thông điệp DNS (kể cả host↔local), cả hai kiểu', kind: 'number', exact: true, mistakes: [{ value: 6, msg: 'Nhớ đếm cả cặp host↔local.' }] },
        { key: 'iterCached', label: 'Nếu local đã có sẵn địa chỉ TLD server: thời gian tuần tự', kind: 'number', unit: 'ms' },
        { key: 'msgsCached', label: 'Khi đó số thông điệp (kể cả host↔local)', kind: 'number', exact: true },
        { key: 'shape', label: 'Hình vẽ trong đề minh họa kiểu truy vấn nào?', kind: 'choice', options: [ITER, REC] },
      ],
    };
  },
};

export default def;
