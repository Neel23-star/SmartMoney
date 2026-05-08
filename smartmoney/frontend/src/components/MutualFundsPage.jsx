import React, { useState, useEffect } from "react";
import { fetchMutualFunds } from "../api";

export default function MutualFundsPage() {
  const [funds, setFunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const load = async (refresh = false) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchMutualFunds(refresh);
      setFunds(data.funds || []);
      setLastUpdated(new Date().toLocaleTimeString("en-IN"));
    } catch {
      setError("Could not load mutual fund data. Backend may be offline.");
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
          <h2 className="text-lg font-bold text-white">🏦 Mutual Funds NAV</h2>
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

      <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-3 mb-5">
        <p className="text-blue-300 text-xs">
          📡 Live NAV data from AMFI India. 1Y returns calculated from historical NAV. Past performance is not indicative of future results.
        </p>
      </div>

      {loading && funds.length === 0 ? (
        <div className="flex items-center justify-center h-48 text-slate-400">Loading NAV data…</div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {funds.map((f, i) => {
            const navUp = f.change > 0;
            const navDown = f.change < 0;
            return (
              <a
                key={i}
                href={`https://www.valueresearchonline.com/funds/selector/?plan=growth`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-blue-500/50 rounded-xl p-4 transition group"
              >
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600/30 flex items-center justify-center text-sm font-bold text-blue-300">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-white group-hover:text-blue-400 transition truncate">{f.name}</div>
                  <div className="text-xs text-slate-500">{f.category} · {f.amc}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  {f.nav ? (
                    <>
                      <div className="text-white font-semibold text-sm">₹{f.nav.toFixed(2)}</div>
                      <div className="flex items-center justify-end gap-2">
                        {f.change !== null && (
                          <span className={`text-xs ${navUp ? "text-emerald-400" : navDown ? "text-red-400" : "text-slate-400"}`}>
                            {navUp ? "▲" : navDown ? "▼" : "—"}{Math.abs(f.change)}%
                          </span>
                        )}
                        {f.returns1Y !== null && (
                          <span className={`text-xs font-medium ${f.returns1Y > 0 ? "text-emerald-400" : "text-red-400"}`}>
                            1Y: {f.returns1Y > 0 ? "+" : ""}{f.returns1Y}%
                          </span>
                        )}
                      </div>
                      {f.navDate && <div className="text-xs text-slate-600">{f.navDate}</div>}
                    </>
                  ) : (
                    <div className="text-xs text-slate-500">Unavailable</div>
                  )}
                </div>
              </a>
            );
          })}
        </div>
      )}

      <p className="text-xs text-slate-600 text-center mt-6">
        NAV data sourced from AMFI India · Past returns are not indicative of future performance
      </p>
    </div>
  );
}

