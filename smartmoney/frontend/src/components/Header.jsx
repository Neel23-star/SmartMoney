import React from "react";

export default function Header({ onRefresh, loading, lastUpdated, onHome, securityMode, analytics, educationMode, onToggleEducation }) {
  return (
    <header className="bg-slate-800/80 backdrop-blur border-b border-slate-700">
      <div className="max-w-5xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between gap-2">
        <button onClick={onHome} className="text-left hover:opacity-80 transition min-w-0 flex-shrink">
          <h1 className="text-base sm:text-xl font-bold text-sky-400 leading-tight truncate flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-sky-600/25 border border-sky-500/40 text-sky-300 text-[11px] font-extrabold">SM</span>
            <span className="sm:inline">Smart Money</span><span className="hidden sm:inline"> Screener</span>
          </h1>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-[10px] sm:text-xs text-slate-400 hidden sm:block">Institutional activity detector — NSE & BSE</p>
            {securityMode && (
              <span className={`text-[10px] sm:text-[11px] px-2 py-0.5 rounded-full border ${securityMode.includes("Private") ? "text-emerald-300 border-emerald-500/40 bg-emerald-500/10" : "text-amber-300 border-amber-500/40 bg-amber-500/10"}`}>
                {securityMode}
              </span>
            )}
          </div>
        </button>

        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          {analytics && (
            <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-lg border border-slate-600 bg-slate-900/60">
              <div className="text-[11px] text-slate-300">
                👥 <span className="text-slate-400">Live:</span> <span className="text-emerald-300 font-semibold">{analytics.activeVisitors}</span>
              </div>
              <div className="w-px h-4 bg-slate-600" />
              <div className="text-[11px] text-slate-300">
                ⏱ <span className="text-slate-400">Avg:</span> <span className="text-emerald-300 font-semibold">{analytics.avgSessionMin}m</span>
              </div>
            </div>
          )}

          {lastUpdated && (
            <span className="text-xs text-slate-500 hidden lg:block">
              Updated: {lastUpdated}
            </span>
          )}

          {onToggleEducation && (
            <button
              onClick={onToggleEducation}
              title="Toggle Education Mode"
              className={`flex items-center gap-1.5 px-2 sm:px-3 py-2 rounded-lg text-xs font-medium border transition ${educationMode ? "bg-sky-600/30 border-sky-400/50 text-sky-200" : "bg-slate-700 hover:bg-slate-600 border-slate-600 text-slate-200"}`}
            >
              <span>🎓</span>
              <span className="hidden sm:inline">{educationMode ? "Education On" : "Education Off"}</span>
            </button>
          )}

          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-xs sm:text-sm font-medium transition"
            >
              <span className={loading ? "animate-spin inline-block" : "inline-block"}>⟳</span>
              <span className="hidden sm:inline">{loading ? "Scanning..." : "Refresh"}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
