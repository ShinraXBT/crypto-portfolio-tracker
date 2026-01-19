'use client'

import { useEffect, useState } from 'react'
import { formatCurrency, formatPercent } from '@/lib/utils'
import MetricsCard from '@/components/MetricsCard'
import LineChart from '@/components/charts/LineChart'

interface Metrics {
  currentValue: number
  athValue: number
  athDate: string | null
  roiPercent: number
  drawdownPercent: number
  btcComparisonPercent: number
  variation24h: number | null
  variation30d: number | null
}

interface MonthlySummary {
  year: number
  startValue: number
  endValue: number
  deltaUsd: number
  deltaPercent: number
  monthlyData: Array<{
    month: number
    monthName: string
    totalValue: number
    deltaUsd: number
    deltaPercent: number
  }>
}

export default function Dashboard() {
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [monthlyData, setMonthlyData] = useState<MonthlySummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [metricsRes, monthlyRes] = await Promise.all([
          fetch('/api/metrics'),
          fetch(`/api/monthly/summary?year=${new Date().getFullYear()}`)
        ])

        if (metricsRes.ok) {
          setMetrics(await metricsRes.json())
        }
        if (monthlyRes.ok) {
          setMonthlyData(await monthlyRes.json())
        }
      } catch (error) {
        console.error('Failed to fetch data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const chartData = monthlyData?.monthlyData ? {
    labels: monthlyData.monthlyData.map(m => m.monthName.substring(0, 3)),
    values: monthlyData.monthlyData.map(m => m.totalValue)
  } : null

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Last updated: {new Date().toLocaleString()}
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricsCard
          title="Current Value"
          value={formatCurrency(metrics?.currentValue)}
          icon="wallet"
          color="blue"
        />
        <MetricsCard
          title="All-Time High"
          value={formatCurrency(metrics?.athValue)}
          subtitle={metrics?.athDate ? `Reached: ${metrics.athDate}` : ''}
          icon="trophy"
          color="yellow"
        />
        <MetricsCard
          title="Drawdown"
          value={formatPercent(metrics?.drawdownPercent)}
          subtitle="From ATH"
          icon="chart-down"
          color={metrics?.drawdownPercent && metrics.drawdownPercent < 0 ? 'red' : 'green'}
        />
        <MetricsCard
          title="vs BTC"
          value={formatPercent(metrics?.btcComparisonPercent)}
          subtitle="Performance comparison"
          icon="bitcoin"
          color={metrics?.btcComparisonPercent && metrics.btcComparisonPercent >= 0 ? 'green' : 'red'}
        />
      </div>

      {/* Variation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">24h Variation</h3>
          <p className={`text-3xl font-bold ${
            metrics?.variation24h && metrics.variation24h >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {formatPercent(metrics?.variation24h)}
          </p>
        </div>
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">30d Variation</h3>
          <p className={`text-3xl font-bold ${
            metrics?.variation30d && metrics.variation30d >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {formatPercent(metrics?.variation30d)}
          </p>
        </div>
      </div>

      {/* Portfolio Evolution Chart */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Portfolio Evolution</h2>
        <div className="h-80">
          {chartData ? (
            <LineChart data={chartData} />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              No data available
            </div>
          )}
        </div>
      </div>

      {/* Year Summary */}
      {monthlyData && (
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
            {monthlyData.year} Summary
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Start Value</p>
              <p className="text-xl font-bold text-gray-800 dark:text-white">
                {formatCurrency(monthlyData.startValue)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">End Value</p>
              <p className="text-xl font-bold text-gray-800 dark:text-white">
                {formatCurrency(monthlyData.endValue)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Delta $</p>
              <p className={`text-xl font-bold ${
                monthlyData.deltaUsd >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatCurrency(monthlyData.deltaUsd)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Delta %</p>
              <p className={`text-xl font-bold ${
                monthlyData.deltaPercent >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatPercent(monthlyData.deltaPercent)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
