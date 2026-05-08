const express = require('express');
const router = express.Router();
const { db } = require('../database');

router.get('/stats', (req, res) => {
  try {
    res.json({
      totalRequests: db.count(),
      pendingApprovals: db.countWhere(r => r.status === 'Pending'),
      rushRequests: db.countWhere(r => r.request_type === 'Rush'),
      highRiskRequests: db.countWhere(r => r.risk_level === 'High'),
      autoValidated: db.countWhere(r => r.ai_recommendation != null),
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
