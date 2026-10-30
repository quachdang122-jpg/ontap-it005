import type { Figure } from '../generators/types';

export function FigureView({ fig }: { fig: Figure }) {
  switch (fig.type) {
    case 'cwnd':
      return <CwndChart rounds={fig.rounds} />;
    case 'mux':
      return <MuxFigure fig={fig} />;
    case 'ring':
      return <RingFigure {...fig} />;
    case 'email':
      return <EmailFigure />;
  }
}

function CwndChart({ rounds }: { rounds: number[] }) {
  const W = 640;
  const H = 300;
  const pad = { l: 40, r: 12, t: 14, b: 40 };
  const maxY = Math.max(...rounds) + 2;
  const yStep = maxY > 30 ? 5 : maxY > 14 ? 2 : 1;
  const x = (t: number) => pad.l + ((t - 0.5) / rounds.length) * (W - pad.l - pad.r);
  const y = (v: number) => H - pad.b - (v / maxY) * (H - pad.t - pad.b);
  const ys: number[] = [];
  for (let v = 0; v <= maxY; v += yStep) ys.push(v);
  return (
    <figure className="figure scroll">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Đồ thị cwnd theo vòng truyền">
        {ys.map((v) => (
          <g key={v}>
            <line className="gridline" x1={pad.l} x2={W - pad.r} y1={y(v)} y2={y(v)} />
            <text className="axis-label" x={pad.l - 6} y={y(v) + 4} textAnchor="end">{v}</text>
          </g>
        ))}
        {rounds.map((_, i) => (
          <text key={i} className="axis-label" x={x(i + 1)} y={H - pad.b + 16} textAnchor="middle">{i + 1}</text>
        ))}
        <text className="axis-title" x={(W + pad.l) / 2} y={H - 6} textAnchor="middle">Vòng truyền (RTT)</text>
        <text className="axis-title" x={12} y={pad.t + (H - pad.t - pad.b) / 2} textAnchor="middle" transform={`rotate(-90 12 ${pad.t + (H - pad.t - pad.b) / 2})`}>cwnd</text>
        <polyline className="series" points={rounds.map((v, i) => `${x(i + 1)},${y(v)}`).join(' ')} />
        {rounds.map((v, i) => (
          <g key={i}>
            <circle className="dot" cx={x(i + 1)} cy={y(v)} r={4} />
            <text className="dot-label" x={x(i + 1)} y={y(v) - 8} textAnchor="middle">{v}</text>
          </g>
        ))}
      </svg>
    </figure>
  );
}

function MuxFigure({ fig }: { fig: Extract<Figure, { type: 'mux' }> }) {
  // Hai client ở hàng trên, server ở hàng dưới: vừa khung 360 px mà không cần cuộn ngang.
  const W = 420;
  const H = 290;
  const boxW = 180;
  const boxH = 100;
  const clients = fig.hosts.filter((h) => !h.server);
  const pos: Record<string, [number, number]> = {};
  clients.forEach((h, i) => (pos[h.name] = [10 + i * (W - 20 - boxW), 10]));
  fig.hosts.filter((h) => h.server).forEach((h) => (pos[h.name] = [(W - boxW) / 2, H - boxH - 10]));
  const anchor = (n: string, toward: string): [number, number] => {
    const [x, y] = pos[n];
    const [tx, ty] = pos[toward];
    if (ty > y) return [x + boxW / 2 + (tx > x ? 30 : -30), y + boxH];
    return [x + boxW / 2 + (tx > x ? 50 : -50), y];
  };
  return (
    <figure className="figure">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Sơ đồ host, tiến trình và cổng" style={{ maxWidth: 520 }}>
        <defs>
          <marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" className="arrow-head" />
          </marker>
        </defs>
        {fig.arrows.map((a, i) => {
          const [x1, y1] = anchor(a.from, a.to);
          const [x2, y2] = anchor(a.to, a.from);
          const my = (y1 + y2) / 2;
          const mx = (x1 + x2) / 2;
          return (
            <g key={i}>
              <path className="link" d={`M${x1},${y1} C${x1},${my} ${x2},${my} ${x2},${y2 + (y2 > y1 ? -3 : 3)}`} markerEnd="url(#arr)" />
              <circle className="badge" cx={mx} cy={my} r={12} />
              <text className="badge-label" x={mx} y={my + 4} textAnchor="middle">{a.label}</text>
            </g>
          );
        })}
        {fig.hosts.map((h) => (
          <g key={h.name} transform={`translate(${pos[h.name][0]},${pos[h.name][1]})`}>
            <rect className={h.server ? 'host server' : 'host'} width={boxW} height={boxH} rx={10} />
            <text className="host-name" x={12} y={24}>{h.server ? `Server ${h.name}` : `Host ${h.name}`}</text>
            <text className="host-ip" x={12} y={44}>{h.ip}</text>
            {h.ports.map((p, j) => (
              <g key={j} transform={`translate(${30},${72 + j * 26})`}>
                <circle className="proc" r={14} />
                <text className="proc-label" y={4} textAnchor="middle">P</text>
                <text className="port-label" x={22} y={5}>cổng {p}</text>
              </g>
            ))}
          </g>
        ))}
        <text className="axis-title" x={W / 2} y={H / 2 - 8} textAnchor="middle">{fig.proto}</text>
      </svg>
    </figure>
  );
}

