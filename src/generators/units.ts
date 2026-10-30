import { tn } from '../lib/format';

/** Hiển thị tốc độ bps thành Mbps/kbps/Gbps (TeX). */
export function rateTex(bps: number): string {
  if (bps >= 1e9 && bps % 1e9 === 0) return `${bps / 1e9}\\text{ Gbps}`;
  if (bps >= 1e6) return `${+(bps / 1e6).toPrecision(6)}\\text{ Mbps}`;
  if (bps >= 1e3) return `${+(bps / 1e3).toPrecision(6)}\\text{ kbps}`;
  return `${bps}\\text{ bps}`;
}

export function distTex(m: number): string {
  return m >= 1000 ? `${+(m / 1000).toPrecision(6)}\\text{ km}` : `${m}\\text{ m}`;
}

export const sTex = (s: number) => `${tn(s)}\\text{ m/s}`;

export type TimeUnit = 'ms' | 'µs' | 's';
export const unitFactor: Record<TimeUnit, number> = { s: 1, ms: 1e3, 'µs': 1e6 };
export const unitTex: Record<TimeUnit, string> = { s: '\\text{ s}', ms: '\\text{ ms}', 'µs': '\\,\\mu\\text{s}' };

/** Chọn đơn vị thời gian sao cho số hiển thị dễ đọc. */
export function pickUnit(seconds: number): TimeUnit {
  if (seconds < 1e-3) return 'µs';
  if (seconds < 10) return 'ms';
  return 's';
}
