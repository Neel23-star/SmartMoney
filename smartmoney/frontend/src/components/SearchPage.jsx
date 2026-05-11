import React, { useMemo, useState } from "react";
import { fetchStockSearch } from "../api";

const QUICK_SYMBOLS = ["RELIANCE", "TCS", "HDFCBANK", "INFY", "ICICIBANK", "SBIN"];

function metricTone(value) {
  if (!Number.isFinite(value)) return "text-slate-300";
  if (value > 0) return "text-emerald-300";
  if (value < 0) return "text-rose-300";
  return "text-slate-300";
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const scoreLabel = useMemo(() => {
    const score = Number(result?.stock?.score || 0);
    if (score >= 40) return "Very High Interest";
    if (score >= 25) return "High Interest";
    if (score >= 12) return "Moderate Interest";
    return "Early Interest";
  }, [result]);

  const runSearch = async (symbolOverride) => {
    const symbol = (symbolOverride || query).trim();
    if (!symbol) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchStockSearch(symbol);
      setResult(data);
      setQuery(symbol.toUpperCase());
    } catch (e) {
      const message = e?.response?.data?.error || "Unable to search this stock right now.";
      setError(message);
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const stock = result?.stock;
  const dividends = Array.isArray(stock?.dividends) ? stock.dividends : [];
  const hasLiveSnapshot = Boolean(
    stock && (
      stock.closePrice != null ||
      stock.openPrice != null ||
      stock.dayHigh != null ||
      stock.dayLow != null ||
      stock.prevClose != null
    )
  );

  return (
    <main className="max-w-5xl mx-auto px-4 py-6">
      <div className="rounded-2xl border border-sky-500/30 bg-sky-900/15 p-4 mb-5">
        <h2 className="text-lg font-semibold text-sky-200 mb-2">🔎 Stock Search</h2>
        <p className="text-xs text-slate-300 mb-3">
          Search any NSE stock symbol to see live context, smart activity score, and interest highlights.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            runSearch();
          }}
          className="flex flex-col sm:flex-row gap-2"
        >
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value.toUpperCase())}
            placeholder="Type symbol (example: RELIANCE, INFY, SBIN)"
            className="flex-1 bg-slate-900/80 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-400"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-sm font-medium"
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </form>

        <div className="mt-3 flex flex-wrap gap-2">
          {QUICK_SYMBOLS.map((sym) => (
            <button
              key={sym}
              onClick={() => runSearch(sym)}
              className="text-xs px-2 py-1 rounded-md border border-slate-600 bg-slate-800 text-slate-200 hover:border-sky-400"
            >
              {sym}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-rose-500/40 bg-rose-900/30 p-3 text-sm text-rose-200">
          ⚠️ {error}
        </div>
      )}

      {stock && (
        <div className="space-y-4">
          {!hasLiveSnapshot && (
            <div className="rounded-xl border border-amber-500/40 bg-amber-900/20 p-3 text-sm text-amber-200">
              Live quote snapshot is temporarily unavailable for this symbol. Signal reasoning is still shown from the latest available market context.
            </div>
          )}

          <div className="rounded-2xl border border-slate-700 bg-slate-800/75 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-xl font-bold text-white">{stock.symbol}</h3>
                <p className="text-xs text-slate-400">
                  {Array.isArray(stock.sectors) && stock.sectors.length ? stock.sectors.join(" • ") : "Sector mapping unavailable"}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400">Smart Activity Score</p>
                <p className="text-2xl font-bold text-emerald-300">{Number(stock.score || 0).toLocaleString("en-IN")}</p>
                <p className="text-xs text-sky-300">{scoreLabel}</p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-2">
                <p className="text-[11px] text-slate-400">Last Price</p>
                <p className="text-slate-100 font-semibold">{stock.closePrice == null ? "--" : `₹${Number(stock.closePrice).toLocaleString("en-IN")}`}</p>
              </div>
              <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-2">
                <p className="text-[11px] text-slate-400">Previous Close</p>
                <p className="text-slate-100 font-semibold">{stock.prevClose == null ? "--" : `₹${Number(stock.prevClose).toLocaleString("en-IN")}`}</p>
              </div>
              <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-2">
                <p className="text-[11px] text-slate-400">Day High / Low</p>
                <p className="text-slate-100 font-semibold">
                  {stock.dayHigh == null || stock.dayLow == null
                    ? "--"
                    : `₹${Number(stock.dayHigh).toLocaleString("en-IN")} / ₹${Number(stock.dayLow).toLocaleString("en-IN")}`}
                </p>
              </div>
              <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-2">
                <p className="text-[11px] text-slate-400">Volume Spike</p>
                <p className={`font-semibold ${metricTone(stock.volume_spike)}`}>
                  {stock.volume_spike == null ? "--" : `${Number(stock.volume_spike).toLocaleString("en-IN")}x`}
                </p>
              </div>
            </div>

            {dividends.length > 0 && (
              <div className="mt-4 rounded-lg border border-cyan-500/30 bg-cyan-900/15 p-3">
                <p className="text-xs text-cyan-200 font-medium mb-2">Dividend Timeline (current year)</p>
                <div className="flex flex-wrap gap-2">
                  {dividends.map((d, idx) => (
                    <span key={`${d.date}-${d.status}-${idx}`} className="text-[11px] px-2 py-1 rounded-full border border-cyan-500/30 text-cyan-100 bg-slate-900/60">
                      {d.status === "upcoming" ? "Upcoming" : "Paid"}: {d.date}
                      {d.amount == null ? "" : ` · ₹${Number(d.amount).toLocaleString("en-IN")}`}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-xl border border-slate-700 bg-slate-800/75 p-4">
              <p className="text-sm font-semibold text-sky-300 mb-2">Score Breakdown</p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Deal Intensity</span>
                  <span className="text-slate-100 font-medium">{Number(stock.scoreBreakdown?.dealScore || 0).toLocaleString("en-IN")}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Volume Pressure</span>
                  <span className="text-slate-100 font-medium">{Number(stock.scoreBreakdown?.volumeScore || 0).toLocaleString("en-IN")}</span>
                </div>
                <div className="flex items-center justify-between border-t border-slate-700 pt-2">
                  <span className="text-slate-200">Total Score</span>
                  <span className="text-emerald-300 font-semibold">{Number(stock.scoreBreakdown?.totalScore || stock.score || 0).toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-700 bg-slate-800/75 p-4">
              <p className="text-sm font-semibold text-amber-300 mb-2">Interest Highlights</p>
              <ul className="space-y-2 text-sm text-slate-200">
                {(stock.interestHighlights || []).map((item, idx) => (
                  <li key={`${item}-${idx}`} className="rounded-lg border border-slate-700 bg-slate-900/55 px-2 py-1.5">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="rounded-xl border border-slate-700 bg-slate-800/75 p-4">
            <p className="text-sm font-semibold text-emerald-300 mb-1">Reasoning</p>
            <p className="text-sm text-slate-200">{stock.signal_reason || "No signal notes available."}</p>
            <p className="text-xs text-slate-400 mt-2">{stock.explanation || "No explanation available."}</p>
          </div>
        </div>
      )}
    </main>
  );
}
