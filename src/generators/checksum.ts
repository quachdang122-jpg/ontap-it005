import { spaced16, toBin16 } from '../lib/format';
import { rng } from '../lib/rng';
import type { Block, ProblemDef } from './types';

export interface P {
  words: number[];
}

export interface CsStep {
  a: number;
  b: number;
  raw: number;
  overflow: boolean;
  wrapped: number;
}

/** Cộng các từ 16 bit có cộng vòng (end-around carry) rồi lấy bù 1. */
export function internetChecksum(words: number[]) {
  const steps: CsStep[] = [];
  let acc = words[0] & 0xffff;
  let naive = words[0] & 0xffff; // tổng nếu quên cộng vòng (bỏ bit tràn)
  for (const w of words.slice(1)) {
    const raw = acc + (w & 0xffff);
    const overflow = raw > 0xffff;
    const wrapped = overflow ? (raw & 0xffff) + 1 : raw;
    steps.push({ a: acc, b: w, raw, overflow, wrapped });
    acc = wrapped & 0xffff;
    naive = (naive + w) & 0xffff;
  }
  return { sum: acc, checksum: ~acc & 0xffff, steps, naive, anyOverflow: steps.some((s) => s.overflow) };
}

export const parseBin = (s: string) => parseInt(s.replace(/\s/g, ''), 2);

const def: ProblemDef<P> = {
  id: 'checksum',
  chapter: 3,
  section: '3.2',
  title: 'Checksum Internet',
  hot: true,
  asks: 'Cộng các từ 16 bit (có cộng vòng khi tràn bit) rồi lấy bù 1 để được checksum.',
  formulas: [
    '\\text{1. Cộng lần lượt các từ 16 bit}',
    '\\text{2. Tràn bit thứ 17} \\Rightarrow \\text{bỏ bit tràn, cộng thêm 1 (cộng vòng)}',
    '\\text{3. Checksum} = \\text{bù 1 của tổng (đảo mọi bit)}',
    '\\text{Bên nhận: tổng mọi từ kể cả checksum} = 1111\\,1111\\,1111\\,1111 \\Rightarrow \\text{không phát hiện lỗi}',
  ],
  generate(seed) {
    const g = rng(seed);
    const n = g.bool(0.55) ? 2 : 3;
    const wantOverflow = g.bool(0.5);
    for (;;) {
      const words = Array.from({ length: n }, () => g.int(0x1000, 0xffff));
      if (internetChecksum(words).anyOverflow === wantOverflow) return { words };
    }
  },
  solve(p) {
    const c = internetChecksum(p.words);
    return { sum: toBin16(c.sum), checksum: toBin16(c.checksum) };
  },
  explain(p) {
    const c = internetChecksum(p.words);
    const lines: string[] = [];
    c.steps.forEach((s, i) => {
      if (i === 0) lines.push(`  ${spaced16(toBin16(s.a))}`);
      lines.push(`+ ${spaced16(toBin16(s.b))}`);
      lines.push(`= ${s.overflow ? '1 ' : ''}${spaced16(toBin16(s.raw))}${s.overflow ? '   (tràn 1 bit)' : '   (không tràn)'}`);
      if (s.overflow) lines.push(`  ${spaced16(toBin16(s.wrapped))}   (bỏ bit tràn, cộng vòng +1)`);
    });
    lines.push(`bù 1:  ${spaced16(toBin16(c.checksum))}  <- checksum`);
    const out: Block[] = [
      { code: lines.join('\n') },
      `**Tổng sau cộng vòng:** \`${spaced16(toBin16(c.sum))}\`. **Checksum** (đảo mọi bit): \`${spaced16(toBin16(c.checksum))}\`.`,
      `Kiểm tra: tổng + checksum = \`11111111 11111111\`.`,
    ];
    if (c.anyOverflow)
      out.push(`Phương án nhiễu “quên cộng vòng” cho tổng \`${spaced16(toBin16(c.naive))}\` và checksum \`${spaced16(toBin16(~c.naive & 0xffff))}\`.`);
    out.push(`Phương án nhiễu “quên lấy bù” ghi checksum bằng chính tổng \`${spaced16(toBin16(c.sum))}\`.`);
    return out;
  },
  view(p) {
    const c = internetChecksum(p.words);
    const forgotWrap = c.anyOverflow
      ? [
          { value: toBin16(c.naive), msg: 'Có thể bạn quên cộng vòng: khi tràn bit thứ 17 phải bỏ bit tràn và cộng thêm 1.' },
        ]
      : [];
    return {
      statement: [
        `Tính checksum Internet của ${p.words.length} từ 16 bit sau:`,
        { code: p.words.map((w) => spaced16(toBin16(w))).join('\n') },
        'Nhập 16 bit (có thể cách quãng giữa hai byte).',
      ],
      fields: [
        { key: 'sum', label: 'Tổng (sau khi đã cộng vòng nếu có tràn)', kind: 'text', norm: 'bits', placeholder: '00000000 00000000', mistakes: forgotWrap },
        {
          key: 'checksum',
          label: 'Checksum',
          kind: 'text',
          norm: 'bits',
          placeholder: '00000000 00000000',
          mistakes: [
            { value: toBin16(c.sum), msg: 'Có thể bạn quên lấy bù 1: checksum là tổng sau khi đảo mọi bit.' },
            ...(c.anyOverflow ? [{ value: toBin16(~c.naive & 0xffff), msg: 'Có thể bạn quên cộng vòng trước khi lấy bù.' }] : []),
          ],
        },
      ],
    };
  },
};

export default def;
