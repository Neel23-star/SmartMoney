#!/usr/bin/env python3
"""
AI Approval Assistant - Python File Generator
Run: python create_files.py
(Does NOT require Node.js)
"""
import os

BASE = r"C:\Users\ngadewar\Desktop\Hackathon"

def write(rel, content):
    full = os.path.join(BASE, rel.replace('/', os.sep))
    os.makedirs(os.path.dirname(full), exist_ok=True)
    with open(full, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"  OK  {rel}")

print("\n" + "="*60)
print("  AI Approval Assistant - Creating Project Files")
print("="*60 + "\n")

# ── BACKEND ──────────────────────────────────────────────────

write('backend/package.json', '''{
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
''')

write('backend/server.js', r"""const express = require('express');
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
app.listen(PORT, () => console.log(`🚀 Backend running on http://localhost:${PORT}`));
""")

write('backend/mockAI.js', r"""function analyzeRequest({ employee_name, employee_id, request_type, department, description, amount, attachment_name }) {
  const warnings = [];
  if (!attachment_name) warnings.push('⚠️ Mandatory policy attachment missing.');
  if (!description || description.length < 20) warnings.push('⚠️ Request description is too brief.');
  if (!employee_id) warnings.push('⚠️ Employee ID is missing.');
  if (!department) warnings.push('⚠️ Department information is missing.');
  if (!amount || amount <= 0) warnings.push('⚠️ Budget/Amount field is required.');

  const urgencyKeywords = ['urgent', 'immediate', 'asap', 'critical', 'production issue', 'emergency', 'blocker'];
  const isUrgent = urgencyKeywords.some(k => (description || '').toLowerCase().includes(k));

  let risk_level = amount > 50000 ? 'High' : (amount > 10000 || isUrgent) ? 'Medium' : 'Low';
  let ai_recommendation = warnings.length > 1 ? 'Reject' : (warnings.length === 1 || risk_level !== 'Low') ? 'Review Further' : 'Approve';

  let suggested_category = 'Standard';
  if (isUrgent || request_type === 'Rush') suggested_category = 'Rush';
  else if (request_type === 'NOPO') suggested_category = 'NOPO';
  else if (request_type === 'PERN') suggested_category = 'PERN';

  const urgencyNote = isUrgent ? ' Urgency indicators detected in description.' : '';
  const ai_summary = `Request from ${employee_name || 'Unknown'} (${department || 'Unknown'}) for ${request_type || 'Standard'} - ${suggested_category} routing. Amount: $${amount || 0}.${urgencyNote} Risk: ${risk_level}. AI recommends: ${ai_recommendation}.`;

  const routing_path = [
    { level: 1, title: 'Level 1 Approver', role: 'Direct Manager', status: 'Pending' },
    { level: 2, title: 'Level 2 Manager', role: 'Department Head', status: 'Pending' }
  ];
  if (risk_level === 'High' || amount > 25000 || request_type === 'NOPO') {
    routing_path.push({ level: 3, title: 'Level 3 Business Approval', role: 'Finance & Compliance', status: 'Pending' });
  }

  return { ai_summary, risk_level, warnings, suggested_category, ai_recommendation, routing_path, isUrgent };
}

module.exports = { analyzeRequest };
""")

