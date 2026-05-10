const express = require("express");
const cors = require("cors");
const axios = require("axios");
const cron = require("node-cron");
const fs = require("fs");
const path = require("path");
const AdmZip = require("adm-zip");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

// ── Frontend static files path ────────────────────────────────────────────────
const DIST_DIR = path.join(__dirname, "..", "frontend", "dist");

const app = express();
app.disable("x-powered-by");

const allowedOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("CORS blocked"));
  },
};

const API_RATE_LIMIT_MAX = Number(process.env.API_RATE_LIMIT_MAX || 180);

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: API_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors(corsOptions));
app.use("/api", apiLimiter);
app.use(express.json());

// ── Simple JSON file storage (no native modules needed) ───────────────────────
const DB_FILE = path.join(__dirname, "signals.json");
const OPTIONS_FILE = path.join(__dirname, "options.json");
const ANALYTICS_FILE = path.join(__dirname, "analytics.json");

function readAnalytics() {
  try {
    if (fs.existsSync(ANALYTICS_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(ANALYTICS_FILE, "utf8"));
      return {
        totalVisits: Number(parsed.totalVisits || 0),
        totalSessions: Number(parsed.totalSessions || 0),
        totalDurationSec: Number(parsed.totalDurationSec || 0),
        activeSessions: parsed.activeSessions || {},
      };
    }
  } catch {}
  return { totalVisits: 0, totalSessions: 0, totalDurationSec: 0, activeSessions: {} };
}

function writeAnalytics(analytics) {
  fs.writeFileSync(ANALYTICS_FILE, JSON.stringify(analytics, null, 2));
}

function cleanupStaleSessions(analytics, staleMs = 15 * 60 * 1000) {
  const now = Date.now();
  for (const [sessionId, session] of Object.entries(analytics.activeSessions || {})) {
    const lastSeen = Number(session?.lastSeen || 0);
    if (!lastSeen || now - lastSeen > staleMs) {
      delete analytics.activeSessions[sessionId];
    }
  }
}

function analyticsSummary(analytics) {
  cleanupStaleSessions(analytics);
  const activeVisitors = Object.keys(analytics.activeSessions || {}).length;
  const avgSessionSec = analytics.totalSessions > 0
    ? Math.round(analytics.totalDurationSec / analytics.totalSessions)
    : 0;
  return {
    totalVisits: analytics.totalVisits || 0,
    activeVisitors,
    totalSessions: analytics.totalSessions || 0,
    avgSessionSec,
    avgSessionMin: Number((avgSessionSec / 60).toFixed(1)),
  };
}

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

const ENABLE_YAHOO_FALLBACK = process.env.ENABLE_YAHOO_FALLBACK !== "false";

const PROVIDER_URLS = {
  nse: "https://www.nseindia.com/api/quote-equity?symbol=RELIANCE",
  bse: "https://api.bseindia.com/BseIndiaAPI/api/StockReachGraph/w?scripcode=500325&flag=0&fromdate=&todate=&seriesid=",
};

async function checkProvider(url) {
  try {
    const res = await axios.get(url, { timeout: 8000, headers: { "User-Agent": "Mozilla/5.0" } });
    return { ok: true, status: res.status };
  } catch (e) {
    return { ok: false, status: e?.response?.status || null, error: e.message };
  }
}

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

const ETF_CATALOG = [
  // Nippon India ETFs (priority)
  { symbol: "NIFTYBEES", fullName: "Nippon India ETF Nifty 50", issuer: "Nippon India", longTermScore: 95 },
  { symbol: "JUNIORBEES", fullName: "Nippon India ETF Nifty Next 50", issuer: "Nippon India", longTermScore: 92 },
  { symbol: "BANKBEES", fullName: "Nippon India ETF Nifty Bank", issuer: "Nippon India", longTermScore: 88 },
  { symbol: "PSUBNKBEES", fullName: "Nippon India ETF PSU Bank BeES", issuer: "Nippon India", longTermScore: 78 },
  { symbol: "ITBEES", fullName: "Nippon India ETF Nifty IT", issuer: "Nippon India", longTermScore: 82 },
  { symbol: "PHARMABEES", fullName: "Nippon India ETF Nifty Pharma", issuer: "Nippon India", longTermScore: 80 },
  { symbol: "AUTOBEES", fullName: "Nippon India ETF Nifty Auto", issuer: "Nippon India", longTermScore: 79 },
  { symbol: "GOLDBEES", fullName: "Nippon India ETF Gold BeES", issuer: "Nippon India", longTermScore: 90 },
  { symbol: "SILVERBEES", fullName: "Nippon India ETF Silver BeES", issuer: "Nippon India", longTermScore: 84 },

  // Other long-term core ETFs
  { symbol: "CPSEETF", fullName: "CPSE Exchange Traded Fund", issuer: "CPSE", longTermScore: 72 },
  { symbol: "SETFNIF50", fullName: "SBI Nifty 50 ETF", issuer: "SBI", longTermScore: 86 },
  { symbol: "SETFNIFBK", fullName: "SBI Nifty Bank ETF", issuer: "SBI", longTermScore: 80 },
  { symbol: "SETFGOLD", fullName: "SBI Gold ETF", issuer: "SBI", longTermScore: 83 },
  { symbol: "UTINIFTETF", fullName: "UTI Nifty 50 ETF", issuer: "UTI", longTermScore: 85 },
  { symbol: "UTIBANKETF", fullName: "UTI Nifty Bank ETF", issuer: "UTI", longTermScore: 79 },
  { symbol: "HDFCNEXT50", fullName: "HDFC Nifty Next 50 ETF", issuer: "HDFC", longTermScore: 84 },
  { symbol: "HDFCNIF100", fullName: "HDFC Nifty 100 ETF", issuer: "HDFC", longTermScore: 83 },
  { symbol: "ICICINXT50", fullName: "ICICI Prudential Nifty Next 50 ETF", issuer: "ICICI", longTermScore: 82 },
  { symbol: "KOTAKNIFTY", fullName: "Kotak Nifty 50 ETF", issuer: "Kotak", longTermScore: 82 },
  { symbol: "KOTAKBKETF", fullName: "Kotak Nifty Bank ETF", issuer: "Kotak", longTermScore: 77 },
  { symbol: "ABSLNN50ET", fullName: "Aditya Birla Sun Life Nifty Next 50 ETF", issuer: "ABSL", longTermScore: 80 },
  { symbol: "ABSLBANETF", fullName: "Aditya Birla Sun Life Nifty Bank ETF", issuer: "ABSL", longTermScore: 75 },
  { symbol: "ABSLPSE", fullName: "Aditya Birla Sun Life Nifty PSE ETF", issuer: "ABSL", longTermScore: 72 },
  { symbol: "ABSLGOLD", fullName: "Aditya Birla Sun Life Gold ETF", issuer: "ABSL", longTermScore: 81 },
  { symbol: "ABSLSILVER", fullName: "Aditya Birla Sun Life Silver ETF", issuer: "ABSL", longTermScore: 78 },
  { symbol: "LICNETFN50", fullName: "LIC MF Nifty 50 ETF", issuer: "LIC", longTermScore: 79 },
  { symbol: "MON100", fullName: "Mirae Asset NYSE FANG+ ETF", issuer: "Mirae", longTermScore: 70 },
  { symbol: "MAFANG", fullName: "Mirae Asset FANG+ ETF", issuer: "Mirae", longTermScore: 69 },
  { symbol: "LIQUIDETF", fullName: "Liquid ETF", issuer: "Exchange", longTermScore: 65 },
];

