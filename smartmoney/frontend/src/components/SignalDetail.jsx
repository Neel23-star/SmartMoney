import React from "react";
import InfoHint from "./InfoHint";

function formatINR(value) {
  if (value == null || Number.isNaN(Number(value))) return "--";
  return `₹${Number(value).toLocaleString("en-IN")}`;
}

export default function SignalDetail({ signal, onClose }) {
  const isFnO = signal.asset_type === "FnO";

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-slate-800 border border-slate-600 rounded-2xl p-6 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-2xl font-bold text-emerald-400">{signal.symbol}</h2>
            <span className="text-sm text-slate-400">{signal.asset_type}</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Plain English explanation */}
        {signal.explanation && (
          <div className="bg-emerald-900/20 border border-emerald-700/30 rounded-xl p-4 mb-4">
            <p className="text-xs text-emerald-400 uppercase tracking-wider mb-1">💡 What this means</p>
            <p className="text-sm text-slate-200">{signal.explanation}</p>
          </div>
        )}

        {/* Signal reason */}
        {signal.signal_reason && (
          <div className="bg-slate-700/50 rounded-xl p-4 mb-4">
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Signal</p>
            <p className="text-white font-medium">{signal.signal_reason}</p>
          </div>
        )}

        {/* Stats grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          {signal.asset_type !== "ETF" && (
            <Stat label="Confidence Score" value={signal.score} highlight />
          )}
          {signal.price && (
            <Stat label="Price" value={`₹${signal.price?.toLocaleString("en-IN")}`} />
          )}
          {signal.volume_spike && (
            <Stat label="Volume Spike" value={`${signal.volume_spike}x average`} />
          )}
          {signal.deal_value > 0 && (
            <Stat
              label="Deal Value"
              value={`₹${(signal.deal_value / 1e7).toFixed(1)} Cr`}
            />
          )}
        </div>

        <div className="bg-slate-700/40 rounded-xl p-4 mb-4">
          <p className="text-xs text-slate-400 uppercase tracking-wider mb-3">{isFnO ? "FnO Snapshot" : "Market Snapshot"}</p>
          {!isFnO && (signal.dayLow != null || signal.dayHigh != null || signal.week52Low != null || signal.week52High != null || signal.openPrice != null || signal.prevClose != null || signal.closePrice != null) ? (
            <div className="space-y-4">
              {(signal.dayLow != null || signal.dayHigh != null) && (
                <RangeLine
                  title="Today's Range"
                  leftLabel="Low"
                  leftValue={signal.dayLow}
                  rightLabel="High"
                  rightValue={signal.dayHigh}
                  markerValue={signal.closePrice}
                />
              )}

              {(signal.week52Low != null || signal.week52High != null) && (
                <RangeLine
                  title="52 Week Range"
                  leftLabel="52W Low"
                  leftValue={signal.week52Low}
                  rightLabel="52W High"
                  rightValue={signal.week52High}
                  markerValue={signal.closePrice}
                />
              )}

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {signal.openPrice != null && (
                  <Stat label="Open" value={formatINR(signal.openPrice)} compact />
                )}
                {signal.prevClose != null && (
                  <Stat label="Prev Close" value={formatINR(signal.prevClose)} compact />
                )}
                {signal.closePrice != null && (
                  <Stat label="LTP" value={formatINR(signal.closePrice)} compact />
                )}
                {signal.dayHigh != null && signal.dayLow != null && (
                  <Stat
                    label="Range Width"
                    value={formatINR(Number(signal.dayHigh) - Number(signal.dayLow))}
                    compact
                    helpText="Difference between today's high and low. Larger width means higher intraday volatility."
                  />
                )}
              </div>
            </div>
          ) : isFnO ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {signal.pcr != null && (
                  <Stat
                    label="PCR"
                    value={Number(signal.pcr).toLocaleString("en-IN")}
                    compact
                    helpText="Put/Call Ratio. Below 1 can indicate call-heavy positioning; above 1 can indicate put-heavy positioning."
                  />
                )}
                {signal.sentiment && (
                  <Stat label="Sentiment" value={signal.sentiment} compact />
                )}
                {signal.underlyingPrice != null && (
                  <Stat label="Underlying" value={formatINR(signal.underlyingPrice)} compact />
                )}
                {signal.expiry && (
                  <Stat label="Expiry" value={signal.expiry} compact />
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {signal.topCallStrike != null && (
                  <Stat
                    label="Top Call Strike"
                    value={formatINR(signal.topCallStrike)}
                    compact
                    helpText="Strike with strongest call open-interest concentration (possible resistance zone)."
                  />
                )}
                {signal.topPutStrike != null && (
                  <Stat
                    label="Top Put Strike"
                    value={formatINR(signal.topPutStrike)}
                    compact
                    helpText="Strike with strongest put open-interest concentration (possible support zone)."
                  />
                )}
                {signal.totalCallOI != null && (
                  <Stat label="Total Call OI" value={Number(signal.totalCallOI).toLocaleString("en-IN")} compact />
                )}
                {signal.totalPutOI != null && (
                  <Stat label="Total Put OI" value={Number(signal.totalPutOI).toLocaleString("en-IN")} compact />
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                {signal.callOIChange != null && (
                  <Stat label="Call OI Change" value={Number(signal.callOIChange).toLocaleString("en-IN")} compact />
                )}
                {signal.putOIChange != null && (
                  <Stat label="Put OI Change" value={Number(signal.putOIChange).toLocaleString("en-IN")} compact />
                )}
              </div>

              {(signal.atmCall || signal.atmPut) && (
                <div className="rounded-lg border border-slate-600/70 bg-slate-800/70 p-3">
                  <p className="text-[11px] uppercase tracking-wider text-slate-400 mb-2 inline-flex items-center">
                    Execution View (ATM)
                    <InfoHint text="ATM metrics use contracts closest to underlying price for quicker execution context." />
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                    <div className="rounded-md border border-slate-700 bg-slate-900/70 p-2">
                      <p className="text-xs text-purple-300 font-medium mb-1">ATM Call</p>
                      <div className="grid grid-cols-2 gap-1 text-xs">
                        <span className="text-slate-400">Strike</span>
                        <span className="text-slate-100 text-right">{formatINR(signal.atmCall?.strike)}</span>
                        <span className="text-slate-400">Premium</span>
                        <span className="text-slate-100 text-right">{formatINR(signal.atmCall?.premium)}</span>
                        <span className="text-slate-400">IV</span>
                        <span className="text-slate-100 text-right">{signal.atmCall?.iv == null ? "--" : `${signal.atmCall.iv}%`}</span>
                        <span className="text-slate-400">OI</span>
                        <span className="text-slate-100 text-right">{signal.atmCall?.openInterest == null ? "--" : Number(signal.atmCall.openInterest).toLocaleString("en-IN")}</span>
                        <span className="text-slate-400">Volume</span>
                        <span className="text-slate-100 text-right">{signal.atmCall?.volume == null ? "--" : Number(signal.atmCall.volume).toLocaleString("en-IN")}</span>
                      </div>
                    </div>

                    <div className="rounded-md border border-slate-700 bg-slate-900/70 p-2">
                      <p className="text-xs text-emerald-300 font-medium mb-1">ATM Put</p>
                      <div className="grid grid-cols-2 gap-1 text-xs">
                        <span className="text-slate-400">Strike</span>
                        <span className="text-slate-100 text-right">{formatINR(signal.atmPut?.strike)}</span>
                        <span className="text-slate-400">Premium</span>
                        <span className="text-slate-100 text-right">{formatINR(signal.atmPut?.premium)}</span>
                        <span className="text-slate-400">IV</span>
                        <span className="text-slate-100 text-right">{signal.atmPut?.iv == null ? "--" : `${signal.atmPut.iv}%`}</span>
                        <span className="text-slate-400">OI</span>
                        <span className="text-slate-100 text-right">{signal.atmPut?.openInterest == null ? "--" : Number(signal.atmPut.openInterest).toLocaleString("en-IN")}</span>
                        <span className="text-slate-400">Volume</span>
                        <span className="text-slate-100 text-right">{signal.atmPut?.volume == null ? "--" : Number(signal.atmPut.volume).toLocaleString("en-IN")}</span>
                      </div>
                    </div>
                  </div>

                  {signal.atmCall?.premium != null && signal.atmPut?.premium != null && (
                    <div className="text-xs text-slate-300">
                      ATM Straddle Premium: <span className="text-amber-300 font-semibold">{formatINR(Number(signal.atmCall.premium) + Number(signal.atmPut.premium))}</span>
                    </div>
                  )}
                </div>
              )}

              {Array.isArray(signal.reasons) && signal.reasons.length > 0 && (
                <div className="rounded-lg border border-slate-600/70 bg-slate-800/70 p-3">
                  <p className="text-[11px] uppercase tracking-wider text-slate-400 mb-2">Positioning Notes</p>
                  <ul className="space-y-1 text-sm text-slate-200">
                    {signal.reasons.slice(0, 3).map((reason, idx) => (
                      <li key={`${reason}-${idx}`}>• {reason}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <p className="text-slate-400 text-sm">No market data available for this asset.</p>
          )}
        </div>

        {/* Last updated */}
        {signal.fetched_at && (
          <p className="text-xs text-slate-500 mb-4">
            Last fetched: {signal.fetched_at}
          </p>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, highlight, compact = false, helpText }) {
  return (
    <div className={`${compact ? "bg-slate-800/80" : "bg-slate-700/40"} rounded-lg p-3`}>
      <p className="text-xs text-slate-400 mb-1 inline-flex items-center">
        {label}
        {helpText && <InfoHint text={helpText} />}
      </p>
      <p className={`font-semibold ${highlight ? "text-emerald-400 text-xl" : compact ? "text-slate-100 text-sm" : "text-white"}`}>
        {value}
      </p>
    </div>
  );
}