write('backend/database.js', r"""const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'approvals.db'));

function initializeDB() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS requests (
      id TEXT PRIMARY KEY, employee_name TEXT, employee_id TEXT, request_type TEXT,
      department TEXT, description TEXT, amount REAL, attachment_name TEXT,
      status TEXT DEFAULT 'Pending', risk_level TEXT, ai_summary TEXT,
      ai_recommendation TEXT, ai_category TEXT, missing_warnings TEXT,
      current_level INTEGER DEFAULT 1, created_at TEXT
    )
  `);

  const count = db.prepare('SELECT COUNT(*) as c FROM requests').get();
  if (count.c === 0) {
    const ins = db.prepare(`INSERT INTO requests VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
    const ago = d => new Date(Date.now() - d * 86400000).toISOString();
    const seeds = [
      ['REQ-001','Sarah Johnson','EMP-1042','NOPO','Procurement','Emergency procurement of network infrastructure equipment for data center upgrade. Vendor has been pre-approved by IT committee.',78500,'nopo_approval_form.pdf','Under Review','High','Request from Sarah Johnson (Procurement) for NOPO - NOPO routing. Amount: $78500. Risk: High. AI recommends: Review Further.','Review Further','NOPO','[]',2,ago(2)],
      ['REQ-002','Michael Chen','EMP-2071','Rush','IT','URGENT: Production server is down. Need immediate purchase of replacement hardware to restore service. This is a critical blocker for all operations.',15200,'incident_report.pdf','Approved','Medium','Request from Michael Chen (IT) for Rush - Rush routing. Amount: $15200. Risk: Medium. Urgency indicators detected in description. AI recommends: Review Further.','Review Further','Rush','[]',2,ago(1)],
      ['REQ-003','Emily Rodriguez','EMP-3018','Standard','Marketing','Annual subscription renewal for marketing analytics platform. Budget approved in Q1 planning.',4800,'vendor_quote.pdf','Approved','Low','Request from Emily Rodriguez (Marketing) for Standard - Standard routing. Amount: $4800. Risk: Low. AI recommends: Approve.','Approve','Standard','[]',1,ago(3)],
      ['REQ-004','James Wilson','EMP-4055','PERN','Finance','Purchase of enterprise resource planning software license for finance department automation and compliance reporting.',32000,null,'Pending','High','Request from James Wilson (Finance) for PERN - PERN routing. Amount: $32000. Risk: High. AI recommends: Review Further.','Review Further','PERN','["⚠️ Mandatory policy attachment missing."]',1,ago(4)],
      ['REQ-005','Lisa Park','EMP-5033','Rush','Operations','Asap replacement of critical manufacturing equipment that failed inspection. Production line is at risk.',28900,'maintenance_report.pdf','Pending','High','Request from Lisa Park (Operations) for Rush - Rush routing. Amount: $28900. Risk: High. Urgency indicators detected in description. AI recommends: Review Further.','Review Further','Rush','[]',1,ago(5)],
      ['REQ-006','David Thompson','EMP-6022','Standard','HR','Office furniture and equipment for new employee onboarding batch of 10 staff members joining next month.',7500,'furniture_quote.pdf','Pending','Low','Request from David Thompson (HR) for Standard - Standard routing. Amount: $7500. Risk: Low. AI recommends: Approve.','Approve','Standard','[]',1,ago(6)],
      ['REQ-007','Amanda Foster','EMP-7091','NOPO','Legal','Outside counsel fees for ongoing contract negotiation with strategic partner. Requires immediate approval.',55000,'legal_engagement_letter.pdf','Rejected','High','Request from Amanda Foster (Legal) for NOPO - NOPO routing. Amount: $55000. Risk: High. Urgency indicators detected in description. AI recommends: Review Further.','Review Further','NOPO','[]',3,ago(7)],
      ['REQ-008','Robert Kim','EMP-8044','Standard','IT','Software development tools and IDE licenses for the engineering team annual renewal.',2400,'renewal_invoice.pdf','Approved','Low','Request from Robert Kim (IT) for Standard - Standard routing. Amount: $2400. Risk: Low. AI recommends: Approve.','Approve','Standard','[]',1,ago(8)],
    ];
    for (const s of seeds) ins.run(...s);
    console.log('Database seeded with 8 mock requests');
  }
}

module.exports = { db, initializeDB };
""")

write('backend/routes/requests.js', r"""const express = require('express');
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

    db.prepare(`INSERT INTO requests (id,employee_name,employee_id,request_type,department,description,amount,attachment_name,status,risk_level,ai_summary,ai_recommendation,ai_category,missing_warnings,current_level,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
      .run(id, employee_name, employee_id, request_type, department, description, parsedAmount, attachment_name, 'Pending', analysis.risk_level, analysis.ai_summary, analysis.ai_recommendation, analysis.suggested_category, JSON.stringify(analysis.warnings), 1, created_at);

    const newRequest = db.prepare('SELECT * FROM requests WHERE id = ?').get(id);
    newRequest.missing_warnings = JSON.parse(newRequest.missing_warnings || '[]');
    newRequest.routing_path = analysis.routing_path;
    newRequest.isUrgent = analysis.isUrgent;
    res.status(201).json(newRequest);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/', (req, res) => {
  try {
    res.json(db.prepare('SELECT * FROM requests ORDER BY created_at DESC').all().map(r => ({ ...r, missing_warnings: JSON.parse(r.missing_warnings || '[]') })));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', (req, res) => {
  try {
    const request = db.prepare('SELECT * FROM requests WHERE id = ?').get(req.params.id);
    if (!request) return res.status(404).json({ error: 'Request not found' });
    request.missing_warnings = JSON.parse(request.missing_warnings || '[]');
    const { routing_path, isUrgent } = require('../mockAI').analyzeRequest(request);
    request.routing_path = routing_path;
    request.isUrgent = isUrgent;
    res.json(request);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.patch('/:id/status', (req, res) => {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: 'Status is required' });
    const result = db.prepare('UPDATE requests SET status = ? WHERE id = ?').run(status, req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Not found' });
    const updated = db.prepare('SELECT * FROM requests WHERE id = ?').get(req.params.id);
    updated.missing_warnings = JSON.parse(updated.missing_warnings || '[]');
    res.json(updated);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
""")

