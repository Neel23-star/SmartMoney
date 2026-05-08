import { useState, useEffect } from 'react'
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
              [User, 'Employee ID', <span className="font-mono">{request.employee_id || '—'}</span>],
              [Building, 'Department', request.department],
              [DollarSign, 'Amount', <span className="font-bold text-base">${(request.amount || 0).toLocaleString()}</span>],
            ].map(([Icon, label, val], i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <Icon className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span className="text-slate-500 w-28">{label}</span>
                <span className="text-slate-800">{val}</span>
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
