import { MUNIS, fmt } from '@/lib/data';
import mapData from '@/data/map.json';

const PALETTE = ['#E8F1FE', '#B8CFFA', '#7FA3F5', '#3460FB', '#0017C1'];

export type MapValue = { code: string; value: number | null };

/** 岩手県33市町村のコロプレス（静的SVG）。各市町村は個別ページへのリンク。色は5分位で濃いほど値が大きい。 */
export function IwateMap({ title, values, unit, family, decimals = 0, note }:
  { title: string; values: MapValue[]; unit: string; family: string; decimals?: number; note?: string }) {
  const byCode = new Map(values.map(v => [v.code, v.value]));
  const nums = values.map(v => v.value).filter((v): v is number => v != null).sort((a, b) => a - b);
  const q = (p: number) => nums.length ? nums[Math.min(nums.length - 1, Math.floor(p * nums.length))] : 0;
  const cuts = [q(0.2), q(0.4), q(0.6), q(0.8)];
  const bin = (v: number) => cuts.filter(c => v > c).length;
  const f = (n: number) => decimals ? n.toFixed(decimals) : fmt(n);
  const ranges = PALETTE.map((_, i) => {
    const lo = i === 0 ? nums[0] : cuts[i - 1], hi = i === PALETTE.length - 1 ? nums[nums.length - 1] : cuts[i];
    return `${f(lo ?? 0)}〜${f(hi ?? 0)}`;
  });
  const munis = MUNIS;
  return (
    <figure className="chart map">
      <figcaption>{title}</figcaption>
      <div className="map-wrap">
        <svg viewBox={(mapData as any).viewBox} role="img" aria-label={title} xmlns="http://www.w3.org/2000/svg">
          {munis.map(m => {
            const v = byCode.get(m.code) ?? null;
            const fill = v == null ? '#F2F2F2' : PALETTE[bin(v)];
            const d = (mapData as any).paths[m.code];
            const [cx, cy] = (mapData as any).centroids[m.code];
            const label = m.name.replace(/[市町村]$/, '');
            return (
              <a key={m.code} href={`/${family}/${m.slug}/`} aria-label={`${m.name} ${v == null ? '—' : f(v) + unit}`}>
                <path d={d} fill={fill} stroke="#fff" strokeWidth="1.2" strokeLinejoin="round" />
                <text x={cx} y={cy} fontSize="10.5" textAnchor="middle" dominantBaseline="central"
                  fill={v != null && bin(v) >= 3 ? '#fff' : '#1A1A1C'} stroke={v != null && bin(v) >= 3 ? 'rgba(0,17,143,.55)' : 'rgba(255,255,255,.85)'} strokeWidth="2.5" paintOrder="stroke" fontWeight="700">{label}</text>
                <title>{m.name}: {v == null ? '—' : f(v) + unit}</title>
              </a>
            );
          })}
        </svg>
        <ul className="map-legend" aria-label="凡例">
          {PALETTE.map((c, i) => <li key={i}><span style={{ background: c }} />{ranges[i]}{unit}</li>)}
          <li><span style={{ background: '#F2F2F2' }} />データなし</li>
        </ul>
      </div>
      <p className="note">市町村をクリックすると個別ページへ移動します。{note ? note + ' ' : ''}地図: {(mapData as any).credit}</p>
    </figure>
  );
}
