import axios from "axios";

const BASE = import.meta.env.VITE_API_URL || "";
const api = axios.create({
  baseURL: BASE,
  timeout: 20000,
});

export const fetchSignals = (refresh = false) =>
  api.get(`/api/signals${refresh ? "?refresh=true" : ""}`).then((r) => r.data);

export const fetchSignalDetail = (symbol) =>
  api.get(`/api/signals/${symbol}`).then((r) => r.data);

export const fetchOptions = (refresh = false, limit = 500) =>
  api.get(`/api/options?limit=${limit}${refresh ? "&refresh=true" : ""}`).then((r) => r.data);

export const fetchGainers = (refresh = false) =>
  api.get(`/api/gainers${refresh ? "?refresh=true" : ""}`).then((r) => r.data);

export const fetchCommodity = (refresh = false) =>
  api.get(`/api/commodity${refresh ? "?refresh=true" : ""}`).then((r) => r.data);

export const fetchMutualFunds = (refresh = false) =>
  api.get(`/api/mutualfunds${refresh ? "?refresh=true" : ""}`).then((r) => r.data);

export const fetchMarketStatus = () =>
  api.get(`/api/market-status`).then((r) => r.data);

export const fetchNews = () =>
  api.get(`/api/news`).then((r) => r.data);

export const fetchProviders = () =>
  api.get(`/api/providers`).then((r) => r.data);

export const fetchEtfs = (refresh = false) =>
  api.get(`/api/etfs${refresh ? "?refresh=true" : ""}`).then((r) => r.data);

export const fetchStockSearch = (symbol) =>
  api.get(`/api/search?symbol=${encodeURIComponent(symbol)}`).then((r) => r.data);

export const fetchAnalyticsSummary = () =>
  api.get(`/api/analytics/summary`).then((r) => r.data);

export const trackVisit = (sessionId) =>
  api.post(`/api/analytics/visit`, { sessionId }).then((r) => r.data);

export const trackHeartbeat = (sessionId) =>
  api.post(`/api/analytics/heartbeat`, { sessionId }).then((r) => r.data);

export const fetchIndices = () =>
  api.get(`/api/indices`).then((r) => r.data);

