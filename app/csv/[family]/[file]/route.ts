import { MUNIS } from '@/lib/data';
import { FAMILIES, familyCsv } from '@/lib/csv';

export const dynamic = 'force-static';

export function generateStaticParams() {
  return Object.keys(FAMILIES).flatMap(family => [
    { family, file: 'all.csv' },
    ...MUNIS.map(m => ({ family, file: `${m.slug}.csv` })),
  ]);
}

export async function GET(_req: Request, { params }: { params: Promise<{ family: string; file: string }> }) {
  const { family, file } = await params;
  const slug = file.replace(/\.csv$/, '');
  const code = slug === 'all' ? null : MUNIS.find(m => m.slug === slug)?.code ?? null;
  const body = familyCsv(family, code);
  return new Response(body, { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="iwate-data_${family}_${slug}.csv"` } });
}
