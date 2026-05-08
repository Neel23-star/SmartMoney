import { useState, useEffect } from 'react'
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
          <div className="p-6 space-y-3">{[...Array(6)].map((_, i) => <div key={i} className="h-12 bg-slate-100 animate-pulse rounded-lg"></div>)}</div>
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
