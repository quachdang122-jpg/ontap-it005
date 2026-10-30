import { describe, expect, it } from 'vitest';
import type { FieldSpec } from '../src/generators/types';
import { checkField, diagnose, normalize, parseNum } from '../src/lib/grade';
import { rng } from '../src/lib/rng';

describe('parseNum', () => {
  it('chấp nhận dấu phẩy, dấu chấm, ký hiệu khoa học, ×10^, %', () => {
    expect(parseNum('0.25')).toBe(0.25);
    expect(parseNum('0,25')).toBe(0.25);
    expect(parseNum('1.6e-4')).toBe(1.6e-4);
    expect(parseNum('1,6e-4')).toBe(1.6e-4);
    expect(parseNum('1,6×10^-4')).toBeCloseTo(1.6e-4, 12);
    expect(parseNum('1.6*10^(-4)')).toBeCloseTo(1.6e-4, 12);
    expect(parseNum('25%')).toBe(0.25);
    expect(parseNum(' 16 000 ')).toBe(16000);
    expect(parseNum('1,234.5')).toBe(1234.5);
    expect(parseNum('∞')).toBe(Infinity);
    expect(parseNum('vô hạn')).toBe(Infinity);
    expect(parseNum('abc')).toBeNull();
    expect(parseNum('')).toBeNull();
  });
});

describe('checkField', () => {
  const num: FieldSpec = { key: 'x', label: '', kind: 'number' };
  it('sai số tương đối 1%', () => {
    expect(checkField(num, 1.8787e-3, '1.88e-3').ok).toBe(true);
    expect(checkField(num, 1.8787e-3, '1.9e-3').ok).toBe(false);
    expect(checkField({ ...num, exact: true }, 3100, '3100').ok).toBe(true);
    expect(checkField({ ...num, exact: true }, 3100, '3101').ok).toBe(false);
  });

  it('gợi ý lỗi hay gặp', () => {
    expect(checkField(num, 1.2, '0.15').hint).toMatch(/nhân 8/);
    expect(checkField(num, 1.2, '1200').hint).toMatch(/1000/);
    expect(checkField({ ...num, mistakes: [{ value: 5, msg: 'cụ thể' }] }, 7, '5').hint).toBe('cụ thể');
  });

  it('chuẩn hóa chuỗi', () => {
    expect(normalize('ACK0 , ack1;ACK1', 'seq')).toBe('ack0,ack1,ack1');
    expect(normalize('1-3, 12–14', 'intset')).toBe('1,2,3,12,13,14');
    expect(normalize('x', 'intset')).toBe('');
    expect(normalize('01010110 11100111', 'bits')).toBe('0101011011100111');
    expect(normalize('HTTP://gaia.cs.umass.edu/a.html', 'url')).toBe('gaia.cs.umass.edu/a.html');
    expect(checkField({ key: 'u', label: '', kind: 'text', norm: 'url' }, 'http://a.b/c', 'a.b/c').ok).toBe(true);
    expect(checkField({ key: 'n', label: '', kind: 'number', exact: true }, [80, 443], '443').ok).toBe(true);
  });

  it('diagnose bỏ qua tỉ số bình thường', () => {
    expect(diagnose(1.3, 1)).toBeUndefined();
  });
});

describe('rng', () => {
  it('cùng seed cùng dãy, khác seed khác dãy', () => {
    const a = rng(1234);
    const b = rng(1234);
    const c = rng(1235);
    const xs = [a.next(), a.next(), a.next()];
    expect([b.next(), b.next(), b.next()]).toEqual(xs);
    expect(c.next()).not.toBe(xs[0]);
    for (let i = 0; i < 1000; i++) {
      const v = a.int(3, 7);
      expect(v).toBeGreaterThanOrEqual(3);
      expect(v).toBeLessThanOrEqual(7);
    }
  });
});
