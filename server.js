const express = require('express');
const { Pool } = require('pg');
const path = require('path');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

// PostgreSQLの接続設定
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// テーブル作成 & カラム追加 (起動時に実行)
const initDb = async () => {
  try {
    // 基本テーブル作成
    await pool.query(`
      CREATE TABLE IF NOT EXISTS cafe_records (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        loc TEXT NOT NULL,
        photo TEXT,
        food TEXT,
        rating INTEGER,
        pay TEXT,
        next TEXT,
        memo TEXT,
        date TEXT,
        tape_class TEXT,
        lat DOUBLE PRECISION,
        lng DOUBLE PRECISION,
        is_favorite BOOLEAN DEFAULT FALSE
      )
    `);

    // カラムが存在しない場合は追加 (既存ユーザー向け)
    await pool.query(`
      ALTER TABLE cafe_records ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION;
      ALTER TABLE cafe_records ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION;
      ALTER TABLE cafe_records ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT FALSE;
    `);

    console.log('Database initialized');
  } catch (err) {
    console.error('Error initializing database:', err);
  }
};
initDb();

// ミドルウェアの設定
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname)));

// APIエンドポイント: 全ての記録を取得
app.get('/api/records', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM cafe_records ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// APIエンドポイント: 新しい記録を保存
app.post('/api/records', async (req, res) => {
  const { name, loc, photo, food, rating, pay, next, memo, date, tapeClass, lat, lng } = req.body;

  try {
    const result = await pool.query(`
      INSERT INTO cafe_records (name, loc, photo, food, rating, pay, next, memo, date, tape_class, lat, lng)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING id
    `, [name, loc, photo, food, rating, pay, next, memo, date, tapeClass, lat, lng]);

    res.json({ id: result.rows[0].id, success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// APIエンドポイント: お気に入り状態の切り替え
app.patch('/api/records/:id/favorite', async (req, res) => {
  const { id } = req.params;
  const { isFavorite } = req.body;

  try {
    await pool.query('UPDATE cafe_records SET is_favorite = $1 WHERE id = $2', [isFavorite, id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// APIエンドポイント: 記録を削除
app.delete('/api/records/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query('DELETE FROM cafe_records WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// サーバー起動
app.listen(port, () => {
  console.log(`Server is running at port ${port}`);
});

