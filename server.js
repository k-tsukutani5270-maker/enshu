const express = require('express');
const { Pool } = require('pg');
const path = require('path');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

// PostgreSQLの接続設定
// Render環境では DATABASE_URL 環境変数が自動的に設定されます
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Renderのデータベース接続に必要
  }
});

// テーブル作成 (起動時に実行)
const initDb = async () => {
  try {
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
        tape_class TEXT
      )
    `);
    console.log('Database initialized');
  } catch (err) {
    console.error('Error initializing database:', err);
  }
};
initDb();

// ミドルウェアの設定
app.use(cors());
app.use(express.json({ limit: '10mb' }));
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
  const { name, loc, photo, food, rating, pay, next, memo, date, tapeClass } = req.body;
  
  try {
    const result = await pool.query(`
      INSERT INTO cafe_records (name, loc, photo, food, rating, pay, next, memo, date, tape_class)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id
    `, [name, loc, photo, food, rating, pay, next, memo, date, tapeClass]);
    
    res.json({ id: result.rows[0].id, success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// サーバー起動
app.listen(port, () => {
  console.log(`Server is running at port ${port}`);
});