write('backend/routes/dashboard.js', r"""const express = require('express');
const router = express.Router();
const { db } = require('../database');

router.get('/stats', (req, res) => {
  try {
    res.json({
      totalRequests: db.prepare('SELECT COUNT(*) as c FROM requests').get().c,
      pendingApprovals: db.prepare("SELECT COUNT(*) as c FROM requests WHERE status='Pending'").get().c,
      rushRequests: db.prepare("SELECT COUNT(*) as c FROM requests WHERE request_type='Rush'").get().c,
      highRiskRequests: db.prepare("SELECT COUNT(*) as c FROM requests WHERE risk_level='High'").get().c,
      autoValidated: db.prepare('SELECT COUNT(*) as c FROM requests WHERE ai_recommendation IS NOT NULL').get().c,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
""")

# ── FRONTEND CONFIG ───────────────────────────────────────────

write('frontend/package.json', '''{
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
''')

write('frontend/vite.config.js', """import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
export default defineConfig({ plugins: [react()], server: { port: 5173 } })
""")

write('frontend/tailwind.config.js', """export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: { extend: {} },
  plugins: []
}
""")

write('frontend/postcss.config.js', """export default { plugins: { tailwindcss: {}, autoprefixer: {} } }
""")

write('frontend/index.html', """<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>AI Approval Assistant</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
""")

write('frontend/src/index.css', """@tailwind base;
@tailwind components;
@tailwind utilities;
body { font-family: 'Inter', system-ui, sans-serif; background-color: #f1f5f9; }
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: #f1f5f9; }
::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
""")

write('frontend/src/main.jsx', """import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode><BrowserRouter><App /></BrowserRouter></React.StrictMode>
)
""")

write('frontend/src/App.jsx', """import { Routes, Route } from 'react-router-dom'
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
""")

write('frontend/src/components/Sidebar.jsx', """import { NavLink } from 'react-router-dom'
import { Sparkles, LayoutDashboard, FileText, PlusCircle } from 'lucide-react'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/requests', icon: FileText, label: 'All Requests' },
  { to: '/submit', icon: PlusCircle, label: 'New Request' },
]

export default function Sidebar() {
  return (
    <aside className="w-64 bg-slate-900 flex flex-col h-screen flex-shrink-0">
      <div className="px-6 py-6 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-white font-bold text-lg leading-tight">AI Approval</h1>
            <p className="text-slate-400 text-xs">Enterprise Assistant</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 px-4 py-6 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-sm font-medium ${
                isActive ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="px-6 py-4 border-t border-slate-700">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 rounded-full text-xs text-slate-400">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
          v1.0 Demo
        </span>
      </div>
    </aside>
  )
}
""")

