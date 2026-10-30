import { useEffect, useState } from 'react';
import { Inline } from '../components/Rich';
import { QUIZ, QUIZ_MINUTES } from '../data/quiz';
import { randomSeed, rng } from '../lib/rng';
import { update, useStore, type QuizSession } from '../lib/storage';

const LIMIT = QUIZ_MINUTES * 60;
const LETTERS = 'ABCD';
/** Câu có phương án kiểu “Cả A và B” thì giữ nguyên thứ tự phương án. */
const locked = (i: number) => QUIZ[i].options.some((o) => /Cả [A-D] và [A-D]/.test(o));

function newSession(shuffled: boolean): QuizSession {
  const g = rng(randomSeed());
  const idx = QUIZ.map((_, i) => i);
  return {
    startedAt: Date.now(),
    order: shuffled ? g.shuffle(idx) : idx,
    optionOrders: QUIZ.map((q, i) => (shuffled && !locked(i) ? g.shuffle(q.options.map((_, j) => j)) : q.options.map((_, j) => j))),
    answers: {},
    shuffled,
  };
}

const mmss = (secs: number) => `${String(Math.floor(secs / 60)).padStart(2, '0')}:${String(secs % 60).padStart(2, '0')}`;

export function Quiz() {
  const s = useStore();
  const [shuffle, setShuffle] = useState(true);
  const [result, setResult] = useState<{ session: QuizSession; score: number; secs: number } | null>(null);
  const [now, setNow] = useState(Date.now());
  const session = s.session;

  useEffect(() => {
    if (!session) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [session]);

  const elapsed = session ? Math.floor((now - session.startedAt) / 1000) : 0;
  const left = Math.max(0, LIMIT - elapsed);

  const submit = (sess: QuizSession) => {
    const score = QUIZ.filter((q, i) => sess.answers[i] === q.answer).length;
    const secs = Math.min(LIMIT, Math.floor((Date.now() - sess.startedAt) / 1000));
    update((st) => ({
      ...st,
      session: null,
      quiz: [...st.quiz, { at: new Date().toISOString(), score, total: QUIZ.length, secs, shuffled: sess.shuffled }].slice(-30),
    }));
    setResult({ session: sess, score, secs });
    window.scrollTo(0, 0);
  };

  useEffect(() => {
    if (session && left === 0) submit(session);
  }, [session, left]);

  const pick = (qi: number, oi: number) => {
    update((st) => (st.session ? { ...st, session: { ...st.session, answers: { ...st.session.answers, [qi]: oi } } } : st));
  };

  if (result) return <Review {...result} onAgain={() => setResult(null)} />;

  if (!session)
    return (
      <div className="page">
        <nav className="crumbs"><a href="#/">Trang chủ</a></nav>
        <header className="problem-head">
          <p className="eyebrow">Chương 5 · Đề tự đánh giá</p>
          <h1>Đề trắc nghiệm {QUIZ.length} câu</h1>
          <p className="asks">Làm trong {QUIZ_MINUTES} phút, không xem tài liệu. Hết giờ app tự nộp bài. Bài đang làm được lưu lại nếu bạn lỡ tải lại trang.</p>
        </header>
        <div className="card">
          <label className="toggle">
            <input type="checkbox" checked={shuffle} onChange={(e) => setShuffle(e.target.checked)} />
            <span>Trộn câu và trộn phương án</span>
          </label>
          <div className="actions">
            <button className="btn primary" onClick={() => update((st) => ({ ...st, session: newSession(shuffle) }))}>Bắt đầu làm bài</button>
          </div>
        </div>
        {s.quiz.length > 0 && (
          <section className="card">
            <h2>Lịch sử điểm</h2>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Thời điểm</th><th>Điểm</th><th>Thời gian</th><th>Trộn</th></tr>
                </thead>
                <tbody>
                  {[...s.quiz].reverse().map((r, i) => (
                    <tr key={i}>
                      <td>{new Date(r.at).toLocaleString('vi-VN')}</td>
                      <td><strong>{r.score}/{r.total}</strong> ({((r.score / r.total) * 10).toFixed(1)} điểm)</td>
                      <td>{mmss(r.secs)}</td>
                      <td>{r.shuffled ? 'Có' : 'Không'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    );

  const answered = Object.keys(session.answers).length;
  return (
    <div className="page quiz">
      <div className="quiz-bar">
        <span className={`timer ${left < 300 ? 'low' : ''}`} aria-live="polite">⏱ {mmss(left)}</span>
        <span className="muted">Đã làm {answered}/{QUIZ.length}</span>
        <button
          className="btn primary small"
          onClick={() => {
            if (answered === QUIZ.length || window.confirm(`Còn ${QUIZ.length - answered} câu chưa làm. Nộp bài?`)) submit(session);
          }}
        >
          Nộp bài
        </button>
      </div>
      <div className="qnav">
        {session.order.map((qi, pos) => (
          <a key={qi} href={`#q${pos + 1}`} onClick={(e) => { e.preventDefault(); document.getElementById(`q${pos + 1}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }} className={session.answers[qi] !== undefined ? 'on' : ''}>
            {pos + 1}
          </a>
        ))}
      </div>
      {session.order.map((qi, pos) => {
        const q = QUIZ[qi];
        return (
          <section key={qi} id={`q${pos + 1}`} className="card qcard">
            <p className="qtext"><strong>Câu {pos + 1}.</strong> <Inline text={q.q} /></p>
            <div className="choices col">
              {session.optionOrders[qi].map((oi, k) => (
                <label key={oi} className={`choice ${session.answers[qi] === oi ? 'picked' : ''}`}>
                  <input type="radio" name={`q${qi}`} checked={session.answers[qi] === oi} onChange={() => pick(qi, oi)} />
                  <span><b>{LETTERS[k]}.</b> <Inline text={q.options[oi]} /></span>
                </label>
              ))}
            </div>
          </section>
        );
      })}
      <div className="actions center">
        <button className="btn primary" onClick={() => submit(session)}>Nộp bài</button>
        <button className="btn ghost" onClick={() => window.confirm('Hủy bài đang làm?') && update((st) => ({ ...st, session: null }))}>Hủy bài</button>
      </div>
    </div>
  );
}

function Review({ session, score, secs, onAgain }: { session: QuizSession; score: number; secs: number; onAgain: () => void }) {
  const [onlyWrong, setOnlyWrong] = useState(false);
  const byChap = [1, 2, 3].map((c) => {
    const qs = QUIZ.map((q, i) => ({ q, i })).filter((x) => x.q.chapter === c);
    return { c, ok: qs.filter((x) => session.answers[x.i] === x.q.answer).length, total: qs.length };
  });
  return (
    <div className="page quiz">
      <nav className="crumbs"><a href="#/">Trang chủ</a></nav>
      <section className="card result">
        <p className="eyebrow">Kết quả</p>
        <p className="big-score">{score}/{QUIZ.length}</p>
        <p className="muted">Tương đương {((score / QUIZ.length) * 10).toFixed(1)} điểm · làm trong {mmss(secs)}</p>
        <ul className="chap-scores">
          {byChap.map((b) => (
            <li key={b.c}>Chương {b.c}: <strong>{b.ok}/{b.total}</strong></li>
          ))}
        </ul>
        <div className="actions">
          <button className="btn primary" onClick={onAgain}>Làm lại</button>
          <label className="toggle">
            <input type="checkbox" checked={onlyWrong} onChange={(e) => setOnlyWrong(e.target.checked)} />
            <span>Chỉ xem câu sai</span>
          </label>
        </div>
      </section>
      {session.order.map((qi, pos) => {
        const q = QUIZ[qi];
        const mine = session.answers[qi];
        const ok = mine === q.answer;
        if (onlyWrong && ok) return null;
        return (
          <section key={qi} className={`card qcard ${ok ? 'right' : 'wrong'}`}>
            <p className="qtext"><strong>Câu {pos + 1}.</strong> <Inline text={q.q} /> <span className="muted">(câu {q.n} trong tài liệu)</span></p>
            <ul className="opts">
              {session.optionOrders[qi].map((oi, k) => (
                <li key={oi} className={oi === q.answer ? 'correct' : oi === mine ? 'mine' : ''}>
                  <b>{LETTERS[k]}.</b> <Inline text={q.options[oi]} />
                  {oi === q.answer && ' ✓'}
                  {oi === mine && oi !== q.answer && ' ✗ (bạn chọn)'}
                </li>
              ))}
            </ul>
            {mine === undefined && <p className="hint">Bạn bỏ trống câu này.</p>}
            <p className="why"><strong>Giải thích:</strong> <Inline text={q.why} /></p>
          </section>
        );
      })}
    </div>
  );
}
