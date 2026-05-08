const express = require("express");
const cors = require("cors");
const axios = require("axios");
const cron = require("node-cron");
const fs = require("fs");
const path = require("path");

// ── Frontend static files path ────────────────────────────────────────────────
const DIST_DIR = path.join(__dirname, "..", "frontend", "dist");

const app = express();
app.use(cors());
app.use(express.json());

// ── Simple JSON file storage (no native modules needed) ───────────────────────
const DB_FILE = path.join(__dirname, "signals.json");
const OPTIONS_FILE = path.join(__dirname, "options.json");

function readSignals() {
  try {
    if (fs.existsSync(DB_FILE)) {
      return JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
    }
  } catch {}
  return [];
}

function writeSignals(signals) {
  fs.writeFileSync(DB_FILE, JSON.stringify(signals, null, 2));
}

function readOptions() {
  try {
    if (fs.existsSync(OPTIONS_FILE)) {
      return JSON.parse(fs.readFileSync(OPTIONS_FILE, "utf8"));
    }
  } catch {}
  return [];
}

function writeOptions(options) {
  fs.writeFileSync(OPTIONS_FILE, JSON.stringify(options, null, 2));
}

// ── NSE Headers ───────────────────────────────────────────────────────────────
const NSE_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
  "Accept-Language": "en-US,en;q=0.9",
  "Referer": "https://www.nseindia.com/",
  "Accept": "application/json",
};

// ── Fetch NSE cookie first ────────────────────────────────────────────────────
async function getNSECookies() {
  try {
    const res = await axios.get("https://www.nseindia.com", {
      headers: NSE_HEADERS,
      timeout: 10000,
    });
    const cookies = res.headers["set-cookie"];
    return cookies ? cookies.map((c) => c.split(";")[0]).join("; ") : "";
  } catch {
    return "";
  }
}

// ── Fetch Bulk Deals ──────────────────────────────────────────────────────────
async function fetchBulkDeals(cookie) {
  try {
    const res = await axios.get("https://www.nseindia.com/api/bulk-deals", {
      headers: { ...NSE_HEADERS, Cookie: cookie },
      timeout: 10000,
    });
    const deals = res.data?.data || [];
    return deals.map((d) => ({
      symbol: d.symbol || d.scripName || "",
      qty: parseInt(d.quantityTraded || d.qty || 0),
      price: parseFloat(d.tradePrice || d.price || 0),
      dealType: "BULK Deal",
      sourceUrl: "https://www.nseindia.com/market-data/bulk-deal-archives",
    }));
  } catch (e) {
    console.log("Bulk deals fetch failed:", e.message);
    return [];
  }
}

// ── Fetch Block Deals ─────────────────────────────────────────────────────────
async function fetchBlockDeals(cookie) {
  try {
    const res = await axios.get("https://www.nseindia.com/api/block-deals", {
      headers: { ...NSE_HEADERS, Cookie: cookie },
      timeout: 10000,
    });
    const deals = res.data?.data || [];
    return deals.map((d) => ({
      symbol: d.symbol || d.scripName || "",
      qty: parseInt(d.quantityTraded || d.qty || 0),
      price: parseFloat(d.tradePrice || d.price || 0),
      dealType: "BLOCK Deal",
      sourceUrl: "https://www.nseindia.com/market-data/block-deal-archives",
    }));
  } catch (e) {
    console.log("Block deals fetch failed:", e.message);
    return [];
  }
}

// ── Nifty 50 symbols for volume check ────────────────────────────────────────
const NIFTY50 = [
  "RELIANCE","TCS","HDFCBANK","INFY","ICICIBANK","HINDUNILVR","ITC",
  "SBIN","BAJFINANCE","BHARTIARTL","KOTAKBANK","LT","AXISBANK",
  "ASIANPAINT","MARUTI","TITAN","SUNPHARMA","WIPRO","HCLTECH","NTPC",
  "TATAMOTORS","ADANIENT","ONGC","JSWSTEEL","TATASTEEL","COALINDIA",
  "DRREDDY","CIPLA","DIVISLAB","APOLLOHOSP","HINDALCO","INDUSINDBK",
];

