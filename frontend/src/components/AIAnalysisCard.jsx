import { CheckCircle, AlertCircle, XCircle, AlertTriangle, Zap, Shield, Tag, ArrowRight } from 'lucide-react'

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
