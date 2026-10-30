import katex from 'katex';
import { describe, expect, it } from 'vitest';
import { PROBLEMS } from '../src/generators';
import type { Block } from '../src/generators/types';
import { checkField, formatAnswer } from '../src/lib/grade';

const SEEDS = Array.from({ length: 40 }, (_, i) => i * 7919 + 13);

function texOf(s: string): string[] {
  const out: string[] = [];
  const re = /\$\$([\s\S]+?)\$\$|\$([^$]+?)\$/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s))) out.push(m[1] ?? m[2]);
  return out;
}

function blockStrings(b: Block): string[] {
  if (typeof b === 'string') return [b];
  if ('table' in b) return [...b.table.head, ...b.table.rows.flat()];
  return [];
}

const renderStrict = (tex: string) => katex.renderToString(tex, { throwOnError: true, strict: 'ignore' });

describe.each(PROBLEMS.map((p) => [p.id, p] as const))('%s', (_id, def) => {
  it('công thức cần nhớ là LaTeX hợp lệ', () => {
    expect(def.formulas.length).toBeGreaterThan(0);
    for (const f of def.formulas) expect(() => renderStrict(f)).not.toThrow();
  });

  it('sinh đề ổn định theo seed', () => {
    expect(JSON.stringify(def.generate(42))).toBe(JSON.stringify(def.generate(42)));
  });

  it('40 seed: đáp án hữu hạn, khớp ô nhập, TeX hợp lệ, đáp án đúng được chấm đúng', () => {
    const seen = new Set<string>();
    for (const seed of SEEDS) {
      const p = def.generate(seed);
      seen.add(JSON.stringify(p));
      const ans = def.solve(p);
      const view = def.view(p);
      const steps = def.explain(p);
      expect(view.fields.length).toBeGreaterThan(0);
      for (const f of view.fields) {
        const a = ans[f.key];
        expect(a, `${def.id} seed ${seed}: thiếu đáp án ${f.key}`).toBeDefined();
        const vals = Array.isArray(a) ? a : [a];
        for (const v of vals) {
          if (typeof v === 'number') {
            expect(Number.isNaN(v), `${def.id} seed ${seed} ${f.key} NaN`).toBe(false);
            if (def.id !== 'queuing-delay') expect(isFinite(v), `${def.id} seed ${seed} ${f.key} vô hạn`).toBe(true);
            expect(v).toBeGreaterThanOrEqual(0);
          }
          if (f.kind === 'choice') expect(f.options, `${def.id} ${f.key}`).toContain(v);
        }
        // nhập đúng đáp án (dạng hiển thị) phải được chấm đúng
        const shown = f.kind === 'number' && typeof vals[0] === 'number' ? (vals[0] === Infinity ? '∞' : String(vals[0])) : String(vals[0]);
        expect(checkField(f, a, shown).ok, `${def.id} seed ${seed} ${f.key}=${shown}`).toBe(true);
        expect(formatAnswer(f, a).length).toBeGreaterThan(0);
      }
      for (const b of [...view.statement, ...steps]) for (const s of blockStrings(b)) for (const t of texOf(s)) {
        expect(() => renderStrict(t), `${def.id} seed ${seed}: ${t}`).not.toThrow();
      }
    }
    // đề phải thực sự ngẫu nhiên
    expect(seen.size).toBeGreaterThanOrEqual(5);
  });

  if (def.toggles?.length)
    it('công tắc quy ước không làm hỏng đáp án', () => {
      for (const seed of SEEDS.slice(0, 10)) {
        const p = { ...def.generate(seed) } as Record<string, unknown>;
        for (const t of def.toggles!) p[t.key] = true;
        const ans = def.solve(p);
        for (const f of def.view(p).fields) expect(ans[f.key]).toBeDefined();
        def.explain(p);
      }
    });
});

describe('ràng buộc số liệu hợp lý', () => {
  it('queuing-delay: phần lớn đề có I < 1, đề I ≥ 1 cho đáp án vô hạn', () => {
    const def = PROBLEMS.find((p) => p.id === 'queuing-delay')!;
    let finite = 0;
    for (const seed of SEEDS) {
      const a = def.solve(def.generate(seed));
      if (isFinite(a.dq as number)) {
        finite++;
        expect(a.I as number).toBeLessThan(1);
      } else expect(a.I as number).toBeGreaterThanOrEqual(1);
    }
    expect(finite).toBeGreaterThan(SEEDS.length * 0.6);
  });

  it('checksum: khoảng một nửa số đề có tràn bit', () => {
    const def = PROBLEMS.find((p) => p.id === 'checksum')!;
    let overflow = 0;
    const N = 200;
    for (let s = 1; s <= N; s++) {
      const { words } = def.generate(s) as { words: number[] };
      let acc = words[0];
      let o = false;
      for (const w of words.slice(1)) {
        acc += w;
        if (acc > 0xffff) {
          o = true;
          acc = (acc & 0xffff) + 1;
        }
      }
      if (o) overflow++;
    }
    expect(overflow / N).toBeGreaterThan(0.35);
    expect(overflow / N).toBeLessThan(0.65);
  });

  it('ps-vs-cs: xác suất nằm trong (0, 1)', () => {
    const def = PROBLEMS.find((p) => p.id === 'ps-vs-cs')!;
    for (const seed of SEEDS) {
      const a = def.solve(def.generate(seed));
      for (const k of ['pk', 'tail']) {
        expect(a[k] as number).toBeGreaterThan(0);
        expect(a[k] as number).toBeLessThan(1);
      }
    }
  });

  it('có đúng 26 dạng bài, id không trùng', () => {
    expect(PROBLEMS.length).toBe(26);
    expect(new Set(PROBLEMS.map((p) => p.id)).size).toBe(26);
  });
});
