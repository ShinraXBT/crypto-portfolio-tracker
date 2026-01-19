<script setup>
import { onMounted, computed, ref } from 'vue'
import { usePortfolioStore } from '../stores/portfolio'
import { metricsApi } from '../services/api'
import LineChart from '../components/charts/LineChart.vue'
import BarChart from '../components/charts/BarChart.vue'
import PieChart from '../components/charts/PieChart.vue'

const store = usePortfolioStore()

const loading = ref(true)
const roiData = ref(null)
const drawdownData = ref(null)
const btcComparisonData = ref(null)

const initialInvestment = ref(100000)

const monthlyData = computed(() => store.monthlyData)

onMounted(async () => {
  await Promise.all([
    store.fetchWallets(),
    store.fetchMonthlySummary(),
    fetchAnalytics()
  ])
})

async function fetchAnalytics() {
  loading.value = true
  try {
    const [roiRes, drawdownRes, btcRes] = await Promise.all([
      metricsApi.getRoi(initialInvestment.value),
      metricsApi.getDrawdown(),
      metricsApi.getVsBtc()
    ])
    roiData.value = roiRes.data
    drawdownData.value = drawdownRes.data
    btcComparisonData.value = btcRes.data
  } catch (e) {
    console.error('Failed to fetch analytics:', e)
  } finally {
    loading.value = false
  }
}

const evolutionChartData = computed(() => {
  if (!monthlyData.value?.monthly_data) return null

  const labels = monthlyData.value.monthly_data.map(m => m.month_name.substring(0, 3))
  const values = monthlyData.value.monthly_data.map(m => m.total_value)

  return {
    labels,
    datasets: [{
      label: 'Portfolio Value',
      data: values,
      borderColor: '#3b82f6',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      fill: true,
      tension: 0.4
    }]
  }
})

const deltaChartData = computed(() => {
  if (!monthlyData.value?.monthly_data) return null

  const labels = monthlyData.value.monthly_data.map(m => m.month_name.substring(0, 3))
  const deltas = monthlyData.value.monthly_data.map(m => m.delta_usd)

  return {
    labels,
    datasets: [{
      label: 'Monthly Delta ($)',
      data: deltas,
      backgroundColor: deltas.map(d => d >= 0 ? 'rgba(34, 197, 94, 0.8)' : 'rgba(239, 68, 68, 0.8)'),
      borderColor: deltas.map(d => d >= 0 ? '#22c55e' : '#ef4444'),
      borderWidth: 1
    }]
  }
})

const allocationChartData = computed(() => {
  if (!monthlyData.value?.monthly_data?.length) return null

  const latestMonth = monthlyData.value.monthly_data[monthlyData.value.monthly_data.length - 1]
  if (!latestMonth?.wallets) return null

  const labels = Object.keys(latestMonth.wallets)
  const values = Object.values(latestMonth.wallets)

  const colors = [
    '#3b82f6', '#ef4444', '#22c55e', '#f59e0b',
    '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'
  ]

  return {
    labels,
    datasets: [{
      data: values,
      backgroundColor: colors.slice(0, labels.length),
      borderWidth: 0
    }]
  }
})

const btcComparisonChartData = computed(() => {
  if (!btcComparisonData.value?.history) return null

  const history = btcComparisonData.value.history
  const labels = history.map(h => `${h.month}/${h.year}`)

  return {
    labels,
    datasets: [
      {
        label: 'Portfolio %',
        data: history.map(h => h.portfolio_perf_percent),
        borderColor: '#3b82f6',
        backgroundColor: 'transparent',
        tension: 0.4
      },
      {
        label: 'BTC %',
        data: history.map(h => h.btc_perf_percent),
        borderColor: '#f59e0b',
        backgroundColor: 'transparent',
        tension: 0.4
      }
    ]
  }
})