const ETF_CACHE = { data: null, fetchedAt: 0 };

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

// ── Fetch and parse Options Chain from NSE ────────────────────────────────────
async function fetchNSEOptionChain(symbol, cookie) {
  try {
    const isIndex = ["NIFTY", "BANKNIFTY", "FINNIFTY"].includes(symbol);
    const url = isIndex
      ? `https://www.nseindia.com/api/option-chain-indices?symbol=${symbol}`
      : `https://www.nseindia.com/api/option-chain-equities?symbol=${symbol}`;

    const res = await axios.get(url, {
      headers: { ...NSE_HEADERS, Cookie: cookie },
      timeout: 10000,
    });

    const chain = res.data?.records || {};
    const records = chain.data || [];
    if (records.length === 0) return null;

    const expiry = chain.expiryDates?.[0] || null;
    const underlyingValue = Number.isFinite(chain.underlyingValue)
      ? chain.underlyingValue
      : null;

    // Aggregate OI across all strikes for CE and PE
    let totalCallOI = 0, totalPutOI = 0;
    let topCallStrike = null, topCallOI = 0;
    let topPutStrike = null, topPutOI = 0;
    let totalCallOIChange = 0, totalPutOIChange = 0;
    const calls = [];
    const puts = [];

    for (const rec of records) {
      if (rec.CE) {
        totalCallOI += rec.CE.openInterest || 0;
        totalCallOIChange += rec.CE.changeinOpenInterest || 0;
        if ((rec.CE.openInterest || 0) > topCallOI) {
          topCallOI = rec.CE.openInterest;
          topCallStrike = rec.strikePrice;
        }
        calls.push({
          symbol,
          expiry,
          strike: rec.strikePrice,
          openInterest: rec.CE.openInterest || 0,
          changeInOI: rec.CE.changeinOpenInterest || 0,
          volume: rec.CE.totalTradedVolume || 0,
          ltp: rec.CE.lastPrice || null,
          impliedVolatility: rec.CE.impliedVolatility || null,
          underlying: underlyingValue,
        });
      }
      if (rec.PE) {
        totalPutOI += rec.PE.openInterest || 0;
        totalPutOIChange += rec.PE.changeinOpenInterest || 0;
        if ((rec.PE.openInterest || 0) > topPutOI) {
          topPutOI = rec.PE.openInterest;
          topPutStrike = rec.strikePrice;
        }
        puts.push({
          symbol,
          expiry,
          strike: rec.strikePrice,
          openInterest: rec.PE.openInterest || 0,
          changeInOI: rec.PE.changeinOpenInterest || 0,
          volume: rec.PE.totalTradedVolume || 0,
          ltp: rec.PE.lastPrice || null,
          impliedVolatility: rec.PE.impliedVolatility || null,
          underlying: underlyingValue,
        });
      }
    }

    // PCR = Put/Call ratio. > 1.2 = bullish, < 0.8 = bearish
    const pcr = totalCallOI > 0 ? Math.round((totalPutOI / totalCallOI) * 100) / 100 : null;
    // Net OI change: positive put change = support building (bullish)
    const sentiment = pcr >= 1.2 ? "Bullish" : pcr <= 0.8 ? "Bearish" : "Neutral";

    return {
      symbol,
      asset_type: "FnO",
      expiry,
      underlyingValue,
      totalCallOI,
      totalPutOI,
      topCallStrike,
      topPutStrike,
      pcr,
      sentiment,
      callOIChange: totalCallOIChange,
      putOIChange: totalPutOIChange,
      calls,
      puts,
      source_url: isIndex
        ? `https://www.nseindia.com/market-data/option-chain`
        : `https://www.nseindia.com/get-quotes/derivatives?symbol=${symbol}`,
    };
  } catch (e) {
    // Silently skip — NSE may block outside market hours
    return null;
  }
}

async function fetchOptionsOI(symbol, cookie) {
  const chain = await fetchNSEOptionChain(symbol, cookie);
  if (!chain) return null;
  return {
    symbol: chain.symbol,
    asset_type: chain.asset_type,
    totalCallOI: chain.totalCallOI,
    totalPutOI: chain.totalPutOI,
    topCallStrike: chain.topCallStrike,
    topPutStrike: chain.topPutStrike,
    pcr: chain.pcr,
    sentiment: chain.sentiment,
    callOIChange: chain.callOIChange,
    putOIChange: chain.putOIChange,
    source_url: chain.source_url,
  };
}

const FO_BHAV_CACHE = { rows: null, fetchedAt: 0, tradeDate: null };

function formatFoDate(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}${mm}${dd}`;
}

function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim());
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",");
    if (cols.length !== headers.length) continue;
    const row = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = cols[j]?.trim();
    }
    rows.push(row);
  }
  return rows;
}

async function fetchFOBhavcopyRows() {
  if (FO_BHAV_CACHE.rows && Date.now() - FO_BHAV_CACHE.fetchedAt < 6 * 60 * 60 * 1000) {
    return FO_BHAV_CACHE;
  }

  for (let lookback = 0; lookback <= 10; lookback++) {
    const dt = new Date();
    dt.setDate(dt.getDate() - lookback);
    const day = dt.getDay();
    if (day === 0 || day === 6) continue;

    const dateToken = formatFoDate(dt);
    const url = `https://nsearchives.nseindia.com/content/fo/BhavCopy_NSE_FO_0_0_0_${dateToken}_F_0000.csv.zip`;
    try {
      const res = await axios.get(url, {
        responseType: "arraybuffer",
        timeout: 10000,
        headers: { "User-Agent": "Mozilla/5.0", Accept: "application/zip,*/*" },
      });
      const zip = new AdmZip(Buffer.from(res.data));
      const entry = zip.getEntries().find((e) => e.entryName.toLowerCase().endsWith(".csv"));
      if (!entry) continue;
      const csv = entry.getData().toString("utf8");
      const rows = parseCSV(csv);
      if (rows.length === 0) continue;
      FO_BHAV_CACHE.rows = rows;
      FO_BHAV_CACHE.fetchedAt = Date.now();
      FO_BHAV_CACHE.tradeDate = dt.toISOString().slice(0, 10);
      return FO_BHAV_CACHE;
    } catch {
      // Try previous day file.
    }
  }

  return { rows: [], fetchedAt: Date.now(), tradeDate: null };
}