function RangeLine({ title, leftLabel, leftValue, rightLabel, rightValue, markerValue }) {
  const low = Number(leftValue);
  const high = Number(rightValue);
  const marker = Number(markerValue);
  let markerPct = null;
  if (Number.isFinite(low) && Number.isFinite(high) && high > low && Number.isFinite(marker)) {
    markerPct = Math.max(0, Math.min(100, ((marker - low) / (high - low)) * 100));
  }

  return (
    <div className="rounded-lg border border-slate-600/60 bg-slate-800/70 p-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[11px] uppercase tracking-wider text-slate-400 inline-flex items-center">
          {title}
          <InfoHint text="Range line shows today's movement between low and high. White marker shows current/last traded price position." />
        </p>
        {Number.isFinite(marker) && <p className="text-[11px] text-emerald-300">Now: {formatINR(marker)}</p>}
      </div>

      <div className="relative h-2 rounded-full bg-slate-600/70 mb-2">
        <div className="absolute inset-y-0 left-0 w-full rounded-full bg-gradient-to-r from-amber-500/70 to-emerald-500/80" />
        {markerPct != null && (
          <div
            className="absolute -top-1 h-4 w-1.5 rounded bg-white shadow"
            style={{ left: `${markerPct}%`, transform: "translateX(-50%)" }}
          />
        )}
      </div>

      <div className="flex items-center justify-between text-xs">
        <div className="text-left">
          <p className="text-slate-400">{leftLabel}</p>
          <p className="text-slate-100 font-semibold">{formatINR(leftValue)}</p>
        </div>
        <div className="text-right">
          <p className="text-slate-400">{rightLabel}</p>
          <p className="text-slate-100 font-semibold">{formatINR(rightValue)}</p>
        </div>
      </div>
    </div>
  );
}
