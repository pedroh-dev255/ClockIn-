const express = require('express');
const router = express.Router();
const pool = require('../configs/db');

router.get('/', async (req, res) => {
  try {
    // filtros
    const { level, context, start, end, search, page = 1 } = req.query;
    const limit = 50;
    const offset = (page - 1) * limit;

    const conditions = [];
    const values = [];

    if (level) {
      conditions.push("level = ?");
      values.push(level);
    }

    if (context) {
      conditions.push("context = ?");
      values.push(context);
    }

    if (start) {
      conditions.push("created_at >= ?");
      values.push(start + " 00:00:00");
    }

    if (end) {
      conditions.push("created_at <= ?");
      values.push(end + " 23:59:59");
    }

    if (search) {
      conditions.push("(message LIKE ? OR JSON_EXTRACT(data, '$') LIKE ?)");
      values.push("%" + search + "%");
      values.push("%" + search + "%");
    }

    const where = conditions.length ? "WHERE " + conditions.join(" AND ") : "";

    const [rows] = await pool.promise().query(
      `
      SELECT * FROM logs
      ${where}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `,
      [...values, limit, offset]
    );

    const [[count]] = await pool.promise().query(
      `SELECT COUNT(*) as total FROM logs ${where}`,
      values
    );

    res.json({
      success: true,
      total: count.total,
      logs: rows
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