const drawdownChartData = computed(() => {
  if (!drawdownData.value?.history) return null

  const history = drawdownData.value.history
  const labels = history.map(h => `${h.month}/${h.year}`)

  return {
    labels,
    datasets: [{
      label: 'Drawdown %',
      data: history.map(h => h.drawdown_percent),
      borderColor: '#ef4444',
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
      fill: true,
      tension: 0.4
    }]
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
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Analytics</h1>
      <div class="flex items-center space-x-2">
        <label class="text-sm text-gray-600 dark:text-gray-400">Initial Investment:</label>
        <input
          type="number"
          v-model="initialInvestment"
          @change="fetchAnalytics"
          class="input w-32"
        />
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>

    <template v-else>
      <!-- ROI Summary -->
      <div v-if="roiData" class="card">
        <h2 class="text-xl font-semibold text-gray-800 dark:text-white mb-4">ROI Analysis</h2>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p class="text-sm text-gray-500">Initial Investment</p>
            <p class="text-xl font-bold text-gray-900 dark:text-white">
              {{ formatCurrency(roiData.initial_investment) }}
            </p>
          </div>
          <div>
            <p class="text-sm text-gray-500">Current Value</p>
            <p class="text-xl font-bold text-gray-900 dark:text-white">
              {{ formatCurrency(roiData.current_value) }}
            </p>
          </div>
          <div>
            <p class="text-sm text-gray-500">Profit/Loss</p>
            <p :class="['text-xl font-bold', roiData.profit_loss >= 0 ? 'text-green-600' : 'text-red-600']">
              {{ formatCurrency(roiData.profit_loss) }}
            </p>
          </div>
          <div>
            <p class="text-sm text-gray-500">ROI</p>
            <p :class="['text-xl font-bold', roiData.roi_percent >= 0 ? 'text-green-600' : 'text-red-600']">
              {{ formatPercent(roiData.roi_percent) }}
            </p>
          </div>
        </div>
      </div>

      <!-- Charts Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Portfolio Evolution -->
        <div class="card">
          <h2 class="text-lg font-semibold text-gray-800 dark:text-white mb-4">Portfolio Evolution</h2>
          <div class="h-64">
            <LineChart v-if="evolutionChartData" :data="evolutionChartData" />
            <div v-else class="flex items-center justify-center h-full text-gray-500">No data</div>
          </div>
        </div>

        <!-- Monthly Deltas -->
        <div class="card">
          <h2 class="text-lg font-semibold text-gray-800 dark:text-white mb-4">Monthly Performance</h2>
          <div class="h-64">
            <BarChart v-if="deltaChartData" :data="deltaChartData" />
            <div v-else class="flex items-center justify-center h-full text-gray-500">No data</div>
          </div>
        </div>

        <!-- Allocation Pie -->
        <div class="card">
          <h2 class="text-lg font-semibold text-gray-800 dark:text-white mb-4">Current Allocation</h2>
          <div class="h-64">
            <PieChart v-if="allocationChartData" :data="allocationChartData" />
            <div v-else class="flex items-center justify-center h-full text-gray-500">No data</div>
          </div>
        </div>

        <!-- Drawdown -->
        <div class="card">
          <h2 class="text-lg font-semibold text-gray-800 dark:text-white mb-4">
            Drawdown Analysis
            <span v-if="drawdownData" class="text-sm font-normal text-red-600 ml-2">
              (Max: {{ formatPercent(drawdownData.max_drawdown_percent) }})
            </span>
          </h2>
          <div class="h-64">
            <LineChart v-if="drawdownChartData" :data="drawdownChartData" />
            <div v-else class="flex items-center justify-center h-full text-gray-500">No data</div>
          </div>
        </div>
      </div>

      <!-- BTC Comparison -->
      <div class="card">
        <h2 class="text-xl font-semibold text-gray-800 dark:text-white mb-4">
          Portfolio vs BTC
          <span v-if="btcComparisonData" :class="[
            'text-sm font-normal ml-2',
            btcComparisonData.current_outperformance_percent >= 0 ? 'text-green-600' : 'text-red-600'
          ]">
            ({{ btcComparisonData.current_outperformance_percent >= 0 ? 'Outperforming' : 'Underperforming' }} by {{ formatPercent(Math.abs(btcComparisonData.current_outperformance_percent)) }})
          </span>
        </h2>
        <div class="h-80">
          <LineChart v-if="btcComparisonChartData" :data="btcComparisonChartData" />
          <div v-else class="flex items-center justify-center h-full text-gray-500">
            No BTC price data available
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
