#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const base = 'C:\\Users\\ngadewar\\Desktop\\Hackathon';

// RequestForm
fs.writeFileSync(path.join(base, 'frontend/src/components/RequestForm.jsx'), require('fs').readFileSync(path.join(__dirname, 'RequestForm.jsx'), 'utf8').replace(/^/g, '') || `import { useState, useRef } from 'react'
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
  const [form, setForm] = useState({
    employee_name: '',
    employee_id: '',
    request_type: 'Standard',
    department: 'IT',
    description: '',
    amount: '',
  })

  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
    if (errors[e.target.name]) setErrors(er => ({ ...er, [e.target.name]: false }))
  }

  const validate = () => {
    const newErrors = {}
    if (!form.employee_name.trim()) newErrors.employee_name = true
    if (!form.description.trim()) newErrors.description = true
    if (!form.amount || parseFloat(form.amount) <= 0) newErrors.amount = true
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) {
      toast.error('Please fill in all required fields')
      return
    }
    setLoading(true)
    try {
      const formData = new FormData()
      Object.entries(form).forEach(([k, v]) => formData.append(k, v))
      if (fileRef.current?.files[0]) {
        formData.append('attachment', fileRef.current.files[0])
      }
      const { data } = await axios.post(\`\${API}/api/requests\`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      toast.success('Request submitted! AI analysis complete.')
      navigate(\`/requests/\${data.id}\`)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Submission failed')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = (field) =>
    \`w-full px-4 py-2.5 rounded-xl border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 \${
      errors[field] ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-white focus:border-blue-400'
    }\`

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
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Employee Name *</label>
              <input name="employee_name" value={form.employee_name} onChange={handleChange} placeholder="e.g. John Smith" className={inputClass('employee_name')} />
              {errors.employee_name && <p className="text-red-500 text-xs mt-1">Required field</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Employee ID</label>
              <input name="employee_id" value={form.employee_id} onChange={handleChange} placeholder="e.g. EMP-1234" className={inputClass('employee_id')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Request Type *</label>
              <select name="request_type" value={form.request_type} onChange={handleChange} className={inputClass('request_type')}>
                <option value="Standard">Standard</option>
                <option value="Rush">Rush</option>
                <option value="NOPO">NOPO</option>
                <option value="PERN">PERN</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Department *</label>
              <select name="department" value={form.department} onChange={handleChange} className={inputClass('department')}>
                <option value="IT">IT</option>
                <option value="Finance">Finance</option>
                <option value="Operations">Operations</option>
                <option value="HR">HR</option>
                <option value="Marketing">Marketing</option>
                <option value="Legal">Legal</option>
                <option value="Procurement">Procurement</option>
              </select>
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Request Description *</label>
              <textarea name="description" value={form.description} onChange={handleChange} rows={4} placeholder="Describe the purpose and details of this request..." className={inputClass('description')} />
              {errors.description && <p className="text-red-500 text-xs mt-1">Required field</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Amount / Budget *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium">\$</span>
                <input type="number" name="amount" value={form.amount} onChange={handleChange} placeholder="0.00" className={\`\${inputClass('amount')} pl-8\`} min="0" step="0.01" />
              </div>
              {errors.amount && <p className="text-red-500 text-xs mt-1">Please enter a valid amount</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Attachment</label>
              <div
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors group"
              >
                <input ref={fileRef} type="file" className="hidden" onChange={(e) => setFileName(e.target.files[0]?.name || null)} />
                {fileName ? (
                  <>
                    <FileUp className="w-8 h-8 text-blue-500" />
                    <p className="text-sm font-medium text-blue-600">{fileName}</p>
                    <p className="text-xs text-slate-400">Click to change file</p>
                  </>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-slate-300 group-hover:text-blue-400 transition-colors" />
                    <p className="text-sm text-slate-500">Click to upload or drag and drop</p>
                    <p className="text-xs text-slate-400">PDF, DOC, XLS up to 10MB</p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
          <p className="text-xs text-slate-400">Fields marked with * are required</p>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl shadow-lg shadow-blue-200 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                AI is analyzing your request...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Submit for AI Analysis
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}`);

// AIAnalysisCard
fs.writeFileSync(path.join(base, 'frontend/src/components/AIAnalysisCard.jsx'), `import { CheckCircle, AlertCircle, XCircle, AlertTriangle, Zap, Shield, Tag, ArrowRight } from 'lucide-react'

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

const statusIcon = {
  Pending: <span className="w-4 h-4 rounded-full border-2 border-slate-300 inline-block" />,
  Approved: <CheckCircle className="w-4 h-4 text-emerald-500" />,
  Rejected: <XCircle className="w-4 h-4 text-red-500" />,
}

export default function AIAnalysisCard({ analysis }) {
  if (!analysis) return null
  const { ai_summary, risk_level, warnings = [], ai_recommendation, suggested_category, routing_path = [], isUrgent } = analysis

  const risk = riskConfig[risk_level] || riskConfig.Low
  const rec = recConfig[ai_recommendation] || recConfig['Review Further']
  const RecIcon = rec.icon

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></ div>
          <h3 className="font-bold text-slate-800 text-base">AI Analysis Results</h3>
        </div>
      </div>

      <div className="p-6 space-y-5">
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
          <p className="text-sm text-blue-800 leading-relaxed">{ai_summary}</p>
        </div>

        {isUrgent && (
          <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-xl px-4 py-3">
            <Zap className="w-5 h-5 text-orange-500 flex-shrink-0" />
            <span className="text-sm font-semibold text-orange-700">Urgency Indicators Detected</span>
          </div>
        )}

        <div className="grid grid-cols-3 gap-3">
          <div className={\`\${risk.bg} border \${risk.border} rounded-xl p-3 flex flex-col items-center gap-1\`}>
            <Shield className={\`w-5 h-5 \${risk.text}\`} />
            <span className="text-xs text-slate-500 font-medium">Risk Level</span>
            <span className={\`text-sm font-bold \${risk.text}\`}>{risk_level}</span>
          </div>
          <div className={\`\${rec.bg} rounded-xl p-3 flex flex-col items-center gap-1\`}>
            <RecIcon className={\`w-5 h-5 \${rec.text}\`} />
            <span className="text-xs text-slate-500 font-medium">AI Recommendation</span>
            <span className={\`text-xs font-bold \${rec.text} text-center leading-tight\`}>{rec.label}</span>
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
                    {statusIcon[node.status] || statusIcon.Pending}
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
}`);

console.log('✓ Components part 2 created');