// ── Sector & theme mappings ───────────────────────────────────────────────────
const SECTOR_MAP = {
  // PSU Banks
  "SBIN":       ["PSU Banks","Nifty50","Nifty100"],
  "BANKBARODA": ["PSU Banks","Nifty100"],
  "PNB":        ["PSU Banks","Nifty100"],
  "CANBK":      ["PSU Banks","Nifty100"],
  "UNIONBANK":  ["PSU Banks","Nifty100"],
  "INDIANB":    ["PSU Banks","Nifty100"],

  // Private Banks
  "HDFCBANK":   ["Private Banks","Nifty50","Nifty100"],
  "ICICIBANK":  ["Private Banks","Nifty50","Nifty100"],
  "KOTAKBANK":  ["Private Banks","Nifty50","Nifty100"],
  "AXISBANK":   ["Private Banks","Nifty50","Nifty100"],
  "INDUSINDBK": ["Private Banks","Nifty50","Nifty100"],
  "BANDHANBNK": ["Private Banks","Nifty100"],
  "FEDERALBNK": ["Private Banks","Nifty100"],
  "IDFCFIRSTB": ["Private Banks","Nifty100"],

  // Petroleum & Energy
  "RELIANCE":   ["Petroleum","Nifty50","Nifty100","Evergreen","Dividend"],
  "ONGC":       ["Petroleum","Nifty50","Nifty100","PSU","Dividend"],
  "BPCL":       ["Petroleum","Nifty50","Nifty100","PSU","Dividend"],
  "IOC":        ["Petroleum","Nifty100","PSU","Dividend"],
  "HINDPETRO":  ["Petroleum","Nifty100","PSU"],
  "GAIL":       ["Petroleum","Nifty100","PSU","Dividend"],
  "PETRONET":   ["Petroleum","Nifty100","Dividend"],
  "OIL":        ["Petroleum","Nifty100","PSU"],

  // IT
  "TCS":        ["IT","Nifty50","Nifty100","Evergreen","Dividend"],
  "INFY":       ["IT","Nifty50","Nifty100","Evergreen","Dividend"],
  "WIPRO":      ["IT","Nifty50","Nifty100"],
  "HCLTECH":    ["IT","Nifty50","Nifty100","Dividend"],
  "TECHM":      ["IT","Nifty50","Nifty100"],
  "LTIM":       ["IT","Nifty100"],
  "MPHASIS":    ["IT","Nifty100"],

  // Pharma
  "SUNPHARMA":  ["Pharma","Nifty50","Nifty100","Evergreen"],
  "DRREDDY":    ["Pharma","Nifty50","Nifty100"],
  "CIPLA":      ["Pharma","Nifty50","Nifty100"],
  "DIVISLAB":   ["Pharma","Nifty50","Nifty100"],
  "APOLLOHOSP": ["Pharma","Nifty50","Nifty100"],
  "LUPIN":      ["Pharma","Nifty100"],
  "AUROPHARMA": ["Pharma","Nifty100"],

  // Auto
  "MARUTI":     ["Auto","Nifty50","Nifty100","Evergreen"],
  "TATAMOTORS": ["Auto","Nifty50","Nifty100"],
  "BAJAJ-AUTO": ["Auto","Nifty50","Nifty100","Dividend"],
  "HEROMOTOCO": ["Auto","Nifty50","Nifty100","Dividend"],
  "EICHERMOT":  ["Auto","Nifty50","Nifty100"],
  "M&M":        ["Auto","Nifty50","Nifty100"],
  "TVSMOTOR":   ["Auto","Nifty100"],

  // Evergreen / Blue chip
  "HINDUNILVR": ["FMCG","Nifty50","Nifty100","Evergreen","Dividend"],
  "ITC":        ["FMCG","Nifty50","Nifty100","Dividend"],
  "NESTLEIND":  ["FMCG","Nifty50","Nifty100","Evergreen"],
  "BRITANNIA":  ["FMCG","Nifty100","Dividend"],
  "TATACONSUM": ["FMCG","Nifty50","Nifty100"],
  "ASIANPAINT": ["Paint","Nifty50","Nifty100","Evergreen"],
  "TITAN":      ["Consumer","Nifty50","Nifty100","Evergreen"],
  "LT":         ["Infra","Nifty50","Nifty100","Evergreen"],
  "BAJFINANCE": ["NBFC","Nifty50","Nifty100","Evergreen"],

  // Metal & Mining
  "JSWSTEEL":   ["Metal","Nifty50","Nifty100"],
  "TATASTEEL":  ["Metal","Nifty50","Nifty100"],
  "HINDALCO":   ["Metal","Nifty50","Nifty100"],
  "COALINDIA":  ["Metal","Nifty50","Nifty100","PSU","Dividend"],
  "ADANIENT":   ["Infra","Nifty50","Nifty100"],
  "ADANIPORTS": ["Infra","Nifty50","Nifty100"],

  // Power & PSU
  "NTPC":       ["Power","Nifty50","Nifty100","PSU","Dividend"],
  "POWERGRID":  ["Power","Nifty100","PSU","Dividend"],

  // Dividend picks
  "BHARTIARTL": ["Telecom","Nifty50","Nifty100"],
};

function getSectors(symbol) {
  return SECTOR_MAP[symbol] || ["Other"];
}

// F&O active stocks to scan for options OI
const FNO_SYMBOLS = [
  "NIFTY","BANKNIFTY","RELIANCE","TCS","HDFCBANK","INFY","ICICIBANK",
  "SBIN","BAJFINANCE","BHARTIARTL","AXISBANK","LT","KOTAKBANK",
  "TATAMOTORS","WIPRO","HCLTECH","SUNPHARMA","TATASTEEL","JSWSTEEL","ONGC",
];

