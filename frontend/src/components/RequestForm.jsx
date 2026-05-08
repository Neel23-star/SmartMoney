import { useState, useRef } from 'react'
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
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Department <span className="text-red-500">*</span></label>
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
