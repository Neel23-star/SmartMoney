import React, { useState, useEffect, useCallback } from "react";
import { fetchSignals, fetchOptions, fetchGainers, fetchMarketStatus, fetchProviders, fetchAnalyticsSummary, trackVisit, trackHeartbeat, fetchEtfs, fetchIndices } from "./api";
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
import SearchPage from "./components/SearchPage";
import BottomNav from "./components/BottomNav";
import EducationPanel from "./components/EducationPanel";

const TABS = [
  { id: "home",        label: "🏠 Home" },
  { id: "stocks",      label: "📈 Stocks" },
  { id: "options",     label: "🎯 F&O" },
  { id: "etf",         label: "📦 ETF" },
  { id: "commodity",   label: "🥇 Commodity" },
  { id: "mutualfunds", label: "🏦 Mutual Funds" },
  { id: "search",      label: "🔎 Search" },
];

export default function App() {
  const [page, setPage] = useState("home");
  const [optionsLimit, setOptionsLimit] = useState(500);
  const [stockFilter, setStockFilter] = useState("all");
  const [etfIssuerFilter, setEtfIssuerFilter] = useState("All");
  const [etfMetalFilter, setEtfMetalFilter] = useState("All");
  const [signals, setSignals] = useState([]);
  const [etfs, setEtfs] = useState([]);
  const [options, setOptions] = useState([]);
  const [gainers, setGainers] = useState([]);
  const [losers, setLosers] = useState([]);
  const [topCalls, setTopCalls] = useState([]);
  const [topPuts, setTopPuts] = useState([]);
  const [optionsSource, setOptionsSource] = useState(null);
  const [optionsTradeDate, setOptionsTradeDate] = useState(null);
  const [optionsNotes, setOptionsNotes] = useState([]);
  const [optionsRankingBasis, setOptionsRankingBasis] = useState(null);
  const [marketStatus, setMarketStatus] = useState(null);
  const [providersMeta, setProvidersMeta] = useState(null);
  const [securityMode, setSecurityMode] = useState("Open API");
  const [analytics, setAnalytics] = useState(null);
  const [educationMode, setEducationMode] = useState(() => localStorage.getItem("sm_education_mode") !== "off");
  const [indices, setIndices] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const mapEtfRows = useCallback((rows) => (rows || []).map((e) => ({
    symbol: e.symbol,
    displayName: e.name,
    issuer: e.issuer || "NSE",
    category: e.category || "Diversified",
    rating: e.rating || null,
    longTermScore: e.longTermScore || null,
    goldSilverScore: e.goldSilverScore || null,
    asset_type: "ETF",
    score: Math.round(Math.abs(Number(e.change || 0)) * 10),
    price: e.price,
    signal_reason: `${e.name} · ${e.category || "Diversified"} · ${e.issuer || "NSE"}`,
    explanation: `Long-term focused ETF shortlist. Issuer: ${e.issuer || "NSE"}. Price shown is ETF unit price (not physical commodity spot price).`,
    sectors: ["ETF", e.category || "Diversified"],
    source_url: e.source_url,
    dayHigh: null,
    dayLow: null,
    openPrice: null,
    prevClose: null,
    closePrice: e.price,
    week52High: null,
    week52Low: null,
  })), []);

  const loadData = useCallback(async (refresh = false) => {
    if (page === "home" || page === "commodity" || page === "mutualfunds" || page === "search") return;
    setLoading(true);
    setError(null);
    try {
      if (page === "stocks") {
        if (stockFilter === "ETF") {
          const data = await fetchEtfs(refresh);
          setEtfs(mapEtfRows(data.etfs));
        } else {
          const shouldForceLiveRefresh = refresh || Boolean(marketStatus?.isOpen);
          const data = await fetchSignals(shouldForceLiveRefresh);
          setSignals(data.signals || []);
          // Pre-fetch gainers/losers silently
          fetchGainers(shouldForceLiveRefresh).then(d => { setGainers(d.gainers || []); setLosers(d.losers || []); }).catch(() => {});
        }
      } else if (page === "options") {
        const data = await fetchOptions(refresh, optionsLimit);
        setOptions(data.options || []);
        setTopCalls(data.topCalls || []);
        setTopPuts(data.topPuts || []);
        setOptionsSource(data.source || null);
        setOptionsTradeDate(data.tradeDate || null);
        setOptionsNotes(data.notes || []);
        setOptionsRankingBasis(data.rankingBasis || null);
      }
      setLastUpdated(new Date().toLocaleTimeString("en-IN"));
    } catch {
      setError("Could not load data. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  }, [page, optionsLimit, stockFilter, mapEtfRows, marketStatus]);

  useEffect(() => {
    let mounted = true;
    fetchEtfs(false)
      .then((data) => {
        if (!mounted) return;
        setEtfs(mapEtfRows(data.etfs));
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, [mapEtfRows]);

  useEffect(() => {
    if (page === "stocks" && stockFilter === "ETF") {
      loadData(false);
    }
  }, [page, stockFilter, loadData]);

  useEffect(() => {
    if (page !== "stocks" || stockFilter === "ETF" || !marketStatus?.isOpen) return;
    const timer = setInterval(() => {
      loadData(true);
    }, 60000);
    return () => clearInterval(timer);
  }, [page, stockFilter, marketStatus, loadData]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    let mounted = true;
    const pullStatus = async () => {
      try {
        const status = await fetchMarketStatus();
        if (mounted) setMarketStatus(status);
      } catch {
        if (mounted) setMarketStatus(null);
      }
    };
    pullStatus();
    const timer = setInterval(pullStatus, 60000);
    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem("sm_education_mode", educationMode ? "on" : "off");
  }, [educationMode]);

  useEffect(() => {
    let mounted = true;
    const pullIndices = () => {
      fetchIndices()
        .then((d) => { if (mounted) setIndices(d.indices || []); })
        .catch(() => {});
    };
    pullIndices();
    const timer = setInterval(pullIndices, 30000);
    return () => { mounted = false; clearInterval(timer); };
  }, []);

  useEffect(() => {
    const getOrCreateSessionId = () => {
      const key = "sm_session_id";
      const existing = sessionStorage.getItem(key);
      if (existing) return existing;
      const created = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
      sessionStorage.setItem(key, created);
      return created;
    };

    const sessionId = getOrCreateSessionId();
    const startedAt = Date.now();

    const syncSummary = (data) => {
      if (data && typeof data.activeVisitors === "number") setAnalytics(data);
    };

    trackVisit(sessionId).then(syncSummary).catch(() => {});

    const timer = setInterval(() => {
      trackHeartbeat(sessionId).then(syncSummary).catch(() => {});
    }, 60000);

    const summaryTimer = setInterval(() => {
      fetchAnalyticsSummary().then(syncSummary).catch(() => {});
    }, 120000);

    const endSession = () => {
      const durationSec = Math.max(1, Math.round((Date.now() - startedAt) / 1000));
      const payload = JSON.stringify({ sessionId, durationSec });
      if (navigator.sendBeacon) {
        const blob = new Blob([payload], { type: "application/json" });
        navigator.sendBeacon("/api/analytics/session-end", blob);
      }
    };

    window.addEventListener("pagehide", endSession);
    window.addEventListener("beforeunload", endSession);

    return () => {
      clearInterval(timer);
      clearInterval(summaryTimer);
      window.removeEventListener("pagehide", endSession);
      window.removeEventListener("beforeunload", endSession);
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    const pullProviders = async () => {
      try {
        const info = await fetchProviders();
        if (!mounted) return;
        setProvidersMeta(info);
        const protectedMode = info?.security?.corsProtected;
        setSecurityMode(protectedMode ? "Private API" : "Open API");
      } catch {
        if (!mounted) return;
        setProvidersMeta(null);
        setSecurityMode("Open API");
      }
    };
    pullProviders();
    const timer = setInterval(pullProviders, 120000);
    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, []);

  const handleSelect = (id) => {
    setSelected(null);
    if (id === "etf") {
      setStockFilter("ETF");
      setEtfIssuerFilter("All");
      setEtfMetalFilter("All");
      setPage("stocks");
      return;
    }
    if (id === "bonds") {
      return;
    }
    setStockFilter("all");
    setEtfIssuerFilter("All");
    setEtfMetalFilter("All");
    setPage(id);
  };

  const handleEtfIssuerChange = (issuer) => {
    setEtfIssuerFilter(issuer);
    // When user switches company, reset metal theme to avoid accidental over-filtering.
    setEtfMetalFilter("All");
  };

  const etfIssuers = ["All", ...Array.from(new Set(etfs.map((e) => e.issuer).filter(Boolean)))];

  // Filter signals by sector
  const filteredSignals = (() => {
    if (stockFilter === "all") return signals;
    if (stockFilter === "ETF") {
      return etfs.filter((e) => {
        const issuerOk = etfIssuerFilter === "All" || e.issuer === etfIssuerFilter;
        const metalOk = etfMetalFilter === "All"
          || (etfMetalFilter === "Gold" && e.category === "Gold")
          || (etfMetalFilter === "Silver" && e.category === "Silver");
        return issuerOk && metalOk;
      });
    }
    if (stockFilter === "gainers") return gainers.map(g => ({ ...g, signal_reason: `▲ ${g.change}% today`, score: g.change, asset_type: "Stock" }));
    if (stockFilter === "losers") return losers.map(l => ({ ...l, signal_reason: `▼ ${Math.abs(l.change)}% today`, score: Math.abs(l.change), asset_type: "Stock" }));
    return signals.filter(s => s.sectors?.includes(stockFilter));
  })();

  const isGainerLoser = stockFilter === "gainers" || stockFilter === "losers";
  const showRefresh = page === "stocks" || page === "options";
  const displayedItems = page === "options" ? options : filteredSignals;

  return (
    <div className="min-h-screen pb-16 md:pb-0">
      <AlertBanner />
      <Header onRefresh={showRefresh ? () => loadData(true) : null} loading={loading} lastUpdated={showRefresh ? lastUpdated : null} onHome={() => handleSelect("home")} securityMode={securityMode} analytics={analytics} educationMode={educationMode} onToggleEducation={() => setEducationMode((v) => !v)} indices={indices} selectedIndex={selectedIndex} onSelectIndex={setSelectedIndex} marketStatus={marketStatus} />
      <NewsTicker marketStatus={marketStatus} providersMeta={providersMeta} />

      <div className="bg-slate-900 border-b border-slate-800">
        <div className="max-w-5xl mx-auto px-4 py-1.5 text-[11px] text-slate-400">
          Educational information only. This platform does not provide investment advice.
        </div>
      </div>

      {/* Desktop Nav tabs — hidden on mobile (BottomNav used instead) */}
      <div className="bg-slate-800/60 border-b border-slate-700 sticky top-0 z-10 hidden md:block">
        <div className="max-w-5xl mx-auto px-4 flex gap-1 overflow-x-auto py-2 scrollbar-hide">
          {TABS.map((t) => {
            const active = t.id === "etf"
              ? page === "stocks" && stockFilter === "ETF"
              : t.id === "stocks"
                ? page === "stocks" && stockFilter !== "ETF"
                : page === t.id;
            return (
            <button key={t.id} onClick={() => handleSelect(t.id)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-lg text-sm font-medium transition whitespace-nowrap ${
                active ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-white hover:bg-slate-700"
              }`}>
              {t.label}
            </button>
            );
          })}
        </div>
      </div>

      {page === "home" && <HomePage onSelect={handleSelect} educationMode={educationMode} />}
      {educationMode && page !== "home" && <EducationPanel page={page} stockFilter={stockFilter} />}
      {page === "commodity" && <CommodityPage />}
      {page === "mutualfunds" && <MutualFundsPage />}
      {page === "search" && <SearchPage />}

      {/* Mobile bottom navigation */}
      <BottomNav page={page} stockFilter={stockFilter} onSelect={handleSelect} />

      {(page === "stocks" || page === "options") && (
        <main className="max-w-5xl mx-auto px-4 py-6">
          {error && (
            <div className="bg-red-900/40 border border-red-500 rounded-xl p-4 mb-4 text-red-300">⚠️ {error}</div>
          )}

          {page === "stocks" && stockFilter !== "ETF" && (
            <div className="mb-4 rounded-xl border border-sky-500/30 bg-sky-900/20 p-3">
              <p className="text-sm text-sky-200 font-semibold mb-1">Purpose Of This Stocks Section</p>
              <p className="text-xs text-slate-200 leading-relaxed">
                This section highlights the top 25 stocks where unusual participation is visible through bulk/block deal intensity and live volume behavior.
                Use it to quickly spot where smart money activity is concentrated, then validate with price action and risk rules before any decision.
              </p>
            </div>
          )}

          {/* Sector filter pills — only for stocks */}
          {page === "stocks" && (
            <StockFilters active={stockFilter} onChange={setStockFilter} />
          )}

          {page === "stocks" && stockFilter === "ETF" && (
            <div className="mb-4 rounded-xl border border-teal-500/30 bg-teal-900/20 p-3">
              <p className="text-sm text-teal-200 font-medium mb-1">📦 What is an ETF?</p>
              <p className="text-xs text-slate-300">
                ETF (Exchange Traded Fund) is a basket of assets traded like a stock on exchange.
                This list focuses on long-term ETFs, with Nippon India ETFs shown on top priority.
              </p>

              <div className="mt-2 text-[11px] text-slate-300 flex flex-wrap items-center gap-2">
                <span>Active: {etfIssuerFilter} · {etfMetalFilter}</span>
                <span className="text-emerald-300">{filteredSignals.length} ETFs</span>
                {etfMetalFilter !== "All" && (
                  <button
                    onClick={() => setEtfMetalFilter("All")}
                    className="px-2 py-0.5 rounded-md border border-emerald-500/40 text-emerald-200 bg-emerald-900/20"
                  >
                    Show all themes
                  </button>
                )}
              </div>

              <div className="mt-3 hidden md:flex flex-wrap items-center gap-2 text-xs">
                <span className="text-slate-400">Company</span>
                {etfIssuers.map((issuer) => (
                  <button
                    key={`issuer-${issuer}`}
                    onClick={() => handleEtfIssuerChange(issuer)}
                    className={`px-2 py-1 rounded-md border transition ${etfIssuerFilter === issuer ? "bg-teal-600/30 border-teal-400/50 text-teal-200" : "bg-slate-800 border-slate-600 text-slate-300"}`}
                  >
                    {issuer}
                  </button>
                ))}
              </div>

              <div className="mt-2 hidden md:flex flex-wrap items-center gap-2 text-xs">
                <span className="text-slate-400">Theme</span>
                {["All", "Gold", "Silver"].map((theme) => (
                  <button
                    key={`theme-${theme}`}
                    onClick={() => setEtfMetalFilter(theme)}
                    className={`px-2 py-1 rounded-md border transition ${etfMetalFilter === theme ? "bg-amber-600/30 border-amber-400/50 text-amber-200" : "bg-slate-800 border-slate-600 text-slate-300"}`}
                  >
                    {theme}
                  </button>
                ))}
              </div>
            </div>
          )}

          {page === "stocks" && stockFilter === "ETF" && (
            <div className="md:hidden sticky top-0 z-20 -mx-4 px-4 py-2 mb-3 border-y border-slate-700 bg-slate-950/95 backdrop-blur">
              <div className="flex items-center gap-2">
                <select
                  value={etfIssuerFilter}
                  onChange={(e) => handleEtfIssuerChange(e.target.value)}
                  className="flex-1 min-w-0 bg-slate-800 border border-slate-600 rounded-md px-2 py-1.5 text-xs text-slate-200"
                  aria-label="Filter ETF by company"
                >
                  {etfIssuers.map((issuer) => (
                    <option key={`mobile-issuer-${issuer}`} value={issuer}>{issuer}</option>
                  ))}
                </select>

                <select
                  value={etfMetalFilter}
                  onChange={(e) => setEtfMetalFilter(e.target.value)}
                  className="w-28 bg-slate-800 border border-slate-600 rounded-md px-2 py-1.5 text-xs text-slate-200"
                  aria-label="Filter ETF by metal theme"
                >
                  {["All", "Gold", "Silver"].map((theme) => (
                    <option key={`mobile-theme-${theme}`} value={theme}>{theme}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {loading && displayedItems.length === 0 ? (
            <div className="text-center py-20 text-slate-400">
              <div className="text-5xl mb-4 animate-pulse">📡</div>
              <p>Scanning {page === "options" ? "options chain" : "markets"} for smart money moves...</p>
            </div>
          ) : displayedItems.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <div className="text-5xl mb-4">🔍</div>
              <p>{stockFilter !== "all" ? `No signals found for this filter yet. Try refreshing.` : page === "options" ? "Options chain not available right now. Try refresh during market hours." : "No signals yet. Markets may be closed."}</p>
              <button onClick={() => loadData(true)} className="mt-4 px-6 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white transition">Try Refresh</button>
            </div>
          ) : (
            <>
              <p className="text-slate-400 text-sm mb-4">
                🎯 Showing <span className="text-emerald-400 font-semibold">{displayedItems.length}</span>{" "}
                {stockFilter !== "all" ? `signals in ${stockFilter}` : page === "options" ? "F&O signals" : "smart money signals"}
              </p>

              {page === "options" && (
                <div className="mb-4 space-y-2">
                  <div className="flex items-center justify-end gap-2 text-xs text-slate-400">
                    <span>Depth</span>
                    <select
                      value={optionsLimit}
                      onChange={(e) => setOptionsLimit(parseInt(e.target.value, 10))}
                      className="bg-slate-800 border border-slate-600 rounded-md px-2 py-1 text-slate-200"
                    >
                      <option value={100}>Top 100</option>
                      <option value={500}>Top 500</option>
                      <option value={1000}>Top 1000</option>
                    </select>
                  </div>

                  <div className="text-xs rounded-lg border border-slate-700 bg-slate-800/70 p-2 text-slate-300">
                    <span className="font-medium text-emerald-300">Data Source:</span>{" "}
                    {optionsSource === "nse_live_chain"
                      ? "NSE Live"
                      : optionsSource === "nse_bhavcopy"
                        ? "NSE Previous Session"
                        : "Unknown / Cache"}
                    {optionsTradeDate ? ` · Trade Date: ${optionsTradeDate}` : ""}
                  </div>

                  {optionsRankingBasis && (
                    <div className="text-[11px] text-slate-400">
                      {optionsRankingBasis}
                    </div>
                  )}


                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {page === "stocks" && isGainerLoser
                  ? filteredSignals.map((s) => <GainerLoserCard key={s.symbol} stock={s} />)
                  : page === "stocks"
                  ? filteredSignals.map((s) => <SignalCard key={s.symbol} signal={s} onClick={() => setSelected(s)} />)
                  : options.map((o) => <OptionsCard key={o.symbol} option={o} onClick={() => setSelected(o)} />)
                }
              </div>

              {page === "options" && (
                <div className="mt-6 grid grid-cols-1 xl:grid-cols-2 gap-4">
                  <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
                    <h3 className="text-sm font-semibold text-purple-300 mb-3">Top Calls by OI ({topCalls.length})</h3>
                    <div className="max-h-96 overflow-auto scrollbar-hide">
                      <table className="w-full text-xs text-left">
                        <thead className="text-slate-400 border-b border-slate-700 sticky top-0 bg-slate-800">
                          <tr>
                            <th className="py-2 pr-2">Symbol</th>
                            <th className="py-2 pr-2">Strike</th>
                            <th className="py-2 pr-2">OI</th>
                            <th className="py-2 pr-2">Score</th>
                            <th className="py-2">LTP</th>
                          </tr>
                        </thead>
                        <tbody>
                          {topCalls.map((c, i) => (
                            <tr key={`call-${c.symbol}-${c.strike}-${i}`} className="border-b border-slate-700/60">
                              <td className="py-2 pr-2 text-slate-200">{c.symbol}</td>
                              <td className="py-2 pr-2 text-slate-300">₹{Number(c.strike).toLocaleString("en-IN")}</td>
                              <td className="py-2 pr-2 text-emerald-300">{Number(c.openInterest || 0).toLocaleString("en-IN")}</td>
                              <td className="py-2 pr-2 text-purple-300">{Number(c.rankScore || 0).toLocaleString("en-IN")}</td>
                              <td className="py-2 text-slate-300">{c.ltp == null ? "--" : `₹${Number(c.ltp).toLocaleString("en-IN")}`}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
                    <h3 className="text-sm font-semibold text-emerald-300 mb-3">Top Puts by OI ({topPuts.length})</h3>
                    <div className="max-h-96 overflow-auto scrollbar-hide">
                      <table className="w-full text-xs text-left">
                        <thead className="text-slate-400 border-b border-slate-700 sticky top-0 bg-slate-800">
                          <tr>
                            <th className="py-2 pr-2">Symbol</th>
                            <th className="py-2 pr-2">Strike</th>
                            <th className="py-2 pr-2">OI</th>
                            <th className="py-2 pr-2">Score</th>
                            <th className="py-2">LTP</th>
                          </tr>
                        </thead>
                        <tbody>
                          {topPuts.map((p, i) => (
                            <tr key={`put-${p.symbol}-${p.strike}-${i}`} className="border-b border-slate-700/60">
                              <td className="py-2 pr-2 text-slate-200">{p.symbol}</td>
                              <td className="py-2 pr-2 text-slate-300">₹{Number(p.strike).toLocaleString("en-IN")}</td>
                              <td className="py-2 pr-2 text-emerald-300">{Number(p.openInterest || 0).toLocaleString("en-IN")}</td>
                              <td className="py-2 pr-2 text-purple-300">{Number(p.rankScore || 0).toLocaleString("en-IN")}</td>
                              <td className="py-2 text-slate-300">{p.ltp == null ? "--" : `₹${Number(p.ltp).toLocaleString("en-IN")}`}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      )}

      {selected && <SignalDetail signal={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