// ── Fetch Options Chain from NSE ──────────────────────────────────────────────
async function fetchOptionsOI(symbol, cookie) {
  try {
    const isIndex = ["NIFTY", "BANKNIFTY", "FINNIFTY"].includes(symbol);
    const url = isIndex
      ? `https://www.nseindia.com/api/option-chain-indices?symbol=${symbol}`
      : `https://www.nseindia.com/api/option-chain-equities?symbol=${symbol}`;

    const res = await axios.get(url, {
      headers: { ...NSE_HEADERS, Cookie: cookie },
      timeout: 10000,
    });

    const records = res.data?.records?.data || [];
    if (records.length === 0) return null;

    // Aggregate OI across all strikes for CE and PE
    let totalCallOI = 0, totalPutOI = 0;
    let topCallStrike = null, topCallOI = 0;
    let topPutStrike = null, topPutOI = 0;
    let totalCallOIChange = 0, totalPutOIChange = 0;

    for (const rec of records) {
      if (rec.CE) {
        totalCallOI += rec.CE.openInterest || 0;
        totalCallOIChange += rec.CE.changeinOpenInterest || 0;
        if ((rec.CE.openInterest || 0) > topCallOI) {
          topCallOI = rec.CE.openInterest;
          topCallStrike = rec.strikePrice;
        }
      }
      if (rec.PE) {
        totalPutOI += rec.PE.openInterest || 0;
        totalPutOIChange += rec.PE.changeinOpenInterest || 0;
        if ((rec.PE.openInterest || 0) > topPutOI) {
          topPutOI = rec.PE.openInterest;
          topPutStrike = rec.strikePrice;
        }
      }
    }

    // PCR = Put/Call ratio. > 1.2 = bullish, < 0.8 = bearish
    const pcr = totalCallOI > 0 ? Math.round((totalPutOI / totalCallOI) * 100) / 100 : null;
    // Net OI change: positive put change = support building (bullish)
    const sentiment = pcr >= 1.2 ? "Bullish" : pcr <= 0.8 ? "Bearish" : "Neutral";

    return {
      symbol,
      asset_type: "FnO",
      totalCallOI,
      totalPutOI,
      topCallStrike,
      topPutStrike,
      pcr,
      sentiment,
      callOIChange: totalCallOIChange,
      putOIChange: totalPutOIChange,
      source_url: isIndex
        ? `https://www.nseindia.com/market-data/option-chain`
        : `https://www.nseindia.com/get-quotes/derivatives?symbol=${symbol}`,
    };
  } catch (e) {
    // Silently skip — NSE may block outside market hours
    return null;
  }
}

// ── Convert options data to signals ──────────────────────────────────────────
function optionsToSignals(optData) {
  const signals = {};
  for (const o of optData) {
    if (!o) continue;
    const sym = o.symbol;
    const reasons = [];
    let score = 0;

    // PCR-based signal
    if (o.pcr >= 1.5) { reasons.push(`🐂 PCR ${o.pcr} — Strong Bullish (heavy Put writing)`); score += 20; }
    else if (o.pcr >= 1.2) { reasons.push(`📈 PCR ${o.pcr} — Bullish bias`); score += 10; }
    else if (o.pcr <= 0.6) { reasons.push(`🐻 PCR ${o.pcr} — Strong Bearish (heavy Call writing)`); score += 15; }
    else if (o.pcr <= 0.8) { reasons.push(`📉 PCR ${o.pcr} — Bearish bias`); score += 8; }
    else { reasons.push(`⚖️ PCR ${o.pcr} — Neutral`); score += 3; }

    // OI buildup signal
    if (o.putOIChange > 0 && o.putOIChange > o.callOIChange) {
      reasons.push(`Put OI building — support at ₹${o.topPutStrike}`);
      score += 5;
    } else if (o.callOIChange > 0 && o.callOIChange > o.putOIChange) {
      reasons.push(`Call OI building — resistance at ₹${o.topCallStrike}`);
      score += 5;
    }

    signals[sym] = {
      symbol: sym,
      asset_type: "FnO",
      score: Math.round(score * 10) / 10,
      reasons,
      price: null,
      volume_spike: null,
      deal_qty: 0,
      deal_value: 0,
      source_url: o.source_url,
      pcr: o.pcr,
      sentiment: o.sentiment,
      topCallStrike: o.topCallStrike,
      topPutStrike: o.topPutStrike,
    };
  }
  return signals;
}

// ── Fetch volume data from Yahoo Finance (live intraday) ─────────────────────
async function fetchVolumeData(symbol) {
  try {
    // Get today's 5-min candles for live volume
    const todayUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}.NS?interval=5m&range=1d`;
    // Get yesterday's daily close for comparison baseline
    const histUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}.NS?interval=1d&range=10d`;

    const [todayRes, histRes] = await Promise.all([
      axios.get(todayUrl, { timeout: 8000 }),
      axios.get(histUrl, { timeout: 8000 }),
    ]);

    // Today's live volume = sum of all 5-min candles so far
    const todayResult = todayRes.data?.chart?.result?.[0];
    const todayVolumes = todayResult?.indicators?.quote?.[0]?.volume || [];
    const todayClose = todayResult?.meta?.regularMarketPrice || 0;
    const todayVol = todayVolumes.filter(Boolean).reduce((a, b) => a + b, 0);

    // Historical average daily volume (last 9 completed days)
    const histResult = histRes.data?.chart?.result?.[0];
    const histVolumes = histResult?.indicators?.quote?.[0]?.volume || [];
    const histValid = histVolumes.filter(Boolean);
    // Remove today's partial candle from history if present
    const avgVol = histValid.slice(0, -1).reduce((a, b) => a + b, 0) / Math.max(histValid.length - 1, 1);

    if (!avgVol || avgVol === 0 || !todayVol) return null;
    const ratio = todayVol / avgVol;

    return {
      symbol,
      price: Math.round(todayClose * 100) / 100,
      volumeRatio: Math.round(ratio * 100) / 100,
      todayVol,
      avgVol: Math.round(avgVol),
      sourceUrl: `https://finance.yahoo.com/quote/${symbol}.NS`,
      isLive: true,
    };
  } catch {
    return null;
  }
}

