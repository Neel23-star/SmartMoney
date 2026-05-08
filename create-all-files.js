#!/usr/bin/env node
// Standalone project initializer - run with: node create-all-files.js

const fs = require('fs');
const path = require('path');

const BASE_DIR = __dirname;

// Helper function to create file with directory
function createFile(filePath, content) {
  const fullPath = path.join(BASE_DIR, filePath);
  const dir = path.dirname(fullPath);
  
  // Create parent directories if needed
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`📁 Created directory: ${path.relative(BASE_DIR, dir)}`);
  }
  
  // Write file
  fs.writeFileSync(fullPath, content, 'utf8');
  console.log(`✅ Created file: ${filePath}`);
}

console.log('🚀 Initializing AI Approval Assistant Project...\n');

// BACKEND FILES
console.log('\n--- BACKEND FILES ---');

createFile('backend/package.json', `{
  "name": "ai-approval-backend",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "better-sqlite3": "^9.4.3",
    "multer": "^1.4.5-lts.1",
    "uuid": "^9.0.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.2"
  }
}
`);

createFile('backend/server.js', `const express = require('express');
const cors = require('cors');
const path = require('path');
const { initializeDB } = require('./database');
const requestsRouter = require('./routes/requests');
const dashboardRouter = require('./routes/dashboard');

const app = express();
const PORT = 3001;

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/requests', requestsRouter);
app.use('/api/dashboard', dashboardRouter);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error', details: err.message });
});

initializeDB();

app.listen(PORT, () => {
  console.log(\`🚀 AI Approval Backend running on http://localhost:\${PORT}\`);
});
`);

createFile('backend/mockAI.js', `function analyzeRequest(requestData) {
  const {
    employee_name,
    employee_id,
    request_type,
    department,
    description,
    amount,
    attachment_name
  } = requestData;

  const warnings = [];

  if (!attachment_name) {
    warnings.push('⚠️ Mandatory policy attachment missing.');
  }
  if (!description || description.length < 20) {
    warnings.push('⚠️ Request description is too brief. Please provide more details.');
  }
  if (!employee_id) {
    warnings.push('⚠️ Employee ID is missing.');
  }
  if (!department) {
    warnings.push('⚠️ Department information is missing.');
  }
  if (!amount || amount <= 0) {
    warnings.push('⚠️ Budget/Amount field is required.');
  }

  const urgencyKeywords = ['urgent', 'immediate', 'asap', 'critical', 'production issue', 'emergency', 'blocker'];
  const descLower = (description || '').toLowerCase();
  const isUrgent = urgencyKeywords.some(keyword => descLower.includes(keyword));

  let risk_level = 'Low';
  if (amount > 50000) {
    risk_level = 'High';
  } else if (amount > 10000 || isUrgent) {
    risk_level = 'Medium';
  }

  let ai_recommendation = 'Approve';
  if (warnings.length > 1) {
    ai_recommendation = 'Reject';
  } else if (warnings.length === 1 || risk_level === 'High') {
    ai_recommendation = 'Review Further';
  } else if (risk_level === 'Medium') {
    ai_recommendation = 'Review Further';
  }

  let suggested_category = 'Standard';
  if (isUrgent || request_type === 'Rush') {
    suggested_category = 'Rush';
  } else if (request_type === 'NOPO') {
    suggested_category = 'NOPO';
  } else if (request_type === 'PERN') {
    suggested_category = 'PERN';
  }

  const urgencyNote = isUrgent ? ' Urgency indicators detected in description.' : '';
  const ai_summary = \`Request from \${employee_name || 'Unknown'} (\${department || 'Unknown'}) for \${request_type || 'Standard'} - \${suggested_category} routing. Amount: $\${amount || 0}.\${urgencyNote} Risk: \${risk_level}. AI recommends: \${ai_recommendation}.\`;

  const routing_path = [
    { level: 1, title: 'Level 1 Approver', role: 'Direct Manager', status: 'Pending' },
    { level: 2, title: 'Level 2 Manager', role: 'Department Head', status: 'Pending' }
  ];

  if (risk_level === 'High' || amount > 25000 || request_type === 'NOPO') {
    routing_path.push({ level: 3, title: 'Level 3 Business Approval', role: 'Finance & Compliance', status: 'Pending' });
  }

  return {
    ai_summary,
    risk_level,
    warnings,
    suggested_category,
    ai_recommendation,
    routing_path,
    isUrgent
  };
}

module.exports = { analyzeRequest };
`);

