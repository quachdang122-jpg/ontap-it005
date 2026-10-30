import { rng } from '../lib/rng';
import type { ProblemDef } from './types';

export interface P {
  host: string;
  path: string;
  version: '1.0' | '1.1';
  conn: 'keep-alive' | 'close' | null;
  browser: Browser;
  langs: { tag: string; q: number }[];
  ims: string | null;
  accept: string;
}

type Browser = 'Firefox' | 'Chrome' | 'Safari' | 'Edge';

const UA: Record<Browser, string> = {
  Firefox: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:131.0) Gecko/20100101 Firefox/131.0',
  Chrome: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
  Safari: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Safari/605.1.15',
  Edge: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36 Edg/129.0.2792.79',
};

const HOSTS = ['gaia.cs.umass.edu', 'www.uit.edu.vn', 'courses.example.edu', 'www.example.org', 'daa.uit.edu.vn', 'net.lab.vn'];
const PATHS = ['/index.html', '/cs453/index.html', '/kurose_ross/interactive/index.php', '/lab/wireshark-file1.html', '/tin-tuc/thong-bao.html', '/img/logo.png', '/docs/it005/bai-tap.pdf'];
const TAGS = ['vi-VN', 'vi', 'en-US', 'en', 'fr-FR', 'fr', 'ja', 'de', 'en-gb', 'zh-CN', 'ko'];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function persistent(p: Pick<P, 'version' | 'conn'>): boolean {
  if (p.conn === 'keep-alive') return true;
  if (p.conn === 'close') return false;
  return p.version === '1.1';
}

export function requestText(p: P): string {
  const lines = [
    `GET ${p.path} HTTP/${p.version}`,
    `Host: ${p.host}`,
    `User-Agent: ${UA[p.browser]}`,
    `Accept: ${p.accept}`,
    `Accept-Language: ${p.langs.map((l) => (l.q === 1 ? l.tag : `${l.tag};q=${l.q}`)).join(',')}`,
    'Accept-Encoding: gzip, deflate',
  ];
  if (p.conn) lines.push(`Connection: ${p.conn}`);
  if (p.ims) lines.push(`If-Modified-Since: ${p.ims}`);
  return lines.join('\n');
}

const YES = 'Có';
const NO = 'Không';
const IP_OPTS = ['Có, ở dòng Host', 'Có, ở dòng User-Agent', 'Không có trong thông điệp HTTP'];

