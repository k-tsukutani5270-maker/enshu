# enshu - My cafe note ☕

自分専用のカフェ記録Webアプリ「My cafe note」のリポジトリです。
スクラップブックのようなあたたかいデザインで、訪れたカフェの思い出を記録できます。

## 機能
- カフェ情報の記録（店名、場所、写真、食べたもの、評価、支払い方法、メモ）
- `localStorage` によるデータ永続化（ブラウザを閉じてもデータが残ります）
- Googleマップ連携（場所から検索リンクを自動生成）
- レスポンシブデザイン（PC/スマホ両対応）

## デプロイ方法 (Render)
1. GitHubにこのリポジトリをプッシュします。
2. [Render](https://render.com/) で "New Static Site" を作成します。
3. リポジトリ `enshu` を選択します。
4. Build Command は空、Publish Directory を `.` に設定してデプロイします。

## ファイル構成
- `index.html`: アプリの構造
- `style.css`: スクラップブック風のデザイン定義
- `script.js`: データ保存・表示のロジック
