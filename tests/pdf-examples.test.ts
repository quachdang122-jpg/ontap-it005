import { describe, expect, it } from 'vitest';
import { caravan } from '../src/generators/caravan';
import { internetChecksum, parseBin } from '../src/generators/checksum';
import { circuitMax } from '../src/generators/circuit-switching';
import { cwndAnswers, roundOfSegment, simulateCwnd } from '../src/generators/cwnd';
import { simulateDns } from '../src/generators/dns-cache';
import { dnsHttp } from '../src/generators/dns-http-delay';
import { dnsIterRec } from '../src/generators/dns-iter-rec';
import { emailAnswers } from '../src/generators/email';
import { endToEnd } from '../src/generators/end-to-end-delay';
import { flow } from '../src/generators/flow-control';
import { gbnSr, maxWindow } from '../src/generators/gbn-sr';
import httpRequest, { persistent } from '../src/generators/http-request';
import { responseAnswers } from '../src/generators/http-response';
import { buildItems } from '../src/generators/layering';
import { muxAnswers } from '../src/generators/mux-demux';
import { oneHop } from '../src/generators/one-hop-delay';
import { p2p } from '../src/generators/p2p';
import { binomPmf, psVsCs } from '../src/generators/ps-vs-cs';
import { queuing } from '../src/generators/queuing-delay';
import { simulateRdt } from '../src/generators/rdt';
import { socketCount } from '../src/generators/sockets';
import { tcpRtt } from '../src/generators/tcp-rtt';
import { tcpSeqAck } from '../src/generators/tcp-seq-ack';
import { throughput } from '../src/generators/throughput';
import { utilization } from '../src/generators/utilization';
import { webCache } from '../src/generators/web-cache';
import { toBin16 } from '../src/lib/format';

const close = (a: number, b: number, rel = 1e-3) => expect(Math.abs(a - b)).toBeLessThanOrEqual(rel * Math.abs(b));

describe('Chương 1', () => {
  it('circuit-switching: ví dụ KC 1.3 và tự luyện 1.1', () => {
    expect(circuitMax({ ab: 20, bc: 19, cd: 15, da: 16 })).toMatchObject({ total: 70, ac: 34 });
    expect(circuitMax({ ab: 10, bc: 14, cd: 8, da: 12 })).toEqual({ total: 44, ac: 18, bd: 18 });
  });

  it('ps-vs-cs: R = 10 Mbps, r = 1 Mbps, p = 0.1, N = 35', () => {
    const r = psVsCs({ R: 10000, r: 1000, p: 0.1, N: 35 });
    expect(r.users).toBe(10);
    close(r.pk, 0.000333, 5e-3);
    close(r.tail, 0.000424, 5e-3);
  });

  it('ps-vs-cs: tự luyện 1.2 (3 Mbps, 150 kbps, N = 120)', () => {
    const r = psVsCs({ R: 3000, r: 150, p: 0.1, N: 120 });
    expect(r.users).toBe(20);
    close(r.pk, 0.00414, 5e-3);
    close(r.tail, 0.00794, 5e-3);
    close(binomPmf(35, 11, 0.1), 0.000333, 5e-3);
  });

  it('caravan: ví dụ và tự luyện 1.3', () => {
    expect(caravan({ n: 10, t: 12, d: 150, v: 100 })).toEqual({ service: 120, travel: 5400, firstServed: 5508, total: 5520 });
    expect(caravan({ n: 7, t: 10, d: 80, v: 120 })).toEqual({ service: 70, travel: 2400, firstServed: 2460, total: 2470 });
  });

  it('one-hop-delay: 1500 byte, 10 Mbps, 2500 km, 2.5e8', () => {
    const o = oneHop({ L: 1500, Lunit: 'byte', R: 10e6, d: 2.5e6, s: 2.5e8 });
    close(o.trans, 1.2e-3);
    close(o.prop, 10e-3);
    close(o.total, 11.2e-3);
    close(o.travelled, 300e3);
    expect(o.arrived).toBe(false);
    const t = oneHop({ L: 1000, Lunit: 'byte', R: 100e6, d: 20e3, s: 2e8 });
    close(t.trans, 80e-6);
    close(t.prop, 100e-6);
    close(t.travelled, 16e3);
  });

  it('queuing-delay: R = 1 Mbps, L = 5000 bit', () => {
    close(queuing({ R: 1e6, L: 5000, a: 100 }).dq, 5e-3);
    close(queuing({ R: 1e6, L: 5000, a: 150 }).dq, 15e-3);
    close(queuing({ R: 1e6, L: 5000, a: 190 }).dq, 95e-3);
    close(queuing({ R: 2e6, L: 4000, a: 450 }).dq, 18e-3);
    expect(queuing({ R: 2e6, L: 4000, a: 600 }).dq).toBe(Infinity);
  });

  it('end-to-end-delay: L = 16000 bit, ba link, s = 3e8 → 1.8787e-3 s', () => {
    const e = endToEnd({
      L: 16000,
      links: [
        { R: 100e6, d: 3e3 },
        { R: 1000e6, d: 500e3 },
        { R: 1000e6, d: 3e3 },
      ],
      s: 3e8,
    });
    close(e.total, 1.8787e-3, 1e-4);
    close(e.per[0].sum, 1.7e-4);
    close(e.per[1].sum, 1.683e-3);
  });

  it('end-to-end-delay: tự luyện 1.6 → 8.07 ms', () => {
    const e = endToEnd({
      L: 12000,
      links: [
        { R: 10e6, d: 1e3 },
        { R: 50e6, d: 1200e3 },
        { R: 20e6, d: 5e3 },
      ],
      s: 2e8,
    });
    close(e.total, 8.07e-3);
  });

  it('throughput: KC 1.4 và tự luyện 1.7', () => {
    const t = throughput({ Rs: 50, Rc: 90, R: 300, n: 4 });
    expect(t.tp).toBe(50);
    expect(t.us).toBe(1);
    close(t.uc, 0.5556);
    close(t.ur, 0.6667);
    const u = throughput({ Rs: 40, Rc: 60, R: 100, n: 4 });
    expect(u.tp).toBe(25);
    expect(u.ur).toBe(1);
  });

  it('layering: mỗi câu có đáp án nằm trong các phương án', () => {
    for (let s = 1; s < 30; s++) for (const it of buildItems(s)) expect(it.options).toContain(it.answer);
  });
});