const def: ProblemDef<P> = {
  id: 'http-request',
  chapter: 2,
  section: '2.4',
  title: 'Đọc HTTP request (GET)',
  asks: 'Cho một HTTP request bắt từ trình duyệt. Trả lời: URL đầy đủ, phiên bản HTTP, kết nối bền vững hay không, trình duyệt gì, ngôn ngữ ưa thích, đã có bản cache chưa…',
  formulas: ['\\text{URL} = \\texttt{http://} + \\text{Host} + \\text{đường dẫn}', '\\text{Không ghi } q \\Rightarrow q = 1'],
  generate(seed) {
    const g = rng(seed);
    const version = g.bool(0.75) ? '1.1' : '1.0';
    const conn = g.pick(['keep-alive', 'close', null] as const);
    const tags = g.shuffle(TAGS).slice(0, g.int(2, 4));
    const qs = g.shuffle([0.9, 0.8, 0.7, 0.5, 0.3, 0.1]).slice(0, tags.length - 1).sort((a, b) => b - a);
    const langs = tags.map((tag, i) => ({ tag, q: i === 0 ? 1 : qs[i - 1] }));
    const day = g.int(1, 28);
    const ims = g.bool()
      ? `${g.pick(DAYS)}, ${String(day).padStart(2, '0')} ${g.pick(MONTHS)} 2026 ${String(g.int(0, 23)).padStart(2, '0')}:${String(g.int(0, 59)).padStart(2, '0')}:00 GMT`
      : null;
    const path = g.pick(PATHS) + (g.bool(0.2) ? `?id=${g.int(1, 99)}` : '');
    const accept = path.endsWith('.png') ? 'image/avif,image/webp,*/*' : 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8';
    return { host: g.pick(HOSTS), path, version, conn, browser: g.pick(['Firefox', 'Chrome', 'Safari', 'Edge'] as const), langs, ims, accept };
  },
  solve(p) {
    return {
      url: `http://${p.host}${p.path}`,
      version: `HTTP/${p.version}`,
      persistent: persistent(p) ? YES : NO,
      browser: p.browser,
      most: p.langs[0].tag,
      least: p.langs[p.langs.length - 1].tag,
      cached: p.ims ? YES : NO,
      ip: IP_OPTS[2],
    };
  },
  explain(p) {
    const pers = persistent(p);
    const ua = UA[p.browser];
    return [
      `**URL đầy đủ:** ghép Host với đường dẫn trong dòng request: \`http://${p.host}${p.path}\`.`,
      `**Phiên bản:** HTTP/${p.version} (cuối dòng request).`,
      p.conn
        ? `**Bền vững:** ${pers ? 'có' : 'không'}, vì có dòng \`Connection: ${p.conn}\`.`
        : `**Bền vững:** không có dòng Connection nên theo mặc định: HTTP/1.1 là bền vững, HTTP/1.0 là không bền vững. Ở đây là HTTP/${p.version}, nên ${pers ? 'bền vững' : 'không bền vững'}.`,
      `**Trình duyệt:** ${p.browser}. ${
        p.browser === 'Chrome'
          ? 'Dòng User-Agent của Chrome có cả chữ “Safari” (lý do lịch sử) nhưng có “Chrome/” và không có “Edg/”.'
          : p.browser === 'Edge'
            ? 'Có chữ “Edg/” ở cuối: Edge (dù dòng này cũng chứa “Chrome” và “Safari”).'
            : p.browser === 'Safari'
              ? 'Có “Version/… Safari/” và không có “Chrome/”: Safari.'
              : 'Có “Firefox/”.'
      } (\`${ua}\`)`,
      `**Ngôn ngữ ưa thích nhất:** ${p.langs[0].tag} (không ghi q nghĩa là q = 1). **Ít ưa thích nhất:** ${p.langs[p.langs.length - 1].tag} (q = ${p.langs[p.langs.length - 1].q}).`,
      p.ims ? '**Đã có bản lưu đệm:** có dòng If-Modified-Since, đây là GET có điều kiện.' : '**Đã có bản lưu đệm:** không có dòng If-Modified-Since, nên không có dấu hiệu trình duyệt đang có bản cache.',
      '**Địa chỉ IP của máy khách:** không có trong thông điệp HTTP (nằm ở header IP của datagram).',
    ];
  },
  view(p) {
    return {
      statement: ['Trình duyệt gửi HTTP request sau (mỗi dòng kết thúc bằng CR LF, sau dòng cuối là một dòng trống):', { code: requestText(p) }],
      fields: [
        { key: 'url', label: 'URL đầy đủ của tài liệu được yêu cầu', kind: 'text', norm: 'url', placeholder: 'http://...', mistakes: [{ value: p.path, msg: 'Phải ghép thêm tên máy ở dòng Host.' }] },
        { key: 'version', label: 'Phiên bản HTTP', kind: 'choice', options: ['HTTP/1.0', 'HTTP/1.1', 'HTTP/2'] },
        {
          key: 'persistent',
          label: 'Trình duyệt yêu cầu kết nối bền vững?',
          kind: 'choice',
          options: [YES, NO],
          mistakes: !p.conn ? [{ value: persistent(p) ? NO : YES, msg: `Không có dòng Connection thì dùng mặc định của HTTP/${p.version}.` }] : [],
        },
        {
          key: 'browser',
          label: 'Trình duyệt nào gửi request?',
          kind: 'choice',
          options: ['Firefox', 'Chrome', 'Safari', 'Edge'],
          mistakes: p.browser === 'Chrome' || p.browser === 'Edge' ? [{ value: 'Safari', msg: 'User-Agent của Chrome và Edge đều có chữ “Safari”; hãy tìm “Chrome/” và “Edg/”.' }, ...(p.browser === 'Edge' ? [{ value: 'Chrome', msg: 'Có “Edg/” ở cuối là Edge.' }] : [])] : [],
        },
        { key: 'most', label: 'Ngôn ngữ được ưa thích nhất (ghi đúng nhãn, ví dụ vi-VN)', kind: 'text', norm: 'lower' },
        { key: 'least', label: 'Ngôn ngữ ít được ưa thích nhất', kind: 'text', norm: 'lower' },
        { key: 'cached', label: 'Trình duyệt đã có sẵn một bản lưu đệm của tài liệu?', kind: 'choice', options: [YES, NO] },
        { key: 'ip', label: 'Địa chỉ IP của máy khách có trong thông điệp này không?', kind: 'choice', options: IP_OPTS },
      ],
    };
  },
};

export default def;
