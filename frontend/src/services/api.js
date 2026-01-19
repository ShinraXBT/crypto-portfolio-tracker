import axios from 'axios'

// Use environment variable for API URL, fallback to /api for local dev with proxy
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Wallets API
export const walletsApi = {
  getAll: () => api.get('/wallets'),
  getOne: (id) => api.get(`/wallets/${id}`),
  create: (data) => api.post('/wallets', data),
  update: (id, data) => api.put(`/wallets/${id}`, data),
  delete: (id) => api.delete(`/wallets/${id}`)
}

// Monthly Entries API
export const monthlyApi = {
  getAll: (year = null, walletId = null) => {
    const params = {}
    if (year) params.year = year
    if (walletId) params.wallet_id = walletId
    return api.get('/monthly', { params })
  },
  getSummary: (year) => api.get('/monthly/summary', { params: { year } }),
  create: (data) => api.post('/monthly', data),
  createBulk: (data) => api.post('/monthly/bulk', data),
  update: (id, data) => api.put(`/monthly/${id}`, data),
  delete: (id) => api.delete(`/monthly/${id}`)
}

// Daily Entries API
export const dailyApi = {
  getAll: (year, month, walletId = null) => {
    const params = { year, month }
    if (walletId) params.wallet_id = walletId
    return api.get('/daily', { params })
  },
  getSnapshots: (year, month) => api.get('/daily/snapshots', { params: { year, month } }),
  create: (data) => api.post('/daily', data),
  update: (id, data) => api.put(`/daily/${id}`, data),
  delete: (id) => api.delete(`/daily/${id}`)
}

// Metrics API
export const metricsApi = {
  getSummary: (initialInvestment = 0) => api.get('/metrics/summary', { params: { initial_investment: initialInvestment } }),
  getRoi: (initialInvestment) => api.get('/metrics/roi', { params: { initial_investment: initialInvestment } }),
  getDrawdown: () => api.get('/metrics/drawdown'),
  getVsBtc: () => api.get('/metrics/vs-btc')
}

// Alerts API
export const alertsApi = {
  getAll: (activeOnly = false) => api.get('/alerts', { params: { active_only: activeOnly } }),
  getOne: (id) => api.get(`/alerts/${id}`),
  create: (data) => api.post('/alerts', data),
  update: (id, data) => api.put(`/alerts/${id}`, data),
  delete: (id) => api.delete(`/alerts/${id}`),
  reset: (id) => api.post(`/alerts/${id}/reset`),
  checkAll: (portfolioValue, btcPrice = null, variation24h = null) => {
    const params = { current_portfolio_value: portfolioValue }
    if (btcPrice) params.current_btc_price = btcPrice
    if (variation24h) params.variation_24h = variation24h
    return api.get('/alerts/check/all', { params })
  }
}

// Prices API
export const pricesApi = {
  getCurrent: (symbols = 'BTC,ETH') => api.get('/prices/current', { params: { symbols } }),
  getOne: (symbol) => api.get(`/prices/current/${symbol}`),
  getHistory: (symbol, days = 30) => api.get(`/prices/history/${symbol}`, { params: { days } })
}

// Years API
export const yearsApi = {
  getAvailable: () => api.get('/years')
}

export default api
