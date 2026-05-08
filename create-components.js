#!/usr/bin/env node
// Component files initializer - run with: node create-components.js
// This script creates the React component files for the frontend

const fs = require('fs');
const path = require('path');

const BASE_DIR = __dirname;

function createFile(filePath, content) {
  const fullPath = path.join(BASE_DIR, filePath);
  const dir = path.dirname(fullPath);
  
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`📁 Created directory: ${path.relative(BASE_DIR, dir)}`);
  }
  
  fs.writeFileSync(fullPath, content, 'utf8');
  console.log(`✅ Created: ${filePath}`);
}

console.log('🚀 Creating React Component Files...\n');

// Component files
createFile('frontend/src/components/Sidebar.jsx', `import { NavLink } from 'react-router-dom'
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
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              \`flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-sm font-medium \${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }\`
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
}`);

createFile('frontend/src/components/Dashboard.jsx', `import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { FileText, Clock, Zap, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react'

const API = 'http://localhost:3001'

const riskColors = {
  Low: 'bg-emerald-100 text-emerald-700',
  Medium: 'bg-yellow-100 text-yellow-700',
  High: 'bg-red-100 text-red-700',
}

const statusColors = {
  Pending: 'bg-blue-100 text-blue-700',
  Approved: 'bg-emerald-100 text-emerald-700',
  Rejected: 'bg-red-100 text-red-700',
  'Under Review': 'bg-yellow-100 text-yellow-700',
}

const typeColors = {
  Rush: 'bg-orange-100 text-orange-700',
  NOPO: 'bg-purple-100 text-purple-700',
  Standard: 'bg-blue-100 text-blue-700',
  PERN: 'bg-indigo-100 text-indigo-700',
}

function StatCard({ label, value, icon: Icon, iconClass, bgClass, loading }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center gap-4">
      <div className={\`w-14 h-14 \${bgClass} rounded-xl flex items-center justify-center flex-shrink-0\`}>
        <Icon className={\`w-7 h-7 \${iconClass}\`} />
      </div>
      <div>
        {loading ? (
          <div className="w-12 h-8 bg-slate-200 animate-pulse rounded mb-1"></div>
        ) : (
          <p className="text-3xl font-bold text-slate-800">{value}</p>
        )}
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
    Promise.all([
      axios.get(\`\${API}/api/dashboard/stats\`),
      axios.get(\`\${API}/api/requests\`)
    ]).then(([statsRes, reqRes]) => {
      setStats(statsRes.data)
      setRequests(reqRes.data.slice(0, 8))
    }).catch(console.error).finally(() => setLoading(false))
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
        {statCards.map(card => (
          <StatCard key={card.label} {...card} loading={loading} />
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">Recent Requests</h2>
          <Link to="/requests" className="text-sm text-blue-600 hover:text-blue-700 font-medium">View all →</Link>
        </div>

        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-slate-100 animate-pulse rounded-lg"></div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  {['Request ID', 'Employee', 'Type', 'Department', 'Amount', 'Risk', 'Status', 'Action'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-slate-500 font-medium text-xs uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {requests.map(req => (
                  <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">{req.id}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{req.employee_name}</td>
                    <td className="px-4 py-3">
                      <span className={\`inline-flex px-2 py-0.5 rounded-full text-xs font-medium \${typeColors[req.request_type] || 'bg-slate-100 text-slate-600'}\`}>
                        {req.request_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{req.department}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">\${(req.amount || 0).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={\`inline-flex px-2 py-0.5 rounded-full text-xs font-medium \${riskColors[req.risk_level] || 'bg-slate-100'}\`}>
                        {req.risk_level}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={\`inline-flex px-2 py-0.5 rounded-full text-xs font-medium \${statusColors[req.status] || 'bg-slate-100'}\`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link to={\`/requests/\${req.id}\`} className="text-blue-600 hover:text-blue-800 font-medium text-xs bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}`);

console.log('\n✨ Component files created successfully!');
console.log('\nNow run: npm run dev (in frontend directory)');
