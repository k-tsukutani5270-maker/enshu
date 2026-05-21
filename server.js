const express = require('express');
const Database = require('better-sqlite3');
const path = require('path');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

// データベースの初期化
const db = new Database('database.sqlite');

// テーブル作成
db.prepare(`
  CREATE TABLE IF NOT EXISTS cafe_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
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
`).run();

// ミドルウェアの設定
app.use(cors());
app.use(express.json({ limit: '10mb' })); // 写真などの大きいデータを扱えるようにする
app.use(express.static(path.join(__dirname))); // 静的ファイル（HTML, CSS, JS）を配信

// APIエンドポイント: 全ての記録を取得
app.get('/api/records', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM cafe_records ORDER BY id DESC').all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// APIエンドポイント: 新しい記録を保存
app.post('/api/records', (req, res) => {
  const { name, loc, photo, food, rating, pay, next, memo, date, tapeClass } = req.body;
  
  try {
    const info = db.prepare(`
      INSERT INTO cafe_records (name, loc, photo, food, rating, pay, next, memo, date, tape_class)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(name, loc, photo, food, rating, pay, next, memo, date, tapeClass);
    
    res.json({ id: info.lastInsertRowid, success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// サーバー起動
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
