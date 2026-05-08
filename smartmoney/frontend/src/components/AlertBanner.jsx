import React from "react";

// ── Update this text whenever you want to change the alert ──
const ALERT_TEXT = "🔔 Important: This tool is for educational purposes only. Please consult a SEBI-registered advisor before investing.";
const ALERT_VISIBLE = true; // set false to hide

export default function AlertBanner() {
  if (!ALERT_VISIBLE) return null;
  return (
    <div className="bg-amber-500/10 border-b border-amber-500/30 px-4 py-2 flex items-center gap-3">
      <span className="text-amber-400 text-lg flex-shrink-0">⚠️</span>
      <p className="text-amber-300 text-xs sm:text-sm">{ALERT_TEXT}</p>
    </div>
  );
}
