import axios from "axios";

const BASE = import.meta.env.VITE_API_URL || "";

export const fetchSignals = (refresh = false) =>
  axios.get(`${BASE}/api/signals${refresh ? "?refresh=true" : ""}`).then((r) => r.data);

export const fetchSignalDetail = (symbol) =>
  axios.get(`${BASE}/api/signals/${symbol}`).then((r) => r.data);

export const fetchOptions = (refresh = false, limit = 500) =>
  axios.get(`${BASE}/api/options?limit=${limit}${refresh ? "&refresh=true" : ""}`).then((r) => r.data);

export const fetchGainers = (refresh = false) =>
  axios.get(`${BASE}/api/gainers${refresh ? "?refresh=true" : ""}`).then((r) => r.data);

export const fetchCommodity = (refresh = false) =>
  axios.get(`${BASE}/api/commodity${refresh ? "?refresh=true" : ""}`).then((r) => r.data);

export const fetchMutualFunds = (refresh = false) =>
  axios.get(`${BASE}/api/mutualfunds${refresh ? "?refresh=true" : ""}`).then((r) => r.data);

export const fetchMarketStatus = () =>
  axios.get(`${BASE}/api/market-status`).then((r) => r.data);

export const fetchNews = () =>
  axios.get(`${BASE}/api/news`).then((r) => r.data);

export const fetchProviders = () =>
  axios.get(`${BASE}/api/providers`).then((r) => r.data);

export const fetchEtfs = (refresh = false) =>
  axios.get(`${BASE}/api/etfs${refresh ? "?refresh=true" : ""}`).then((r) => r.data);

export const fetchStockSearch = (symbol) =>
  axios.get(`${BASE}/api/search?symbol=${encodeURIComponent(symbol)}`).then((r) => r.data);

export const fetchAnalyticsSummary = () =>
  axios.get(`${BASE}/api/analytics/summary`).then((r) => r.data);

export const trackVisit = (sessionId) =>
  axios.post(`${BASE}/api/analytics/visit`, { sessionId }).then((r) => r.data);

export const trackHeartbeat = (sessionId) =>
  axios.post(`${BASE}/api/analytics/heartbeat`, { sessionId }).then((r) => r.data);

