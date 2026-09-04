// ビルド時に描画する純SVGチャート（クライアントJS不要）
export type Series = { label: string; points: { x: number; y: number | null }[]; color?: string };

const C = { blue: '#0017C1', light: '#3460FB', gray: '#767676', grid: '#E6E6E6', text: '#1A1A1C' };

function ticks(min: number, max: number, n = 4): number[] {
  if (max === min) return [min];
  const raw = (max - min) / n;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const norm = raw / mag;
  const step = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10) * mag;
  const lo = Math.floor(min / step) * step, hi = Math.ceil(max / step) * step;
  const out: number[] = [];
  for (let v = lo; v <= hi + 1e-9; v += step) out.push(Math.round(v * 1000) / 1000);
  return out;
}

export function LineChart({ series, title, unit = '', height = 260, zero = false }:
  { series: Series[]; title: string; unit?: string; height?: number; zero?: boolean }) {
  const W = 720, H = height, padL = 56, padR = 16, padT = 12, padB = 32;
  const xs = series.flatMap(s => s.points.map(p => p.x));
  const ys = series.flatMap(s => s.points.map(p => p.y).filter((v): v is number => v != null));
  if (!ys.length) return null;
  const xmin = Math.min(...xs), xmax = Math.max(...xs);
  let ymin = zero ? 0 : Math.min(...ys), ymax = Math.max(...ys);
  const t = ticks(ymin, ymax, 4); ymin = t[0]; ymax = t[t.length - 1];
  if (ymax === ymin) ymax = ymin + 1;
  const X = (x: number) => padL + ((x - xmin) / Math.max(1, xmax - xmin)) * (W - padL - padR);
  const Y = (y: number) => padT + (1 - (y - ymin) / (ymax - ymin)) * (H - padT - padB);
  const colors = [C.blue, C.light, C.gray, '#B03A2E'];
  const xTicks = xs.filter((v, i, a) => a.indexOf(v) === i).sort((a, b) => a - b);
  const step = xTicks.length > 9 ? Math.ceil(xTicks.length / 8) : 1;
  return (
    <figure className="chart">
      <figcaption>{title}</figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={title} width="100%">
        {t.map(v => (
          <g key={v}>
            <line x1={padL} x2={W - padR} y1={Y(v)} y2={Y(v)} stroke={C.grid} strokeWidth={1} />
            <text x={padL - 8} y={Y(v) + 4} textAnchor="end" fontSize={12} fill={C.gray}>{v.toLocaleString('ja-JP')}</text>
          </g>
        ))}
        {xTicks.map((x, i) => (i % step === 0 || i === xTicks.length - 1) && (
          <text key={x} x={X(x)} y={H - padB + 18} textAnchor="middle" fontSize={12} fill={C.gray}>{x}</text>
        ))}
        {series.map((s, si) => {
          const pts = s.points.filter(p => p.y != null) as { x: number; y: number }[];
          const d = pts.map((p, i) => `${i ? 'L' : 'M'}${X(p.x).toFixed(1)},${Y(p.y).toFixed(1)}`).join(' ');
          const col = s.color || colors[si % colors.length];
          return (
            <g key={s.label}>
              <path d={d} fill="none" stroke={col} strokeWidth={2.5} strokeLinejoin="round" />
              {pts.map(p => <circle key={p.x} cx={X(p.x)} cy={Y(p.y)} r={3} fill={col}><title>{`${p.x}: ${p.y.toLocaleString('ja-JP')}${unit}`}</title></circle>)}
            </g>
          );
        })}
      </svg>
      {series.length > 1 && (
        <ul className="legend">
          {series.map((s, si) => <li key={s.label}><span style={{ background: s.color || colors[si % colors.length] }} />{s.label}</li>)}
        </ul>
      )}
    </figure>
  );
}

export function BarChart({ items, title, unit = '', highlight }:
  { items: { label: string; value: number | null; href?: string }[]; title: string; unit?: string; highlight?: string }) {
  const vals = items.map(i => i.value).filter((v): v is number => v != null);
  if (!vals.length) return null;
  const max = Math.max(...vals);
  const rowH = 22, labelW = 120, W = 720, H = items.length * rowH + 8;
  return (
    <figure className="chart">
      <figcaption>{title}</figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={title} width="100%">
        {items.map((it, i) => {
          const y = 4 + i * rowH; const w = it.value == null ? 0 : ((it.value / max) * (W - labelW - 80));
          const hl = it.label === highlight;
          return (
            <g key={it.label}>
              <text x={labelW - 8} y={y + 15} textAnchor="end" fontSize={12} fill={C.text} fontWeight={hl ? 700 : 400}>{it.label}</text>
              <rect x={labelW} y={y + 3} width={w} height={rowH - 8} fill={hl ? C.blue : C.light} opacity={hl ? 1 : 0.75} />
              <text x={labelW + w + 6} y={y + 15} fontSize={12} fill={C.gray}>{it.value == null ? '—' : it.value.toLocaleString('ja-JP') + unit}</text>
            </g>
          );
        })}
      </svg>
    </figure>
  );
}
