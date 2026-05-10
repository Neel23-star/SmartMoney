import React from "react";

const CATEGORIES = [
  {
    id: "stocks",
    icon: "📈",
    label: "Stocks",
    desc: "NSE stocks, participation trends and smart activity",
    color: "from-emerald-600 to-emerald-800",
    border: "border-emerald-500/40",
    hover: "hover:border-emerald-400",
  },
  {
    id: "mutualfunds",
    icon: "🏦",
    label: "Mutual Funds",
    desc: "Top-performing funds and category-wise snapshots",
    color: "from-blue-600 to-blue-800",
    border: "border-blue-500/40",
    hover: "hover:border-blue-400",
  },
  {
    id: "etf",
    icon: "📦",
    label: "ETF",
    desc: "Top 50 ETFs across index, bank, pharma, gold, silver and more",
    color: "from-teal-600 to-teal-800",
    border: "border-teal-500/40",
    hover: "hover:border-teal-400",
  },
  {
    id: "options",
    icon: "🎯",
    label: "F&O",
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
    id: "bonds",
    icon: "🧾",
    label: "Bonds",
    desc: "Government and corporate bond insights",
    color: "from-slate-600 to-slate-800",
    border: "border-slate-500/40",
    hover: "hover:border-slate-400",
    comingSoon: true,
  },
];

export default function HomePage({ onSelect }) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      {/* Hero */}
      <div className="text-center mb-10">
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">
          Where is <span className="text-emerald-400">Smart Money</span> flowing?
        </h2>
        <p className="text-slate-400 text-base sm:text-lg">
          Track institutional activity across all asset classes — live, free, transparent.
        </p>
      </div>

      {/* Why this site is useful */}
      <div className="mb-10 rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/40 to-slate-900/70 p-5 sm:p-6">
        <h3 className="text-lg sm:text-xl font-semibold text-emerald-300 mb-4">
          Why people use Smart Money Screener
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-xl border border-slate-700 bg-slate-800/70 p-3">
            <p className="text-sm text-white font-medium mb-1">Faster decisions</p>
            <p className="text-xs text-slate-400">Signals, options activity, and market context in one dashboard.</p>
          </div>
          <div className="rounded-xl border border-slate-700 bg-slate-800/70 p-3">
            <p className="text-sm text-white font-medium mb-1">India-first focus</p>
            <p className="text-xs text-slate-400">Designed around NSE/BSE behavior instead of generic global feeds.</p>
          </div>
          <div className="rounded-xl border border-slate-700 bg-slate-800/70 p-3">
            <p className="text-sm text-white font-medium mb-1">Transparent tracking</p>
            <p className="text-xs text-slate-400">Official source links and live status checks improve trust.</p>
          </div>
        </div>
      </div>

      {/* Category Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => !cat.comingSoon && onSelect(cat.id)}
            disabled={cat.comingSoon}
            className={`group relative overflow-hidden rounded-2xl border ${cat.border} ${cat.hover} bg-slate-800/80 p-6 text-left transition-all duration-200 ${cat.comingSoon ? "opacity-70 cursor-not-allowed" : "hover:scale-[1.02] hover:shadow-xl"}`}
          >
            {/* Gradient accent */}
            <div className={`absolute inset-0 bg-gradient-to-br ${cat.color} opacity-10 group-hover:opacity-20 transition-opacity`} />

            <div className="relative">
              <div className="text-4xl mb-3">{cat.icon}</div>
              <h3 className="text-xl font-bold text-white mb-1">{cat.label}</h3>
              <p className="text-sm text-slate-400">{cat.desc}</p>
              <div className="mt-4 text-xs font-medium text-slate-500 group-hover:text-white transition">
                {cat.comingSoon ? "Coming soon" : "View signals →"}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Footer note */}
      <p className="text-center text-xs text-slate-600 mt-8">
        Data source policy: NSE and BSE only. Updated on Refresh.
      </p>
    </div>
  );
}