write('frontend/src/components/Dashboard.jsx', """import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { FileText, Clock, Zap, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react'

const API = 'http://localhost:3001'
const riskColors = { Low: 'bg-emerald-100 text-emerald-700', Medium: 'bg-yellow-100 text-yellow-700', High: 'bg-red-100 text-red-700' }
const statusColors = { Pending: 'bg-blue-100 text-blue-700', Approved: 'bg-emerald-100 text-emerald-700', Rejected: 'bg-red-100 text-red-700', 'Under Review': 'bg-yellow-100 text-yellow-700' }
const typeColors = { Rush: 'bg-orange-100 text-orange-700', NOPO: 'bg-purple-100 text-purple-700', Standard: 'bg-blue-100 text-blue-700', PERN: 'bg-indigo-100 text-indigo-700' }

function StatCard({ label, value, icon: Icon, iconClass, bgClass, loading }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center gap-4">
      <div className={`w-14 h-14 ${bgClass} rounded-xl flex items-center justify-center flex-shrink-0`}>
        <Icon className={`w-7 h-7 ${iconClass}`} />
      </div>
      <div>
        {loading ? <div className="w-12 h-8 bg-slate-200 animate-pulse rounded mb-1"></div>
          : <p className="text-3xl font-bold text-slate-800">{value}</p>}
        <p className="text-sm text-slate-500 font-medium">{label}</p>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([axios.get(`${API}/api/dashboard/stats`), axios.get(`${API}/api/requests`)])
      .then(([s, r]) => { setStats(s.data); setRequests(r.data.slice(0, 8)) })
      .catch(console.error).finally(() => setLoading(false))
  }, [])

  const statCards = [
    { label: 'Total Requests', value: stats?.totalRequests ?? 0, icon: FileText, iconClass: 'text-blue-600', bgClass: 'bg-blue-50' },
    { label: 'Pending Approvals', value: stats?.pendingApprovals ?? 0, icon: Clock, iconClass: 'text-amber-600', bgClass: 'bg-amber-50' },
    { label: 'Rush Requests', value: stats?.rushRequests ?? 0, icon: Zap, iconClass: 'text-orange-600', bgClass: 'bg-orange-50' },
    { label: 'High Risk', value: stats?.highRiskRequests ?? 0, icon: AlertTriangle, iconClass: 'text-red-600', bgClass: 'bg-red-50' },
    { label: 'AI Validated', value: stats?.autoValidated ?? 0, icon: CheckCircle, iconClass: 'text-emerald-600', bgClass: 'bg-emerald-50' },
  ]

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <TrendingUp className="w-7 h-7 text-blue-600" />
          <h1 className="text-2xl font-bold text-slate-800">AI Approval Dashboard</h1>
        </div>
        <p className="text-slate-500 ml-10">Enterprise Request Management &amp; AI Analysis</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {statCards.map(card => <StatCard key={card.label} {...card} loading={loading} />)}
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">Recent Requests</h2>
          <Link to="/requests" className="text-sm text-blue-600 hover:text-blue-700 font-medium">View all →</Link>
        </div>
        {loading ? (
          <div className="p-6 space-y-3">{[...range(5)].map((_, i) => <div key={i} className="h-12 bg-slate-100 animate-pulse rounded-lg"></div>)}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>{['Request ID','Employee','Type','Department','Amount','Risk','Status','Action'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-slate-500 font-medium text-xs uppercase tracking-wide">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {requests.map(req => (
                  <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">{req.id}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{req.employee_name}</td>
                    <td className="px-4 py-3"><span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${typeColors[req.request_type] || 'bg-slate-100 text-slate-600'}`}>{req.request_type}</span></td>
                    <td className="px-4 py-3 text-slate-600">{req.department}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">${(req.amount || 0).toLocaleString()}</td>
                    <td className="px-4 py-3"><span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${riskColors[req.risk_level] || 'bg-slate-100'}`}>{req.risk_level}</span></td>
                    <td className="px-4 py-3"><span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[req.status] || 'bg-slate-100'}`}>{req.status}</span></td>
                    <td className="px-4 py-3"><Link to={`/requests/${req.id}`} className="text-blue-600 hover:text-blue-800 font-medium text-xs bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors">View</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function* range(n) { for (let i = 0; i < n; i++) yield i; }
""")

