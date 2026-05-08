import React from "react";
import usePWAInstall from "../hooks/usePWAInstall";

export default function Header({ onRefresh, loading, lastUpdated, onHome, onDownload }) {
  const { canInstall, isInstalled, isInstalling, install } = usePWAInstall();

  return (
    <header className="bg-slate-800/80 backdrop-blur border-b border-slate-700">
      <div className="max-w-5xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between gap-2">
        <button onClick={onHome} className="text-left hover:opacity-80 transition min-w-0 flex-shrink">
          <h1 className="text-base sm:text-xl font-bold text-emerald-400 leading-tight truncate">
            📈 <span className="sm:inline">Smart Money</span><span className="hidden sm:inline"> Screener</span>
          </h1>
          <p className="text-[10px] sm:text-xs text-slate-400 hidden sm:block">Institutional activity detector — NSE & MCX</p>
        </button>

        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          {lastUpdated && (
            <span className="text-xs text-slate-500 hidden lg:block">
              Updated: {lastUpdated}
            </span>
          )}

          {/* PWA install — icon only on mobile */}
          {canInstall && (
            <button
              onClick={install}
              disabled={isInstalling}
              title={isInstalling ? "Installing…" : "Install as app"}
              className="flex items-center gap-1.5 px-2 sm:px-3 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg text-xs font-medium transition"
            >
              <span>📲</span>
              <span className="hidden sm:inline">{isInstalling ? "Installing…" : "Install App"}</span>
            </button>
          )}
          {isInstalled && (
            <span className="text-xs text-emerald-400 hidden sm:block">✓ Installed</span>
          )}

          {/* Download — icon only on small screens */}
          <button
            onClick={onDownload}
            title="Get the desktop app"
            className="flex items-center gap-1.5 px-2 sm:px-3 py-2 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-lg text-xs font-medium text-slate-200 transition"
          >
            <span>⬇</span>
            <span className="hidden sm:inline">Download</span>
          </button>

          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-xs sm:text-sm font-medium transition"
            >
              <span className={loading ? "animate-spin inline-block" : "inline-block"}>⟳</span>
              <span className="hidden sm:inline">{loading ? "Scanning..." : "Refresh"}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
