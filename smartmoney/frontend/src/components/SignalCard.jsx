import React from "react";

const TYPE_COLORS = {
  Stock: "bg-blue-600/20 text-blue-300 border-blue-500/30",
  FnO: "bg-purple-600/20 text-purple-300 border-purple-500/30",
  Commodity: "bg-yellow-600/20 text-yellow-300 border-yellow-500/30",
};

const SCORE_COLOR = (score) => {
  if (score >= 40) return "text-red-400";
  if (score >= 20) return "text-orange-400";
  return "text-emerald-400";
};

export default function SignalCard({ signal, onClick }) {
  const typeStyle = TYPE_COLORS[signal.asset_type] || TYPE_COLORS.Stock;

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-emerald-500/50 rounded-xl p-4 transition-all duration-200 group"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-white group-hover:text-emerald-400 transition">
            {signal.symbol}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full border ${typeStyle}`}>
            {signal.asset_type}
          </span>
        </div>
        <div className="text-right">
          <div className={`text-xl font-bold ${SCORE_COLOR(signal.score)}`}>
            {signal.score}
          </div>
          <div className="text-xs text-slate-500">score</div>
        </div>
      </div>

      <p className="text-sm text-slate-300 mb-2">{signal.signal_reason}</p>

      {/* Plain English explanation */}
      {signal.explanation && (
        <p className="text-xs text-slate-400 italic mb-3 border-l-2 border-emerald-600/50 pl-2">
          {signal.explanation}
        </p>
      )}

      <div className="flex items-center justify-between text-xs text-slate-500">
        <div className="flex gap-3">
          {signal.price && (
            <span>₹{signal.price?.toLocaleString("en-IN")}</span>
          )}
          {signal.volume_spike && (
            <span className="text-emerald-400">🔥 {signal.volume_spike}x vol</span>
          )}
        </div>
        <span className="text-emerald-500 group-hover:text-emerald-400">
          View details →
        </span>
      </div>
    </button>
  );
}
