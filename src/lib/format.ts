/** Làm tròn tới `digits` chữ số có nghĩa, bỏ số 0 thừa. */
export function round(x: number, digits = 4): number {
  if (!isFinite(x) || x === 0) return x;
  return Number(x.toPrecision(digits));
}

/** Số dạng chữ thường (để gợi ý nhập), ví dụ 0.000424 hoặc 1.879e-3. */
export function plain(x: number, digits = 4): string {
  if (x === Infinity) return '∞';
  if (x === 0) return '0';
  const a = Math.abs(x);
  if (a < 1e-3 || a >= 1e7) {
    const [m, e] = x.toExponential(digits - 1).split('e');
    return `${Number(m)}e${Number(e)}`;
  }
  return String(round(x, digits));
}

function group(intPart: string): string {
  if (intPart.replace('-', '').length < 5) return intPart;
  return intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '\\,');
}

/** Số dạng TeX: 1.6 \times 10^{-4}, 16\,000, 0.5. */
export function tn(x: number, digits = 4): string {
  if (x === Infinity) return '\\infty';
  if (x === 0) return '0';
  const a = Math.abs(x);
  if (a < 1e-3 || a >= 1e7) {
    const [m, e] = x.toExponential(digits - 1).split('e');
    const mant = Number(m);
    return `${mant === 1 ? '' : `${mant} \\times `}10^{${Number(e)}}`;
  }
  const s = String(round(x, digits));
  const [ip, fp] = s.split('.');
  return fp ? `${group(ip)}.${fp}` : group(ip);
}

/** Số nguyên có nhóm hàng nghìn kiểu TeX. */
export function ti(x: number): string {
  return group(String(Math.round(x)));
}

export const toBin16 = (x: number) => (x & 0xffff).toString(2).padStart(16, '0');
export const spaced16 = (b: string) => `${b.slice(0, 8)} ${b.slice(8)}`;
