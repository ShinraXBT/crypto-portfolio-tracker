<script setup>
import { onMounted, computed } from 'vue'
import { usePortfolioStore } from '../stores/portfolio'
import { useAlertsStore } from '../stores/alerts'
import MetricsCard from '../components/MetricsCard.vue'
import LineChart from '../components/charts/LineChart.vue'

const portfolioStore = usePortfolioStore()
const alertsStore = useAlertsStore()

const metrics = computed(() => portfolioStore.metrics)
const monthlyData = computed(() => portfolioStore.monthlyData)
const loading = computed(() => portfolioStore.loading)
const activeAlerts = computed(() => alertsStore.triggeredAlerts)

const chartData = computed(() => {
  if (!monthlyData.value?.monthly_data) return null

  const labels = monthlyData.value.monthly_data.map(m => m.month_name.substring(0, 3))
  const values = monthlyData.value.monthly_data.map(m => m.total_value)

  return {
    labels,
    datasets: [{
      label: 'Portfolio Value ($)',
      data: values,
      borderColor: '#3b82f6',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      fill: true,
      tension: 0.4
    }]
  }
})

onMounted(async () => {
  await Promise.all([
    portfolioStore.fetchWallets(),
    portfolioStore.fetchAvailableYears(),
    portfolioStore.fetchMetrics(0),
    portfolioStore.fetchMonthlySummary()
  ])

  if (metrics.value?.current_value) {
    await alertsStore.checkAlerts(metrics.value.current_value)
  }
})

function formatCurrency(value) {
  if (value === null || value === undefined) return 'N/A'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(value)
}

function formatPercent(value) {
  if (value === null || value === undefined) return 'N/A'
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(2)}%`
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
      <div class="text-sm text-gray-500 dark:text-gray-400">
        Last updated: {{ new Date().toLocaleString() }}
      </div>
    </div>

    <!-- Alerts Banner -->
    <div v-if="activeAlerts.length > 0" class="bg-yellow-50 dark:bg-yellow-900/30 border-l-4 border-yellow-400 p-4 rounded-r-lg">
      <div class="flex items-center">
        <svg class="w-5 h-5 text-yellow-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
        </svg>
        <span class="font-medium text-yellow-700 dark:text-yellow-300">{{ activeAlerts.length }} alert(s) triggered!</span>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>

    <!-- Metrics Cards -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricsCard
        title="Current Value"
        :value="formatCurrency(metrics?.current_value)"
        icon="wallet"
        color="blue"
      />
      <MetricsCard
        title="All-Time High"
        :value="formatCurrency(metrics?.ath_value)"
        :subtitle="metrics?.ath_date ? `Reached: ${metrics.ath_date}` : ''"
        icon="trophy"
        color="yellow"
      />
      <MetricsCard
        title="Drawdown"
        :value="formatPercent(metrics?.drawdown_percent)"
        subtitle="From ATH"
        icon="chart-down"
        :color="metrics?.drawdown_percent < 0 ? 'red' : 'green'"
      />
      <MetricsCard
        title="vs BTC"
        :value="formatPercent(metrics?.btc_comparison_percent)"
        subtitle="Performance comparison"
        icon="bitcoin"
        :color="metrics?.btc_comparison_percent >= 0 ? 'green' : 'red'"
      />
    </div>

    <!-- Variation Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="card">
        <h3 class="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">24h Variation</h3>
        <p :class="[
          'text-3xl font-bold',
          metrics?.variation_24h >= 0 ? 'text-green-600' : 'text-red-600'
        ]">
          {{ formatPercent(metrics?.variation_24h) }}
        </p>
      </div>
      <div class="card">
        <h3 class="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">30d Variation</h3>
        <p :class="[
          'text-3xl font-bold',
          metrics?.variation_30d >= 0 ? 'text-green-600' : 'text-red-600'
        ]">
          {{ formatPercent(metrics?.variation_30d) }}
        </p>
      </div>
    </div>

    <!-- Portfolio Evolution Chart -->
    <div class="card">
      <h2 class="text-xl font-semibold text-gray-800 dark:text-white mb-4">Portfolio Evolution</h2>
      <div class="h-80">
        <LineChart v-if="chartData" :data="chartData" />
        <div v-else class="flex items-center justify-center h-full text-gray-500">
          No data available
        </div>
      </div>
    </div>

    <!-- Year Summary -->
    <div v-if="monthlyData" class="card">
      <h2 class="text-xl font-semibold text-gray-800 dark:text-white mb-4">
        {{ monthlyData.year }} Summary
      </h2>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <p class="text-sm text-gray-500 dark:text-gray-400">Start Value</p>
          <p class="text-xl font-bold text-gray-800 dark:text-white">
            {{ formatCurrency(monthlyData.start_value) }}
          </p>
        </div>
        <div>
          <p class="text-sm text-gray-500 dark:text-gray-400">End Value</p>
          <p class="text-xl font-bold text-gray-800 dark:text-white">
            {{ formatCurrency(monthlyData.end_value) }}
          </p>
        </div>
        <div>
          <p class="text-sm text-gray-500 dark:text-gray-400">Delta $</p>
          <p :class="[
            'text-xl font-bold',
            monthlyData.delta_usd >= 0 ? 'text-green-600' : 'text-red-600'
          ]">
            {{ formatCurrency(monthlyData.delta_usd) }}
          </p>
        </div>
        <div>
          <p class="text-sm text-gray-500 dark:text-gray-400">Delta %</p>
          <p :class="[
            'text-xl font-bold',
            monthlyData.delta_percent >= 0 ? 'text-green-600' : 'text-red-600'
          ]">
            {{ formatPercent(monthlyData.delta_percent) }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