write('frontend/src/components/RequestForm.jsx', """import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import toast from 'react-hot-toast'
import { Sparkles, Upload, FileUp, Loader2 } from 'lucide-react'

const API = 'http://localhost:3001'

export default function RequestForm() {
  const navigate = useNavigate()
  const fileRef = useRef(null)
  const [loading, setLoading] = useState(false)
  const [fileName, setFileName] = useState(null)
  const [errors, setErrors] = useState({})
  const [form, setForm] = useState({ employee_name: '', employee_id: '', request_type: 'Standard', department: 'IT', description: '', amount: '' })

  const handleChange = e => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
    if (errors[e.target.name]) setErrors(er => ({ ...er, [e.target.name]: false }))
  }

  const validate = () => {
    const e = {}
    if (!form.employee_name.trim()) e.employee_name = true
    if (!form.description.trim()) e.description = true
    if (!form.amount || parseFloat(form.amount) <= 0) e.amount = true
    setErrors(e)
    return !Object.keys(e).length
  }

  const handleSubmit = async e => {
    e.preventDefault()
    if (!validate()) { toast.error('Please fill in all required fields'); return }
    setLoading(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => fd.append(k, v))
      if (fileRef.current?.files[0]) fd.append('attachment', fileRef.current.files[0])
      const { data } = await axios.post(`${API}/api/requests`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      toast.success('Request submitted! AI analysis complete.')
      navigate(`/requests/${data.id}`)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Submission failed')
    } finally { setLoading(false) }
  }

  const ic = f => `w-full px-4 py-2.5 rounded-xl border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors[f] ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-white focus:border-blue-400'}`

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 mb-1">Submit New Request</h1>
        <p className="text-slate-500">Fill out the form below. Our AI will analyze and route your request automatically.</p>
      </div>
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Employee Name <span className="text-red-500">*</span></label>
              <input name="employee_name" value={form.employee_name} onChange={handleChange} placeholder="e.g. John Smith" className={ic('employee_name')} />
              {errors.employee_name && <p className="text-red-500 text-xs mt-1">Required field</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Employee ID</label>
              <input name="employee_id" value={form.employee_id} onChange={handleChange} placeholder="e.g. EMP-1234" className={ic('employee_id')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Request Type <span className="text-red-500">*</span></label>
              <select name="request_type" value={form.request_type} onChange={handleChange} className={ic('request_type')}>
                <option value="Standard">Standard</option>
                <option value="Rush">Rush</option>
                <option value="NOPO">NOPO</option>
                <option value="PERN">PERN</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Department <span className="text-sm font-medium text-slate-700">*</span></label>
              <select name="department" value={form.department} onChange={handleChange} className={ic('department')}>
                {['IT','Finance','Operations','HR','Marketing','Legal','Procurement'].map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Request Description <span className="text-red-500">*</span></label>
              <textarea name="description" value={form.description} onChange={handleChange} rows={4} placeholder="Describe the purpose and details of this request..." className={ic('description')} />
              {errors.description && <p className="text-red-500 text-xs mt-1">Required field</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Amount / Budget <span className="text-red-500">*</span></label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium">$</span>
                <input type="number" name="amount" value={form.amount} onChange={handleChange} placeholder="0.00" className={`${ic('amount')} pl-8`} min="0" step="0.01" />
              </div>
              {errors.amount && <p className="text-red-500 text-xs mt-1">Please enter a valid amount</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Attachment</label>
              <div onClick={() => fileRef.current?.click()} className="border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors group">
                <input ref={fileRef} type="file" className="hidden" onChange={e => setFileName(e.target.files[0]?.name || null)} />
                {fileName ? (
                  <><FileUp className="w-8 h-8 text-blue-500" /><p className="text-sm font-medium text-blue-600">{fileName}</p><p className="text-xs text-slate-400">Click to change file</p></>
                ) : (
                  <><Upload className="w-8 h-8 text-slate-300 group-hover:text-blue-400 transition-colors" /><p className="text-sm text-slate-500">Click to upload or drag and drop</p><p className="text-xs text-slate-400">PDF, DOC, XLS up to 10MB</p></>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
          <p className="text-xs text-slate-400">Fields marked with <span className="text-red-500">*</span> are required</p>
          <button type="submit" disabled={loading} className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl shadow-lg shadow-blue-200 transition-all disabled:opacity-60 disabled:cursor-not-allowed">
            {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> AI is analyzing...</> : <><Sparkles className="w-5 h-5" /> Submit for AI Analysis</>}
          </button>
        </div>
      </form>
    </div>
  )
}
""")