// ── Plain English explanation generator ──────────────────────────────────────
function generateExplanation(signal) {
  const parts = [];
  const vol = signal.volume_spike;
  const hasBulk = signal.signal_reason?.includes("BULK");
  const hasBlock = signal.signal_reason?.includes("BLOCK");
  const score = signal.score;

  if (hasBlock) parts.push(`Big institution made a block deal (₹10Cr+ trade)`);
  if (hasBulk) parts.push(`Bulk deal reported — large entity bought/sold`);

  if (vol >= 3.0) parts.push(`Volume is ${vol}x normal — unusually heavy buying activity`);
  else if (vol >= 2.0) parts.push(`Volume is ${vol}x normal — strong interest today`);
  else if (vol >= 1.3) parts.push(`Volume is ${vol}x above average — above normal activity`);
  else if (vol) parts.push(`Volume is ${vol}x average — being tracked`);

  if (score >= 40) parts.push(`🔥 Very high conviction signal`);
  else if (score >= 20) parts.push(`⭐ Medium-high conviction signal`);
  else parts.push(`📊 Early stage signal — watch closely`);

  return parts.join(". ") + ".";
}

// ── Build & rank signals ──────────────────────────────────────────────────────
async function buildSignals() {
  console.log("🔍 Fetching smart money signals...");

  const cookie = await getNSECookies();
  const [bulk, block] = await Promise.all([
    fetchBulkDeals(cookie),
    fetchBlockDeals(cookie),
  ]);

  // Fetch all volume data (no threshold — rank by ratio)
  const volResults = await Promise.all(NIFTY50.map((sym) => fetchVolumeData(sym)));
  const volData = volResults.filter(Boolean);

  // Fetch options OI for F&O symbols (sequentially to avoid NSE rate limit)
  const optionsRaw = [];
  for (const sym of FNO_SYMBOLS) {
    const data = await fetchOptionsOI(sym, cookie);
    if (data) optionsRaw.push(data);
    await new Promise((r) => setTimeout(r, 300)); // 300ms delay between requests
  }
  const optSignals = optionsToSignals(optionsRaw);
  // Save options separately
  writeOptions(Object.values(optSignals).sort((a, b) => b.score - a.score).slice(0, 20));

  console.log(`📊 Volume: ${volData.length} stocks | Bulk: ${bulk.length} | Block: ${block.length} | Options: ${optionsRaw.length}`);

  const signals = {};

  // Process deals
  for (const deal of [...bulk, ...block]) {
    const sym = deal.symbol?.toUpperCase();
    if (!sym) continue;
    if (!signals[sym]) {
      signals[sym] = {
        symbol: sym, asset_type: "Stock", score: 0,
        reasons: [], price: deal.price, volume_spike: null,
        deal_qty: 0, deal_value: 0,
        source_url: deal.sourceUrl,
      };
    }
    const val = deal.qty * deal.price;
    signals[sym].deal_qty += deal.qty;
    signals[sym].deal_value += val;
    if (!signals[sym].reasons.includes(deal.dealType)) {
      signals[sym].reasons.push(deal.dealType);
    }
    signals[sym].score += Math.min(val / 1e7, 50);
  }

  // Process all volume data — rank by ratio, highlight spikes
  for (const v of volData) {
    const sym = v.symbol.toUpperCase();
    if (!signals[sym]) {
      signals[sym] = {
        symbol: sym, asset_type: "Stock", score: 0,
        reasons: [], price: v.price, volume_spike: null,
        deal_qty: 0, deal_value: 0,
        source_url: v.sourceUrl,
      };
    }
    signals[sym].volume_spike = v.volumeRatio;
    signals[sym].price = signals[sym].price || v.price;

    if (v.volumeRatio >= 2.0) {
      signals[sym].reasons.push(`🔥 Live Vol ${v.volumeRatio}x avg`);
      signals[sym].score += Math.min((v.volumeRatio - 1) * 10, 50);
    } else if (v.volumeRatio >= 1.3) {
      signals[sym].reasons.push(`📈 Live Vol ${v.volumeRatio}x avg`);
      signals[sym].score += (v.volumeRatio - 1) * 5;
    } else {
      signals[sym].reasons.push(`Live Vol ${v.volumeRatio}x avg`);
      signals[sym].score += v.volumeRatio * 2;
    }
  }

  // Sort and take top 15, tag with sectors
  const ranked = Object.values(signals)
    .map((s) => {
      const signal = {
        ...s,
        signal_reason: s.reasons.join(" | ") || "Tracking",
        score: Math.round(s.score * 10) / 10,
        sectors: getSectors(s.symbol),
      };
      signal.explanation = generateExplanation(signal);
      return signal;
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 15);

  writeSignals(ranked);
  console.log(`✅ Saved ${ranked.length} signals`);
  return ranked;
}

// ── Fetch Top Gainers & Losers ────────────────────────────────────────────────
const ALL_SYMBOLS = [...new Set([...NIFTY50,
  "BANKBARODA","PNB","CANBK","UNIONBANK","INDIANB","BANDHANBNK","FEDERALBNK","IDFCFIRSTB",
  "BPCL","IOC","HINDPETRO","GAIL","PETRONET","OIL",
  "TECHM","LTIM","MPHASIS","LUPIN","AUROPHARMA",
  "BAJAJ-AUTO","HEROMOTOCO","EICHERMOT","M&M","TVSMOTOR",
  "NESTLEIND","BRITANNIA","TATACONSUM","ADANIPORTS","POWERGRID",
])];

async function fetchGainersLosers() {
  const results = [];
  // Fetch in batches to avoid rate limits
  const batch = ALL_SYMBOLS.slice(0, 40);
  await Promise.all(batch.map(async (sym) => {
    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${sym}.NS?interval=1d&range=2d`;
      const res = await axios.get(url, { timeout: 6000 });
      const result = res.data?.chart?.result?.[0];
      if (!result) return;
      const closes = result.indicators?.quote?.[0]?.close || [];
      const meta = result.meta || {};
      const prev = closes[closes.length - 2];
      const curr = closes[closes.length - 1] || meta.regularMarketPrice;
      if (!prev || !curr) return;
      const change = ((curr - prev) / prev) * 100;
      results.push({
        symbol: sym,
        price: Math.round(curr * 100) / 100,
        change: Math.round(change * 100) / 100,
        sectors: getSectors(sym),
        source_url: `https://finance.yahoo.com/quote/${sym}.NS`,
      });
    } catch {}
  }));
  results.sort((a, b) => b.change - a.change);
  return {
    gainers: results.filter(r => r.change > 0).slice(0, 10),
    losers: results.filter(r => r.change < 0).reverse().slice(0, 10),
  };
}


