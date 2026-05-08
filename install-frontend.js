#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const base = 'C:\\Users\\ngadewar\\Desktop\\Hackathon';

// File: backend/routes/requests.js
fs.writeFileSync(path.join(base, 'backend/routes/requests.js'), `const express = require('express');
const router = express.Router();
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../database');
const { analyzeRequest } = require('../mockAI');

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post('/', upload.single('attachment'), (req, res) => {
  try {
    const { employee_name, employee_id, request_type, department, description, amount } = req.body;

    if (!employee_name || !request_type || !description) {
      return res.status(400).json({ error: 'Missing required fields: employee_name, request_type, description' });
    }

    const attachment_name = req.file ? req.file.originalname : null;
    const parsedAmount = parseFloat(amount) || 0;

    const analysis = analyzeRequest({
      employee_name,
      employee_id,
      request_type,
      department,
      description,
      amount: parsedAmount,
      attachment_name
    });

    const id = 'REQ-' + uuidv4().substring(0, 8).toUpperCase();
    const created_at = new Date().toISOString();

    const stmt = db.prepare(\`
      INSERT INTO requests (id, employee_name, employee_id, request_type, department, description, amount, attachment_name, status, risk_level, ai_summary, ai_recommendation, ai_category, missing_warnings, current_level, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    \`);

    stmt.run(
      id, employee_name, employee_id, request_type, department, description,
      parsedAmount, attachment_name, 'Pending', analysis.risk_level,
      analysis.ai_summary, analysis.ai_recommendation, analysis.suggested_category,
      JSON.stringify(analysis.warnings), 1, created_at
    );

    const newRequest = db.prepare('SELECT * FROM requests WHERE id = ?').get(id);
    newRequest.missing_warnings = JSON.parse(newRequest.missing_warnings || '[]');
    newRequest.routing_path = analysis.routing_path;
    newRequest.isUrgent = analysis.isUrgent;

    res.status(201).json(newRequest);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create request', details: err.message });
  }
});

router.get('/', (req, res) => {
  try {
    const requests = db.prepare('SELECT * FROM requests ORDER BY created_at DESC').all();
    const parsed = requests.map(r => ({
      ...r,
      missing_warnings: JSON.parse(r.missing_warnings || '[]')
    }));
    res.json(parsed);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
});

router.get('/:id', (req, res) => {
  try {
    const request = db.prepare('SELECT * FROM requests WHERE id = ?').get(req.params.id);
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }
    request.missing_warnings = JSON.parse(request.missing_warnings || '[]');

    const analysis = analyzeRequest({
      employee_name: request.employee_name,
      employee_id: request.employee_id,
      request_type: request.request_type,
      department: request.department,
      description: request.description,
      amount: request.amount,
      attachment_name: request.attachment_name
    });
    request.routing_path = analysis.routing_path;
    request.isUrgent = analysis.isUrgent;

    res.json(request);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch request' });
  }
});

router.patch('/:id/status', (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }
    const stmt = db.prepare('UPDATE requests SET status = ? WHERE id = ?');
    const result = stmt.run(status, req.params.id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Request not found' });
    }
    const updated = db.prepare('SELECT * FROM requests WHERE id = ?').get(req.params.id);
    updated.missing_warnings = JSON.parse(updated.missing_warnings || '[]');
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

module.exports = router;`);

// File: backend/routes/dashboard.js
fs.writeFileSync(path.join(base, 'backend/routes/dashboard.js'), `const express = require('express');
const router = express.Router();
const { db } = require('../database');

router.get('/stats', (req, res) => {
  try {
    const totalRequests = db.prepare('SELECT COUNT(*) as c FROM requests').get().c;
    const pendingApprovals = db.prepare("SELECT COUNT(*) as c FROM requests WHERE status = 'Pending'").get().c;
    const rushRequests = db.prepare("SELECT COUNT(*) as c FROM requests WHERE request_type = 'Rush'").get().c;
    const highRiskRequests = db.prepare("SELECT COUNT(*) as c FROM requests WHERE risk_level = 'High'").get().c;
    const autoValidated = db.prepare('SELECT COUNT(*) as c FROM requests WHERE ai_recommendation IS NOT NULL').get().c;

    res.json({ totalRequests, pendingApprovals, rushRequests, highRiskRequests, autoValidated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

module.exports = router;`);

// Frontend files
fs.writeFileSync(path.join(base, 'frontend/package.json'), `{
  "name": "ai-approval-frontend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.22.0",
    "axios": "^1.6.7",
    "lucide-react": "^0.323.0",
    "react-hot-toast": "^2.4.1"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.1",
    "autoprefixer": "^10.4.17",
    "postcss": "^8.4.35",
    "tailwindcss": "^3.4.1",
    "vite": "^5.1.4"
  }
}`);

fs.writeFileSync(path.join(base, 'frontend/vite.config.js'), `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: { port: 5173 }
})`);

fs.writeFileSync(path.join(base, 'frontend/tailwind.config.js'), `export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        }
      }
    }
  },
  plugins: []
}`);

fs.writeFileSync(path.join(base, 'frontend/postcss.config.js'), `export default {
  plugins: { tailwindcss: {}, autoprefixer: {} }
}`);

fs.writeFileSync(path.join(base, 'frontend/index.html'), `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>AI Approval Assistant</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"><\/script>
  </body>
</html>`);

fs.writeFileSync(path.join(base, 'frontend/src/index.css'), `@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  font-family: 'Inter', system-ui, sans-serif;
  background-color: #f1f5f9;
}

::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: #f1f5f9; }
::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: #94a3b8; }`);

fs.writeFileSync(path.join(base, 'frontend/src/main.jsx'), `import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)`);

fs.writeFileSync(path.join(base, 'frontend/src/App.jsx'), `import { Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Sidebar from './components/Sidebar.jsx'
import Dashboard from './components/Dashboard.jsx'
import RequestForm from './components/RequestForm.jsx'
import WorkflowScreen from './components/WorkflowScreen.jsx'
import RequestsList from './components/RequestsList.jsx'

export default function App() {
  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      <Toaster position="top-right" />
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/requests" element={<RequestsList />} />
          <Route path="/submit" element={<RequestForm />} />
          <Route path="/requests/:id" element={<WorkflowScreen />} />
        </Routes>
      </main>
    </div>
  )
}`);

console.log('✓ All files created successfully!');
