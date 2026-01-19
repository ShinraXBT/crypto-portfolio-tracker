import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { walletsApi, monthlyApi, dailyApi, metricsApi, yearsApi } from '../services/api'

export const usePortfolioStore = defineStore('portfolio', () => {
  // State
  const wallets = ref([])
  const monthlyData = ref(null)
  const dailySnapshots = ref([])
  const metrics = ref(null)
  const availableYears = ref([])
  const selectedYear = ref(new Date().getFullYear())
  const selectedMonth = ref(new Date().getMonth() + 1)
  const loading = ref(false)
  const error = ref(null)

  // Computed
  const walletNames = computed(() => wallets.value.map(w => w.name))
  const walletMap = computed(() => {
    const map = {}
    wallets.value.forEach(w => { map[w.id] = w })
    return map
  })

  // Actions
  async function fetchWallets() {
    try {
      const response = await walletsApi.getAll()
      wallets.value = response.data
    } catch (e) {
      error.value = 'Failed to fetch wallets'
      console.error(e)
    }
  }

  async function createWallet(data) {
    try {
      const response = await walletsApi.create(data)
      wallets.value.push(response.data)
      return response.data
    } catch (e) {
      error.value = e.response?.data?.detail || 'Failed to create wallet'
      throw e
    }
  }

  async function updateWallet(id, data) {
    try {
      const response = await walletsApi.update(id, data)
      const index = wallets.value.findIndex(w => w.id === id)
      if (index !== -1) {
        wallets.value[index] = response.data
      }
      return response.data
    } catch (e) {
      error.value = e.response?.data?.detail || 'Failed to update wallet'
      throw e
    }
  }

  async function deleteWallet(id) {
    try {
      await walletsApi.delete(id)
      wallets.value = wallets.value.filter(w => w.id !== id)
    } catch (e) {
      error.value = 'Failed to delete wallet'
      throw e
    }
  }

  async function fetchMonthlySummary(year = null) {
    loading.value = true
    try {
      const targetYear = year || selectedYear.value
      const response = await monthlyApi.getSummary(targetYear)
      monthlyData.value = response.data
    } catch (e) {
      error.value = 'Failed to fetch monthly data'
      console.error(e)
    } finally {
      loading.value = false
    }
  }

  async function fetchDailySnapshots(year = null, month = null) {
    loading.value = true
    try {
      const targetYear = year || selectedYear.value
      const targetMonth = month || selectedMonth.value
      const response = await dailyApi.getSnapshots(targetYear, targetMonth)
      dailySnapshots.value = response.data
    } catch (e) {
      error.value = 'Failed to fetch daily data'
      console.error(e)
    } finally {
      loading.value = false
    }
  }

  async function fetchMetrics(initialInvestment = 0) {
    loading.value = true
    try {
      const response = await metricsApi.getSummary(initialInvestment)
      metrics.value = response.data
    } catch (e) {
      error.value = 'Failed to fetch metrics'
      console.error(e)
    } finally {
      loading.value = false
    }
  }

  async function fetchAvailableYears() {
    try {
      const response = await yearsApi.getAvailable()
      availableYears.value = response.data
      if (response.data.length > 0 && !response.data.includes(selectedYear.value)) {
        selectedYear.value = response.data[0]
      }
    } catch (e) {
      console.error(e)
    }
  }

  async function addMonthlyEntry(data) {
    try {
      await monthlyApi.create(data)
      await fetchMonthlySummary()
    } catch (e) {
      error.value = e.response?.data?.detail || 'Failed to add entry'
      throw e
    }
  }

  async function addBulkMonthlyEntries(data) {
    try {
      await monthlyApi.createBulk(data)
      await fetchMonthlySummary()
    } catch (e) {
      error.value = e.response?.data?.detail || 'Failed to add entries'
      throw e
    }
  }

  async function addDailyEntry(data) {
    try {
      await dailyApi.create(data)
      await fetchDailySnapshots()
    } catch (e) {
      error.value = e.response?.data?.detail || 'Failed to add entry'
      throw e
    }
  }

  function setSelectedYear(year) {
    selectedYear.value = year
  }

  function setSelectedMonth(month) {
    selectedMonth.value = month
  }

  function clearError() {
    error.value = null
  }

  return {
    // State
    wallets,
    monthlyData,
    dailySnapshots,
    metrics,
    availableYears,
    selectedYear,
    selectedMonth,
    loading,
    error,
    // Computed
    walletNames,
    walletMap,
    // Actions
    fetchWallets,
    createWallet,
    updateWallet,
    deleteWallet,
    fetchMonthlySummary,
    fetchDailySnapshots,
    fetchMetrics,
    fetchAvailableYears,
    addMonthlyEntry,
    addBulkMonthlyEntries,
    addDailyEntry,
    setSelectedYear,
    setSelectedMonth,
    clearError
  }
})
