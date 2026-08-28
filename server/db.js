require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function initDB() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS scores (
        id SERIAL PRIMARY KEY,
        player_name VARCHAR(50) NOT NULL,
        score INTEGER NOT NULL DEFAULT 0,
        room_id VARCHAR(20),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ Base de datos lista (tabla scores verificada)');
  } finally {
    client.release();
  }
}

async function saveScore(playerName, score, roomId) {
  await pool.query(
    'INSERT INTO scores (player_name, score, room_id) VALUES ($1, $2, $3)',
    [playerName, score, roomId]
  );
}

async function getLeaderboard(limit = 10) {
  const result = await pool.query(
    `SELECT player_name, MAX(score) as best_score
     FROM scores
     GROUP BY player_name
     ORDER BY best_score DESC
     LIMIT $1`,
    [limit]
  );
  return result.rows;
}

module.exports = { initDB, saveScore, getLeaderboard };
