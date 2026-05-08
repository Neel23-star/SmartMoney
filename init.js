const fs = require('fs');
const path = require('path');

const base = 'C:\\Users\\ngadewar\\Desktop\\Hackathon';

// Ensure directories exist
const dirs = [
  path.join(base, 'backend', 'routes'),
  path.join(base, 'frontend', 'src', 'components')
];

dirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created: ${dir}`);
  }
});

// File contents
const files = {
  'backend/package.json': `{
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
}`,
  'backend/database.js': `const Database = require('better-sqlite3');
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

module.exports = { db, initializeDB };`,
  'frontend/package.json': `{
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
}`,
  'frontend/vite.config.js': `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: { port: 5173 }
})`,
  'frontend/tailwind.config.js': `export default {
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
}`,
  'frontend/postcss.config.js': `export default {
  plugins: { tailwindcss: {}, autoprefixer: {} }
}`,
  'frontend/index.html': `<!DOCTYPE html>
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
</html>`
};

// Create all files
Object.entries(files).forEach(([filepath, content]) => {
  const fullPath = path.join(base, filepath);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(fullPath, content);
  console.log(`✓ ${filepath}`);
});

console.log('\nAll files and directories created successfully!');