function RingFigure({ ab, bc, cd, da }: { ab: number; bc: number; cd: number; da: number }) {
  const pts = { A: [90, 50], B: [330, 50], C: [330, 190], D: [90, 190] } as const;
  const edges: [keyof typeof pts, keyof typeof pts, number][] = [
    ['A', 'B', ab],
    ['B', 'C', bc],
    ['C', 'D', cd],
    ['D', 'A', da],
  ];
  return (
    <figure className="figure narrow">
      <svg viewBox="0 0 420 240" role="img" aria-label="Vòng 4 switch A, B, C, D">
        {edges.map(([u, v, n]) => {
          const [x1, y1] = pts[u];
          const [x2, y2] = pts[v];
          const mx = (x1 + x2) / 2;
          const my = (y1 + y2) / 2;
          return (
            <g key={u + v}>
              <line className="link solid" x1={x1} y1={y1} x2={x2} y2={y2} />
              <rect className="edge-tag" x={mx - 22} y={my - 13} width={44} height={26} rx={6} />
              <text className="edge-label" x={mx} y={my + 5} textAnchor="middle">{n}</text>
            </g>
          );
        })}
        {Object.entries(pts).map(([k, [x, y]]) => (
          <g key={k}>
            <circle className="switch" cx={x} cy={y} r={22} />
            <text className="switch-label" x={x} y={y + 6} textAnchor="middle">{k}</text>
          </g>
        ))}
      </svg>
    </figure>
  );
}

function EmailFigure() {
  const nodes = [
    { x: 10, label: ['UA', 'của Alice'] },
    { x: 170, label: ['Mail server', 'của Alice'] },
    { x: 330, label: ['Mail server', 'của Bob'] },
    { x: 490, label: ['UA', 'của Bob'] },
  ];
  const steps = [
    { from: 0, to: 1, n: 2 },
    { from: 1, to: 2, n: 4 },
    { from: 3, to: 2, n: 6 },
  ];
  return (
    <figure className="figure scroll">
      <svg viewBox="0 0 640 150" role="img" aria-label="Sơ đồ gửi thư 6 bước">
        <defs>
          <marker id="arr2" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" className="arrow-head" />
          </marker>
        </defs>
        {nodes.map((n, i) => (
          <g key={i} transform={`translate(${n.x},70)`}>
            <rect className={i === 1 || i === 2 ? 'host server' : 'host'} width={140} height={60} rx={10} />
            <text className="host-name" x={70} y={26} textAnchor="middle">{n.label[0]}</text>
            <text className="host-ip" x={70} y={46} textAnchor="middle">{n.label[1]}</text>
          </g>
        ))}
        {steps.map((s) => {
          const x1 = nodes[s.from].x + 70;
          const x2 = nodes[s.to].x + 70;
          const mid = (x1 + x2) / 2;
          const pull = s.n === 6;
          return (
            <g key={s.n}>
              <path className="link" d={`M${x1},66 C${x1},20 ${x2},20 ${x2},66`} markerEnd={pull ? undefined : 'url(#arr2)'} markerStart={pull ? 'url(#arr2)' : undefined} />
              <circle className="badge" cx={mid} cy={32} r={13} />
              <text className="badge-label" x={mid} y={37} textAnchor="middle">{s.n}</text>
            </g>
          );
        })}
      </svg>
    </figure>
  );
}