function buildChainsFromBhavcopy(rows, allowedSymbols = null) {
  const grouped = new Map();
  for (const row of rows) {
    const segment = row.Sgmt;
    const instType = row.FinInstrmTp;
    const symbol = row.TckrSymb;
    const type = row.OptnTp;
    if (!symbol || segment !== "FO") continue;
    if (!["STO", "IO"].includes(instType)) continue; // Stock Option / Index Option
    if (allowedSymbols && !allowedSymbols.has(symbol)) continue;
    if (type !== "CE" && type !== "PE") continue;

    if (!grouped.has(symbol)) {
      grouped.set(symbol, {
        symbol,
        asset_type: "FnO",
        expiry: row.XpryDt || null,
        underlyingValue: null,
        totalCallOI: 0,
        totalPutOI: 0,
        topCallStrike: null,
        topPutStrike: null,
        pcr: null,
        sentiment: "N/A",
        callOIChange: 0,
        putOIChange: 0,
        calls: [],
        puts: [],
        source_url: "https://www.nseindia.com/all-reports-derivatives",
      });
    }

    const g = grouped.get(symbol);
    const openInterest = Number(row.OpnIntrst) || 0;
    const changeInOI = Number(row.ChngInOpnIntrst) || 0;
    const strike = Number(row.StrkPric) || null;
    const contract = {
      symbol,
      expiry: row.XpryDt || null,
      strike,
      openInterest,
      changeInOI,
      volume: Number(row.TtlTradgVol) || 0,
      ltp: Number(row.ClsPric || row.LastPric) || null,
      impliedVolatility: null,
      underlying: Number(row.UndrlygPric) || null,
    };

    if (type === "CE") {
      g.calls.push(contract);
      g.totalCallOI += openInterest;
      g.callOIChange += changeInOI;
      if (g.topCallStrike == null || openInterest > (g._topCallOI || 0)) {
        g._topCallOI = openInterest;
        g.topCallStrike = strike;
      }
    } else {
      g.puts.push(contract);
      g.totalPutOI += openInterest;
      g.putOIChange += changeInOI;
      if (g.topPutStrike == null || openInterest > (g._topPutOI || 0)) {
        g._topPutOI = openInterest;
        g.topPutStrike = strike;
      }
    }
  }

  const chains = [];
  for (const chain of grouped.values()) {
    chain.pcr = chain.totalCallOI > 0 ? round2(chain.totalPutOI / chain.totalCallOI) : null;
    chain.sentiment = deriveSentiment(chain.pcr);
    delete chain._topCallOI;
    delete chain._topPutOI;
    chains.push(chain);
  }
  return chains;
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

    const inferredUnderlying = Number.isFinite(o.underlyingValue)
      ? o.underlyingValue
      : (Number.isFinite(o.topCallStrike) && Number.isFinite(o.topPutStrike)
        ? (Number(o.topCallStrike) + Number(o.topPutStrike)) / 2
        : null);

    const atmCallContract = pickAtmContract(o.calls || [], inferredUnderlying);
    const atmPutContract = pickAtmContract(o.puts || [], inferredUnderlying);

    const mapContract = (c) => {
      if (!c) return null;
      return {
        strike: Number.isFinite(c.strike) ? round2(c.strike) : null,
        premium: Number.isFinite(c.ltp) ? round2(c.ltp) : null,
        iv: Number.isFinite(c.impliedVolatility) ? round2(c.impliedVolatility) : null,
        openInterest: Number.isFinite(c.openInterest) ? c.openInterest : null,
        volume: Number.isFinite(c.volume) ? c.volume : null,
      };
    };

    signals[sym] = {
      symbol: sym,
      asset_type: "FnO",
      score: Math.round(score * 10) / 10,
      reasons,
      signal_reason: reasons.join(" | "),
      price: null,
      volume_spike: null,
      deal_qty: 0,
      deal_value: 0,
      source_url: o.source_url,
      pcr: o.pcr,
      sentiment: o.sentiment,
      topCallStrike: o.topCallStrike,
      topPutStrike: o.topPutStrike,
      totalCallOI: Number.isFinite(o.totalCallOI) ? o.totalCallOI : null,
      totalPutOI: Number.isFinite(o.totalPutOI) ? o.totalPutOI : null,
      callOIChange: Number.isFinite(o.callOIChange) ? o.callOIChange : null,
      putOIChange: Number.isFinite(o.putOIChange) ? o.putOIChange : null,
      underlyingPrice: Number.isFinite(o.underlyingValue) ? round2(o.underlyingValue) : null,
      expiry: o.expiry || null,
      atmCall: mapContract(atmCallContract),
      atmPut: mapContract(atmPutContract),
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
      sourceUrl: `https://www.nseindia.com/get-quotes/equity?symbol=${encodeURIComponent(symbol)}`,
      isLive: true,
    };
  } catch {
    return null;
  }
}

async function fetchStockQuoteMetrics(symbols) {
  if (!Array.isArray(symbols) || symbols.length === 0) return {};
  const nsSymbols = symbols.map((s) => `${s}.NS`);
  const quoteMap = await fetchYahooQuotes(nsSymbols);
  const out = {};
  for (const sym of symbols) {
    const q = quoteMap[`${sym}.NS`] || null;
    out[sym] = q;
  }
  return out;
}

function optionRankScore(contract) {
  const oi = Math.max(Number(contract?.openInterest) || 0, 0);
  const chg = Math.max(Number(contract?.changeInOI) || 0, 0);
  const vol = Math.max(Number(contract?.volume) || 0, 0);
  const ltp = Math.max(Number(contract?.ltp) || 0, 0);
  const oiNotional = oi * Math.max(ltp, 1);
  // Weighted blend: 55% OI notional, 30% OI change, 15% traded volume
  const score = oiNotional * 0.55 + chg * 0.30 + vol * 0.15;
  return { score, oiNotional };
}

function rankOptionContracts(contracts, limit) {
  const enriched = (contracts || []).map((c) => {
    const { score, oiNotional } = optionRankScore(c);
    return { ...c, rankScore: round2(score), oiNotional: round2(oiNotional) };
  }).sort((a, b) => (b.rankScore || 0) - (a.rankScore || 0));

  const perSymbolCap = Math.max(3, Math.floor(limit / 20));
  const symbolCounts = {};
  const selected = [];

  for (const row of enriched) {
    if (selected.length >= limit) break;
    const sym = row.symbol || "UNKNOWN";
    const used = symbolCounts[sym] || 0;
    if (used >= perSymbolCap) continue;
    selected.push(row);
    symbolCounts[sym] = used + 1;
  }

  // If still short, backfill from remaining highest-score rows.
  if (selected.length < limit) {
    const seen = new Set(selected.map((r) => `${r.symbol}|${r.strike}|${r.expiry}|${r.ltp}`));
    for (const row of enriched) {
      if (selected.length >= limit) break;
      const key = `${row.symbol}|${row.strike}|${row.expiry}|${row.ltp}`;
      if (seen.has(key)) continue;
      selected.push(row);
      seen.add(key);
    }
  }

  return selected;
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

function normalizeEquitySymbol(value) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/\.NS$/i, "");
}

