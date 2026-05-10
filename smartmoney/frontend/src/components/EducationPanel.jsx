import React from "react";

const CONTENT = {
  home: {
    title: "Section Guide",
    basis: "Dashboard orientation and education flow",
    source: "All module data summaries",
    use: "Start with Stocks, validate with F&O, then use ETF/Commodity/MF for context.",
  },
  stocks: {
    title: "Stocks Signal Basis",
    basis: "Activity Score from bulk/block deal intensity plus intraday volume spike vs average.",
    source: "NSE bulk/block archives, NSE quotes, Yahoo fallback when needed.",
    use: "Shows top 25 unusual activity stocks for screening, not buy/sell advice.",
  },
  options: {
    title: "F&O Signal Basis",
    basis: "Weighted ranking from OI notional, OI change, and traded volume with symbol diversification.",
    source: "NSE live option chain and bhavcopy fallback.",
    use: "Use as positioning and sentiment context. Confirm with spot action.",
  },
  commodity: {
    title: "Commodity Basis",
    basis: "Global commodity spot/futures references including metals, energy, and agri contracts.",
    source: "Exchange-linked commodity market references and pricing snapshots.",
    use: "Use for macro context and correlation checks with equity/ETF positions.",
  },
  mutualfunds: {
    title: "Mutual Funds Basis",
    basis: "NAV snapshots and historical return views (including 1Y).",
    source: "NSE/BSE policy-mode mapping and category classification.",
    use: "Use for comparison and education. Past return is not future guarantee.",
  },
  search: {
    title: "Search Basis",
    basis: "Single-stock smart activity score from deal intensity and live volume pressure.",
    source: "NSE bulk/block archives, NSE quotes, Yahoo fallback for volume baselines.",
    use: "Search any NSE symbol to inspect score breakdown and interest highlights instantly.",
  },
};

const GLOSSARY = [
  { term: "PCR", meaning: "Put/Call Ratio. Compares put OI to call OI." },
  { term: "OI", meaning: "Open Interest. Number of open derivative contracts." },
  { term: "Volume Spike", meaning: "Current volume much higher than normal average." },
  { term: "Range Width", meaning: "Difference between intraday high and intraday low." },
  { term: "ETF", meaning: "Exchange Traded Fund. Basket traded like a stock." },
];

export default function EducationPanel({ page, stockFilter, inline = false }) {
  const key = CONTENT[page] ? page : "home";
  const data = CONTENT[key];
  const showEtfNote = page === "stocks" && stockFilter === "ETF";

  const inner = (
      <div className="rounded-xl border border-sky-500/30 bg-sky-900/20 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <p className="text-sky-300 text-sm font-semibold">🎓 {data.title}</p>
          <span className="text-[11px] px-2 py-1 rounded-full border border-slate-600 text-slate-300 bg-slate-900/60">
            Educational view
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <div className="rounded-lg border border-slate-700 bg-slate-800/70 p-2">
            <p className="text-[11px] text-slate-400 mb-1">Basis</p>
            <p className="text-xs text-slate-200">{data.basis}</p>
          </div>
          <div className="rounded-lg border border-slate-700 bg-slate-800/70 p-2">
            <p className="text-[11px] text-slate-400 mb-1">Data Source</p>
            <p className="text-xs text-slate-200">{data.source}</p>
          </div>
          <div className="rounded-lg border border-slate-700 bg-slate-800/70 p-2">
            <p className="text-[11px] text-slate-400 mb-1">How to Use</p>
            <p className="text-xs text-slate-200">{data.use}</p>
          </div>
        </div>

        {showEtfNote && (
          <p className="text-xs text-teal-300 mt-2">
            ETF note: No intraday activity score is shown for ETFs. Use Rating and Gold/Silver Score chips.
          </p>
        )}

        <div className="mt-3 flex flex-wrap gap-2">
          {GLOSSARY.map((item) => (
            <span
              key={item.term}
              title={item.meaning}
              className="text-[11px] px-2 py-1 rounded-full border border-slate-600 text-slate-300 bg-slate-900/60"
            >
              {item.term}
            </span>
          ))}
        </div>
      </div>
  );

  if (inline) return inner;
  return <div className="max-w-5xl mx-auto px-4 pt-4">{inner}</div>;
}
