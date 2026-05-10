import React from "react";

const INDEX_ORDER = ["nifty50", "sensex", "banknifty", "niftymid50", "niftyit", "niftynext50"];

function fmt(n) {
  if (n == null) return "—";
  return n.toLocaleString("en-IN", { maximumFractionDigits: 2, minimumFractionDigits: 2 });
}

function fmtPct(n) {
  if (n == null) return null;
  return (n >= 0 ? "+" : "") + n.toFixed(2) + "%";
}

export default function IndexBar({ indices = [], selectedIndex, onSelectIndex, marketStatus }) {
  const sorted = [...indices].sort(
    (a, b) => INDEX_ORDER.indexOf(a.id) - INDEX_ORDER.indexOf(b.id)
  );

  if (!sorted.length) return null;

  // Market status badge config
  const status = marketStatus?.status || "—";
  const isLive = status === "Live";
  const isHoliday = status === "Holiday";
  const statusColor = isLive
    ? "text-emerald-400"
    : isHoliday
    ? "text-amber-400"
    : "text-slate-400";
  const dotColor = isLive ? "bg-emerald-500" : isHoliday ? "bg-amber-500" : "bg-slate-500";
  const pingColor = isLive ? "bg-emerald-400" : isHoliday ? "bg-amber-400" : "";

  return (
    <div className="bg-slate-900/80 border-b border-slate-700/60">
      <div className="max-w-7xl mx-auto px-3 py-1.5 flex items-center gap-0 overflow-x-auto scrollbar-hide">

        {/* All indices in one row, pipe-separated */}
        {sorted.map((idx, i) => {
          const up = idx.changePct != null ? idx.changePct >= 0 : null;
          const chgColor =
            up === true ? "text-emerald-400" : up === false ? "text-red-400" : "text-slate-500";
          const isSelected = selectedIndex === idx.id;

          return (
            <React.Fragment key={idx.id}>
              {i > 0 && (
                <span className="text-slate-700 px-2 select-none flex-shrink-0">|</span>
              )}
              <button
                onClick={() => onSelectIndex(isSelected ? null : idx.id)}
                className={`flex items-baseline gap-1.5 px-1.5 py-0.5 rounded transition flex-shrink-0 ${
                  isSelected ? "bg-slate-700/60 ring-1 ring-slate-500/50" : "hover:bg-slate-800/60"
                }`}
                title={`${idx.label} · ${idx.exchange}`}
              >
                <span className="text-[11px] text-slate-400 font-medium whitespace-nowrap">
                  {idx.label}
                  <span className="ml-0.5 text-slate-600 text-[9px]">{idx.exchange}</span>
                </span>
                <span className="text-[12px] font-bold text-slate-100 tabular-nums">
                  {fmt(idx.price)}
                </span>
                {idx.changePct != null && (
                  <span className={`text-[11px] font-semibold tabular-nums ${chgColor}`}>
                    {fmtPct(idx.changePct)}
                  </span>
                )}
              </button>
            </React.Fragment>
          );
        })}

        {/* Market status badge — pushed right */}
        <div className="ml-auto flex items-center gap-1.5 flex-shrink-0 pl-3">
          <span className="relative flex h-2 w-2">
            {isLive || isHoliday ? (
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-70 ${pingColor}`} />
            ) : null}
            <span className={`relative inline-flex rounded-full h-2 w-2 ${dotColor}`} />
          </span>
          <span className={`text-[11px] font-medium whitespace-nowrap ${statusColor}`}>
            {status}
          </span>
        </div>

      </div>
    </div>
  );
}
