const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.database_url,
  ssl: { rejectUnauthorized: false },
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};
