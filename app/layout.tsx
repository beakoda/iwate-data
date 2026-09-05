import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';
import { SITE } from '@/lib/data';

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: `${SITE.name} — 岩手県 市町村×業種の統計データ`, template: `%s | ${SITE.name}` },
  description: SITE.description,
  openGraph: { siteName: SITE.name, locale: 'ja_JP', type: 'website' },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>
        <header className="site-header">
          <div className="container">
            <Link href="/" className="brand"><span className="brand-mark">岩</span>{SITE.name}<span className="brand-sub">岩手県 市町村×業種 統計</span></Link>
            <nav aria-label="主要ナビゲーション">
              <Link href="/dental/">歯科診療所</Link>
              <Link href="/population/">人口・世帯</Link>
              <Link href="/aging/">高齢化率</Link>
              <Link href="/work/">就業・昼夜間</Link>
              <Link href="/industry/">産業・事業所</Link>
              <Link href="/building/">住宅着工</Link>
              <Link href="/medical/">病院・医師</Link>
              <Link href="/welfare/">介護施設</Link>
              <Link href="/school/">学校</Link>
              <Link href="/jobless/">失業率</Link>
              <Link href="/education/">学歴</Link>
              <Link href="/farm/">農家</Link>
              <Link href="/economy/">所得・製造業</Link>
              <Link href="/garbage/">ごみ</Link>
              <Link href="/vital/">出生・死亡</Link>
              <Link href="/household/">世帯</Link>
              <Link href="/city/">市町村別</Link>
            </nav>
          </div>
        </header>
        <main className="container">{children}</main>
        <footer className="site-footer">
          <div className="container">
            <p>{SITE.name}は、政府統計（e-Stat）の公表データを岩手県33市町村の粒度で再集計して公開しています。運営: <a href={SITE.publisherUrl}>{SITE.publisher}</a>（盛岡市）</p>
            <p><small>本サイトの図表・数値は出典明記のうえ自由に利用できます（CC BY 4.0）。原データの著作権は各統計の作成機関に帰属します。</small></p>
          </div>
        </footer>
      </body>
    </html>
  );
}