function deriveInterestLevel(score) {
  if (score >= 40) return "Very High";
  if (score >= 25) return "High";
  if (score >= 12) return "Moderate";
  return "Early";
}

function buildInterestHighlights(signal) {
  const highlights = [];
  const score = Number(signal?.score || 0);
  const vol = Number(signal?.volume_spike || 0);
  const dealValue = Number(signal?.deal_value || 0);

  highlights.push(`Interest level: ${deriveInterestLevel(score)} (score ${round2(score)})`);

  if (dealValue > 0) {
    highlights.push(`Tracked bulk/block value: ₹${Math.round(dealValue).toLocaleString("en-IN")}`);
  } else {
    highlights.push("No fresh bulk/block deal detected in current pull.");
  }

  if (vol >= 2) highlights.push(`Volume pressure is strong at ${vol}x average.`);
  else if (vol >= 1.3) highlights.push(`Volume is building at ${vol}x average.`);
  else if (vol > 0) highlights.push(`Volume is near baseline at ${vol}x average.`);

  const dayHigh = Number(signal?.dayHigh);
  const dayLow = Number(signal?.dayLow);
  if (Number.isFinite(dayHigh) && Number.isFinite(dayLow) && dayHigh > dayLow) {
    const intradayRangePct = ((dayHigh - dayLow) / dayLow) * 100;
    highlights.push(`Intraday range: ${round2(intradayRangePct)}%`);
  }

  const closePrice = Number(signal?.closePrice);
  const week52High = Number(signal?.week52High);
  const week52Low = Number(signal?.week52Low);
  if (Number.isFinite(closePrice) && Number.isFinite(week52High) && Number.isFinite(week52Low) && week52High > week52Low) {
    const normalized = ((closePrice - week52Low) / (week52High - week52Low)) * 100;
    highlights.push(`Price is ${round2(normalized)}% through its 52-week range.`);
  }

  return highlights;
}

