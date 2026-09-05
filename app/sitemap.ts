import type { MetadataRoute } from 'next';
import { MUNIS, INDUSTRIES, SITE, GENERATED, econAt } from '@/lib/data';
export const dynamic = 'force-static';
export default function sitemap(): MetadataRoute.Sitemap {
  const d = new Date(GENERATED);
  const u = (p: string, pr: number) => ({ url: SITE.url + p, lastModified: d, priority: pr });
  return [u('/', 1), u('/dental/', 0.9), u('/population/', 0.9), u('/industry/', 0.9), u('/aging/', 0.9), u('/work/', 0.9), u('/building/', 0.9), u('/medical/', 0.9), u('/vital/', 0.9), u('/household/', 0.9), u('/city/', 0.8),
    ...MUNIS.flatMap(m => [u(`/city/${m.slug}/`, 0.8), u(`/dental/${m.slug}/`, 0.7), u(`/population/${m.slug}/`, 0.7), u(`/aging/${m.slug}/`, 0.7), u(`/work/${m.slug}/`, 0.7), u(`/building/${m.slug}/`, 0.7), u(`/medical/${m.slug}/`, 0.7), u(`/vital/${m.slug}/`, 0.7), u(`/household/${m.slug}/`, 0.7)]),
    ...INDUSTRIES.filter(i => i.code !== 'AR').map(i => u(`/industry/${i.slug}/`, 0.7)),
    ...INDUSTRIES.filter(i => i.code !== 'AR').flatMap(i =>
      MUNIS.filter(m => econAt(m.code, i.code)?.['2021']?.estab != null)
        .map(m => u(`/industry/${i.slug}/${m.slug}/`, 0.6)))];
}