write('frontend/src/components/AIAnalysisCard.jsx', """import { CheckCircle, AlertCircle, XCircle, AlertTriangle, Zap, Shield, Tag, ArrowRight } from 'lucide-react'

const riskConfig = {
  Low: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  Medium: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  High: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
}

const recConfig = {
  'Approve': { icon: CheckCircle, bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Approve' },
  'Review Further': { icon: AlertCircle, bg: 'bg-amber-100', text: 'text-amber-700', label: 'Review Further' },
  'Reject': { icon: XCircle, bg: 'bg-red-100', text: 'text-red-700', label: 'Reject' },
}

export default function AIAnalysisCard({ analysis }) {
  if (!analysis) return null
  const { ai_summary, risk_level, warnings = [], ai_recommendation, suggested_category, routing_path = [], isUrgent } = analysis
  const risk = riskConfig[risk_level] || riskConfig.Low
  const rec = recConfig[ai_recommendation] || recConfig['Review Further']
  const RecIcon = rec.icon

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
        <h3 className="font-bold text-slate-800 text-base">🤖 AI Analysis Results</h3>
      </div>
      <div className="p-6 space-y-5">
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
          <p className="text-sm text-blue-800 leading-relaxed">{ai_summary}</p>
        </div>
        {isUrgent && (
          <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-xl px-4 py-3">
            <Zap className="w-5 h-5 text-orange-500 flex-shrink-0" />
            <span className="text-sm font-semibold text-orange-700">⚡ Urgency Indicators Detected</span>
          </div>
        )}
        <div className="grid grid-cols-3 gap-3">
          <div className={`${risk.bg} border ${risk.border} rounded-xl p-3 flex flex-col items-center gap-1`}>
            <Shield className={`w-5 h-5 ${risk.text}`} />
            <span className="text-xs text-slate-500 font-medium">Risk Level</span>
            <span className={`text-sm font-bold ${risk.text}`}>{risk_level}</span>
          </div>
          <div className={`${rec.bg} rounded-xl p-3 flex flex-col items-center gap-1`}>
            <RecIcon className={`w-5 h-5 ${rec.text}`} />
            <span className="text-xs text-slate-500 font-medium">AI Recommendation</span>
            <span className={`text-xs font-bold ${rec.text} text-center leading-tight`}>{rec.label}</span>
          </div>
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 flex flex-col items-center gap-1">
            <Tag className="w-5 h-5 text-indigo-600" />
            <span className="text-xs text-slate-500 font-medium">Category</span>
            <span className="text-sm font-bold text-indigo-700">{suggested_category}</span>
          </div>
        </div>
        {warnings.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              Warnings ({warnings.length})
            </p>
            {warnings.map((w, i) => (
              <div key={i} className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-red-700">{w}</span>
              </div>
            ))}
          </div>
        )}
        <div>
          <p className="text-sm font-semibold text-slate-700 mb-3">Approval Routing Path</p>
          <div className="flex items-center gap-1 flex-wrap">
            {routing_path.map((node, i) => (
              <div key={i} className="flex items-center gap-1">
                <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-center min-w-[100px]">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <span className="w-5 h-5 bg-blue-600 text-white rounded-full text-xs flex items-center justify-center font-bold">{node.level}</span>
                  </div>
                  <p className="text-xs font-semibold text-slate-700">{node.title}</p>
                  <p className="text-xs text-slate-400">{node.role}</p>
                  <span className="text-xs text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-full mt-1 inline-block">{node.status}</span>
                </div>
                {i < routing_path.length - 1 && <ArrowRight className="w-4 h-4 text-slate-300 flex-shrink-0" />}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
""")

