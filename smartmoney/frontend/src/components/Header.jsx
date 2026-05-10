import React from "react";

const BASE = import.meta.env.BASE_URL || "/";

function fmt(n) {
  if (n == null) return "—";
  return n.toLocaleString("en-IN", { maximumFractionDigits: 2, minimumFractionDigits: 2 });
}
function fmtPct(n) {
  if (n == null) return null;
  return (n >= 0 ? "+" : "") + n.toFixed(2) + "%";
}

export default function Header({
  onRefresh, loading, lastUpdated, onHome,
  securityMode, analytics, educationMode, onToggleEducation,
  indices = [], selectedIndex, onSelectIndex, marketStatus,
}) {
  const INDEX_ORDER = ["nifty50", "sensex", "banknifty", "niftymid50", "niftyit", "niftynext50"];
  const sorted = [...indices].sort(
    (a, b) => INDEX_ORDER.indexOf(a.id) - INDEX_ORDER.indexOf(b.id)
  );

  const status = marketStatus?.status || null;
  const isLive = status === "Live";
  const isHoliday = status === "Holiday";
  const statusColor = isLive ? "text-emerald-400" : isHoliday ? "text-amber-400" : "text-slate-500";
  const dotColor = isLive ? "bg-emerald-500" : isHoliday ? "bg-amber-500" : "bg-slate-600";
  const pingColor = isLive ? "bg-emerald-400" : isHoliday ? "bg-amber-400" : "";

  return (
    <header className="bg-slate-800/80 backdrop-blur border-b border-slate-700">
      <div className="max-w-full px-3 sm:px-5 py-2 flex items-center gap-3">

        {/* Logo + Name */}
        <button onClick={onHome} className="flex items-center gap-2.5 hover:opacity-80 transition flex-shrink-0">
          <img
            src={`${BASE}logo.svg`}
            alt="Smart Money Screener logo"
            className="w-8 h-8 rounded-lg object-cover flex-shrink-0"
          />
          <div className="text-left hidden sm:block">
            <div className="text-base font-bold text-sky-400 leading-tight whitespace-nowrap">
              Smart Money Screener
            </div>
            <div className="flex items-center gap-1.5">
              <p className="text-[10px] text-slate-400 leading-tight">NSE & BSE</p>
              {securityMode && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${securityMode.includes("Private") ? "text-emerald-300 border-emerald-500/40 bg-emerald-500/10" : "text-amber-300 border-amber-500/40 bg-amber-500/10"}`}>
                  {securityMode}
                </span>
              )}
            </div>
          </div>
        </button>

        {/* Divider */}
        {sorted.length > 0 && <div className="w-px h-8 bg-slate-700 flex-shrink-0 hidden sm:block" />}

        {/* Inline index ticker — scrollable, takes all middle space */}
        {sorted.length > 0 && (
          <div className="flex items-center gap-0 overflow-x-auto scrollbar-hide flex-1 min-w-0">
            {sorted.map((idx, i) => {
              const up = idx.changePct != null ? idx.changePct >= 0 : null;
              const chgColor = up === true ? "text-emerald-400" : up === false ? "text-red-400" : "text-slate-500";
              const isSelected = selectedIndex === idx.id;
              return (
                <React.Fragment key={idx.id}>
                  {i > 0 && <span className="text-slate-700 px-1.5 select-none flex-shrink-0 text-[11px]">|</span>}
                  <button
                    onClick={() => onSelectIndex && onSelectIndex(isSelected ? null : idx.id)}
                    className={`flex items-baseline gap-1 px-1.5 py-0.5 rounded transition flex-shrink-0 ${isSelected ? "bg-slate-700/60 ring-1 ring-slate-500/50" : "hover:bg-slate-700/40"}`}
                    title={`${idx.label} · ${idx.exchange}`}
                  >
                    <span className="text-[11px] text-slate-400 font-medium whitespace-nowrap">
                      {idx.label}<span className="ml-0.5 text-slate-600 text-[9px]">{idx.exchange}</span>
                    </span>
                    <span className="text-[12px] font-bold text-slate-100 tabular-nums">{fmt(idx.price)}</span>
                    {idx.changePct != null && (
                      <span className={`text-[10px] font-semibold tabular-nums ${chgColor}`}>{fmtPct(idx.changePct)}</span>
                    )}
                  </button>
                </React.Fragment>
              );
            })}
          </div>
        )}

        {/* Right controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0 ml-auto">
          {/* Market status */}
          {status && (
            <div className="hidden sm:flex items-center gap-1.5 flex-shrink-0">
              <span className="relative flex h-2 w-2">
                {(isLive || isHoliday) && <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-70 ${pingColor}`} />}
                <span className={`relative inline-flex rounded-full h-2 w-2 ${dotColor}`} />
              </span>
              <span className={`text-[11px] font-medium whitespace-nowrap ${statusColor}`}>{status}</span>
            </div>
          )}

          {analytics && (
            <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-lg border border-slate-600 bg-slate-900/60">
              <div className="text-[11px] text-slate-300">
                👥 <span className="text-slate-400">Live:</span> <span className="text-emerald-300 font-semibold">{analytics.activeVisitors}</span>
              </div>
              <div className="w-px h-4 bg-slate-600" />
              <div className="text-[11px] text-slate-300">
                ⏱ <span className="text-slate-400">Avg:</span> <span className="text-emerald-300 font-semibold">{analytics.avgSessionMin}m</span>
              </div>
            </div>
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
