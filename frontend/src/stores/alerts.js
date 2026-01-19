import { defineStore } from 'pinia'
import { ref } from 'vue'
import { alertsApi } from '../services/api'

export const useAlertsStore = defineStore('alerts', () => {
  // State
  const alerts = ref([])
  const triggeredAlerts = ref([])
  const loading = ref(false)
  const error = ref(null)

  // Actions
  async function fetchAlerts(activeOnly = false) {
    loading.value = true
    try {
      const response = await alertsApi.getAll(activeOnly)
      alerts.value = response.data
    } catch (e) {
      error.value = 'Failed to fetch alerts'
      console.error(e)
    } finally {
      loading.value = false
    }
  }

  async function createAlert(data) {
    try {
      const response = await alertsApi.create(data)
      alerts.value.unshift(response.data)
      return response.data
    } catch (e) {
      error.value = e.response?.data?.detail || 'Failed to create alert'
      throw e
    }
  }

  async function updateAlert(id, data) {
    try {
      const response = await alertsApi.update(id, data)
      const index = alerts.value.findIndex(a => a.id === id)
      if (index !== -1) {
        alerts.value[index] = response.data
      }
      return response.data
    } catch (e) {
      error.value = e.response?.data?.detail || 'Failed to update alert'
      throw e
    }
  }

  async function deleteAlert(id) {
    try {
      await alertsApi.delete(id)
      alerts.value = alerts.value.filter(a => a.id !== id)
    } catch (e) {
      error.value = 'Failed to delete alert'
      throw e
    }
  }

  async function resetAlert(id) {
    try {
      const response = await alertsApi.reset(id)
      const index = alerts.value.findIndex(a => a.id === id)
      if (index !== -1) {
        alerts.value[index] = response.data
      }
      return response.data
    } catch (e) {
      error.value = 'Failed to reset alert'
      throw e
    }
  }

  async function checkAlerts(portfolioValue, btcPrice = null, variation24h = null) {
    try {
      const response = await alertsApi.checkAll(portfolioValue, btcPrice, variation24h)
      triggeredAlerts.value = response.data.alerts
      return response.data
    } catch (e) {
      console.error('Failed to check alerts:', e)
      return { triggered_count: 0, alerts: [] }
    }
  }

  function clearError() {
    error.value = null
  }

  return {
    // State
    alerts,
    triggeredAlerts,
    loading,
    error,
    // Actions
    fetchAlerts,
    createAlert,
    updateAlert,
    deleteAlert,
    resetAlert,
    checkAlerts,
    clearError
  }
})
