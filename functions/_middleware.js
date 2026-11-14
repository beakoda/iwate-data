/* Cloudflare Pages Functions（middleware）
   目的: 既定サブドメイン *.pages.dev に来たアクセスを本番ドメイン iwate-data.com へ 301 で寄せる。
        canonical だけだと pages.dev も 200 で中身を返してしまうため、URL を1本に統一する。

   本番ドメイン（iwate-data.com）では何もせず next() で静的ファイルを返す。
   www→apex は Cloudflare のリダイレクトルール（ゾーン側）が先に処理するのでここには来ない。

   実行回数: out/_routes.json で /_next/* や /csv/* などを除外しているので、この関数を通るのは
   実質 HTML のページビューだけ（Pages Functions の無料枠は 10万リクエスト/日）。
   プロジェクト設定は Fail open なので、万一ここで例外が出ても静的ファイルはそのまま配信される。
   ブランチのプレビュー（<branch>.iwate-data.pages.dev / <hash>.iwate-data.pages.dev）は確認用に中身を返し、
   検索に載らないよう X-Robots-Tag: noindex を付ける（2026-11-14。以前はプレビューも本番へ飛んで確認できなかった）。 */
export const onRequest = async ({ request, next }) => {
  const url = new URL(request.url);
  if (url.hostname.endsWith('.iwate-data.pages.dev')) {
    const res = await next();
    const out = new Response(res.body, res);
    out.headers.set('X-Robots-Tag', 'noindex, nofollow');
    return out;
  }
  if (url.hostname.endsWith('.pages.dev')) {
    url.protocol = 'https:';
    url.hostname = 'iwate-data.com';
    url.port = '';
    return Response.redirect(url.toString(), 301);
  }
  return next();
};
