import React, { useState, useEffect } from "react";
import { fetchCommodity } from "../api";

function formatValue(value, prefix = "", suffix = "") {
  if (value === null || value === undefined || Number.isNaN(value)) return "--";
  return `${prefix}${Number(value).toLocaleString()}${suffix}`;
}

function formatCompact(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return "--";
  return Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 2 }).format(value);
}

function sentimentColor(sentiment) {
  if (sentiment === "Bullish") return "text-emerald-400";
  if (sentiment === "Bearish") return "text-red-400";
  return "text-amber-300";
}

export default function CommodityPage() {
  const [commodities, setCommodities] = useState([]);
  const [usdToInr, setUsdToInr] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const load = async (refresh = false) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCommodity(refresh);
      setCommodities(data.commodities || []);
      if (data.usdToInr) setUsdToInr(data.usdToInr);
      setLastUpdated(new Date().toLocaleTimeString("en-IN"));
    } catch {
      setError("Could not load commodity data. Backend may be offline.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Header row */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-white">🥇 Commodity Prices</h2>
          {lastUpdated && <p className="text-xs text-slate-500">Updated {lastUpdated}</p>}
        </div>
        <button
          onClick={() => load(true)}
          disabled={loading}
          className="text-xs bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg transition"
        >
          {loading ? "Loading…" : "↺ Refresh"}
        </button>
      </div>

      {error && (
        <div className="bg-red-900/40 border border-red-500 rounded-xl p-4 mb-4 text-red-300 text-sm">⚠️ {error}</div>
      )}

      <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-xl p-3 mb-5 flex items-center justify-between gap-4">
        <p className="text-yellow-300 text-xs">
          📡 Prices in <strong>₹ INR</strong>. Futures quote, day range, volume/OI, and options proxy sentiment.
        </p>
        {usdToInr && (
          <span className="text-xs text-slate-400 flex-shrink-0">1 USD = ₹{usdToInr.toLocaleString()}</span>
        )}
      </div>

      {loading && commodities.length === 0 ? (
        <div className="flex items-center justify-center h-48 text-slate-400">Loading prices…</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {commodities.map((c) => {
            const isUp = c.change > 0;
            const isDown = c.change < 0;
            const proxyUp = c.options?.proxyChange > 0;
            const proxyDown = c.options?.proxyChange < 0;
            return (
              <div
                key={c.symbol}
                className="bg-slate-800 border border-slate-700 hover:border-yellow-500/40 rounded-xl p-4 transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{c.icon}</span>
                    <div>
                      <div className="font-bold text-white">{c.name}</div>
                      <div className="text-xs text-slate-500">{c.futures?.exchange || c.exchange} · {c.unit}</div>
                    </div>
                  </div>
                  <a
                    href={`https://finance.yahoo.com/quote/${c.symbol}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-yellow-300 hover:text-yellow-200"
                  >
                    Futures ↗
                  </a>
                </div>

                <div className="mt-3 flex items-end justify-between gap-2">
                  {c.price ? (
                    <>
                      <div>
                        <div className="text-white font-semibold text-base">{formatValue(c.price, "₹")}</div>
                        {c.priceUSD && <div className="text-xs text-slate-500">${c.priceUSD.toLocaleString()}</div>}
                      </div>
                      {c.change !== null && (
                        <div className={`text-xs font-medium ${isUp ? "text-emerald-400" : isDown ? "text-red-400" : "text-slate-400"}`}>
                          {isUp ? "▲" : isDown ? "▼" : "—"} {Math.abs(c.change)}%
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-xs text-slate-500">Unavailable</div>
                  )}

                  <div className="text-[10px] text-slate-500 uppercase tracking-wider">{c.marketState || "--"}</div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-900/60 rounded-lg p-2 border border-slate-700">
                    <div className="text-slate-400 mb-1">Day Range</div>
                    <div className="text-slate-100">
                      {formatValue(c.futures?.dayLow, "₹")} – {formatValue(c.futures?.dayHigh, "₹")}
                    </div>
                  </div>
                  <div className="bg-slate-900/60 rounded-lg p-2 border border-slate-700">
                    <div className="text-slate-400 mb-1">Futures OI</div>
                    <div className="text-slate-100">{formatCompact(c.futures?.openInterest)}</div>
                  </div>
                  <div className="bg-slate-900/60 rounded-lg p-2 border border-slate-700">
                    <div className="text-slate-400 mb-1">Futures Volume</div>
                    <div className="text-slate-100">{formatCompact(c.futures?.volume)}</div>
                  </div>
                  <div className="bg-slate-900/60 rounded-lg p-2 border border-slate-700">
                    <div className="text-slate-400 mb-1">Options PCR</div>
                    <div className={`font-medium ${sentimentColor(c.options?.sentiment)}`}>
                      {formatValue(c.options?.pcr)} {c.options?.sentiment ? `(${c.options.sentiment})` : ""}
                    </div>
                  </div>
                </div>

                <div className="mt-3 bg-slate-900/60 rounded-lg p-2 border border-slate-700 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-slate-400">Options Proxy</span>
                    <a
                      href={`https://finance.yahoo.com/quote/${c.options?.proxySymbol || ""}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-300 hover:text-blue-200"
                    >
                      {c.options?.proxySymbol || "--"} ↗
                    </a>
                  </div>

                  <div className="text-slate-200 truncate">{c.options?.proxyName || "Unavailable"}</div>

                  <div className="mt-1 text-slate-300">
                    Proxy Px: {formatValue(c.options?.proxyPrice, "₹")} {c.options?.proxyChange != null ? (
                      <span className={proxyUp ? "text-emerald-400" : proxyDown ? "text-red-400" : "text-slate-400"}>
                        ({proxyUp ? "+" : ""}{c.options.proxyChange}%)
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-1 text-slate-400 space-y-0.5">
                    <div>Exp: {c.options?.expiry || "--"}</div>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                      <span>ATM Call ₹{formatValue(c.options?.atmCall?.strike)} @ <span className="text-emerald-400">₹{formatValue(c.options?.atmCall?.lastPrice)}</span></span>
                      <span>ATM Put ₹{formatValue(c.options?.atmPut?.strike)} @ <span className="text-red-400">₹{formatValue(c.options?.atmPut?.lastPrice)}</span></span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