// ── API Routes ────────────────────────────────────────────────────────────────
app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.get("/api/signals", async (req, res) => {
  try {
    if (req.query.refresh === "true") {
      const signals = await buildSignals();
      return res.json({ signals, count: signals.length });
    }
    let signals = readSignals();
    if (signals.length === 0) {
      signals = await buildSignals();
    }
    res.json({ signals, count: signals.length });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/signals/:symbol", (req, res) => {
  const signals = readSignals();
  const row = signals.find((s) => s.symbol === req.params.symbol.toUpperCase());
  if (!row) return res.status(404).json({ error: "Signal not found" });
  res.json(row);
});

// ── Gainers & Losers endpoint ─────────────────────────────────────────────────
const GL_CACHE = { data: null, fetchedAt: 0 };
app.get("/api/gainers", async (req, res) => {
  try {
    const refresh = req.query.refresh === "true";
    if (!refresh && GL_CACHE.data && Date.now() - GL_CACHE.fetchedAt < 10 * 60 * 1000) {
      return res.json(GL_CACHE.data);
    }
    const data = await fetchGainersLosers();
    GL_CACHE.data = data;
    GL_CACHE.fetchedAt = Date.now();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Options endpoint ──────────────────────────────────────────────────────────
app.get("/api/options", async (req, res) => {
  try {
    let options = readOptions();
    if (req.query.refresh === "true" || options.length === 0) {
      const cookie = await getNSECookies();
      const optionsRaw = [];
      for (const sym of FNO_SYMBOLS) {
        const data = await fetchOptionsOI(sym, cookie);
        if (data) optionsRaw.push(data);
        await new Promise((r) => setTimeout(r, 300));
      }
      options = Object.values(optionsToSignals(optionsRaw))
        .sort((a, b) => b.score - a.score)
        .slice(0, 20);
      writeOptions(options);
    }
    res.json({ options, count: options.length });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// ── News / Market ticker ──────────────────────────────────────────────────────
const NEWS_CACHE = { items: [], fetchedAt: 0 };

async function fetchMarketNews() {
  // Cache for 15 minutes
  if (Date.now() - NEWS_CACHE.fetchedAt < 15 * 60 * 1000 && NEWS_CACHE.items.length > 0) {
    return NEWS_CACHE.items;
  }
  try {
    // ET Markets RSS feed — no API key needed
    const res = await axios.get(
      "https://economictimes.indiatimes.com/markets/rss.cms",
      { timeout: 8000, headers: { "User-Agent": "Mozilla/5.0" } }
    );
    const xml = res.data;
    const titles = [...xml.matchAll(/<title><!\[CDATA\[(.+?)\]\]><\/title>/g)]
      .map((m) => m[1].trim())
      .filter((t) => !t.includes("Economic Times")) // remove feed title
      .slice(0, 10);
    if (titles.length > 0) {
      NEWS_CACHE.items = titles;
      NEWS_CACHE.fetchedAt = Date.now();
      return titles;
    }
  } catch (e) {
    console.log("News fetch failed:", e.message);
  }
  // Fallback static market context
  return [
    "📊 NSE bulk & block deal data updated after 3:30 PM daily",
    "🏦 RBI Monetary Policy — next meeting scheduled",
    "📈 FII/DII activity tracked live on NSE website",
    "⚡ Smart Money Screener — showing live institutional signals",
    "🔔 Volume spikes often precede big price moves by 1–3 days",
    "💡 Tip: High delivery % + volume spike = strong buying signal",
  ];
}

app.get("/api/news", async (req, res) => {
  try {
    const news = await fetchMarketNews();
    res.json({ news });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Commodity prices from Yahoo Finance ──────────────────────────────────────
const COMMODITY_SYMBOLS = [
  { symbol: "GC=F",  name: "Gold",        icon: "🥇", unit: "USD/oz", exchange: "COMEX", optionProxy: "GLD", optionProxyName: "SPDR Gold Shares" },
  { symbol: "SI=F",  name: "Silver",      icon: "🥈", unit: "USD/oz", exchange: "COMEX", optionProxy: "SLV", optionProxyName: "iShares Silver Trust" },
  { symbol: "CL=F",  name: "Crude Oil",   icon: "🛢️", unit: "USD/bbl", exchange: "NYMEX", optionProxy: "USO", optionProxyName: "United States Oil Fund" },
  { symbol: "NG=F",  name: "Natural Gas", icon: "🔥", unit: "USD/MMBtu", exchange: "NYMEX", optionProxy: "UNG", optionProxyName: "United States Natural Gas Fund" },
  { symbol: "HG=F",  name: "Copper",      icon: "🟤", unit: "USD/lb", exchange: "COMEX", optionProxy: "COPX", optionProxyName: "Global X Copper Miners ETF" },
  { symbol: "ALI=F", name: "Aluminium",   icon: "⚙️", unit: "USD/lb", exchange: "LME", optionProxy: "AA", optionProxyName: "Alcoa Corp" },
];

const COMMODITY_CACHE = { data: null, fetchedAt: 0 };
const FX_CACHE = { rate: null, fetchedAt: 0 };

async function getUSDtoINR() {
  // Cache for 15 minutes
  if (FX_CACHE.rate && Date.now() - FX_CACHE.fetchedAt < 15 * 60 * 1000) return FX_CACHE.rate;
  try {
    const url = "https://query1.finance.yahoo.com/v8/finance/chart/USDINR=X?interval=1d&range=1d";
    const res = await axios.get(url, { timeout: 8000, headers: { "User-Agent": "Mozilla/5.0" } });
    const price = res.data?.chart?.result?.[0]?.meta?.regularMarketPrice;
    if (Number.isFinite(price) && price > 50) {
      FX_CACHE.rate = price;
      FX_CACHE.fetchedAt = Date.now();
      return price;
    }
  } catch {}
  return FX_CACHE.rate || 84.0; // fallback to approximate rate
}

function round2(value) {
  return Number.isFinite(value) ? Math.round(value * 100) / 100 : null;
}

function pickAtmContract(contracts, underlyingPrice) {
  if (!Array.isArray(contracts) || contracts.length === 0 || !Number.isFinite(underlyingPrice)) {
    return null;
  }
  return contracts.reduce((best, current) => {
    const bestDiff = Math.abs((best?.strike || 0) - underlyingPrice);
    const currDiff = Math.abs((current?.strike || 0) - underlyingPrice);
    return currDiff < bestDiff ? current : best;
  }, contracts[0]);
}

function formatOptionContract(contract) {
  if (!contract) return null;
  return {
    strike: round2(contract.strike),
    lastPrice: round2(contract.lastPrice),
    bid: round2(contract.bid),
    ask: round2(contract.ask),
    iv: Number.isFinite(contract.impliedVolatility)
      ? Math.round(contract.impliedVolatility * 10000) / 100
      : null,
    openInterest: Number.isFinite(contract.openInterest) ? contract.openInterest : null,
    volume: Number.isFinite(contract.volume) ? contract.volume : null,
  };
}

async function fetchYahooQuotes(symbols) {
  if (!Array.isArray(symbols) || symbols.length === 0) return {};
  try {
    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbols.join(","))}`;
    const res = await axios.get(url, {
      timeout: 8000,
      headers: { "User-Agent": "Mozilla/5.0", Accept: "application/json" },
    });
    const quotes = res.data?.quoteResponse?.result || [];
    return quotes.reduce((acc, q) => {
      if (q?.symbol) acc[q.symbol] = q;
      return acc;
    }, {});
  } catch {
    return {};
  }
}

async function fetchOptionSnapshot(symbol) {
  try {
    const res = await axios.get(`https://query1.finance.yahoo.com/v7/finance/options/${symbol}`, {
      timeout: 9000,
      headers: { "User-Agent": "Mozilla/5.0", Accept: "application/json" },
    });
    const result = res.data?.optionChain?.result?.[0];
    if (!result) return null;

    const optionData = result.options?.[0] || {};
    const calls = optionData.calls || [];
    const puts = optionData.puts || [];
    const underlyingPrice = result.quote?.regularMarketPrice ?? result.quote?.previousClose ?? null;

    const atmCall = pickAtmContract(calls, underlyingPrice);
    const atmPut = pickAtmContract(puts, underlyingPrice);
    const totalCallOI = calls.reduce((sum, c) => sum + (c.openInterest || 0), 0);
    const totalPutOI = puts.reduce((sum, p) => sum + (p.openInterest || 0), 0);
    const pcr = totalCallOI > 0 ? totalPutOI / totalCallOI : null;
    const sentiment = pcr == null ? "N/A" : pcr >= 1.2 ? "Bullish" : pcr <= 0.8 ? "Bearish" : "Neutral";

    return {
      proxySymbol: symbol,
      underlyingPrice: round2(underlyingPrice),
      expiry: optionData.expirationDate
        ? new Date(optionData.expirationDate * 1000).toISOString().slice(0, 10)
        : null,
      totalCallOI,
      totalPutOI,
      pcr: round2(pcr),
      sentiment,
      atmCall: formatOptionContract(atmCall),
      atmPut: formatOptionContract(atmPut),
    };
  } catch {
    return null;
  }
}

async function fetchCommodityChartFallback(symbol) {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=5d`;
    const res = await axios.get(url, {
      timeout: 9000,
      headers: { "User-Agent": "Mozilla/5.0", Accept: "application/json" },
    });
    const result = res.data?.chart?.result?.[0];
    if (!result) return null;

    const meta = result.meta || {};
    const quote = result.indicators?.quote?.[0] || {};
    const closes = (quote.close || []).filter((v) => Number.isFinite(v));
    const highs = (quote.high || []).filter((v) => Number.isFinite(v));
    const lows = (quote.low || []).filter((v) => Number.isFinite(v));
    const volumes = (quote.volume || []).filter((v) => Number.isFinite(v));

    const price = meta.regularMarketPrice ?? closes[closes.length - 1] ?? null;
    const prevClose = meta.chartPreviousClose ?? closes[closes.length - 2] ?? null;

    return {
      price: round2(price),
      prevClose: round2(prevClose),
      dayHigh: round2(meta.regularMarketDayHigh ?? highs[highs.length - 1] ?? null),
      dayLow: round2(meta.regularMarketDayLow ?? lows[lows.length - 1] ?? null),
      volume: Number.isFinite(meta.regularMarketVolume)
        ? meta.regularMarketVolume
        : (volumes.length ? volumes[volumes.length - 1] : null),
      marketState: meta.marketState || "CLOSED",
    };
  } catch {
    return null;
  }
}

async function fetchCommodityPrices() {
  if (Date.now() - COMMODITY_CACHE.fetchedAt < 5 * 60 * 1000 && COMMODITY_CACHE.data) {
    return COMMODITY_CACHE.data;
  }
  const usdToInr = await getUSDtoINR();
  const toINR = (usd) => (Number.isFinite(usd) ? Math.round(usd * usdToInr) : null);

  const futureSymbols = COMMODITY_SYMBOLS.map((c) => c.symbol);
  const optionProxySymbols = [...new Set(COMMODITY_SYMBOLS.map((c) => c.optionProxy))];

  const [futureQuotes, proxyQuotes, optionSnapshotsRaw] = await Promise.all([
    fetchYahooQuotes(futureSymbols),
    fetchYahooQuotes(optionProxySymbols),
    Promise.all(optionProxySymbols.map((sym) => fetchOptionSnapshot(sym))),
  ]);

  const quoteFallbackRaw = await Promise.all(
    futureSymbols.map((sym) => fetchCommodityChartFallback(sym))
  );
  const quoteFallback = futureSymbols.reduce((acc, sym, idx) => {
    acc[sym] = quoteFallbackRaw[idx];
    return acc;
  }, {});

  const optionSnapshots = optionProxySymbols.reduce((acc, sym, idx) => {
    acc[sym] = optionSnapshotsRaw[idx];
    return acc;
  }, {});

  const results = COMMODITY_SYMBOLS.map((c) => {
    const quote = futureQuotes[c.symbol] || {};
    const proxyQuote = proxyQuotes[c.optionProxy] || {};
    const fallback = quoteFallback[c.symbol] || {};
    const prevClose = quote.regularMarketPreviousClose ?? quote.previousClose ?? fallback.prevClose ?? null;
    const price = quote.regularMarketPrice ?? quote.postMarketPrice ?? fallback.price ?? null;
    const changePct = quote.regularMarketChangePercent
      ?? (Number.isFinite(price) && Number.isFinite(prevClose) && prevClose !== 0
        ? ((price - prevClose) / prevClose) * 100
        : null);

    const priceUSD = price;
    const dayHighUSD = quote.regularMarketDayHigh ?? fallback.dayHigh ?? null;
    const dayLowUSD  = quote.regularMarketDayLow  ?? fallback.dayLow  ?? null;

    // ATM option strikes/prices converted to INR
    const optSnap = optionSnapshots[c.optionProxy] || {};
    const convertOptionContract = (contract) => {
      if (!contract) return null;
      return {
        ...contract,
        strike: toINR(contract.strike),
        lastPrice: toINR(contract.lastPrice),
        bid: toINR(contract.bid),
        ask: toINR(contract.ask),
      };
    };

    return {
      ...c,
      currency: "INR",
      usdToInr: round2(usdToInr),
      price: toINR(priceUSD),
      priceUSD: round2(priceUSD),
      prevClose: toINR(prevClose),
      change: round2(changePct),          // % change stays the same
      marketState: quote.marketState || fallback.marketState || "CLOSED",
      futures: {
        contract: c.symbol,
        exchange: quote.fullExchangeName || c.exchange,
        dayHigh: toINR(dayHighUSD),
        dayLow: toINR(dayLowUSD),
        volume: Number.isFinite(quote.regularMarketVolume)
          ? quote.regularMarketVolume
          : (Number.isFinite(fallback.volume) ? fallback.volume : null),
        openInterest: Number.isFinite(quote.openInterest) ? quote.openInterest : null,
      },
      options: {
        ...optSnap,
        proxySymbol: c.optionProxy,
        proxyName: c.optionProxyName,
        proxyPrice: toINR(proxyQuote.regularMarketPrice),
        proxyChange: round2(proxyQuote.regularMarketChangePercent),
        atmCall: convertOptionContract(optSnap.atmCall),
        atmPut:  convertOptionContract(optSnap.atmPut),
      },
    };
  });

  COMMODITY_CACHE.data = results;
  COMMODITY_CACHE.fetchedAt = Date.now();
  return results;
}

app.get("/api/commodity", async (req, res) => {
  try {
    const refresh = req.query.refresh === "true";
    if (refresh) COMMODITY_CACHE.fetchedAt = 0;
    const data = await fetchCommodityPrices();
    const rate = await getUSDtoINR();
    res.json({ commodities: data, usdToInr: rate, generatedAt: new Date().toISOString() });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Mutual Funds NAV from AMFI API ────────────────────────────────────────────
const TOP_FUNDS = [
  { schemeCode: "119551", name: "Mirae Asset Large Cap Fund", category: "Large Cap", amc: "Mirae Asset" },
  { schemeCode: "122639", name: "Parag Parikh Flexi Cap Fund", category: "Flexi Cap", amc: "PPFAS" },
  { schemeCode: "120503", name: "Axis Bluechip Fund", category: "Large Cap", amc: "Axis MF" },
  { schemeCode: "125497", name: "SBI Small Cap Fund", category: "Small Cap", amc: "SBI MF" },
  { schemeCode: "118989", name: "HDFC Mid-Cap Opportunities", category: "Mid Cap", amc: "HDFC MF" },
  { schemeCode: "131652", name: "Kotak Emerging Equity Fund", category: "Mid Cap", amc: "Kotak MF" },
  { schemeCode: "118825", name: "ICICI Pru Balanced Advantage", category: "Balanced Advantage", amc: "ICICI Prudential" },
  { schemeCode: "120465", name: "Nippon India Small Cap Fund", category: "Small Cap", amc: "Nippon India" },
];

const MF_CACHE = { data: null, fetchedAt: 0 };

async function fetchMutualFundsNAV() {
  if (Date.now() - MF_CACHE.fetchedAt < 15 * 60 * 1000 && MF_CACHE.data) {
    return MF_CACHE.data;
  }
  const results = await Promise.all(TOP_FUNDS.map(async (fund) => {
    try {
      const res = await axios.get(`https://api.mfapi.in/mf/${fund.schemeCode}`, { timeout: 8000 });
      const data = res.data?.data || [];
      const latest = data[0];
      const prev = data[1];
      const nav = latest ? parseFloat(latest.nav) : null;
      const prevNav = prev ? parseFloat(prev.nav) : null;
      const change = nav && prevNav ? Math.round(((nav - prevNav) / prevNav) * 10000) / 100 : null;
      // 1Y return: approx from ~252 trading days back
      const oneYearEntry = data[250] || data[data.length - 1];
      const nav1Y = oneYearEntry ? parseFloat(oneYearEntry.nav) : null;
      const returns1Y = nav && nav1Y ? Math.round(((nav - nav1Y) / nav1Y) * 10000) / 100 : null;
      return {
        ...fund,
        nav,
        navDate: latest?.date,
        change,
        returns1Y,
        url: `https://www.valueresearchonline.com/funds/selector/?plan=growth`,
      };
    } catch {
      return { ...fund, nav: null, change: null, returns1Y: null };
    }
  }));
  MF_CACHE.data = results;
  MF_CACHE.fetchedAt = Date.now();
  return results;
}

app.get("/api/mutualfunds", async (req, res) => {
  try {
    const refresh = req.query.refresh === "true";
    if (refresh) MF_CACHE.fetchedAt = 0;
    const data = await fetchMutualFundsNAV();
    res.json({ funds: data });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Market status helper ──────────────────────────────────────────────────────
app.get("/api/market-status", (req, res) => {
  const now = new Date();
  // Convert to IST (UTC+5:30)
  const ist = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
  const day = ist.getUTCDay(); // 0=Sun, 6=Sat
  const hours = ist.getUTCHours();
  const minutes = ist.getUTCMinutes();
  const timeMin = hours * 60 + minutes;
  const isWeekday = day >= 1 && day <= 5;
  const isOpen = isWeekday && timeMin >= 555 && timeMin <= 930; // 9:15 AM to 3:30 PM IST
  res.json({ isOpen, istTime: `${String(hours).padStart(2,'0')}:${String(minutes).padStart(2,'0')}`, day });
});

// ── Scheduler: 9:20 AM and 3:35 PM IST on weekdays ───────────────────────────
cron.schedule("20 9 * * 1-5", buildSignals, { timezone: "Asia/Kolkata" });
cron.schedule("35 15 * * 1-5", buildSignals, { timezone: "Asia/Kolkata" });

// ── Serve built React frontend (for Electron / production) ───────────────────
const DIST_DIR = path.join(__dirname, "..", "frontend", "dist");
if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
  // SPA fallback — serve index.html for any non-API route
  app.get(/^\/(?!api).*/, (req, res) => {
    res.sendFile(path.join(DIST_DIR, "index.html"));
  });
}

// ── Serve frontend static files ────────────────────────────────────────────────
if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
  // SPA fallback: serve index.html for non-API routes
  app.get("*", (req, res) => {
    if (!req.path.startsWith("/api")) {
      res.sendFile(path.join(DIST_DIR, "index.html"));
    }
  });
}

// ── Start server ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`\n🚀 Smart Money Screener Backend running at http://localhost:${PORT}`);
  console.log(`📊 API docs: http://localhost:${PORT}/api/health`);
  console.log(`📈 Signals: http://localhost:${PORT}/api/signals\n`);
});
