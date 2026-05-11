import React from "react";
import InfoHint from "./InfoHint";

const SENTIMENT_STYLE = {
  Bullish: "text-emerald-400 bg-emerald-900/30 border-emerald-500/30",
  Bearish: "text-red-400 bg-red-900/30 border-red-500/30",
  Neutral: "text-yellow-400 bg-yellow-900/30 border-yellow-500/30",
};

const SENTIMENT_ICON = { Bullish: "🐂", Bearish: "🐻", Neutral: "⚖️" };

function getConfidenceMeta(scoreValue) {
  const score = Number(scoreValue || 0);
  if (score >= 20) {
    return {
      label: "High Confidence",
      className: "text-emerald-300 bg-emerald-900/30 border-emerald-500/40",
    };
  }
  if (score >= 10) {
    return {
      label: "Moderate Confidence",
      className: "text-amber-300 bg-amber-900/30 border-amber-500/40",
    };
  }
  return {
    label: "Early Signal",
    className: "text-slate-300 bg-slate-700/40 border-slate-500/40",
  };
}

export default function OptionsCard({ option, onClick }) {
  const style = SENTIMENT_STYLE[option.sentiment] || SENTIMENT_STYLE.Neutral;
  const icon = SENTIMENT_ICON[option.sentiment] || "⚖️";
  const confidence = getConfidenceMeta(option.score);

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
        <div className="flex flex-col items-end gap-1">
          <div className={`text-xs px-2 py-1 rounded-lg border font-semibold ${style}`}>
            {icon} {option.sentiment}
          </div>
          <div className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${confidence.className}`}>
            {confidence.label}
          </div>
        </div>
      </div>

      <p className="text-xs text-slate-300 mb-1">{option.signal_reason || option.reasons?.[0] || "No reasoning available."}</p>
      {option.explanation && (
        <p className="text-[11px] text-slate-400 mb-2 italic">{option.explanation}</p>
      )}

      <div className="flex items-center justify-between text-xs text-slate-500">
        <div className="flex gap-3">
          {option.pcr && (
            <span>
              PCR<InfoHint text="Put/Call Ratio compares total put OI to call OI." />: <span className="text-purple-300">{option.pcr}</span>
            </span>
          )}
          {option.topCallStrike && (
            <span>
              Call OI<InfoHint text="Strike with strongest call open interest concentration." />: ₹{option.topCallStrike}
            </span>
          )}
          {option.topPutStrike && (
            <span>
              Put OI<InfoHint text="Strike with strongest put open interest concentration." />: ₹{option.topPutStrike}
            </span>
          )}
        </div>
        <span className="text-purple-500 group-hover:text-purple-400">View details →</span>
      </div>
    </button>
  );
}