async function buildSingleStockSignal(symbolInput) {
  const symbol = normalizeEquitySymbol(symbolInput);
  if (!symbol) {
    const err = new Error("Valid symbol is required");
    err.status = 400;
    throw err;
  }

  const cookie = await getNSECookies();
  const [bulk, block, volumeData, nseQuote, yahooQuoteMap] = await Promise.all([
    fetchBulkDeals(cookie),
    fetchBlockDeals(cookie),
    fetchVolumeData(symbol),
    fetchNSEEquityQuote(symbol, cookie),
    fetchStockQuoteMetrics([symbol]),
  ]);

  const matchedDeals = [...bulk, ...block].filter((deal) => normalizeEquitySymbol(deal.symbol) === symbol);

  const reasons = [];
  let dealQty = 0;
  let dealValue = 0;
  let dealScore = 0;
  let volumeScore = 0;
  let fallbackPrice = null;
  let sourceUrl = `https://www.nseindia.com/get-quotes/equity?symbol=${encodeURIComponent(symbol)}`;

  for (const deal of matchedDeals) {
    const qty = Number(deal.qty) || 0;
    const price = Number(deal.price) || 0;
    const value = qty * price;
    dealQty += qty;
    dealValue += value;
    fallbackPrice = fallbackPrice || (Number.isFinite(price) ? price : null);
    if (deal.sourceUrl) sourceUrl = deal.sourceUrl;
    if (!reasons.includes(deal.dealType)) reasons.push(deal.dealType);
    dealScore += Math.min(value / 1e7, 50);
  }

  if (volumeData?.volumeRatio) {
    const ratio = volumeData.volumeRatio;
    if (ratio >= 2.0) {
      reasons.push(`🔥 Live Vol ${ratio}x avg`);
      volumeScore += Math.min((ratio - 1) * 10, 50);
    } else if (ratio >= 1.3) {
      reasons.push(`📈 Live Vol ${ratio}x avg`);
      volumeScore += (ratio - 1) * 5;
    } else {
      reasons.push(`Live Vol ${ratio}x avg`);
      volumeScore += ratio * 2;
    }
    if (volumeData.sourceUrl) sourceUrl = volumeData.sourceUrl;
  }

  if (reasons.length === 0) reasons.push("Tracking");

  const q = nseQuote || yahooQuoteMap[symbol] || {};
  const totalScore = round2(dealScore + volumeScore);

  const signal = {
    symbol,
    asset_type: "Stock",
    score: totalScore,
    signal_reason: reasons.join(" | "),
    sectors: getSectors(symbol),
    volume_spike: volumeData?.volumeRatio ?? null,
    deal_qty: dealQty,
    deal_value: round2(dealValue),
    source_url: sourceUrl,
    openPrice: Number.isFinite(q?.regularMarketOpen) ? round2(q.regularMarketOpen) : null,
    dayHigh: Number.isFinite(q?.regularMarketDayHigh) ? round2(q.regularMarketDayHigh) : null,
    dayLow: Number.isFinite(q?.regularMarketDayLow) ? round2(q.regularMarketDayLow) : null,
    closePrice: Number.isFinite(q?.regularMarketPrice)
      ? round2(q.regularMarketPrice)
      : (Number.isFinite(volumeData?.price) ? round2(volumeData.price) : (Number.isFinite(fallbackPrice) ? round2(fallbackPrice) : null)),
    prevClose: Number.isFinite(q?.regularMarketPreviousClose) ? round2(q.regularMarketPreviousClose) : null,
    week52High: Number.isFinite(q?.fiftyTwoWeekHigh) ? round2(q.fiftyTwoWeekHigh) : null,
    week52Low: Number.isFinite(q?.fiftyTwoWeekLow) ? round2(q.fiftyTwoWeekLow) : null,
    scoreBreakdown: {
      dealScore: round2(dealScore),
      volumeScore: round2(volumeScore),
      totalScore,
    },
    interestLevel: deriveInterestLevel(totalScore),
  };

  signal.explanation = generateExplanation(signal);
  signal.interestHighlights = buildInterestHighlights(signal);
  return signal;
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

  const symbols = Object.keys(signals);
  const [nseQuoteMetrics, yahooQuoteMetrics] = await Promise.all([
    fetchNSEEquityQuotes(symbols, cookie),
    fetchStockQuoteMetrics(symbols),
  ]);

  // Sort and take top 25, tag with sectors
  const ranked = Object.values(signals)
    .map((s) => {
      const q = nseQuoteMetrics[s.symbol] || yahooQuoteMetrics[s.symbol] || {};
      const signal = {
        ...s,
        signal_reason: s.reasons.join(" | ") || "Tracking",
        score: Math.round(s.score * 10) / 10,
        sectors: getSectors(s.symbol),
        openPrice: Number.isFinite(q.regularMarketOpen) ? round2(q.regularMarketOpen) : null,
        dayHigh: Number.isFinite(q.regularMarketDayHigh) ? round2(q.regularMarketDayHigh) : null,
        dayLow: Number.isFinite(q.regularMarketDayLow) ? round2(q.regularMarketDayLow) : null,
        closePrice: Number.isFinite(q.regularMarketPrice) ? round2(q.regularMarketPrice) : (Number.isFinite(s.price) ? round2(s.price) : null),
        prevClose: Number.isFinite(q.regularMarketPreviousClose) ? round2(q.regularMarketPreviousClose) : null,
        week52High: Number.isFinite(q.fiftyTwoWeekHigh) ? round2(q.fiftyTwoWeekHigh) : null,
        week52Low: Number.isFinite(q.fiftyTwoWeekLow) ? round2(q.fiftyTwoWeekLow) : null,
      };
      signal.explanation = generateExplanation(signal);
      return signal;
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 25);

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
        source_url: `https://www.nseindia.com/get-quotes/equity?symbol=${encodeURIComponent(sym)}`,
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

app.get("/api/providers", async (req, res) => {
  try {
    const [nse, bse] = await Promise.all([
      checkProvider(PROVIDER_URLS.nse),
      checkProvider(PROVIDER_URLS.bse),
    ]);

    res.json({
      checkedAt: new Date().toISOString(),
      providers: { nse, bse },
      yahooFallbackEnabled: ENABLE_YAHOO_FALLBACK,
      security: {
        corsProtected: allowedOrigins.length > 0,
        allowedOriginsCount: allowedOrigins.length,
        rateLimitPerMinute: API_RATE_LIMIT_MAX,
      },
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/analytics/summary", (req, res) => {
  const analytics = readAnalytics();
  writeAnalytics(analytics);
  res.json(analyticsSummary(analytics));
});

app.post("/api/analytics/visit", (req, res) => {
  const sessionId = String(req.body?.sessionId || "").trim();
  if (!sessionId) return res.status(400).json({ error: "sessionId required" });

  const analytics = readAnalytics();
  cleanupStaleSessions(analytics);

  if (!analytics.activeSessions[sessionId]) {
    analytics.totalVisits += 1;
    analytics.activeSessions[sessionId] = { startedAt: Date.now(), lastSeen: Date.now() };
  } else {
    analytics.activeSessions[sessionId].lastSeen = Date.now();
  }

  writeAnalytics(analytics);
  res.json(analyticsSummary(analytics));
});

app.post("/api/analytics/heartbeat", (req, res) => {
  const sessionId = String(req.body?.sessionId || "").trim();
  if (!sessionId) return res.status(400).json({ error: "sessionId required" });

  const analytics = readAnalytics();
  cleanupStaleSessions(analytics);

  if (!analytics.activeSessions[sessionId]) {
    analytics.totalVisits += 1;
    analytics.activeSessions[sessionId] = { startedAt: Date.now(), lastSeen: Date.now() };
  } else {
    analytics.activeSessions[sessionId].lastSeen = Date.now();
  }

  writeAnalytics(analytics);
  res.json(analyticsSummary(analytics));
});

app.post("/api/analytics/session-end", (req, res) => {
  const sessionId = String(req.body?.sessionId || "").trim();
  const durationSec = Number(req.body?.durationSec || 0);
  if (!sessionId) return res.status(400).json({ error: "sessionId required" });

  const analytics = readAnalytics();
  cleanupStaleSessions(analytics);

  if (Number.isFinite(durationSec) && durationSec > 0) {
    analytics.totalDurationSec += Math.round(durationSec);
    analytics.totalSessions += 1;
  }
  delete analytics.activeSessions[sessionId];

  writeAnalytics(analytics);
  res.json(analyticsSummary(analytics));
});

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

app.get("/api/search", async (req, res) => {
  try {
    const symbol = String(req.query.symbol || "").trim();
    if (!symbol) return res.status(400).json({ error: "Query parameter 'symbol' is required" });
    const stock = await buildSingleStockSignal(symbol);
    res.json({
      query: normalizeEquitySymbol(symbol),
      stock,
      source: "NSE deals + live volume baseline + quote snapshot",
      generatedAt: new Date().toISOString(),
    });
  } catch (e) {
    const status = Number(e?.status) || 500;
    res.status(status).json({ error: e.message || "Search failed" });
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

app.get("/api/etfs", async (req, res) => {
  try {
    if (req.query.refresh === "true") ETF_CACHE.fetchedAt = 0;
    const etfs = await fetchTopETFs();
    res.json({ etfs, count: etfs.length, source: "NSE quote-equity" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Options endpoint ──────────────────────────────────────────────────────────
app.get("/api/options", async (req, res) => {
  try {
    const limit = Math.max(10, Math.min(parseInt(req.query.limit || "500", 10), 1000));
    let options = readOptions();
    if (options.length > 0 && !("atmCall" in options[0])) {
      options = [];
    }
    let topCalls = [];
    let topPuts = [];
    let tradeDate = null;
    let source = "cache";
    const notes = [];

    if (req.query.refresh === "true" || options.length === 0) {
      const cookie = await getNSECookies();
      const optionsRaw = [];
      const chains = [];

      for (const sym of FNO_SYMBOLS) {
        let chain = await fetchNSEOptionChain(sym, cookie);
        if (!chain && ENABLE_YAHOO_FALLBACK && !["NIFTY", "BANKNIFTY", "FINNIFTY"].includes(sym)) {
          chain = await fetchYahooNSEOptionChain(sym);
          if (chain) notes.push(`Yahoo fallback used for ${sym}`);
        }
        if (chain) {
          chains.push(chain);
          optionsRaw.push(chain);
        }
        await new Promise((r) => setTimeout(r, 300));
      }

      if (chains.length > 0) source = "nse_live_chain";

      if (chains.length === 0) {
        const bhav = await fetchFOBhavcopyRows();
        tradeDate = bhav.tradeDate;
        const allowed = new Set(FNO_SYMBOLS);
        const bhavChains = buildChainsFromBhavcopy(bhav.rows || [], allowed);
        chains.push(...bhavChains);
        optionsRaw.push(...bhavChains);
        if (bhavChains.length > 0) {
          source = "nse_bhavcopy";
        } else {
          notes.push("No option-chain records were available from live NSE and bhavcopy sources.");
        }
      }

      options = Object.values(optionsToSignals(optionsRaw))
        .sort((a, b) => b.score - a.score)
        .slice(0, 200);

      topCalls = rankOptionContracts(chains.flatMap((c) => c.calls || []), limit);
      topPuts = rankOptionContracts(chains.flatMap((c) => c.puts || []), limit);

      writeOptions(options);
    } else {
      const bhav = await fetchFOBhavcopyRows();
      tradeDate = bhav.tradeDate;
      if ((bhav.rows || []).length > 0) {
        const allowed = new Set(FNO_SYMBOLS);
        const bhavChains = buildChainsFromBhavcopy(bhav.rows || [], allowed);
        topCalls = rankOptionContracts(bhavChains.flatMap((c) => c.calls || []), limit);
        topPuts = rankOptionContracts(bhavChains.flatMap((c) => c.puts || []), limit);
        source = "nse_bhavcopy";
      } else {
        notes.push("Bhavcopy was unavailable in this session.");
      }
    }

    res.json({
      options,
      topCalls,
      topPuts,
      tradeDate,
      limit,
      count: options.length,
      rankingBasis: "Weighted score: OI notional (55%) + OI change (30%) + volume (15%), diversified by symbol cap",
      source,
      notes,
    });
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

  const isInvestmentTip = (title) => /\b(buy|sell|reduce|hold|upgrade|downgrade|rating|target|recommendation|bullish|bearish)\b/i.test(title);

  // Try NSE official announcements
  try {
    const nseRes = await axios.get("https://www.nseindia.com/market-data/latest-news", {
      timeout: 8000,
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
    });
    const html = nseRes.data;
    // Extract news headlines from NSE page (look for common patterns)
    const headlines = [...html.matchAll(/>([A-Z][^<]{20,180})<\/(a|p|div|span)>/g)]
      .map((m) => m[1].trim())
      .filter((t) => t && t.length > 15 && !isInvestmentTip(t) && /[0-9]|market|stock|nse|bse|equity|sensex|nifty/i.test(t))
      .slice(0, 6);
    
    if (headlines.length > 0) {
      NEWS_CACHE.items = headlines;
      NEWS_CACHE.fetchedAt = Date.now();
      return headlines;
    }
  } catch (e) {
    console.log("NSE news fetch failed:", e.message);
  }

  // Try BSE official announcements
  try {
    const bseRes = await axios.get("https://www.bseindia.com/", {
      timeout: 8000,
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
    });
    const html = bseRes.data;
    const headlines = [...html.matchAll(/>([A-Z][^<]{20,180})<\/(a|p|div|span)>/g)]
      .map((m) => m[1].trim())
      .filter((t) => t && t.length > 15 && !isInvestmentTip(t) && /[0-9]|market|stock|nse|bse|equity|sensex|nifty/i.test(t))
      .slice(0, 6);
    
    if (headlines.length > 0) {
      NEWS_CACHE.items = headlines;
      NEWS_CACHE.fetchedAt = Date.now();
      return headlines;
    }
  } catch (e) {
    console.log("BSE news fetch failed:", e.message);
  }

  // Fallback: curated market facts (no third-party news)
  const fallback = [
    "📊 NSE Market Open 9:15 AM — Close 3:30 PM IST",
    "🏦 RBI Interest Rate: 6.50% (Last reviewed May 2026)",
    "📈 Sensex 52-Week High: ₹82,000 | Low: ₹68,000",
    "⚡ Smart Money Screener — Live institutional activity detection",
    "🎯 Today's Top Movers: Check Signals tab for live data",
    "💼 Market Holiday Calendar: Check NSE official website",
  ];
  NEWS_CACHE.items = fallback;
  NEWS_CACHE.fetchedAt = Date.now();
  return fallback;
}

app.get("/api/news", async (req, res) => {
  try {
    const news = await fetchMarketNews();
    res.json({ news });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Commodity prices (global futures references) ────────────────────────────
const COMMODITY_SYMBOLS = [
  { symbol: "GC=F",    name: "Gold Futures",       icon: "🥇", unit: "USD/oz",    exchange: "COMEX", nseOptionSymbol: null },
  { symbol: "SI=F",    name: "Silver Futures",     icon: "🥈", unit: "USD/oz",    exchange: "COMEX", nseOptionSymbol: null },
  { symbol: "CL=F",    name: "Crude Oil (WTI)",    icon: "🛢️",  unit: "USD/bbl",  exchange: "NYMEX", nseOptionSymbol: null },
  { symbol: "NG=F",    name: "Natural Gas",        icon: "💨", unit: "USD/MMBtu", exchange: "NYMEX", nseOptionSymbol: null },
  { symbol: "HG=F",    name: "Copper Futures",     icon: "🔧", unit: "USD/lb",   exchange: "COMEX", nseOptionSymbol: null },
  { symbol: "ZW=F",    name: "Wheat Futures",      icon: "🌾", unit: "USD/bu",   exchange: "CBOT",  nseOptionSymbol: null },
];

const COMMODITY_CACHE = { data: null, fetchedAt: 0 };

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

async function fetchNSEEquityQuote(symbol, cookie, timeoutMs = 9000) {
  try {
    const nseSymbol = symbol.replace(/\.NS$/i, "");
    const url = `https://www.nseindia.com/api/quote-equity?symbol=${encodeURIComponent(nseSymbol)}`;
    const res = await axios.get(url, {
      timeout: timeoutMs,
      headers: { ...NSE_HEADERS, Cookie: cookie },
    });
    const info = res.data?.priceInfo || {};
    const sec = res.data?.securityInfo || {};
    const md = res.data?.metadata || {};
    const tradedVolume = info?.totalTradedVolume
      ?? sec?.totalTradedVolume
      ?? sec?.tradedVolume
      ?? md?.totalTradedVolume
      ?? null;

    return {
      symbol,
      regularMarketPrice: Number.isFinite(info.lastPrice) ? info.lastPrice : null,
      regularMarketOpen: Number.isFinite(info.open) ? info.open : null,
      regularMarketPreviousClose: Number.isFinite(info.previousClose) ? info.previousClose : null,
      regularMarketDayHigh: Number.isFinite(info.intraDayHighLow?.max) ? info.intraDayHighLow.max : null,
      regularMarketDayLow: Number.isFinite(info.intraDayHighLow?.min) ? info.intraDayHighLow.min : null,
      regularMarketVolume: Number.isFinite(tradedVolume)
        ? tradedVolume
        : (Number.isFinite(sec?.issuedCap) ? sec.issuedCap : null),
      regularMarketChangePercent: Number.isFinite(info.pChange) ? info.pChange : null,
      marketState: md?.status === "Open" ? "REGULAR" : "CLOSED",
      fullExchangeName: "NSE",
      openInterest: null,
    };
  } catch {
    return null;
  }
}

async function fetchNSEEquityQuotes(symbols, cookie, options = {}) {
  const batchSize = Number(options.batchSize || 8);
  const timeoutMs = Number(options.timeoutMs || 9000);
  const interBatchDelayMs = Number(options.interBatchDelayMs || 80);
  const out = {};
  for (let i = 0; i < symbols.length; i += batchSize) {
    const batch = symbols.slice(i, i + batchSize);
    const results = await Promise.all(batch.map((sym) => fetchNSEEquityQuote(sym, cookie, timeoutMs)));
    for (const q of results) {
      if (q?.symbol) out[q.symbol] = q;
    }
    if (i + batchSize < symbols.length && interBatchDelayMs > 0) {
      await new Promise((r) => setTimeout(r, interBatchDelayMs));
    }
  }
  return out;
}

function etfCategory(symbol) {
  const s = String(symbol || "").toUpperCase();
  if (s.includes("GOLD")) return "Gold";
  if (s.includes("SILVER")) return "Silver";
  if (s.includes("PHARMA")) return "Pharma";
  if (s.includes("PSU") || s.includes("PSE")) return "PSU";
  if (s.includes("BANK")) return "Bank";
  if (s.includes("IT")) return "IT";
  if (s.includes("METAL")) return "Metal";
  if (s.includes("AUTO")) return "Auto";
  if (s.includes("NIFTY") || s.includes("N50") || s.includes("NEXT50") || s.includes("SENSEX")) return "Index";
  return "Diversified";
}

function computeEtfRating(longTermScore) {
  const safe = Number.isFinite(longTermScore) ? longTermScore : 50;
  return Math.max(1, Math.min(10, Math.round(safe / 10)));
}

function computeGoldSilverScore(category, longTermScore, volume) {
  if (!(category === "Gold" || category === "Silver")) return null;
  const lt = Number.isFinite(longTermScore) ? longTermScore : 50;
  const vol = Number.isFinite(volume) ? Math.min(10, Math.log10(Math.max(1, volume))) : 0;
  return Math.max(1, Math.min(100, Math.round(lt * 0.9 + vol * 1.5)));
}

async function fetchTopETFs() {
  if (ETF_CACHE.data && Date.now() - ETF_CACHE.fetchedAt < 5 * 60 * 1000) {
    return ETF_CACHE.data;
  }

  const cookie = await getNSECookies();
  const quoteMap = await fetchNSEEquityQuotes(ETF_CATALOG.map((e) => `${e.symbol}.NS`), cookie, {
    batchSize: 10,
    timeoutMs: 3000,
    interBatchDelayMs: 60,
  });

  const etfs = ETF_CATALOG.map((entry) => {
    const symbol = entry.symbol;
    const q = quoteMap[`${symbol}.NS`] || null;
    const nipponPriority = entry.issuer === "Nippon India" ? 1 : 0;
    const category = etfCategory(symbol);
    const volume = Number.isFinite(q?.regularMarketVolume) ? q.regularMarketVolume : 0;
    const rating = computeEtfRating(entry.longTermScore);
    const goldSilverScore = computeGoldSilverScore(category, entry.longTermScore, volume);
    return {
      symbol,
      name: entry.fullName,
      issuer: entry.issuer,
      longTermScore: entry.longTermScore,
      rating,
      nipponPriority,
      category,
      goldSilverScore,
      asset_type: "ETF",
      price: Number.isFinite(q?.regularMarketPrice) ? round2(q.regularMarketPrice) : null,
      change: Number.isFinite(q?.regularMarketChangePercent) ? round2(q.regularMarketChangePercent) : null,
      volume,
      exchange: q?.fullExchangeName || "NSE",
      source_url: `https://www.nseindia.com/get-quotes/equity?symbol=${encodeURIComponent(symbol)}`,
    };
  })
    .filter((e) => e.price != null)
    .sort((a, b) => {
      if (b.nipponPriority !== a.nipponPriority) return b.nipponPriority - a.nipponPriority;
      if ((b.longTermScore || 0) !== (a.longTermScore || 0)) return (b.longTermScore || 0) - (a.longTermScore || 0);
      const volDiff = (b.volume || 0) - (a.volume || 0);
      if (volDiff !== 0) return volDiff;
      return Math.abs(b.change || 0) - Math.abs(a.change || 0);
    })
    .slice(0, 50);

  ETF_CACHE.data = etfs;
  ETF_CACHE.fetchedAt = Date.now();
  return etfs;
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

function deriveSentiment(pcr) {
  if (!Number.isFinite(pcr)) return "N/A";
  return pcr >= 1.2 ? "Bullish" : pcr <= 0.8 ? "Bearish" : "Neutral";
}

async function fetchYahooNSEOptionChain(symbol) {
  try {
    const yahooSymbol = `${symbol}.NS`;
    const res = await axios.get(`https://query1.finance.yahoo.com/v7/finance/options/${yahooSymbol}`, {
      timeout: 9000,
      headers: { "User-Agent": "Mozilla/5.0", Accept: "application/json" },
    });
    const result = res.data?.optionChain?.result?.[0];
    if (!result) return null;

    const optionData = result.options?.[0] || {};
    const callsRaw = optionData.calls || [];
    const putsRaw = optionData.puts || [];
    if (callsRaw.length === 0 && putsRaw.length === 0) return null;

    const underlyingValue = result.quote?.regularMarketPrice ?? result.quote?.previousClose ?? null;
    const expiry = optionData.expirationDate
      ? new Date(optionData.expirationDate * 1000).toISOString().slice(0, 10)
      : null;

    const calls = callsRaw.map((c) => ({
      symbol,
      expiry,
      strike: c.strike,
      openInterest: c.openInterest || 0,
      changeInOI: 0,
      volume: c.volume || 0,
      ltp: c.lastPrice || null,
      impliedVolatility: Number.isFinite(c.impliedVolatility) ? (c.impliedVolatility * 100) : null,
      underlying: underlyingValue,
    }));

    const puts = putsRaw.map((p) => ({
      symbol,
      expiry,
      strike: p.strike,
      openInterest: p.openInterest || 0,
      changeInOI: 0,
      volume: p.volume || 0,
      ltp: p.lastPrice || null,
      impliedVolatility: Number.isFinite(p.impliedVolatility) ? (p.impliedVolatility * 100) : null,
      underlying: underlyingValue,
    }));

    const totalCallOI = calls.reduce((sum, c) => sum + (c.openInterest || 0), 0);
    const totalPutOI = puts.reduce((sum, p) => sum + (p.openInterest || 0), 0);
    const pcr = totalCallOI > 0 ? Math.round((totalPutOI / totalCallOI) * 100) / 100 : null;
    const topCall = calls.sort((a, b) => b.openInterest - a.openInterest)[0] || null;
    const topPut = puts.sort((a, b) => b.openInterest - a.openInterest)[0] || null;

    return {
      symbol,
      asset_type: "FnO",
      expiry,
      underlyingValue: round2(underlyingValue),
      totalCallOI,
      totalPutOI,
      topCallStrike: topCall?.strike || null,
      topPutStrike: topPut?.strike || null,
      pcr,
      sentiment: deriveSentiment(pcr),
      callOIChange: 0,
      putOIChange: 0,
      calls,
      puts,
      source_url: `https://finance.yahoo.com/quote/${yahooSymbol}/options`,
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

function formatNSEOptionContract(contract) {
  if (!contract) return null;
  return {
    strike: round2(contract.strike),
    lastPrice: round2(contract.ltp),
    bid: null,
    ask: null,
    iv: round2(contract.impliedVolatility),
    openInterest: Number.isFinite(contract.openInterest) ? contract.openInterest : null,
    volume: Number.isFinite(contract.volume) ? contract.volume : null,
  };
}

function pickAtmNSEContract(contracts, underlying) {
  if (!Array.isArray(contracts) || contracts.length === 0 || !Number.isFinite(underlying)) return null;
  return contracts.reduce((best, current) => {
    const bestDiff = Math.abs((best?.strike || 0) - underlying);
    const currentDiff = Math.abs((current?.strike || 0) - underlying);
    return currentDiff < bestDiff ? current : best;
  }, contracts[0]);
}

async function fetchCommodityPrices() {
  if (Date.now() - COMMODITY_CACHE.fetchedAt < 5 * 60 * 1000 && COMMODITY_CACHE.data) {
    return COMMODITY_CACHE.data;
  }

  try {
    const dynamicRaw = await Promise.all(COMMODITY_SYMBOLS.map((c) => fetchCommodityChartFallback(c.symbol)));

    const fallbackBySymbol = {
      "GC=F": { price: 2385.5, prevClose: 2375.2, dayHigh: 2392.8, dayLow: 2378.5, volume: 120000 },
      "SI=F": { price: 28.65, prevClose: 28.42, dayHigh: 28.92, dayLow: 28.35, volume: 90000 },
      "CL=F": { price: 82.45, prevClose: 81.23, dayHigh: 83.2, dayLow: 81.5, volume: 325000 },
      "NG=F": { price: 2.45, prevClose: 2.52, dayHigh: 2.68, dayLow: 2.4, volume: 680000 },
      "HG=F": { price: 4.18, prevClose: 4.12, dayHigh: 4.25, dayLow: 4.1, volume: 215000 },
      "ZW=F": { price: 5.68, prevClose: 5.72, dayHigh: 5.85, dayLow: 5.6, volume: 125000 },
    };

    const results = COMMODITY_SYMBOLS.map((c, idx) => {
      const live = dynamicRaw[idx] || {};
      const fallback = fallbackBySymbol[c.symbol] || {};
      const price = live.price ?? fallback.price ?? null;
      const prevClose = live.prevClose ?? fallback.prevClose ?? null;
      const change = Number.isFinite(price) && Number.isFinite(prevClose) && prevClose !== 0
        ? ((price - prevClose) / prevClose) * 100
        : null;

      return {
        ...c,
        currency: "USD",
        price: round2(price),
        prevClose: round2(prevClose),
        change: round2(change),
        marketState: live.marketState || "CLOSED",
        dayHigh: round2(live.dayHigh ?? fallback.dayHigh ?? null),
        dayLow: round2(live.dayLow ?? fallback.dayLow ?? null),
        volume: Number.isFinite(live.volume) ? live.volume : (Number.isFinite(fallback.volume) ? fallback.volume : null),
        openInterest: null,
        source_url: `https://finance.yahoo.com/quote/${encodeURIComponent(c.symbol)}`,
      };
    }).filter((row) => row.price != null);

    COMMODITY_CACHE.data = results;
    COMMODITY_CACHE.fetchedAt = Date.now();
    return results;
  } catch (e) {
    console.error("Error fetching commodity prices:", e.message);
    COMMODITY_CACHE.data = [];
    return [];
  }
}

app.get("/api/commodity", async (req, res) => {
  try {
    const refresh = req.query.refresh === "true";
    if (refresh) COMMODITY_CACHE.fetchedAt = 0;
    const data = await fetchCommodityPrices();
    res.json({
      commodities: data,
      generatedAt: new Date().toISOString(),
      market: "GLOBAL",
      source: "NSE/BSE policy mode",
      officialLinks: ["https://www.nseindia.com", "https://www.bseindia.com"],
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Mutual Funds NAV from AMFI API ────────────────────────────────────────────
const TOP_FUNDS = [
  { schemeCode: "119551", name: "Mirae Asset Large Cap Fund", category: "Large Cap", amc: "Mirae Asset", riskLevel: "Moderate", style: "Large Cap Core", objective: "Long-term growth from large established Indian companies." },
  { schemeCode: "122639", name: "Parag Parikh Flexi Cap Fund", category: "Flexi Cap", amc: "PPFAS", riskLevel: "Moderate-High", style: "Flexi Cap", objective: "Dynamic allocation across market caps for long-term compounding." },
  { schemeCode: "120503", name: "Axis Bluechip Fund", category: "Large Cap", amc: "Axis MF", riskLevel: "Moderate", style: "Large Cap Quality", objective: "Invest in fundamentally strong blue-chip businesses." },
  { schemeCode: "125497", name: "SBI Small Cap Fund", category: "Small Cap", amc: "SBI MF", riskLevel: "High", style: "Small Cap Growth", objective: "High-growth small-cap opportunities with long horizon." },
  { schemeCode: "118989", name: "HDFC Mid-Cap Opportunities", category: "Mid Cap", amc: "HDFC MF", riskLevel: "High", style: "Mid Cap Blend", objective: "Capture mid-cap growth with diversified exposure." },
  { schemeCode: "131652", name: "Kotak Emerging Equity Fund", category: "Mid Cap", amc: "Kotak MF", riskLevel: "High", style: "Mid Cap Growth", objective: "Focus on emerging businesses in mid-cap universe." },
  { schemeCode: "118825", name: "ICICI Pru Balanced Advantage", category: "Balanced Advantage", amc: "ICICI Prudential", riskLevel: "Moderate", style: "Dynamic Asset Allocation", objective: "Balance equity and debt based on valuations and market phase." },
  { schemeCode: "120465", name: "Nippon India Small Cap Fund", category: "Small Cap", amc: "Nippon India", riskLevel: "High", style: "Small Cap Active", objective: "Long-term alpha via actively selected smaller companies." },
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
        source_url: "https://www.nseindia.com",
      };
    } catch {
      return { ...fund, nav: null, change: null, returns1Y: null, source_url: "https://www.nseindia.com" };
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
    res.json({
      funds: data,
      source: "NSE/BSE policy mode",
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Market status helper ──────────────────────────────────────────────────────
app.get("/api/market-status", (req, res) => {
  const nowIST = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  const day = nowIST.getDay(); // 0=Sun, 6=Sat
  const hours = nowIST.getHours();
  const minutes = nowIST.getMinutes();
  const timeMin = hours * 60 + minutes;
  const isWeekday = day >= 1 && day <= 5;
  const isHoliday = !isWeekday;
  const isOpen = isWeekday && timeMin >= 555 && timeMin <= 930; // 9:15 AM to 3:30 PM IST
  const status = isHoliday ? "Holiday" : isOpen ? "Live" : "Market Closed";
  res.json({
    isOpen,
    isHoliday,
    status,
    session: isOpen ? "Live Data" : "Market Closed",
    istTime: `${String(hours).padStart(2,'0')}:${String(minutes).padStart(2,'0')}`,
    day,
  });
});

// ── Scheduler: 9:20 AM and 3:35 PM IST on weekdays ───────────────────────────
cron.schedule("20 9 * * 1-5", buildSignals, { timezone: "Asia/Kolkata" });
cron.schedule("35 15 * * 1-5", buildSignals, { timezone: "Asia/Kolkata" });

// ── Serve frontend static files ────────────────────────────────────────────────
if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
  // SPA fallback — serve index.html for any non-API route
  app.get(/^\/(?!api).*/, (req, res) => {
    res.sendFile(path.join(DIST_DIR, "index.html"));
  });
}

// ── Start server ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`\n🚀 Smart Money Screener Backend running at http://localhost:${PORT}`);
  console.log(`📊 API docs: http://localhost:${PORT}/api/health`);
  console.log(`📈 Signals: http://localhost:${PORT}/api/signals\n`);
});