createFile('backend/database.js', `const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'approvals.db'));

function initializeDB() {
  db.exec(\`
    CREATE TABLE IF NOT EXISTS requests (
      id TEXT PRIMARY KEY,
      employee_name TEXT,
      employee_id TEXT,
      request_type TEXT,
      department TEXT,
      description TEXT,
      amount REAL,
      attachment_name TEXT,
      status TEXT DEFAULT 'Pending',
      risk_level TEXT,
      ai_summary TEXT,
      ai_recommendation TEXT,
      ai_category TEXT,
      missing_warnings TEXT,
      current_level INTEGER DEFAULT 1,
      created_at TEXT
    )
  \`);

  const count = db.prepare('SELECT COUNT(*) as c FROM requests').get();
  if (count.c === 0) {
    const insert = db.prepare(\`
      INSERT INTO requests (id, employee_name, employee_id, request_type, department, description, amount, attachment_name, status, risk_level, ai_summary, ai_recommendation, ai_category, missing_warnings, current_level, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    \`);

    const seeds = [
      {
        id: 'REQ-001',
        employee_name: 'Sarah Johnson',
        employee_id: 'EMP-1042',
        request_type: 'NOPO',
        department: 'Procurement',
        description: 'Emergency procurement of network infrastructure equipment for data center upgrade. Vendor has been pre-approved by IT committee.',
        amount: 78500,
        attachment_name: 'nopo_approval_form.pdf',
        status: 'Under Review',
        risk_level: 'High',
        ai_summary: 'Request from Sarah Johnson (Procurement) for NOPO - NOPO routing. Amount: $78500. Risk: High. AI recommends: Review Further.',
        ai_recommendation: 'Review Further',
        ai_category: 'NOPO',
        missing_warnings: JSON.stringify([]),
        current_level: 2,
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'REQ-002',
        employee_name: 'Michael Chen',
        employee_id: 'EMP-2071',
        request_type: 'Rush',
        department: 'IT',
        description: 'URGENT: Production server is down. Need immediate purchase of replacement hardware to restore service. This is a critical blocker for all operations.',
        amount: 15200,
        attachment_name: 'incident_report.pdf',
        status: 'Approved',
        risk_level: 'Medium',
        ai_summary: 'Request from Michael Chen (IT) for Rush - Rush routing. Amount: $15200. Risk: Medium. Urgency indicators detected in description. AI recommends: Review Further.',
        ai_recommendation: 'Review Further',
        ai_category: 'Rush',
        missing_warnings: JSON.stringify([]),
        current_level: 2,
        created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'REQ-003',
        employee_name: 'Emily Rodriguez',
        employee_id: 'EMP-3018',
        request_type: 'Standard',
        department: 'Marketing',
        description: 'Annual subscription renewal for marketing analytics platform. Budget approved in Q1 planning.',
        amount: 4800,
        attachment_name: 'vendor_quote.pdf',
        status: 'Approved',
        risk_level: 'Low',
        ai_summary: 'Request from Emily Rodriguez (Marketing) for Standard - Standard routing. Amount: $4800. Risk: Low. AI recommends: Approve.',
        ai_recommendation: 'Approve',
        ai_category: 'Standard',
        missing_warnings: JSON.stringify([]),
        current_level: 1,
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'REQ-004',
        employee_name: 'James Wilson',
        employee_id: 'EMP-4055',
        request_type: 'PERN',
        department: 'Finance',
        description: 'Purchase of enterprise resource planning software license for finance department automation and compliance reporting.',
        amount: 32000,
        attachment_name: null,
        status: 'Pending',
        risk_level: 'High',
        ai_summary: 'Request from James Wilson (Finance) for PERN - PERN routing. Amount: $32000. Risk: High. AI recommends: Review Further.',
        ai_recommendation: 'Review Further',
        ai_category: 'PERN',
        missing_warnings: JSON.stringify(['⚠️ Mandatory policy attachment missing.']),
        current_level: 1,
        created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'REQ-005',
        employee_name: 'Lisa Park',
        employee_id: 'EMP-5033',
        request_type: 'Rush',
        department: 'Operations',
        description: 'Asap replacement of critical manufacturing equipment that failed inspection. Production line is at risk.',
        amount: 28900,
        attachment_name: 'maintenance_report.pdf',
        status: 'Pending',
        risk_level: 'High',
        ai_summary: 'Request from Lisa Park (Operations) for Rush - Rush routing. Amount: $28900. Risk: High. Urgency indicators detected in description. AI recommends: Review Further.',
        ai_recommendation: 'Review Further',
        ai_category: 'Rush',
        missing_warnings: JSON.stringify([]),
        current_level: 1,
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'REQ-006',
        employee_name: 'David Thompson',
        employee_id: 'EMP-6022',
        request_type: 'Standard',
        department: 'HR',
        description: 'Office furniture and equipment for new employee onboarding batch of 10 staff members joining next month.',
        amount: 7500,
        attachment_name: 'furniture_quote.pdf',
        status: 'Pending',
        risk_level: 'Low',
        ai_summary: 'Request from David Thompson (HR) for Standard - Standard routing. Amount: $7500. Risk: Low. AI recommends: Approve.',
        ai_recommendation: 'Approve',
        ai_category: 'Standard',
        missing_warnings: JSON.stringify([]),
        current_level: 1,
        created_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'REQ-007',
        employee_name: 'Amanda Foster',
        employee_id: 'EMP-7091',
        request_type: 'NOPO',
        department: 'Legal',
        description: 'Outside counsel fees for ongoing contract negotiation with strategic partner. Requires immediate approval.',
        amount: 55000,
        attachment_name: 'legal_engagement_letter.pdf',
        status: 'Rejected',
        risk_level: 'High',
        ai_summary: 'Request from Amanda Foster (Legal) for NOPO - NOPO routing. Amount: $55000. Risk: High. Urgency indicators detected in description. AI recommends: Review Further.',
        ai_recommendation: 'Review Further',
        ai_category: 'NOPO',
        missing_warnings: JSON.stringify([]),
        current_level: 3,
        created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'REQ-008',
        employee_name: 'Robert Kim',
        employee_id: 'EMP-8044',
        request_type: 'Standard',
        department: 'IT',
        description: 'Software development tools and IDE licenses for the engineering team annual renewal.',
        amount: 2400,
        attachment_name: 'renewal_invoice.pdf',
        status: 'Approved',
        risk_level: 'Low',
        ai_summary: 'Request from Robert Kim (IT) for Standard - Standard routing. Amount: $2400. Risk: Low. AI recommends: Approve.',
        ai_recommendation: 'Approve',
        ai_category: 'Standard',
        missing_warnings: JSON.stringify([]),
        current_level: 1,
        created_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];

    for (const seed of seeds) {
      insert.run(
        seed.id, seed.employee_name, seed.employee_id, seed.request_type,
        seed.department, seed.description, seed.amount, seed.attachment_name,
        seed.status, seed.risk_level, seed.ai_summary, seed.ai_recommendation,
        seed.ai_category, seed.missing_warnings, seed.current_level, seed.created_at
      );
    }
    console.log('Database seeded with 8 mock requests');
  }
}

module.exports = { db, initializeDB };
`);

