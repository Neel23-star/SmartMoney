const express = require('express');
const router = express.Router();
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../database');
const { analyzeRequest } = require('../mockAI');

const upload = multer({ storage: multer.memoryStorage() });

router.post('/', upload.single('attachment'), (req, res) => {
  try {
    const { employee_name, employee_id, request_type, department, description, amount } = req.body;
    if (!employee_name || !request_type || !description)
      return res.status(400).json({ error: 'Missing required fields' });

    const attachment_name = req.file ? req.file.originalname : null;
    const parsedAmount = parseFloat(amount) || 0;
    const analysis = analyzeRequest({ employee_name, employee_id, request_type, department, description, amount: parsedAmount, attachment_name });
    const id = 'REQ-' + uuidv4().substring(0, 8).toUpperCase();
    const created_at = new Date().toISOString();

    const newRequest = {
      id, employee_name, employee_id, request_type, department, description,
      amount: parsedAmount, attachment_name, status: 'Pending',
      risk_level: analysis.risk_level, ai_summary: analysis.ai_summary,
      ai_recommendation: analysis.ai_recommendation, ai_category: analysis.suggested_category,
      missing_warnings: analysis.warnings, current_level: 1, created_at,
      routing_path: analysis.routing_path, isUrgent: analysis.isUrgent
    };
    db.insert(newRequest);
    res.status(201).json(newRequest);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/', (req, res) => {
  try {
    res.json(db.all());
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', (req, res) => {
  try {
    const request = db.findById(req.params.id);
    if (!request) return res.status(404).json({ error: 'Request not found' });
    const { routing_path, isUrgent } = analyzeRequest(request);
    res.json({ ...request, routing_path: request.routing_path || routing_path, isUrgent: request.isUrgent ?? isUrgent });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.patch('/:id/status', (req, res) => {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: 'Status is required' });
    const updated = db.updateStatus(req.params.id, status);
    if (!updated) return res.status(404).json({ error: 'Not found' });
    res.json(updated);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
