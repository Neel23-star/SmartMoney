#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const base = 'C:\\Users\\ngadewar\\Desktop\\Hackathon';

// Create directories
['backend', 'backend/routes', 'frontend', 'frontend/src', 'frontend/src/components'].forEach(dir => {
  const fullPath = path.join(base, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
});

// File: backend/package.json
fs.writeFileSync(path.join(base, 'backend/package.json'), `{
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
}`);

// File: backend/database.js
fs.writeFileSync(path.join(base, 'backend/database.js'), `const Database = require('better-sqlite3');
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
        missing_warnings: JSON.stringify(['Warning: Mandatory policy attachment missing.']),
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

module.exports = { db, initializeDB };`);

// File: backend/mockAI.js
fs.writeFileSync(path.join(base, 'backend/mockAI.js'), `function analyzeRequest(requestData) {
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
    warnings.push('Warning: Mandatory policy attachment missing.');
  }
  if (!description || description.length < 20) {
    warnings.push('Warning: Request description is too brief. Please provide more details.');
  }
  if (!employee_id) {
    warnings.push('Warning: Employee ID is missing.');
  }
  if (!department) {
    warnings.push('Warning: Department information is missing.');
  }
  if (!amount || amount <= 0) {
    warnings.push('Warning: Budget/Amount field is required.');
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
  const ai_summary = \`Request from \${employee_name || 'Unknown'} (\${department || 'Unknown'}) for \${request_type || 'Standard'} - \${suggested_category} routing. Amount: \$\${amount || 0}.\${urgencyNote} Risk: \${risk_level}. AI recommends: \${ai_recommendation}.\`;

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

module.exports = { analyzeRequest };`);

// File: backend/server.js
fs.writeFileSync(path.join(base, 'backend/server.js'), `const express = require('express');
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
  console.log('AI Approval Backend running on http://localhost:' + PORT);
});`);

console.log('✓ Backend files created');
console.log('All files created successfully!');
