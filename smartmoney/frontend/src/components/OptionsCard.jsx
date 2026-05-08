import React from "react";

const SENTIMENT_STYLE = {
  Bullish: "text-emerald-400 bg-emerald-900/30 border-emerald-500/30",
  Bearish: "text-red-400 bg-red-900/30 border-red-500/30",
  Neutral: "text-yellow-400 bg-yellow-900/30 border-yellow-500/30",
};

const SENTIMENT_ICON = { Bullish: "🐂", Bearish: "🐻", Neutral: "⚖️" };

export default function OptionsCard({ option, onClick }) {
  const style = SENTIMENT_STYLE[option.sentiment] || SENTIMENT_STYLE.Neutral;
  const icon = SENTIMENT_ICON[option.sentiment] || "⚖️";

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-purple-500/50 rounded-xl p-4 transition-all duration-200 group"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-white group-hover:text-purple-400 transition">
            {option.symbol}
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full border bg-purple-600/20 text-purple-300 border-purple-500/30">
            F&O
          </span>
        </div>
        <div className={`text-xs px-2 py-1 rounded-lg border font-semibold ${style}`}>
          {icon} {option.sentiment}
        </div>
      </div>

      <p className="text-xs text-slate-300 mb-2">{option.reasons?.[0]}</p>

      <div className="flex items-center justify-between text-xs text-slate-500">
        <div className="flex gap-3">
          {option.pcr && <span>PCR: <span className="text-purple-300">{option.pcr}</span></span>}
          {option.topCallStrike && <span>Call OI: ₹{option.topCallStrike}</span>}
          {option.topPutStrike && <span>Put OI: ₹{option.topPutStrike}</span>}
        </div>
        <span className="text-purple-500 group-hover:text-purple-400">View details →</span>
      </div>
    </button>
  );
}
