# enshu - My cafe note ☕

自分専用のカフェ記録Webアプリ「My cafe note」のリポジトリです。
スクラップブックのようなあたたかいデザインで、訪れたカフェの思い出を記録できます。

## 機能
- カフェ情報の記録（店名、場所、写真、食べたもの、評価、支払い方法、メモ）
- **PostgreSQL によるデータ永続化**（Renderデプロイ後もデータが保持されます）
- Googleマップ連携（場所から検索リンクを自動生成）
- レスポンシブデザイン（PC/スマホ両対応）

## デプロイ方法 (Render)

### 1. PostgreSQL データベースの作成
1. Renderのダッシュボードから **"New" > "PostgreSQL"** を選択。
2. Nameを入力（例: `cafe-db`）し、"Create Database" をクリック。
3. 作成完了後、**"Internal Database URL"** をコピーしておきます。

### 2. Web Service の作成
1. **"New" > "Web Service"** を選択。
2. このリポジトリを選択。
3. 以下の設定を入力：
   - **Language**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
4. **Environment Variables** に以下を追加：
   - `DATABASE_URL`: (先ほどコピーした PostgreSQL の URL)

## ファイル構成
- `server.js`: Node.js (Express) & PostgreSQL バックエンド
- `index.html`: アプリの構造
- `style.css`: デザイン定義
- `script.js`: フロントエンドロジック
