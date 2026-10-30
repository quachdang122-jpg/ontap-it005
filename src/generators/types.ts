/** Một khối nội dung: đoạn văn (có $TeX$, **đậm**), bảng hoặc khối mã. */
export type Block =
  | string
  | { table: { head: string[]; rows: string[][] } }
  | { code: string };

export interface Mistake {
  value: number | string;
  msg: string;
}

export type Norm = 'seq' | 'bits' | 'url' | 'lower' | 'intset';

export interface FieldSpec {
  key: string;
  label: string;
  kind: 'number' | 'choice' | 'text';
  unit?: string;
  options?: string[];
  norm?: Norm;
  /** sai số tương đối cho ô số, mặc định 1% */
  tol?: number;
  /** ô số nguyên phải đúng tuyệt đối */
  exact?: boolean;
  placeholder?: string;
  mistakes?: Mistake[];
  /** trộn thứ tự phương án (theo seed) khi hiển thị */
  shuffle?: boolean;
}

export type Figure =
  | { type: 'cwnd'; rounds: number[]; ssthresh?: number[] }
  | { type: 'mux'; proto: 'UDP' | 'TCP'; hosts: { name: string; ip: string; ports: number[]; server?: boolean }[]; arrows: { from: string; to: string; label: string }[] }
  | { type: 'ring'; ab: number; bc: number; cd: number; da: number }
  | { type: 'email'; step6: string };

export interface View {
  statement: Block[];
  figure?: Figure;
  fields: FieldSpec[];
}

export type AnswerValue = number | string | (number | string)[];
export type Answers = Record<string, AnswerValue>;

export interface Toggle {
  key: string;
  label: string;
}

export interface ProblemDef<P = any> {
  id: string;
  chapter: 1 | 2 | 3;
  section: string;
  title: string;
  asks: string;
  formulas: string[];
  hot?: boolean;
  toggles?: Toggle[];
  generate(seed: number): P;
  solve(p: P): Answers;
  explain(p: P): Block[];
  view(p: P): View;
}
