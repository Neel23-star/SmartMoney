import React, { useState, useEffect, useCallback } from "react";
import { fetchSignals, fetchOptions, fetchGainers } from "./api";
import SignalCard from "./components/SignalCard";
import SignalDetail from "./components/SignalDetail";
import OptionsCard from "./components/OptionsCard";
import GainerLoserCard from "./components/GainerLoserCard";
import StockFilters from "./components/StockFilters";
import Header from "./components/Header";
import NewsTicker from "./components/NewsTicker";
import AlertBanner from "./components/AlertBanner";
import HomePage from "./components/HomePage";
import CommodityPage from "./components/CommodityPage";
import MutualFundsPage from "./components/MutualFundsPage";
import DownloadPage from "./components/DownloadPage";
import BottomNav from "./components/BottomNav";

const TABS = [
  { id: "home",        label: "🏠 Home" },
  { id: "stocks",      label: "📈 Stocks" },
  { id: "options",     label: "🎯 Options" },
  { id: "commodity",   label: "🥇 Commodity" },
  { id: "mutualfunds", label: "🏦 Mutual Funds" },
  { id: "download",    label: "⬇ Get App" },
];

export default function App() {
  const [page, setPage] = useState("home");
  const [stockFilter, setStockFilter] = useState("all");
  const [signals, setSignals] = useState([]);
  const [options, setOptions] = useState([]);
  const [gainers, setGainers] = useState([]);
  const [losers, setLosers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadData = useCallback(async (refresh = false) => {
    if (page === "home" || page === "commodity" || page === "mutualfunds") return;
    setLoading(true);
    setError(null);
    try {
      if (page === "stocks") {
        const data = await fetchSignals(refresh);
        setSignals(data.signals || []);
        // Pre-fetch gainers/losers silently
        fetchGainers(refresh).then(d => { setGainers(d.gainers || []); setLosers(d.losers || []); }).catch(() => {});
      } else if (page === "options") {
        const data = await fetchOptions(refresh);
        setOptions(data.options || []);
      }
      setLastUpdated(new Date().toLocaleTimeString("en-IN"));
    } catch {
      setError("Could not load data. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSelect = (id) => { setSelected(null); setStockFilter("all"); setPage(id); };

  // Filter signals by sector
  const filteredSignals = (() => {
    if (stockFilter === "all") return signals;
    if (stockFilter === "gainers") return gainers.map(g => ({ ...g, signal_reason: `▲ ${g.change}% today`, score: g.change, asset_type: "Stock" }));
    if (stockFilter === "losers") return losers.map(l => ({ ...l, signal_reason: `▼ ${Math.abs(l.change)}% today`, score: Math.abs(l.change), asset_type: "Stock" }));
    return signals.filter(s => s.sectors?.includes(stockFilter));
  })();

  const isGainerLoser = stockFilter === "gainers" || stockFilter === "losers";
  const showRefresh = page === "stocks" || page === "options";

  return (
    <div className="min-h-screen pb-16 md:pb-0">
      <AlertBanner />
      <Header onRefresh={showRefresh ? () => loadData(true) : null} loading={loading} lastUpdated={showRefresh ? lastUpdated : null} onHome={() => handleSelect("home")} onDownload={() => handleSelect("download")} />
      <NewsTicker />

      {/* Desktop Nav tabs — hidden on mobile (BottomNav used instead) */}
      <div className="bg-slate-800/60 border-b border-slate-700 sticky top-0 z-10 hidden md:block">
        <div className="max-w-5xl mx-auto px-4 flex gap-1 overflow-x-auto py-2 scrollbar-hide">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => handleSelect(t.id)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-lg text-sm font-medium transition whitespace-nowrap ${
                page === t.id ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-white hover:bg-slate-700"
              }`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {page === "home" && <HomePage onSelect={handleSelect} />}
      {page === "commodity" && <CommodityPage />}
      {page === "mutualfunds" && <MutualFundsPage />}
      {page === "download" && <DownloadPage />}

      {/* Mobile bottom navigation */}
      <BottomNav page={page} onSelect={handleSelect} />

      {(page === "stocks" || page === "options") && (
        <main className="max-w-5xl mx-auto px-4 py-6">
          {error && (
            <div className="bg-red-900/40 border border-red-500 rounded-xl p-4 mb-4 text-red-300">⚠️ {error}</div>
          )}

          {/* Sector filter pills — only for stocks */}
          {page === "stocks" && (
            <StockFilters active={stockFilter} onChange={setStockFilter} />
          )}

          {loading && filteredSignals.length === 0 ? (
            <div className="text-center py-20 text-slate-400">
              <div className="text-5xl mb-4 animate-pulse">📡</div>
              <p>Scanning {page === "options" ? "options chain" : "markets"} for smart money moves...</p>
            </div>
          ) : filteredSignals.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <div className="text-5xl mb-4">🔍</div>
              <p>{stockFilter !== "all" ? `No signals found for this filter yet. Try refreshing.` : page === "options" ? "NSE options data available during market hours." : "No signals yet. Markets may be closed."}</p>
              <button onClick={() => loadData(true)} className="mt-4 px-6 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white transition">Try Refresh</button>
            </div>
          ) : (
            <>
              <p className="text-slate-400 text-sm mb-4">
                🎯 Showing <span className="text-emerald-400 font-semibold">{filteredSignals.length}</span>{" "}
                {stockFilter !== "all" ? `signals in ${stockFilter}` : page === "options" ? "F&O signals" : "smart money signals"}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {page === "stocks" && isGainerLoser
                  ? filteredSignals.map((s) => <GainerLoserCard key={s.symbol} stock={s} />)
                  : page === "stocks"
                  ? filteredSignals.map((s) => <SignalCard key={s.symbol} signal={s} onClick={() => setSelected(s)} />)
                  : options.map((o) => <OptionsCard key={o.symbol} option={o} onClick={() => setSelected(o)} />)
                }
              </div>
            </>
          )}
        </main>
      )}

      {selected && <SignalDetail signal={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
