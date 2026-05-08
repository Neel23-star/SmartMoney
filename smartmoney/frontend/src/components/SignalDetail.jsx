import React from "react";

export default function SignalDetail({ signal, onClose }) {
  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-slate-800 border border-slate-600 rounded-2xl p-6 w-full max-w-lg shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-2xl font-bold text-emerald-400">{signal.symbol}</h2>
            <span className="text-sm text-slate-400">{signal.asset_type}</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Plain English explanation */}
        {signal.explanation && (
          <div className="bg-emerald-900/20 border border-emerald-700/30 rounded-xl p-4 mb-4">
            <p className="text-xs text-emerald-400 uppercase tracking-wider mb-1">💡 What this means</p>
            <p className="text-sm text-slate-200">{signal.explanation}</p>
          </div>
        )}

        {/* Signal reason */}
        <div className="bg-slate-700/50 rounded-xl p-4 mb-4">
          <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Signal</p>
          <p className="text-white font-medium">{signal.signal_reason}</p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <Stat label="Confidence Score" value={signal.score} highlight />
          {signal.price && (
            <Stat label="Price" value={`₹${signal.price?.toLocaleString("en-IN")}`} />
          )}
          {signal.volume_spike && (
            <Stat label="Volume Spike" value={`${signal.volume_spike}x average`} />
          )}
          {signal.deal_value > 0 && (
            <Stat
              label="Deal Value"
              value={`₹${(signal.deal_value / 1e7).toFixed(1)} Cr`}
            />
          )}
        </div>

        {/* Last updated */}
        {signal.fetched_at && (
          <p className="text-xs text-slate-500 mb-4">
            Last fetched: {signal.fetched_at}
          </p>
        )}

        {/* Source link */}
        {signal.source_url && (
          <a
            href={signal.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full text-center py-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-medium transition"
          >
            🔗 View Source Data →
          </a>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, highlight }) {
  return (
    <div className="bg-slate-700/40 rounded-lg p-3">
      <p className="text-xs text-slate-400 mb-1">{label}</p>
      <p className={`font-semibold ${highlight ? "text-emerald-400 text-xl" : "text-white"}`}>
        {value}
      </p>
    </div>
  );
}
