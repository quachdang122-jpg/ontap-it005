import { useEffect, useState } from 'react';

export interface QuizRecord {
  at: string;
  score: number;
  total: number;
  secs: number;
  shuffled: boolean;
}

export interface QuizSession {
  startedAt: number;
  order: number[];
  optionOrders: number[][];
  answers: Record<number, number>;
  shuffled: boolean;
}

export type Theme = 'auto' | 'light' | 'dark';

export interface Store {
  solved: Record<string, number>;
  tries: Record<string, number>;
  kc: Record<string, 'known' | 'unsure'>;
  quiz: QuizRecord[];
  session: QuizSession | null;
  theme: Theme;
}

const KEY = 'it005-luyen-tap:v1';
const empty = (): Store => ({ solved: {}, tries: {}, kc: {}, quiz: [], session: null, theme: 'auto' });

let memory: Store = empty();
const listeners = new Set<(s: Store) => void>();

function read(): Store {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) return { ...empty(), ...JSON.parse(raw) };
  } catch {
    /* storage bị chặn hoặc hỏng: dùng bộ nhớ tạm */
  }
  return memory;
}

memory = typeof window !== 'undefined' ? read() : empty();

export function getStore(): Store {
  return memory;
}

export function update(fn: (s: Store) => Store): void {
  memory = fn(memory);
  try {
    window.localStorage.setItem(KEY, JSON.stringify(memory));
  } catch {
    /* không lưu được thì vẫn chạy với bộ nhớ tạm */
  }
  listeners.forEach((l) => l(memory));
}

export function useStore(): Store {
  const [s, set] = useState(memory);
  useEffect(() => {
    listeners.add(set);
    return () => {
      listeners.delete(set);
    };
  }, []);
  return s;
}

export function resetProgress(): void {
  update((s) => ({ ...empty(), theme: s.theme }));
}
