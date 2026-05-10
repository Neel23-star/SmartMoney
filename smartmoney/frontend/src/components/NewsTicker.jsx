import React, { useEffect, useState } from "react";
import { fetchNews } from "../api";

export default function NewsTicker({ marketStatus, providersMeta }) {
  const fallbackNews = [
    "📊 Market headlines unavailable right now — retrying shortly",
    "🏦 NSE session status shown above updates every minute",
    "🔄 Use refresh in each section to pull latest available data",
  ];
  const [news, setNews] = useState(fallbackNews);

  const statusLabel = marketStatus?.isHoliday
    ? "Holiday"
    : marketStatus?.isOpen
      ? "Live"
      : "Closed";
  const statusClass = marketStatus?.isHoliday
    ? "text-amber-300 border-amber-400/40 bg-amber-500/10"
    : marketStatus?.isOpen
      ? "text-emerald-300 border-emerald-400/40 bg-emerald-500/10"
      : "text-slate-300 border-slate-500/40 bg-slate-600/20";

  useEffect(() => {
    let mounted = true;

    const loadNews = () => {
      fetchNews()
        .then((r) => {
          if (!mounted) return;
          if (r.news?.length) {
            setNews(r.news);
          } else {
            setNews(fallbackNews);
          }
        })
        .catch(() => {
          if (mounted) setNews(fallbackNews);
        });
    };

    loadNews();
    const timer = setInterval(loadNews, 60000);

    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, []);

  // Duplicate items for seamless infinite scroll
  const items = [...news, ...news];
  const nseOk = providersMeta?.providers?.nse?.ok;
  const bseOk = providersMeta?.providers?.bse?.ok;

  return (
    <div className="bg-slate-900 border-b border-slate-700 overflow-hidden">
      <div className="flex items-center">
        {/* Label */}
        <div className="flex-shrink-0 bg-emerald-600 text-white text-xs font-bold px-3 py-1.5 uppercase tracking-wider">
          📰 Market
        </div>
        <div className={`ml-2 flex-shrink-0 text-[11px] px-2 py-0.5 rounded-full border ${statusClass}`}>
          {statusLabel}
        </div>
        {/* Scrolling text */}
        <div className="overflow-hidden flex-1 py-1.5">
          <div className="ticker-track flex gap-0 whitespace-nowrap">
            {items.map((item, i) => (
              <span key={i} className="text-xs text-slate-300 px-8">
                {item}
                <span className="text-emerald-600 mx-6">◆</span>
              </span>
            ))}
          </div>
        </div>

        <div className="hidden md:flex items-center gap-2 px-2">
          <a
            href="https://www.nseindia.com"
            target="_blank"
            rel="noopener noreferrer"
            className="px-2 py-0.5 rounded-md border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10 transition flex items-center gap-1 text-[11px]"
            title={`NSE provider: ${nseOk ? "reachable" : "not reachable"}`}
          >
            <span className={`inline-block w-1.5 h-1.5 rounded-full ${nseOk ? "bg-emerald-400" : "bg-red-400"}`} />
            NSE India
          </a>
          <a
            href="https://www.bseindia.com"
            target="_blank"
            rel="noopener noreferrer"
            className="px-2 py-0.5 rounded-md border border-blue-500/40 text-blue-300 hover:bg-blue-500/10 transition flex items-center gap-1 text-[11px]"
            title={`BSE provider: ${bseOk ? "reachable" : "not reachable"}`}
          >
            <span className={`inline-block w-1.5 h-1.5 rounded-full ${bseOk ? "bg-emerald-400" : "bg-red-400"}`} />
            BSE India
          </a>
        </div>
      </div>
      <style>{`
        .ticker-track {
          display: inline-flex;
          animation: ticker-scroll 40s linear infinite;
        }
        .ticker-track:hover {
          animation-play-state: paused;
        }
        @keyframes ticker-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