write('frontend/src/components/WorkflowScreen.jsx', """import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import axios from 'axios'
import toast from 'react-hot-toast'
import { ArrowLeft, CheckCircle2, Clock, XCircle, AlertCircle, Calendar, User, Building, DollarSign, FileText, Paperclip } from 'lucide-react'
import AIAnalysisCard from './AIAnalysisCard.jsx'

const API = 'http://localhost:3001'
const statusColors = { Pending: 'bg-blue-100 text-blue-700 border-blue-200', Approved: 'bg-emerald-100 text-emerald-700 border-emerald-200', Rejected: 'bg-red-100 text-red-700 border-red-200', 'Under Review': 'bg-amber-100 text-amber-700 border-amber-200' }
const typeColors = { Rush: 'bg-orange-100 text-orange-700', NOPO: 'bg-purple-100 text-purple-700', Standard: 'bg-blue-100 text-blue-700', PERN: 'bg-indigo-100 text-indigo-700' }

export default function WorkflowScreen() {
  const { id } = useParams()
  const [request, setRequest] = useState(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    axios.get(`${API}/api/requests/${id}`)
      .then(r => setRequest(r.data))
      .catch(() => toast.error('Failed to load request'))
      .finally(() => setLoading(false))
  }, [id])

  const updateStatus = async status => {
    setUpdating(true)
    try {
      await axios.patch(`${API}/api/requests/${id}/status`, { status })
      setRequest(r => ({ ...r, status }))
      toast.success(`Request ${status.toLowerCase()}`)
    } catch { toast.error('Failed to update status') }
    finally { setUpdating(false) }
  }

  if (loading) return <div className="p-8 flex justify-center items-center h-64"><div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>
  if (!request) return <div className="p-8 text-center"><p className="text-slate-500">Request not found</p><Link to="/requests" className="text-blue-600 hover:underline mt-2 inline-block">← Back</Link></div>

  const analysis = { ai_summary: request.ai_summary, risk_level: request.risk_level, warnings: request.missing_warnings || [], ai_recommendation: request.ai_recommendation, suggested_category: request.ai_category, routing_path: request.routing_path || [], isUrgent: request.isUrgent }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <Link to="/requests" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 mb-6 text-sm font-medium transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Requests
      </Link>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-start justify-between mb-4">
            <div><h2 className="text-xl font-bold text-slate-800">{request.id}</h2><p className="text-slate-500 text-sm mt-0.5">Request Details</p></div>
            <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${statusColors[request.status] || 'bg-slate-100 text-slate-600'}`}>{request.status}</span>
          </div>
          <div className="space-y-3">
            {[
              [User, 'Employee', request.employee_name],
              [User, 'Employee ID', request.employee_id || '—'],
              [Building, 'Department', request.department],
              [DollarSign, 'Amount', `$${(request.amount || 0).toLocaleString()}`],
            ].map(([Icon, label, val], i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <Icon className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span className="text-slate-500 w-28">{label}</span>
                <span className="text-slate-800 font-medium">{val}</span>
              </div>
            ))}
            <div className="flex items-center gap-2 text-sm">
              <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <span className="text-slate-500 w-28">Type</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeColors[request.request_type] || 'bg-slate-100'}`}>{request.request_type}</span>
            </div>
            {request.attachment_name && (
              <div className="flex items-center gap-2 text-sm">
                <Paperclip className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span className="text-slate-500 w-28">Attachment</span>
                <span className="text-blue-600 font-medium">{request.attachment_name}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <span className="text-slate-500 w-28">Created</span>
              <span className="text-slate-700">{new Date(request.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
            <div className="pt-2 border-t border-slate-100">
              <p className="text-xs text-slate-500 font-medium mb-1">Description</p>
              <p className="text-sm text-slate-700 leading-relaxed">{request.description}</p>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-100">
            <p className="text-xs text-slate-500 font-medium mb-3">DEMO ACTIONS</p>
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => updateStatus('Approved')} disabled={updating || request.status === 'Approved'} className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                <CheckCircle2 className="w-4 h-4" /> Approve
              </button>
              <button onClick={() => updateStatus('Under Review')} disabled={updating || request.status === 'Under Review'} className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                <AlertCircle className="w-4 h-4" /> Request More Info
              </button>
              <button onClick={() => updateStatus('Rejected')} disabled={updating || request.status === 'Rejected'} className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                <XCircle className="w-4 h-4" /> Reject
              </button>
            </div>
          </div>
        </div>
        <AIAnalysisCard analysis={analysis} />
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <h3 className="font-bold text-slate-800 mb-6">Approval Workflow Timeline</h3>
        <div className="relative">
          {(request.routing_path || []).map((step, i) => {
            const isCurrent = request.current_level === step.level
            const isComplete = request.current_level > step.level || request.status === 'Approved'
            return (
              <div key={i} className="flex gap-4 mb-6 last:mb-0 relative">
                {i < (request.routing_path || []).length - 1 && <div className="absolute left-5 top-10 bottom-0 w-0.5 bg-slate-200"></div>}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 z-10 border-2 ${isComplete ? 'bg-emerald-500 border-emerald-500' : isCurrent ? 'bg-blue-600 border-blue-600' : 'bg-white border-slate-300'}`}>
                  {isComplete ? <CheckCircle2 className="w-5 h-5 text-white" /> : isCurrent ? <span className="text-white font-bold text-sm">{step.level}</span> : <Clock className="w-4 h-4 text-slate-400" />}
                </div>
                <div className={`flex-1 rounded-xl p-4 border ${isCurrent ? 'bg-blue-50 border-blue-200' : isComplete ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`font-semibold text-sm ${isCurrent ? 'text-blue-700' : isComplete ? 'text-emerald-700' : 'text-slate-600'}`}>{step.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{step.role}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${isCurrent ? 'bg-blue-100 text-blue-700' : isComplete ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      {isComplete ? 'Completed' : isCurrent ? 'In Progress' : 'Pending'}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
""")

