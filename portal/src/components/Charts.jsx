// Hand-rolled SVG charts. Colors come from CSS tokens so they work in both themes.

export function TrendChart({ data, height = 220 }) {
  const W = 640;
  const H = height;
  const pad = { l: 34, r: 16, t: 16, b: 28 };
  const max = Math.max(5, ...data.map((d) => d.created));
  const top = Math.ceil(max / 5) * 5;
  const x = (i) => pad.l + (i / (data.length - 1)) * (W - pad.l - pad.r);
  const y = (v) => pad.t + (1 - v / top) * (H - pad.t - pad.b);
  const line = (key) => data.map((d, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(d[key]).toFixed(1)}`).join(' ');
  const area = (key) => `${line(key)} L${x(data.length - 1)} ${y(0)} L${x(0)} ${y(0)} Z`;
  const ticks = [0, top / 2, top];
  const last = data[data.length - 1];
  const fmt = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

  return (
    <div style={{ overflowX: 'auto' }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', minWidth: 420, height: 'auto', display: 'block' }} role="img"
        aria-label="Tickets created and auto-resolved per day, last 14 days">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke="var(--line)" />
            <text x={pad.l - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill="var(--muted)">{t}</text>
          </g>
        ))}
        {data.map((d, i) => (i % 3 === 0 || i === data.length - 1 ? (
          <text key={d.date} x={x(i)} y={H - 8} textAnchor="middle" fontSize="11" fill="var(--muted)">{i === data.length - 1 ? 'Today' : fmt(d.date)}</text>
        ) : null))}
        <path d={area('created')} fill="var(--info)" opacity="0.08" />
        <path d={line('created')} fill="none" stroke="var(--info)" strokeWidth="2" />
        <path d={area('autoResolved')} fill="var(--accent)" opacity="0.16" />
        <path d={line('autoResolved')} fill="none" stroke="var(--accent)" strokeWidth="2.5" />
        <circle cx={x(data.length - 1)} cy={y(last.created)} r="4" fill="var(--surface)" stroke="var(--info)" strokeWidth="2" />
        <circle cx={x(data.length - 1)} cy={y(last.autoResolved)} r="4.5" fill="var(--accent)" />
      </svg>
      <div className="row small" style={{ gap: 18, marginTop: 6 }}>
        <span className="row" style={{ gap: 6 }}><i style={{ width: 14, height: 3, background: 'var(--info)', borderRadius: 2 }} /> Tickets created</span>
        <span className="row" style={{ gap: 6 }}><i style={{ width: 14, height: 3, background: 'var(--accent)', borderRadius: 2 }} /> Auto-resolved</span>
      </div>
    </div>
  );
}

export function BarList({ rows, max }) {
  const top = max || Math.max(1, ...rows.map((r) => r.value));
  return (
    <div className="bars">
      {rows.map((r) => (
        <div key={r.label} className="bar-row">
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.label}</span>
          <div className="bar-track"><div className="bar-fill" style={{ width: `${(r.value / top) * 100}%`, background: r.color || 'var(--accent)' }} /></div>
          <span className="n">{r.value}</span>
        </div>
      ))}
    </div>
  );
}

export function Ring({ value, size = 120, label }) {
  const r = (size - 14) / 2;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${label}: ${Math.round(value * 100)}%`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-2)" strokeWidth="12" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--accent)" strokeWidth="12" strokeLinecap="round"
        strokeDasharray={`${c * value} ${c}`} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      <text x="50%" y="50%" dy="0.1em" textAnchor="middle" fontFamily="var(--font-display)" fontWeight="700" fontSize="24" fill="var(--ink)">
        {Math.round(value * 100)}%
      </text>
      <text x="50%" y="50%" dy="1.6em" textAnchor="middle" fontSize="10.5" fill="var(--muted)">{label}</text>
    </svg>
  );
}
