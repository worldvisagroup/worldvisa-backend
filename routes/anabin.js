const express = require('express');
const router = express.Router();

const data = require('../lib/data/formated-anabin-database.json');
const total = data.length;

const searchIndex = data.map((item) => [
  (item.collegeName || '').toLowerCase(),
  (item.cityName || '').toLowerCase(),
  (item.abbreviation || '').toLowerCase(),
  (item.address || '').toLowerCase(),
].join(' '));

const MAX_LIMIT = 100;
const SEARCH_RESULT_LIMIT = 50;

router.get('/', (req, res) => {
  const raw = req.query.q;
  const q = raw && raw.trim().toLowerCase();

  if (q) {
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
    return res.json({ data: results, total: results.length });
  }

  let page = parseInt(req.query.page, 10) || 1;
  let limit = parseInt(req.query.limit, 10) || 20;

  if (page < 1) page = 1;
  if (limit < 1) limit = 1;
  if (limit > MAX_LIMIT) limit = MAX_LIMIT;

  const start = (page - 1) * limit;
  const pageData = data.slice(start, start + limit);

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

module.exports = router;