createFile('backend/routes/requests.js', `const express = require('express');
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

module.exports = router;
`);

createFile('backend/routes/dashboard.js', `const express = require('express');
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

module.exports = router;
`);

// FRONTEND FILES
console.log('\n--- FRONTEND FILES ---');

createFile('frontend/package.json', `{
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
}
`);

createFile('frontend/vite.config.js', `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: { port: 5173 }
})
`);

createFile('frontend/tailwind.config.js', `export default {
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
        },
        emerald: {
          500: '#10b981',
          600: '#059669',
        }
      }
    }
  },
  plugins: []
}
`);

createFile('frontend/postcss.config.js', `export default {
  plugins: { tailwindcss: {}, autoprefixer: {} }
}
`);

createFile('frontend/index.html', `<!DOCTYPE html>
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
</html>
`);

createFile('frontend/src/index.css', `@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  font-family: 'Inter', system-ui, sans-serif;
  background-color: #f1f5f9;
}

::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: #f1f5f9; }
::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
`);

createFile('frontend/src/main.jsx', `import React from 'react'
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
)
`);

createFile('frontend/src/App.jsx', `import { Routes, Route } from 'react-router-dom'
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
}
`);

console.log('\n✨ All project files created successfully!');
console.log('\n📋 Next Steps:');
console.log('   1. cd backend');
console.log('   2. npm install');
console.log('   3. npm start');
console.log('\n   (in another terminal)');
console.log('   1. cd frontend');
console.log('   2. npm install');
console.log('   3. npm run dev');
console.log('\n🌐 Application URL: http://localhost:5173');
