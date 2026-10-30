import { useEffect, useMemo, useState } from 'react';
import { Blocks, Inline, Tex } from '../components/Rich';
import { FigureView } from '../components/Figures';
import { byChapter, byId } from '../generators';
import type { FieldSpec } from '../generators/types';
import { checkField, formatAnswer, type FieldResult } from '../lib/grade';
import { go } from '../lib/router';
import { randomSeed, rng } from '../lib/rng';
import { update, useStore } from '../lib/storage';

interface Attempt {
  key: string;
  inputs: Record<string, string>;
  results: Record<string, FieldResult> | null;
  showSol: boolean;
}

const blank = (key: string): Attempt => ({ key, inputs: {}, results: null, showSol: false });

function hashKey(s: string): number {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0;
  return h;
}

export function ProblemPage({ id, seedParam }: { id: string; seedParam: string | null }) {
  const def = byId(id);
  const store = useStore();
  const seed = seedParam && /^\d+$/.test(seedParam) ? Number(seedParam) : null;

  useEffect(() => {
    if (def && seed === null) go(`#/p/${id}?seed=${randomSeed()}`, true);
  }, [def, id, seed]);

  const [toggles, setToggles] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState(false);
  // Trạng thái làm bài gắn với đúng (đề, seed, công tắc): đổi đề là tự về trạng thái trống,
  // không còn sót kết quả chấm của đề cũ trong lượt render đầu tiên.
  const attemptKey = `${id}|${seed}|${JSON.stringify(toggles)}`;
  const [attempt, setAttempt] = useState<Attempt>(blank(''));
  const cur = attempt.key === attemptKey ? attempt : blank(attemptKey);
  const { inputs, results, showSol } = cur;
  const patch = (p: Partial<Attempt>) => setAttempt({ ...cur, ...p });
  const setInputs = (inputs: Record<string, string>) => patch({ inputs });
  const setShowSol = (showSol: boolean) => patch({ showSol });

  const data = useMemo(() => {
    if (!def || seed === null) return null;
    const params = { ...def.generate(seed), ...toggles };
    return { params, view: def.view(params), answers: def.solve(params), steps: def.explain(params) };
  }, [def, seed, toggles]);

  if (!def) return <div className="page"><p>Không tìm thấy dạng bài “{id}”.</p><a href="#/">Về trang chủ</a></div>;
  if (!data || seed === null) return null;

  const { view, answers, steps } = data;
  const siblings = byChapter(def.chapter);
  const idx = siblings.findIndex((p) => p.id === def.id);
  const next = siblings[idx + 1];

  const options = (f: FieldSpec) => (f.shuffle && f.options ? rng(seed + hashKey(f.key)).shuffle(f.options) : f.options ?? []);

  const check = () => {
    const r: Record<string, FieldResult> = {};
    for (const f of view.fields) r[f.key] = checkField(f, answers[f.key], inputs[f.key] ?? '');
    patch({ results: r });
    const allOk = view.fields.every((f) => r[f.key].ok);
    update((s) => ({
      ...s,
      tries: { ...s.tries, [def.id]: (s.tries[def.id] ?? 0) + 1 },
      solved: allOk ? { ...s.solved, [def.id]: (s.solved[def.id] ?? 0) + 1 } : s.solved,
    }));
  };

  const newProblem = () => go(`#/p/${def.id}?seed=${randomSeed()}`);

  const share = async () => {
    const url = `${location.origin}${location.pathname}#/p/${def.id}?seed=${seed}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      window.prompt('Sao chép link đề:', url);
    }
  };

  const okCount = results ? view.fields.filter((f) => results[f.key]?.ok).length : 0;

  return (
    <div className="page problem">
      <nav className="crumbs">
        <a href="#/">Trang chủ</a>
        <span>›</span>
        <a href={`#/c/${def.chapter}`}>Chương {def.chapter}</a>
      </nav>
      <header className="problem-head">
        <div className="eyebrow">
          Mục {def.section}
          {def.hot && <span className="hot">Hay thi</span>}
          {store.solved[def.id] ? <span className="done-badge">Đã làm đúng {store.solved[def.id]} lần</span> : null}
        </div>
        <h1>{def.title}</h1>
        <p className="asks"><strong>Đề hỏi gì:</strong> {def.asks}</p>
      </header>

      <details className="formulas" open>
        <summary>Công thức cần nhớ</summary>
        <div className="formula-list">
          {def.formulas.map((f, i) => (
            // chế độ inline + \displaystyle: KaTeX được phép xuống dòng sau dấu = và +, hợp với màn hình hẹp
            <div key={i} className="formula">
              <Tex tex={`\\displaystyle ${f}`} />
            </div>
          ))}
        </div>
      </details>

      {def.toggles?.map((t) => (
        <label key={t.key} className="toggle">
          <input type="checkbox" checked={!!toggles[t.key]} onChange={(e) => setToggles({ ...toggles, [t.key]: e.target.checked })} />
          <span>{t.label}</span>
        </label>
      ))}

      <section className="card statement">
        <div className="statement-head">
          <h2>Đề bài</h2>
          <span className="seed">seed {seed}</span>
        </div>
        <Blocks blocks={view.statement} />
        {view.figure && <FigureView fig={view.figure} />}
      </section>

      <form
        className="card answers"
        onSubmit={(e) => {
          e.preventDefault();
          check();
        }}
      >
        <h2>Đáp án của bạn</h2>
        {view.fields.map((f) => {
          const r = results?.[f.key];
          const state = r ? (r.ok ? 'ok' : 'bad') : '';
          const idFor = `f-${f.key}`;
          return (
            <div key={f.key} className={`field ${state}`}>
              <label htmlFor={f.kind === 'choice' ? undefined : idFor} className="field-label">
                <Inline text={f.label} />
              </label>
              {f.kind === 'choice' ? (
                <div className="choices" role="radiogroup">
                  {options(f).map((o) => (
                    <label key={o} className={`choice ${inputs[f.key] === o ? 'picked' : ''}`}>
                      <input type="radio" name={idFor} value={o} checked={inputs[f.key] === o} onChange={() => setInputs({ ...inputs, [f.key]: o })} />
                      <span><Inline text={o} /></span>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="input-row">
                  <input
                    id={idFor}
                    type="text"
                    inputMode={f.kind === 'number' ? 'decimal' : 'text'}
                    autoComplete="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    placeholder={f.placeholder ?? (f.kind !== 'number' ? '' : f.exact ? 'số nguyên' : 'ví dụ 0,25 hoặc 1.6e-4')}
                    value={inputs[f.key] ?? ''}
                    onChange={(e) => setInputs({ ...inputs, [f.key]: e.target.value })}
                  />
                  {f.unit && <span className="unit">{f.unit}</span>}
                </div>
              )}
              {r && !r.ok && (
                <p className="hint">
                  {r.hint ?? 'Chưa đúng.'}
                  {showSol && <> Đáp án: <strong>{formatAnswer(f, answers[f.key])}</strong></>}
                </p>
              )}
              {r?.ok && <p className="hint good">Đúng</p>}
            </div>
          );
        })}
        {results && (
          <p className={`score ${okCount === view.fields.length ? 'all' : ''}`}>
            {okCount === view.fields.length ? 'Chính xác toàn bộ!' : `Đúng ${okCount}/${view.fields.length} ô.`}
          </p>
        )}
        <div className="actions">
          <button type="submit" className="btn primary">Kiểm tra</button>
          <button type="button" className="btn" onClick={newProblem}>Đề mới</button>
          <button type="button" className="btn" onClick={() => setShowSol(!showSol)}>{showSol ? 'Ẩn lời giải' : 'Xem lời giải'}</button>
          <button type="button" className="btn ghost" onClick={share}>{copied ? 'Đã chép link' : 'Chia sẻ đề'}</button>
        </div>
      </form>

      {showSol && (
        <section className="card solution">
          <h2>Lời giải</h2>
          <div className="table-wrap">
            <table className="answer-table">
              <tbody>
                {view.fields.map((f) => (
                  <tr key={f.key}>
                    <td><Inline text={f.label} /></td>
                    <td className="ans">
                      {formatAnswer(f, answers[f.key])}
                      {f.unit ? ` ${f.unit}` : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <h3>Từng bước</h3>
          <Blocks blocks={steps} ordered />
        </section>
      )}

      <nav className="pager">
        {idx > 0 ? <a href={`#/p/${siblings[idx - 1].id}`}>← {siblings[idx - 1].title}</a> : <span />}
        {next ? <a href={`#/p/${next.id}`}>{next.title} →</a> : <a href={`#/c/${def.chapter}`}>Về Chương {def.chapter} →</a>}
      </nav>
    </div>
  );
}
