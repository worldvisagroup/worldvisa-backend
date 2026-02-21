const express = require('express');
const router = express.Router();

// Load JSON once — Node.js caches require(), zero repeated I/O
const data = require('../lib/data/formated-anabin-database.json');
const total = data.length;

// Pre-compute a lowercase search index at startup for fast O(n) search
// Format: "collegename cityname abbreviation address" per record
const searchIndex = data.map((item) => [
  (item.collegeName || '').toLowerCase(),
  (item.cityName || '').toLowerCase(),
  (item.abbreviation || '').toLowerCase(),
  (item.address || '').toLowerCase(),
].join(' '));

const MAX_LIMIT = 100;
const SEARCH_RESULT_LIMIT = 50;

// GET /api/anabin?page=1&limit=20
router.get('/', (req, res) => {
  let page = parseInt(req.query.page, 10) || 1;
  let limit = parseInt(req.query.limit, 10) || 20;

  if (page < 1) page = 1;
  if (limit < 1) limit = 1;
  if (limit > MAX_LIMIT) limit = MAX_LIMIT;

  const start = (page - 1) * limit;
  const end = start + limit;
  const pageData = data.slice(start, end);

  res.json({
    data: pageData,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
});

// GET /api/anabin/search?q=mumbai
router.get('/search', (req, res) => {
  const raw = req.query.q;

  if (!raw || !raw.trim()) {
    return res.status(400).json({ message: 'Query parameter "q" is required.' });
  }

  const q = raw.trim().toLowerCase();

  const results = [];
  for (let i = 0; i < total; i++) {
    if (searchIndex[i].includes(q)) {
      const item = data[i];
      results.push({
        label: `${item.collegeName} - ${item.cityName}`,
        collegeName: item.collegeName,
        cityName: item.cityName,
        abbreviation: item.abbreviation,
        address: item.address,
      });
      if (results.length === SEARCH_RESULT_LIMIT) break;
    }
  }

  res.json({ data: results, total: results.length });
});

module.exports = router;
