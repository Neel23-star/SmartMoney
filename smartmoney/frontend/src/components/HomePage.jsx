import React from "react";

const CATEGORIES = [
  {
    id: "stocks",
    icon: "📈",
    label: "Stocks",
    desc: "NSE Nifty50 — Bulk deals, volume spikes & institutional buying",
    color: "from-emerald-600 to-emerald-800",
    border: "border-emerald-500/40",
    hover: "hover:border-emerald-400",
  },
  {
    id: "options",
    icon: "🎯",
    label: "Options / F&O",
    desc: "Put-Call Ratio, OI buildup & smart money positioning",
    color: "from-purple-600 to-purple-800",
    border: "border-purple-500/40",
    hover: "hover:border-purple-400",
  },
  {
    id: "commodity",
    icon: "🥇",
    label: "Commodity",
    desc: "MCX Gold, Silver, Crude Oil & Agricultural commodities",
    color: "from-yellow-600 to-yellow-800",
    border: "border-yellow-500/40",
    hover: "hover:border-yellow-400",
  },
  {
    id: "mutualfunds",
    icon: "🏦",
    label: "Mutual Funds",
    desc: "Top performing funds, SIP picks & institutional fund flows",
    color: "from-blue-600 to-blue-800",
    border: "border-blue-500/40",
    hover: "hover:border-blue-400",
  },
];

export default function HomePage({ onSelect }) {
  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* Hero */}
      <div className="text-center mb-10">
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">
          Where is <span className="text-emerald-400">Smart Money</span> flowing?
        </h2>
        <p className="text-slate-400 text-base sm:text-lg">
          Track institutional activity across all asset classes — live, free, transparent.
        </p>
      </div>

      {/* 4 Category Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onSelect(cat.id)}
            className={`group relative overflow-hidden rounded-2xl border ${cat.border} ${cat.hover} bg-slate-800/80 p-6 text-left transition-all duration-200 hover:scale-[1.02] hover:shadow-xl`}
          >
            {/* Gradient accent */}
            <div className={`absolute inset-0 bg-gradient-to-br ${cat.color} opacity-10 group-hover:opacity-20 transition-opacity`} />

            <div className="relative">
              <div className="text-4xl mb-3">{cat.icon}</div>
              <h3 className="text-xl font-bold text-white mb-1">{cat.label}</h3>
              <p className="text-sm text-slate-400">{cat.desc}</p>
              <div className="mt-4 text-xs font-medium text-slate-500 group-hover:text-white transition">
                View signals →
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Footer note */}
      <p className="text-center text-xs text-slate-600 mt-8">
        Data sourced from NSE, MCX & Yahoo Finance. Updated on Refresh.
      </p>
    </div>
  );
}
