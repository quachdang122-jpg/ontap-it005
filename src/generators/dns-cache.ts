import { rng } from '../lib/rng';
import type { ProblemDef } from './types';

export interface Req {
  t: number;
  name: string;
}

export interface P {
  ttl: number;
  reqs: Req[];
}

type Level = 'A' | 'NS' | 'TLD' | 'none';

export interface Trace {
  t: number;
  name: string;
  time: number;
  hit: Level;
  stored: { key: string; at: number; exp: number }[];
  /** các thời điểm kiểm tra/lưu cần tránh nằm sát mốc hết hạn (để đề không mơ hồ) */
  boundary: boolean;
}

const tldOf = (name: string) => name.split('.').slice(-1)[0];
const domainOf = (name: string) => name.split('.').slice(-2).join('.');

/**
 * Mô phỏng bộ nhớ đệm của local DNS (truy vấn tuần tự, mỗi thông điệp 1 đơn vị).
 * Local nhận yêu cầu lúc t+1 và xét cache tại thời điểm đó. Bản ghi được lưu khi
 * câu trả lời về tới local: với cache rỗng, TLD lưu lúc t+3, NS lúc t+5, A lúc t+7.
 * Bản ghi lưu lúc s còn hiệu lực tới (không gồm) s + TTL.
 */
export function simulateDns({ ttl, reqs }: P): Trace[] {
  const cache = new Map<string, { at: number; exp: number }>();
  const sorted = [...reqs].sort((a, b) => a.t - b.t);
  const pending: { key: string; at: number; exp: number }[] = [];
  return sorted.map(({ t, name }) => {
    const c = t + 1;
    // nạp các bản ghi đã về tới local trước thời điểm c
    for (const rec of pending) if (rec.at <= c) cache.set(rec.key, { at: rec.at, exp: rec.exp });
    const keys = { A: `A ${name}`, NS: `NS ${domainOf(name)}`, TLD: `TLD .${tldOf(name)}` };
    const valid = (k: string) => {
      const r = cache.get(k);
      return !!r && r.at <= c && c < r.exp;
    };
    let boundary = false;
    for (const k of Object.values(keys)) {
      for (const r of pending) if (r.key === k && (Math.abs(c - r.exp) <= 1 || Math.abs(c - r.at) <= 1)) boundary = true;
    }
    const hit: Level = valid(keys.A) ? 'A' : valid(keys.NS) ? 'NS' : valid(keys.TLD) ? 'TLD' : 'none';
    const servers = { A: 0, NS: 1, TLD: 2, none: 3 }[hit];
    const stored: Trace['stored'] = [];
    const chain: string[] = hit === 'none' ? [keys.TLD, keys.NS, keys.A] : hit === 'TLD' ? [keys.NS, keys.A] : hit === 'NS' ? [keys.A] : [];
    chain.forEach((key, i) => {
      const at = t + 3 + 2 * i;
      const rec = { key, at, exp: at + ttl };
      stored.push(rec);
      pending.push(rec);
    });
    return { t, name, time: 2 + 2 * servers, hit, stored, boundary };
  });
}

const POOL = [
  'gaia.cs.umass.edu',
  'www.umass.edu',
  'cs.umd.edu',
  'cs.mit.edu',
  'web.mit.edu',
  'www.google.com',
  'mail.google.com',
  'www.amazon.com',
  'icann.org',
  'www.wikipedia.org',
  'en.wikipedia.org',
  'vnexpress.net',
];

const def: ProblemDef<P> = {
  id: 'dns-cache',
  chapter: 2,
  section: '2.1',
  title: 'Bộ nhớ đệm DNS với TTL',
  asks: 'Cache của local DNS ban đầu rỗng; mỗi thông điệp một chiều mất 1 đơn vị thời gian; mỗi bản ghi được lưu đệm trong TTL đơn vị. Tính thời gian phân giải cho từng yêu cầu của host.',
  formulas: [
    'T = 2 \\times (1 + \\text{số server phải hỏi})',
    '\\text{Cache rỗng: } 8 \\quad \\text{có TLD: } 6 \\quad \\text{có NS miền: } 4 \\quad \\text{có bản ghi A: } 2',
    '\\text{Yêu cầu bắt đầu ở } t: \\text{ TLD lưu lúc } t+3,\\ \\text{NS lúc } t+5,\\ \\text{A lúc } t+7',
  ],
  generate(seed) {
    const g = rng(seed);
    for (;;) {
      const ttl = g.pick([10, 15, 20, 25, 30]);
      const reqs: Req[] = [];
      let t = 0;
      for (let i = 0; i < 6; i++) {
        let name: string;
        const used = reqs.map((r) => r.name);
        const roll = g.next();
        if (used.length && roll < 0.35) name = g.pick(used);
        else if (used.length && roll < 0.7) {
          const tld = tldOf(g.pick(used));
          name = g.pick(POOL.filter((n) => tldOf(n) === tld));
        } else name = g.pick(POOL);
        reqs.push({ t, name });
        t += g.int(1, Math.round(ttl * 0.6));
      }
      const tr = simulateDns({ ttl, reqs });
      const kinds = new Set(tr.map((x) => x.time));
      if (!tr.some((x) => x.boundary) && kinds.size >= 3) return { ttl, reqs };
    }
  },
  solve(p) {
    return Object.fromEntries(simulateDns(p).map((x, i) => [`r${i}`, x.time]));
  },
  explain(p) {
    const why: Record<Level, string> = {
      none: 'Không có gì còn hạn: host↔local, local↔root, local↔TLD, local↔authoritative.',
      TLD: 'Còn địa chỉ TLD server: bỏ qua root.',
      NS: 'Còn bản ghi NS của miền (địa chỉ authoritative server): chỉ hỏi authoritative.',
      A: 'Còn câu trả lời cuối (bản ghi A): chỉ cần host↔local.',
    };
    return [
      `Local nhận yêu cầu lúc $t+1$ và xét cache tại đó. Bản ghi lưu lúc $s$ hết hạn ở $s + ${p.ttl}$.`,
      {
        table: {
          head: ['t', 'Tên', 'Thời gian', 'Lý do', 'Bản ghi mới lưu (lúc → hết hạn)'],
          rows: simulateDns(p).map((x) => [
            String(x.t),
            x.name,
            `**${x.time}**`,
            why[x.hit],
            x.stored.length ? x.stored.map((s) => `${s.key}: ${s.at} → ${s.exp}`).join('; ') : '—',
          ]),
        },
      },
    ];
  },
  view(p) {
    return {
      statement: [
        `Cache của local DNS ban đầu rỗng. Mỗi thông điệp một chiều (host↔local, local↔server bất kỳ) mất 1 đơn vị thời gian. Mọi bản ghi được lưu đệm $${p.ttl}$ đơn vị. Local DNS hỏi theo kiểu **tuần tự**. Host gửi các yêu cầu sau; tính thời gian từ lúc host hỏi tới lúc nhận được trả lời.`,
      ],
      fields: p.reqs.map((r, i) => ({ key: `r${i}`, label: `t = ${r.t}: ${r.name}`, kind: 'number', exact: true, unit: 'đơn vị' })),
    };
  },
};

export default def;