describe('Chương 2', () => {
  it('dns-cache: t = 0, 1, 5, 10, 12, 30 (TTL 20) → 8, 8, 6, 2, 6, 8', () => {
    const tr = simulateDns({
      ttl: 20,
      reqs: [
        { t: 0, name: 'gaia.cs.umass.edu' },
        { t: 1, name: 'icann.org' },
        { t: 5, name: 'cs.umd.edu' },
        { t: 10, name: 'gaia.cs.umass.edu' },
        { t: 12, name: 'cs.mit.edu' },
        { t: 30, name: 'gaia.cs.umass.edu' },
      ],
    });
    expect(tr.map((x) => x.time)).toEqual([8, 8, 6, 2, 6, 8]);
    expect(tr[0].stored.map((s) => s.at)).toEqual([3, 5, 7]);
  });

  it('dns-cache: tự luyện 2.1 (www.umass.edu ở t = 15 → 4)', () => {
    const tr = simulateDns({ ttl: 20, reqs: [{ t: 0, name: 'gaia.cs.umass.edu' }, { t: 15, name: 'www.umass.edu' }] });
    expect(tr[1].time).toBe(4);
  });

  it('dns-iter-rec: 122 ms và 76 ms; tự luyện 2.2 → 92 ms', () => {
    const r = dnsIterRec({ hostLocal: 1, localRoot: 15, localTld: 20, localAuth: 25, rootTld: 10, tldAuth: 12, shape: 'star' });
    expect(r.iter).toBe(122);
    expect(r.rec).toBe(76);
    expect(r.iterCached).toBe(92);
    expect(r.msgs).toBe(8);
    expect(r.msgsCached).toBe(6);
  });

  it('dns-http-delay: DNS 1 + 48, RTT 20, 10 đối tượng, k = 5', () => {
    const d = dnsHttp({ dns: [1, 48], rtt: 20, n: 10, k: 5 });
    expect([d.base, d.npSerial, d.npParallel, d.pParallel, d.pPipe, d.pNoPipe]).toEqual([89, 489, 169, 129, 109, 289]);
  });

  it('dns-http-delay: tự luyện 2.3', () => {
    const d = dnsHttp({ dns: [3, 20, 26], rtt: 15, n: 8, k: 5 });
    expect([d.base, d.npSerial, d.npParallel, d.pParallel, d.pPipe, d.pNoPipe]).toEqual([79, 319, 139, 109, 94, 199]);
  });

  it('http-request: mặc định bền vững theo phiên bản', () => {
    expect(persistent({ version: '1.1', conn: null })).toBe(true);
    expect(persistent({ version: '1.0', conn: null })).toBe(false);
    expect(persistent({ version: '1.0', conn: 'keep-alive' })).toBe(true);
    expect(persistent({ version: '1.1', conn: 'close' })).toBe(false);
    const p = httpRequest.generate(7);
    const a = httpRequest.solve(p);
    expect(a.url).toBe(`http://${p.host}${p.path}`);
    expect(a.most).toBe(p.langs[0].tag);
  });

  it('http-response: 304 không có thân; 404 không trả đối tượng', () => {
    const base = { length: 422, keep: true, date: '', lastMod: '', ask: 'Date' as const };
    expect(responseAnswers({ ...base, code: 304 })).toMatchObject({ found: 'Không', length: 0 });
    expect(responseAnswers({ ...base, code: 200 })).toMatchObject({ found: 'Có', length: 422, keep: 'Có' });
    expect(responseAnswers({ ...base, code: 404, keep: false })).toMatchObject({ found: 'Không', keep: 'Không' });
  });

  it('web-cache: ví dụ slide và tự luyện 2.6', () => {
    const a = webCache({ R: 1.54, lambda: 15, size: 100, h: 0.4, dI: 2, dL: 0.01 });
    close(a.before, 0.974, 1e-3);
    close(a.after, 0.584, 2e-3);
    close(a.delay, 1.21, 2e-3);
    const b = webCache({ R: 10, lambda: 90, size: 100, h: 0.3, dI: 1.5, dL: 0.01 });
    close(b.before, 0.9);
    close(b.after, 0.63);
    close(b.delay, 1.06, 2e-3);
  });

  it('email: bước 6 webmail là HTTP, bước 4 vẫn SMTP', () => {
    const a = emailAnswers({ step6: 'HTTP', client: '' });
    expect(a.p4).toBe('SMTP');
    expect(a.p6).toBe('HTTP');
    expect(a.port4).toBe(25);
    expect(emailAnswers({ step6: 'IMAP', client: '' }).port6).toEqual([143]);
  });

  it('p2p: F = 15 Gbit, us = 30 Mbps, d = 2 Mbps, N = 100, u = 700 kbps', () => {
    const r = p2p({ F: 15, Funit: 'Gbit', us: 30e6, dmin: 2e6, N: 100, u: 700e3 });
    close(r.dcs, 50000);
    close(r.dp2p, 15000);
    const t = p2p({ F: 1, Funit: 'Gbit', us: 20e6, dmin: 5e6, N: 50, u: 1e6 });
    close(t.dcs, 2500);
    close(t.dp2p, 714.3, 1e-3);
    const gb = p2p({ F: 1, Funit: 'GB', us: 20e6, dmin: 5e6, N: 50, u: 1e6 });
    close(gb.F, 8e9);
  });

  it('sockets: web server có 5 kết nối TCP dùng 6 socket', () => {
    expect(socketCount({ proto: 'TCP', n: 5 }).total).toBe(6);
    expect(socketCount({ proto: 'TCP', n: 8 }).total).toBe(9);
    expect(socketCount({ proto: 'UDP', n: 8 }).total).toBe(1);
  });
});

