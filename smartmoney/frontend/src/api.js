import axios from "axios";

const BASE = import.meta.env.VITE_API_URL || "";

export const fetchSignals = (refresh = false) =>
  axios.get(`${BASE}/api/signals${refresh ? "?refresh=true" : ""}`).then((r) => r.data);

export const fetchSignalDetail = (symbol) =>
  axios.get(`${BASE}/api/signals/${symbol}`).then((r) => r.data);

export const fetchOptions = (refresh = false) =>
  axios.get(`${BASE}/api/options${refresh ? "?refresh=true" : ""}`).then((r) => r.data);

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

