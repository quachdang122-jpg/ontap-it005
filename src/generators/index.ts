import caravan from './caravan';
import checksum from './checksum';
import circuitSwitching from './circuit-switching';
import cwnd from './cwnd';
import dnsCache from './dns-cache';
import dnsHttpDelay from './dns-http-delay';
import dnsIterRec from './dns-iter-rec';
import email from './email';
import endToEndDelay from './end-to-end-delay';
import flowControl from './flow-control';
import gbnSr from './gbn-sr';
import httpRequest from './http-request';
import httpResponse from './http-response';
import layering from './layering';
import muxDemux from './mux-demux';
import oneHopDelay from './one-hop-delay';
import p2p from './p2p';
import psVsCs from './ps-vs-cs';
import queuingDelay from './queuing-delay';
import rdt from './rdt';
import sockets from './sockets';
import tcpRtt from './tcp-rtt';
import tcpSeqAck from './tcp-seq-ack';
import throughput from './throughput';
import utilization from './utilization';
import webCache from './web-cache';
import type { ProblemDef } from './types';

export const PROBLEMS: ProblemDef[] = [
  circuitSwitching,
  psVsCs,
  caravan,
  oneHopDelay,
  queuingDelay,
  endToEndDelay,
  throughput,
  layering,
  dnsCache,
  dnsIterRec,
  dnsHttpDelay,
  httpRequest,
  httpResponse,
  webCache,
  email,
  p2p,
  sockets,
  muxDemux,
  checksum,
  rdt,
  utilization,
  gbnSr,
  tcpSeqAck,
  tcpRtt,
  flowControl,
  cwnd,
];

export const byId = (id: string) => PROBLEMS.find((p) => p.id === id);
export const byChapter = (c: number) => PROBLEMS.filter((p) => p.chapter === c);

export const CHAPTERS = [
  { n: 1, title: 'Giới thiệu', desc: 'Chuyển mạch, các loại trễ, thông lượng, phân tầng' },
  { n: 2, title: 'Tầng Ứng dụng', desc: 'DNS, HTTP, web cache, email, P2P, socket' },
  { n: 3, title: 'Tầng Vận chuyển', desc: 'Phân kênh, checksum, rdt, GBN/SR, TCP' },
] as const;