describe('Chương 3', () => {
  it('mux-demux: KC 3.3 segment trả lời đảo nguồn/đích', () => {
    const a = muxAnswers({
      proto: 'TCP',
      A: { ip: '60.54.75.24', port: 4829 },
      B: { ip: '60.54.75.24', port: 4829 },
      C: { ip: '128.119.40.186', port: 3546 },
      tf: 1,
    });
    expect(a).toMatchObject({ s1src: 4829, s1dst: 3546, s2src: 3546, s2dst: 4829, s2srcIp: '128.119.40.186', s2dstIp: '60.54.75.24', tf: 'Sai' });
  });

  it('checksum: hai từ (có tràn) → 0101011011100111', () => {
    const c = internetChecksum([parseBin('1111010111010011'), parseBin('1011001101000100')]);
    expect(toBin16(c.sum)).toBe('1010100100011000');
    expect(toBin16(c.checksum)).toBe('0101011011100111');
    expect(c.anyOverflow).toBe(true);
  });

  it('checksum: ba từ → 1011010100111101', () => {
    const c = internetChecksum(['0110011001100000', '0101010101010101', '1000111100001100'].map(parseBin));
    expect(toBin16(c.checksum)).toBe('1011010100111101');
  });

  it('checksum: không tràn, tự luyện 3.2 và câu 27', () => {
    expect(toBin16(internetChecksum([parseBin('0100000111000100'), parseBin('0010000000101011')]).checksum)).toBe('1001111000010000');
    expect(toBin16(internetChecksum(['1101101011100101', '1011011000111010', '0011110001011100'].map(parseBin)).checksum)).toBe('0011001010000011');
    expect(toBin16(internetChecksum([0x8001, 0x8002]).checksum)).toBe('1111111111111011');
  });

  it('rdt3.0: mất ACK thì bên nhận bỏ gói trùng và gửi lại ACK', () => {
    const t = simulateRdt({ proto: 'rdt3.0', k: 3, event: 'lossAck', at: 1 });
    expect(t.pkts).toEqual(['pkt0', 'pkt1', 'pkt1', 'pkt0']);
    expect(t.acks).toEqual(['ACK0', 'ACK1', 'ACK1', 'ACK0']);
    expect(t.delivered).toBe(3);
  });

  it('rdt2.2: pkt0 lỗi → bên nhận gửi ACK1 (tự luyện 3.3a)', () => {
    const t = simulateRdt({ proto: 'rdt2.2', k: 3, event: 'corruptPkt', at: 0 });
    expect(t.acks[0]).toBe('ACK1');
    expect(t.pkts.slice(0, 2)).toEqual(['pkt0', 'pkt0']);
  });

  it('utilization: KC 3.4 và tự luyện 3.4', () => {
    const a = utilization({ L: 10, Lunit: 'Kbit', R: 10e6, rtt: 10, N: 5, target: 0.9 });
    close(a.tr, 1);
    close(a.usw, 1 / 11);
    expect(a.nmin).toBe(10);
    const b = utilization({ L: 1500, Lunit: 'byte', R: 1e9, rtt: 30, N: 5, target: 0.9 });
    close(b.tr, 0.012);
    close(b.usw, 0.0004, 2e-3);
    expect(b.nmin).toBe(2251);
    close(utilization({ L: 2, Lunit: 'Kbit', R: 1e6, rtt: 18, N: 1, target: 0.5 }).usw, 0.1);
  });

  it('gbn-sr: tự luyện 3.5', () => {
    const r = gbnSr({ N: 4, mode: 'pkt', lost: 2, bits: 3 });
    expect(r.gbnAcks).toEqual(['ACK0', 'ACK1', 'ACK1']);
    expect(r.gbnResend).toEqual(['pkt2', 'pkt3']);
    expect(r.srAcks).toEqual(['ACK0', 'ACK1', 'ACK3']);
    expect(r.srResend).toEqual(['pkt2']);
    expect(gbnSr({ N: 4, mode: 'ack', lost: 1, bits: 3 }).gbnResend).toEqual([]);
    expect(maxWindow(3)).toEqual({ gbn: 7, sr: 4 });
  });

  it('tcp-seq-ack: Seq 100, 500 byte, cửa sổ 5, segment 2 mất, bên nhận giữ', () => {
    const r = tcpSeqAck({ seq0: 100, L: 500, W: 5, mode: 'seg', lost: 2, policy: 'keep' });
    expect(r.seqs).toEqual([100, 600, 1100, 1600, 2100]);
    expect(r.acks).toEqual([600, null, 600, 600, 600]);
    expect(r.actions.map((a) => [a.t, a.sends])).toEqual([
      [15, [2600]],
      [16, []],
      [17, []],
      [18, []],
      [19, [600]],
    ]);
    expect(r.finalAck).toBe(3100);
  });

  it('tcp-seq-ack: bên nhận bỏ segment sai thứ tự → ACK 1100', () => {
    expect(tcpSeqAck({ seq0: 100, L: 500, W: 5, mode: 'seg', lost: 2, policy: 'discard' }).finalAck).toBe(1100);
  });

  it('tcp-seq-ack: ví dụ 1 (Seq 236, 540 byte, cửa sổ 4, segment 2 mất)', () => {
    const r = tcpSeqAck({ seq0: 236, L: 540, W: 4, mode: 'seg', lost: 2, policy: 'keep' });
    expect(r.seqs).toEqual([236, 776, 1316, 1856]);
    expect(r.acks).toEqual([776, null, 776, 776]);
    expect(r.fastRetx).toBeNull();
  });

  it('tcp-rtt: Est 100, Dev 5, mẫu 106, 120, 140, 90, 115', () => {
    const rows = tcpRtt({ est0: 100, dev0: 5, samples: [106, 120, 140, 90, 115], alpha: 0.125, beta: 0.25, rfc: false });
    const expected = [121.0, 135.1875, 164.0234, 163.2793, 158.3033];
    rows.forEach((r, i) => expect(r.timeout).toBeCloseTo(expected[i], 3));
    expect(rows[0].est).toBeCloseTo(100.75, 6);
    expect(rows[0].dev).toBeCloseTo(5.0625, 6);
  });

  it('tcp-rtt: tự luyện 3.7 và chế độ RFC 6298 khác giáo trình', () => {
    const rows = tcpRtt({ est0: 50, dev0: 4, samples: [62, 44, 58], alpha: 0.125, beta: 0.25, rfc: false });
    expect(rows[0].timeout).toBeCloseTo(74.0, 3);
    expect(rows[2].timeout).toBeCloseTo(75.578, 2);
    const rfc = tcpRtt({ est0: 100, dev0: 5, samples: [106], alpha: 0.125, beta: 0.25, rfc: true });
    expect(rfc[0].dev).toBeCloseTo(0.75 * 5 + 0.25 * 6, 9);
  });

  it('flow-control: tự luyện 3.8 và câu 39', () => {
    expect(flow({ buf: 4096, rcvd: 3000, read: 1000, unacked: 1500, mss: 100 })).toMatchObject({ rwnd: 2096, more: 596, segs: 5 });
    expect(flow({ buf: 8000, rcvd: 6000, read: 2500, unacked: 0, mss: 100 }).rwnd).toBe(4500);
  });

  it('cwnd: ssthresh 8, 3 ACK trùng ở vòng 6, timeout ở vòng 11', () => {
    const p = { ssthresh0: 8, T: 17, events: [{ round: 6, type: 'dup' as const }, { round: 11, type: 'timeout' as const }], noPlus3: false };
    const rows = simulateCwnd(p);
    expect(rows.map((r) => r.cwnd)).toEqual([1, 2, 4, 8, 9, 10, 8, 9, 10, 11, 12, 1, 2, 4, 6, 7, 8]);
    expect(roundOfSegment(rows, 50)).toBe(8);
    const a = cwndAnswers({ ...p, k: 50, askRound: 15 });
    expect(a.ss).toBe('1-3, 12-14');
    expect(a.ca).toBe('4-11, 15-17');
    expect(a.sAfter).toBe('5, 6');
    expect(a.cAt).toBe(6);
  });

  it('cwnd: tự luyện 3.9 (ssthresh 16, 3 ACK trùng ở cwnd 20, timeout ở cwnd 14)', () => {
    const rows = simulateCwnd({ ssthresh0: 16, T: 15, events: [{ round: 9, type: 'dup' }, { round: 11, type: 'timeout' }], noPlus3: false });
    expect(rows.map((r) => r.cwnd)).toEqual([1, 2, 4, 8, 16, 17, 18, 19, 20, 13, 14, 1, 2, 4, 7]);
  });

  it('cwnd: quy ước bỏ +3 sau 3 ACK trùng', () => {
    const rows = simulateCwnd({ ssthresh0: 8, T: 8, events: [{ round: 6, type: 'dup' }], noPlus3: true });
    expect(rows[6].cwnd).toBe(5);
  });
});
