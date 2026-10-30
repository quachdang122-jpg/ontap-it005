import { Inline } from '../components/Rich';
import { TOPICS, TRAPS } from '../data/traps';
import { byId } from '../generators';

export function Traps() {
  return (
    <div className="page">
      <nav className="crumbs"><a href="#/">Trang chủ</a></nav>
      <header className="problem-head">
        <p className="eyebrow">{TRAPS.length} bẫy</p>
        <h1>Ôn tập bẫy hay thi</h1>
        <p className="asks">Các hộp “Bẫy hay gặp” trong tài liệu, gom theo chủ đề. Bấm vào tên dạng để luyện ngay.</p>
      </header>
      {TOPICS.map((t) => (
        <section key={t} className="card">
          <h2>{t}</h2>
          <ul className="trap-list">
            {TRAPS.filter((x) => x.topic === t).map((x, i) => {
              const p = x.problem ? byId(x.problem) : undefined;
              return (
                <li key={i}>
                  <p><Inline text={x.text} /></p>
                  <p className="trap-meta">
                    Mục {x.section}
                    {p && (
                      <>
                        {' · '}
                        <a href={`#/p/${p.id}`}>Luyện: {p.title}</a>
                      </>
                    )}
                  </p>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
