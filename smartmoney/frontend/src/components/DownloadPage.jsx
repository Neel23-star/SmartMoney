import React from "react";
import usePWAInstall from "../hooks/usePWAInstall";

const STEPS = [
  { step: "1", text: "Install Node.js from nodejs.org (LTS version)" },
  { step: "2", text: 'Open PowerShell and run: Set-Location "C:\\...\\smartmoney"' },
  { step: "3", text: "Run: npm start" },
];

export default function DownloadPage() {
  const { canInstall, isInstalled, isInstalling, install } = usePWAInstall();

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="text-center mb-10">
        <div className="text-5xl mb-4">⬇️</div>
        <h2 className="text-3xl font-bold text-white mb-2">Get the App</h2>
        <p className="text-slate-400 text-sm">
          Use Smart Money Screener offline, as a desktop app, or install directly from your browser.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8">

        {/* PWA Card */}
        <div className="bg-slate-800 border border-blue-500/30 rounded-2xl p-6 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">📲</span>
            <div>
              <h3 className="text-white font-bold text-lg">Install as Web App</h3>
              <p className="text-xs text-slate-400">Works on Android, iOS & Windows Chrome</p>
            </div>
          </div>
          <p className="text-sm text-slate-300">
            Install directly from your browser. No app store needed. Works offline after install.
          </p>
          <ul className="text-xs text-slate-400 space-y-1">
            <li>✓ Works on mobile & desktop</li>
            <li>✓ Installable from Chrome / Edge</li>
            <li>✓ No download required</li>
            <li>✓ Auto-updates with the web version</li>
          </ul>
          {isInstalled ? (
            <div className="mt-auto py-2.5 bg-emerald-600/20 border border-emerald-500/40 rounded-xl text-center text-emerald-400 text-sm font-medium">
              ✓ Already Installed
            </div>
          ) : canInstall ? (
            <button
              onClick={install}
              disabled={isInstalling}
              className="mt-auto py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-xl text-white text-sm font-semibold transition"
            >
              {isInstalling ? "Installing…" : "📲 Install Now"}
            </button>
          ) : (
            <div className="mt-auto py-2.5 bg-slate-700 rounded-xl text-center text-slate-400 text-xs">
              Open in Chrome or Edge to install as app
            </div>
          )}
        </div>

        {/* Desktop App Card */}
        <div className="bg-slate-800 border border-emerald-500/30 rounded-2xl p-6 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🖥️</span>
            <div>
              <h3 className="text-white font-bold text-lg">Windows Desktop App</h3>
              <p className="text-xs text-slate-400">Electron — runs natively on Windows</p>
            </div>
          </div>
          <p className="text-sm text-slate-300">
            Full native desktop experience. Includes the backend — no separate server needed.
          </p>
          <ul className="text-xs text-slate-400 space-y-1">
            <li>✓ Runs without a browser</li>
            <li>✓ Backend bundled inside</li>
            <li>✓ Works offline (cached signals)</li>
            <li>✓ Auto-starts backend on launch</li>
          </ul>
          <div className="mt-auto space-y-2">
            <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-700 font-mono text-xs text-emerald-300 space-y-1">
              {STEPS.map((s) => (
                <div key={s.step} className="flex gap-2">
                  <span className="text-slate-500">{s.step}.</span>
                  <span className="text-slate-300">{s.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Build installer section */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
        <h3 className="text-white font-bold mb-3">📦 Build a Windows Installer (.exe)</h3>
        <p className="text-slate-400 text-sm mb-4">
          Run this once to package the app into a standalone installer for distribution:
        </p>
        <div className="bg-slate-900 rounded-xl p-4 font-mono text-xs space-y-2">
          <div className="text-slate-400"># In PowerShell:</div>
          <div className="text-emerald-300">Set-Location "C:\Users\...\smartmoney"</div>
          <div className="text-emerald-300">npm run build-frontend</div>
          <div className="text-emerald-300">npm run package</div>
          <div className="text-slate-400 mt-2"># Installer will be in: smartmoney\dist\</div>
        </div>
        <p className="text-xs text-slate-500 mt-3">
          Requires Node.js 18+. The installer bundles the backend and serves the UI from within Electron.
        </p>
      </div>
    </div>
  );
}
