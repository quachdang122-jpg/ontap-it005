import { CARDS } from '../data/knowledge';
import { QUIZ } from '../data/quiz';
import { TRAPS } from '../data/traps';
import { byChapter, CHAPTERS, PROBLEMS } from '../generators';
import { useStore } from '../lib/storage';

export function Home() {
  const s = useStore();
  const known = CARDS.filter((c) => s.kc[c.id] === 'known').length;
  const best = s.quiz.length ? Math.max(...s.quiz.map((q) => q.score)) : null;
  const hot = PROBLEMS.filter((p) => p.hot);

  return (
    <div className="page home">
      <header className="hero">
        <p className="eyebrow">IT005 · Nhập môn mạng máy tính</p>
        <h1>Luyện bài tập Kurose–Ross, Chương 1–3</h1>
        <p className="lede">Mỗi lần mở một dạng bài là một bộ số mới. Nhập đáp án, bấm Kiểm tra, rồi xem lời giải từng bước với đúng số liệu vừa sinh.</p>
      </header>

      <section className="grid chapters">
        {CHAPTERS.map((c) => {
          const list = byChapter(c.n);
          const done = list.filter((p) => s.solved[p.id]).length;
          const pct = Math.round((done / list.length) * 100);
          return (
            <a key={c.n} href={`#/c/${c.n}`} className={`tile ch${c.n}`}>
              <span className="tile-num">Chương {c.n}</span>
              <span className="tile-title">{c.title}</span>
              <span className="tile-desc">{c.desc}</span>
              <span className="progress" aria-label={`Hoàn thành ${pct}%`}>
                <span style={{ width: `${pct}%` }} />
              </span>
              <span className="tile-meta">{done}/{list.length} dạng đã làm đúng · {pct}%</span>
            </a>
          );
        })}
      </section>

      <section className="grid extras">
        <a href="#/kc" className="tile plain">
          <span className="tile-title">Knowledge check</span>
          <span className="tile-desc">Thẻ lật theo mục 1.1–3.7, kèm giải thích.</span>
          <span className="tile-meta">Đã nhớ {known}/{CARDS.length} thẻ</span>
        </a>
        <a href="#/quiz" className="tile plain">
          <span className="tile-title">Đề trắc nghiệm {QUIZ.length} câu</span>
          <span className="tile-desc">60 phút, chấm điểm và giải thích từng câu.</span>
          <span className="tile-meta">{best === null ? 'Chưa làm lần nào' : `Điểm cao nhất ${best}/${QUIZ.length} · ${s.quiz.length} lần làm`}</span>
        </a>
        <a href="#/traps" className="tile plain">
          <span className="tile-title">Ôn tập bẫy hay thi</span>
          <span className="tile-desc">{TRAPS.length} lỗi hay gặp, gom theo chủ đề.</span>
          <span className="tile-meta">Đọc trước khi vào phòng thi</span>
        </a>
      </section>

      <section className="card">
        <h2>Ưu tiên cho thi giữa kỳ</h2>
        <p className="muted">Các dạng đánh dấu “Hay thi” trong tài liệu (dựa trên ba đề đã giải).</p>
        <ul className="hot-list">
          {hot.map((p) => (
            <li key={p.id}>
              <a href={`#/p/${p.id}`}>
                <span className="sec">{p.section}</span> {p.title}
              </a>
              {s.solved[p.id] ? <span className="check" aria-label="đã làm đúng">✓</span> : null}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export function ChapterPage({ n }: { n: number }) {
  const s = useStore();
  const c = CHAPTERS.find((x) => x.n === n);
  if (!c) return <div className="page"><a href="#/">Về trang chủ</a></div>;
  const list = byChapter(n);
  return (
    <div className="page">
      <nav className="crumbs"><a href="#/">Trang chủ</a></nav>
      <header className="problem-head">
        <p className="eyebrow">Chương {n}</p>
        <h1>{c.title}</h1>
        <p className="asks">{c.desc}</p>
      </header>
      <ul className="problem-list">
        {list.map((p) => (
          <li key={p.id}>
            <a href={`#/p/${p.id}`} className={`row ch${n}`}>
              <span className="sec">{p.section}</span>
              <span className="row-main">
                <span className="row-title">
                  {p.title}
                  {p.hot && <span className="hot">Hay thi</span>}
                </span>
                <span className="row-desc">{p.asks}</span>
              </span>
              <span className={s.solved[p.id] ? 'status done' : 'status'}>{s.solved[p.id] ? '✓' : s.tries[p.id] ? '…' : ''}</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
