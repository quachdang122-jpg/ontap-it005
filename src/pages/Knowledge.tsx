import { useMemo, useState } from 'react';
import { Inline } from '../components/Rich';
import { CARDS, SECTIONS } from '../data/knowledge';
import { randomSeed, rng } from '../lib/rng';
import { update, useStore } from '../lib/storage';

export function Knowledge() {
  const s = useStore();
  const [section, setSection] = useState<string>('all');
  const [onlyUnknown, setOnlyUnknown] = useState(false);
  const [order, setOrder] = useState<number | null>(null);
  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const deck = useMemo(() => {
    let d = CARDS.filter((c) => (section === 'all' || c.section === section) && (!onlyUnknown || s.kc[c.id] !== 'known'));
    if (order !== null) d = rng(order).shuffle(d);
    return d;
    // cố ý không phụ thuộc s.kc: vừa đánh dấu xong thì không lọc lại, để thẻ không nhảy
  }, [section, onlyUnknown, order]);

  const card = deck[Math.min(i, deck.length - 1)];
  const reset = () => {
    setI(0);
    setFlipped(false);
  };
  const move = (d: number) => {
    setI((x) => Math.max(0, Math.min(deck.length - 1, x + d)));
    setFlipped(false);
  };
  const mark = (v: 'known' | 'unsure') => {
    if (!card) return;
    update((st) => ({ ...st, kc: { ...st.kc, [card.id]: v } }));
    if (i < deck.length - 1) move(1);
  };

  const known = CARDS.filter((c) => s.kc[c.id] === 'known').length;

  return (
    <div className="page">
      <nav className="crumbs"><a href="#/">Trang chủ</a></nav>
      <header className="problem-head">
        <p className="eyebrow">Đã nhớ {known}/{CARDS.length} thẻ</p>
        <h1>Knowledge check</h1>
        <p className="asks">Tự trả lời trong đầu, chạm vào thẻ để lật xem đáp án, rồi đánh dấu mức độ nhớ.</p>
      </header>

      <div className="chips" role="tablist">
        {['all', ...SECTIONS].map((x) => (
          <button
            key={x}
            className={`chip ${section === x ? 'on' : ''}`}
            onClick={() => {
              setSection(x);
              reset();
            }}
          >
            {x === 'all' ? 'Tất cả' : x}
          </button>
        ))}
      </div>
      <div className="row-controls">
        <label className="toggle">
          <input
            type="checkbox"
            checked={onlyUnknown}
            onChange={(e) => {
              setOnlyUnknown(e.target.checked);
              reset();
            }}
          />
          <span>Chỉ thẻ chưa nhớ</span>
        </label>
        <button
          className="btn ghost small"
          onClick={() => {
            setOrder(order === null ? randomSeed() : null);
            reset();
          }}
        >
          {order === null ? 'Trộn thẻ' : 'Theo thứ tự'}
        </button>
      </div>

      {card ? (
        <>
          <button className={`flash ${flipped ? 'flipped' : ''}`} onClick={() => setFlipped(!flipped)} aria-label="Lật thẻ">
            <span className="flash-meta">
              Mục {card.section} · {Math.min(i, deck.length - 1) + 1}/{deck.length}
              {s.kc[card.id] === 'known' && <span className="done-badge">Đã nhớ</span>}
              {s.kc[card.id] === 'unsure' && <span className="hot">Chưa chắc</span>}
            </span>
            <span className="flash-q"><Inline text={card.q} /></span>
            {flipped ? (
              <span className="flash-a"><Inline text={card.a} /></span>
            ) : (
              <span className="flash-tap">Chạm để xem đáp án</span>
            )}
          </button>
          <div className="actions center">
            <button className="btn" onClick={() => move(-1)} disabled={i === 0}>← Trước</button>
            <button className="btn warn" onClick={() => mark('unsure')}>Chưa chắc</button>
            <button className="btn primary" onClick={() => mark('known')}>Đã nhớ</button>
            <button className="btn" onClick={() => move(1)} disabled={i >= deck.length - 1}>Sau →</button>
          </div>
        </>
      ) : (
        <p className="card">Không còn thẻ nào trong bộ lọc này. Giỏi lắm!</p>
      )}
    </div>
  );
}
