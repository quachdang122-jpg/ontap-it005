import { rng } from '../lib/rng';
import type { ProblemDef } from './types';

export type Code = 200 | 301 | 304 | 404 | 505;

export interface P {
  code: Code;
  length: number;
  keep: boolean;
  date: string;
  lastMod: string;
  ask: 'Date' | 'Last-Modified';
}

export const MEANING: Record<Code, string> = {
  200: 'Thành công, đối tượng nằm ở phần thân',
  301: 'Đối tượng đã chuyển hẳn sang URL mới (dòng Location)',
  304: 'Bản cache của client vẫn còn mới, không gửi lại đối tượng',
  404: 'Không tìm thấy tài liệu trên server',
  505: 'Server không hỗ trợ phiên bản HTTP của request',
};
const REASON: Record<Code, string> = { 200: 'OK', 301: 'Moved Permanently', 304: 'Not Modified', 404: 'Not Found', 505: 'HTTP Version Not Supported' };

export function responseText(p: P): string {
  const lines = [`HTTP/1.1 ${p.code} ${REASON[p.code]}`, `Date: ${p.date}`, 'Server: Apache/2.4.62 (Ubuntu)'];
  if (p.code === 200) lines.push(`Last-Modified: ${p.lastMod}`, 'ETag: "1a6-5f2c"', 'Accept-Ranges: bytes');
  if (p.code === 301) lines.push('Location: https://www.example.org/new/index.html');
  if (p.code === 304) lines.push('ETag: "1a6-5f2c"');
  if (p.code !== 304) lines.push(`Content-Length: ${p.length}`);
  if (p.keep) lines.push('Keep-Alive: timeout=5, max=100', 'Connection: Keep-Alive');
  else lines.push('Connection: close');
  if (p.code !== 304) lines.push('Content-Type: text/html; charset=UTF-8');
  return lines.join('\n');
}

export function responseAnswers(p: P) {
  return {
    found: p.code === 200 ? 'Có' : 'Không',
    length: p.code === 304 ? 0 : p.length,
    keep: p.keep ? 'Có' : 'Không',
    meaning: MEANING[p.code],
    line: p.ask,
  };
}

const def: ProblemDef<P> = {
  id: 'http-response',
  chapter: 2,
  section: '2.5',
  title: 'Đọc HTTP response',
  hot: true,
  asks: 'Cho một HTTP response. Server có trả về đối tượng không, phần thân dài bao nhiêu, có giữ kết nối không, mã trạng thái nghĩa là gì?',
  formulas: ['\\text{200 OK} \\cdot \\text{301 Moved Permanently} \\cdot \\text{304 Not Modified} \\cdot \\text{404 Not Found} \\cdot \\text{505 Version Not Supported}'],
  generate(seed) {
    const g = rng(seed);
    const code = g.pick([200, 200, 301, 304, 404, 505] as const);
    const len = code === 200 ? g.int(200, 9000) : code === 301 ? g.int(180, 260) : code === 404 ? g.int(196, 620) : g.int(150, 320);
    const mon = g.pick(['Sep', 'Oct']);
    return {
      code,
      length: len,
      keep: g.bool(),
      date: `Thu, ${g.int(10, 29)} Oct 2026 ${String(g.int(0, 23)).padStart(2, '0')}:${String(g.int(10, 59))}:02 GMT`,
      lastMod: `Mon, ${String(g.int(1, 9)).padStart(2, '0')} ${mon} 2026 07:30:11 GMT`,
      ask: code === 200 && g.bool() ? 'Last-Modified' : 'Date',
    };
  },
  solve: responseAnswers,
  explain(p) {
    const a = responseAnswers(p);
    return [
      `**Mã ${p.code} ${REASON[p.code]}:** ${MEANING[p.code]}.`,
      p.code === 200 ? '**Có trả đối tượng:** có, mã 200 nghĩa là đối tượng ở phần thân.' : `**Có trả đối tượng được yêu cầu:** không.${p.code === 404 ? ' Phần thân (nếu có) chỉ là trang báo lỗi.' : ''}${p.code === 301 ? ' Client phải gửi request mới tới URL ở dòng Location.' : ''}`,
      p.code === 304 ? '**Kích thước phần thân:** 0, response 304 không có phần thân (không có dòng Content-Length).' : `**Kích thước phần thân:** ${a.length} byte (dòng Content-Length).`,
      `**Giữ kết nối:** ${p.keep ? 'có (Connection: Keep-Alive)' : 'không, server đóng kết nối sau response này (Connection: close)'}.`,
      p.ask === 'Date' ? '**Thời điểm server gửi response:** dòng Date.' : '**Thời điểm tài liệu được sửa lần cuối:** dòng Last-Modified.',
    ];
  },
  view(p) {
    return {
      statement: ['Server trả về HTTP response sau (chỉ hiện phần header):', { code: responseText(p) }],
      fields: [
        { key: 'found', label: 'Server có gửi về đối tượng được yêu cầu không?', kind: 'choice', options: ['Có', 'Không'], mistakes: p.code === 404 ? [{ value: 'Có', msg: 'Phần thân của 404 chỉ là trang báo lỗi, không phải tài liệu được yêu cầu.' }] : [] },
        {
          key: 'length',
          label: 'Kích thước phần thân (nhập 0 nếu không có)',
          kind: 'number',
          exact: true,
          unit: 'byte',
        },
        { key: 'keep', label: 'Server có giữ kết nối TCP sau response này không?', kind: 'choice', options: ['Có', 'Không'] },
        { key: 'meaning', label: `Ý nghĩa của mã ${p.code}`, kind: 'choice', options: Object.values(MEANING), shuffle: true },
        {
          key: 'line',
          label: p.ask === 'Date' ? 'Dòng nào cho biết thời điểm server gửi response?' : 'Dòng nào cho biết thời điểm tài liệu được sửa lần cuối?',
          kind: 'choice',
          options: ['Date', 'Last-Modified', 'Server', 'ETag'],
        },
      ],
    };
  },
};

export default def;
