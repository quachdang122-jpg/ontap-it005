import katex from 'katex';
import { describe, expect, it } from 'vitest';
import { CARDS, SECTIONS } from '../src/data/knowledge';
import { QUIZ } from '../src/data/quiz';
import { TRAPS } from '../src/data/traps';
import { byId } from '../src/generators';

const texOf = (s: string) => [...s.matchAll(/\$([^$]+?)\$/g)].map((m) => m[1]);
const valid = (s: string) => texOf(s).forEach((t) => expect(() => katex.renderToString(t, { throwOnError: true, strict: 'ignore' }), t).not.toThrow());

describe('Đề trắc nghiệm 40 câu', () => {
  it('đáp án khớp Phụ lục B', () => {
    const key = 'BBBDBCCBCB' + 'CBBDACBBBC' + 'BCBCBBBBCA' + 'BBCBACABCB';
    expect(QUIZ).toHaveLength(40);
    expect(QUIZ.map((q) => 'ABCD'[q.answer]).join('')).toBe(key);
  });

  it('mỗi câu có 4 phương án, giải thích, TeX hợp lệ', () => {
    for (const q of QUIZ) {
      expect(q.options).toHaveLength(4);
      expect(q.why.length).toBeGreaterThan(5);
      [q.q, q.why, ...q.options].forEach(valid);
    }
    expect(QUIZ.filter((q) => q.chapter === 1)).toHaveLength(11);
    expect(QUIZ.filter((q) => q.chapter === 2)).toHaveLength(13);
    expect(QUIZ.filter((q) => q.chapter === 3)).toHaveLength(16);
  });
});

describe('Knowledge check và bẫy', () => {
  it('phủ đủ các mục 1.1–1.5, 2.1–2.4, 2.7, 3.1–3.7', () => {
    for (const s of ['1.1', '1.2', '1.3', '1.4', '1.5', '2.1', '2.2', '2.3', '2.4', '2.7', '3.1', '3.2', '3.3', '3.4', '3.5', '3.6', '3.7']) expect(SECTIONS).toContain(s);
    CARDS.forEach((c) => [c.q, c.a].forEach(valid));
  });

  it('mỗi bẫy trỏ tới dạng bài có thật', () => {
    for (const t of TRAPS) {
      valid(t.text);
      if (t.problem) expect(byId(t.problem), t.problem).toBeDefined();
    }
  });
});
