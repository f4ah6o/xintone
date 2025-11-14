# xintone
kintone api, supabase, cloudflare workers, htmx, hono

## techs

- htmx
- hono
- supabase
- cloudflare workers
- kintone api

## どんなもの？
* kintone を中心にしつつ、外部の軽量な API 基盤を組み合わせて柔軟な拡張を行う構成  
* UI は htmx で必要な部分だけ動的に更新  
* サーバ側ロジックは Hono ＋ Cloudflare Workers で完結  
* ユーザー管理や認証・認可は Supabase を担当  
* kintone API で kintone 本体のデータとやり取りする

## 技術スタックの役割
* **htmx**  
  * HTML を軸に、ページ全体を作り替えずに動的な操作を実現  

* **Hono**  
  * API やルーティングを小さくシンプルに書けるフレームワーク  

* **Cloudflare Workers**  
  * Hono を動かす超軽量サーバレス基盤  
  * 中継 API・Webhook・軽いロジックを実行する場  

* **Supabase（認証・認可・ユーザー管理）**  
  * ログイン／サインアップ  
  * ロール・権限付与  
  * アプリ側への JWT による安全なアクセス制御  

* **kintone API**  
  * kintone のレコード操作全般  
  * Supabase 側で認証したユーザーごとにアクセス権のコントロールが可能