write('frontend/src/components/RequestsList.jsx', """import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { Search, PlusCircle, FileText, ChevronRight } from 'lucide-react'

const API = 'http://localhost:3001'
const riskColors = { Low: 'bg-emerald-100 text-emerald-700', Medium: 'bg-yellow-100 text-yellow-700', High: 'bg-red-100 text-red-700' }
const statusColors = { Pending: 'bg-blue-100 text-blue-700', Approved: 'bg-emerald-100 text-emerald-700', Rejected: 'bg-red-100 text-red-700', 'Under Review': 'bg-yellow-100 text-yellow-700' }
const typeColors = { Rush: 'bg-orange-100 text-orange-700', NOPO: 'bg-purple-100 text-purple-700', Standard: 'bg-blue-100 text-blue-700', PERN: 'bg-indigo-100 text-indigo-700' }
const recColors = { 'Approve': 'bg-emerald-100 text-emerald-700', 'Review Further': 'bg-amber-100 text-amber-700', 'Reject': 'bg-red-100 text-red-700' }

export default function RequestsList() {
  const navigate = useNavigate()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    axios.get(`${API}/api/requests`).then(r => setRequests(r.data)).catch(console.error).finally(() => setLoading(false))
  }, [])

  const filtered = requests.filter(r =>
    (typeFilter === 'all' || r.request_type === typeFilter) &&
    (statusFilter === 'all' || r.status === statusFilter) &&
    (!search || r.employee_name.toLowerCase().includes(search.toLowerCase()))
  )

  const sc = "px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <FileText className="w-7 h-7 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-slate-800">All Requests</h1>
            <p className="text-slate-500 text-sm">{filtered.length} of {requests.length} requests</p>
          </div>
          <span className="ml-2 px-2.5 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">{filtered.length}</span>
        </div>
        <Link to="/submit" className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium text-sm shadow-sm transition-colors">
          <PlusCircle className="w-4 h-4" /> New Request
        </Link>
      </div>
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-4 mb-5 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by employee name..." className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className={sc}>
          <option value="all">All Types</option>
          {['NOPO','Rush','Standard','PERN'].map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className={sc}>
          <option value="all">All Statuses</option>
          {['Pending','Approved','Rejected','Under Review'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">{Array.from({length:6}).map((_, i) => <div key={i} className="h-12 bg-slate-100 animate-pulse rounded-lg"></div>)}</div>
        ) : filtered.length === 0 ? (
          <div className="py-20 flex flex-col items-center gap-3 text-slate-400">
            <FileText className="w-12 h-12 text-slate-200" />
            <p className="text-lg font-medium">No requests found</p>
            <Link to="/submit" className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors">Submit Request</Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>{['Request ID','Employee','Type','Department','Amount','Risk','AI Rec.','Status',''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-slate-500 font-medium text-xs uppercase tracking-wide">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(req => (
                  <tr key={req.id} onClick={() => navigate(`/requests/${req.id}`)} className="hover:bg-slate-50 cursor-pointer transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-slate-600 font-medium">{req.id}</td>
                    <td className="px-4 py-3"><p className="font-medium text-slate-800">{req.employee_name}</p><p className="text-xs text-slate-400">{req.employee_id}</p></td>
                    <td className="px-4 py-3"><span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${typeColors[req.request_type] || 'bg-slate-100 text-slate-600'}`}>{req.request_type}</span></td>
                    <td className="px-4 py-3 text-slate-600">{req.department}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800">${(req.amount || 0).toLocaleString()}</td>
                    <td className="px-4 py-3"><span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${riskColors[req.risk_level] || 'bg-slate-100'}`}>{req.risk_level}</span></td>
                    <td className="px-4 py-3"><span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${recColors[req.ai_recommendation] || 'bg-slate-100'}`}>{req.ai_recommendation}</span></td>
                    <td className="px-4 py-3"><span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[req.status] || 'bg-slate-100'}`}>{req.status}</span></td>
                    <td className="px-4 py-3"><ChevronRight className="w-4 h-4 text-slate-300" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
""")

print("\n" + "="*60)
print("  All files created successfully!")
print("="*60)
print()
print("NEXT STEPS:")
print()
print("1. Install Node.js from: https://nodejs.org  (choose LTS)")
print()
print("2. After installing Node.js, open a new terminal and run:")
print()
print("   cd C:\\Users\\ngadewar\\Desktop\\Hackathon\\backend")
print("   npm install")
print()
print("   cd C:\\Users\\ngadewar\\Desktop\\Hackathon\\frontend")
print("   npm install")
print()
print("3. Start backend (Terminal 1):")
print("   cd C:\\Users\\ngadewar\\Desktop\\Hackathon\\backend")
print("   node server.js")
print()
print("4. Start frontend (Terminal 2):")
print("   cd C:\\Users\\ngadewar\\Desktop\\Hackathon\\frontend")
print("   npm run dev")
print()
print("5. Open: http://localhost:5173")
print()
