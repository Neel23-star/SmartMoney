import React from "react";

const INDEX_ORDER = ["nifty50", "sensex", "banknifty", "niftymid50", "niftyit", "niftynext50"];

function fmt(n) {
  if (n == null) return "—";
  return n.toLocaleString("en-IN", { maximumFractionDigits: 2, minimumFractionDigits: 2 });
}

function fmtChg(n) {
  if (n == null) return null;
  return (n >= 0 ? "+" : "") + n.toFixed(2);
}

export default function IndexBar({ indices = [], selectedIndex, onSelectIndex }) {
  // Ensure consistent ordering
  const sorted = [...indices].sort(
    (a, b) => INDEX_ORDER.indexOf(a.id) - INDEX_ORDER.indexOf(b.id)
  );

  // Default visible = nifty50 + sensex; others shown as pills
  const primary = sorted.filter((i) => i.id === "nifty50" || i.id === "sensex");
  const secondary = sorted.filter((i) => i.id !== "nifty50" && i.id !== "sensex");

  const active = selectedIndex
    ? sorted.find((i) => i.id === selectedIndex)
    : null;

  const renderTile = (idx, size = "normal") => {
    const up = idx.changePct != null ? idx.changePct >= 0 : null;
    const color =
      up === true ? "text-emerald-400" : up === false ? "text-red-400" : "text-slate-400";
    const bg =
      selectedIndex === idx.id
        ? "bg-slate-700/80 border-slate-500 ring-1 ring-slate-400/40"
        : "bg-slate-800/60 border-slate-700/60 hover:bg-slate-700/50";

    return (
      <button
        key={idx.id}
        onClick={() => onSelectIndex(selectedIndex === idx.id ? null : idx.id)}
        className={`flex flex-col items-start px-3 py-1.5 rounded-lg border transition cursor-pointer flex-shrink-0 ${bg}`}
        title={`${idx.label} · ${idx.exchange}`}
      >
        <span className="text-[10px] text-slate-400 leading-tight font-medium whitespace-nowrap">
          {idx.label}
          <span className="ml-1 text-slate-600 text-[9px]">{idx.exchange}</span>
        </span>
        <div className="flex items-baseline gap-1.5 mt-0.5">
          <span className="text-[13px] font-bold text-slate-100 tabular-nums leading-none">
            {fmt(idx.price)}
          </span>
          {idx.changePct != null && (
            <span className={`text-[11px] font-semibold tabular-nums leading-none ${color}`}>
              {fmtChg(idx.changePct)}%
            </span>
          )}
        </div>
        {idx.change != null && (
          <span className={`text-[10px] tabular-nums leading-tight ${color}`}>
            {fmtChg(idx.change)}
          </span>
        )}
      </button>
    );
  };

  if (!indices.length) return null;

  return (
    <div className="bg-slate-850 border-b border-slate-700/60 bg-slate-900/80">
      <div className="max-w-5xl mx-auto px-3 py-2 flex items-center gap-2 overflow-x-auto scrollbar-hide">
        {/* Primary: Nifty 50 + Sensex always visible */}
        {primary.map((idx) => renderTile(idx))}

        {/* Divider */}
        {secondary.length > 0 && (
          <div className="w-px h-8 bg-slate-700 flex-shrink-0 mx-1" />
        )}

        {/* Secondary indices as compact pills */}
        {secondary.map((idx) => renderTile(idx))}

        {/* Live indicator */}
        <div className="ml-auto flex items-center gap-1 flex-shrink-0 pl-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-[10px] text-slate-500 whitespace-nowrap">Live</span>
        </div>
      </div>
    </div>
  );
}
