import { rng } from '../lib/rng';
import type { ProblemDef } from './types';

export interface P {
  buf: number;
  rcvd: number;
  read: number;
  unacked: number;
  mss: number;
}

export function flow({ buf, rcvd, read, unacked, mss }: P) {
  const rwnd = buf - (rcvd - read);
  const more = Math.max(0, rwnd - unacked);
  return { rwnd, more, segs: Math.floor(more / mss) };
}

const def: ProblemDef<P> = {
  id: 'flow-control',
  chapter: 3,
  section: '3.8',
  title: 'Điều khiển luồng TCP',
  asks: 'Cho kích thước bộ đệm nhận và các con trỏ byte. Tính rwnd, số byte và số segment bên gửi còn được phát thêm.',
  formulas: [
    '\\text{rwnd} = \\text{RcvBuffer} - (\\text{LastByteRcvd} - \\text{LastByteRead})',
    '\\text{LastByteSent} - \\text{LastByteAcked} \\le \\text{rwnd}',
  ],
  generate(seed) {
    const g = rng(seed);
    for (;;) {
      const buf = g.pick([2048, 4096, 8000, 8192, 10000, 16384, 20000]);
      const read = g.int(5, 60) * 100;
      const rcvd = read + g.int(1, Math.floor((buf * 0.8) / 100)) * 100;
      const mss = g.pick([100, 200, 250, 500, 536, 1000]);
      const r = buf - (rcvd - read);
      const unacked = g.int(0, Math.floor(r / 100)) * 100;
      const p = { buf, rcvd, read, unacked, mss };
      if (flow(p).more > 0) return p;
    }
  },
  solve(p) {
    return flow(p);
  },
  explain(p) {
    const f = flow(p);
    return [
      `**rwnd:** byte đang nằm trong bộ đệm chưa được ứng dụng đọc là $${p.rcvd} - ${p.read} = ${p.rcvd - p.read}$, nên $\\text{rwnd} = ${p.buf} - ${p.rcvd - p.read} = ${f.rwnd}$ byte.`,
      `**Còn gửi thêm được:** dữ liệu chưa ACK phải $\\le$ rwnd, nên còn $${f.rwnd} - ${p.unacked} = ${f.more}$ byte.`,
      `**Số segment ${p.mss} byte đầy đủ:** $\\lfloor ${f.more} / ${p.mss} \\rfloor = ${f.segs}$.`,
    ];
  },
  view(p) {
    const f = flow(p);
    return {
      statement: [
        `Bên nhận TCP có RcvBuffer $= ${p.buf}$ byte, LastByteRcvd $= ${p.rcvd}$, LastByteRead $= ${p.read}$. Bên gửi hiện có $${p.unacked}$ byte đã gửi nhưng chưa được ACK. Mỗi segment mang tối đa $${p.mss}$ byte dữ liệu.`,
      ],
      fields: [
        { key: 'rwnd', label: 'rwnd bên nhận quảng bá', kind: 'number', exact: true, unit: 'byte', mistakes: [{ value: p.rcvd - p.read, msg: 'Đó là phần đã chiếm trong bộ đệm; rwnd là phần còn trống.' }, { value: p.buf - p.rcvd, msg: 'Phải trừ phần đã được ứng dụng đọc: rwnd = RcvBuffer − (LastByteRcvd − LastByteRead).' }] },
        { key: 'more', label: 'Bên gửi còn được phát thêm bao nhiêu byte?', kind: 'number', exact: true, unit: 'byte', mistakes: [{ value: f.rwnd, msg: 'Phải trừ số byte đã gửi mà chưa được ACK.' }] },
        { key: 'segs', label: 'Tức là bao nhiêu segment đầy đủ?', kind: 'number', exact: true },
      ],
    };
  },
};

export default def;
