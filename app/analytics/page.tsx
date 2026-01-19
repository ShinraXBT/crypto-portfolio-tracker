'use client'

import { useEffect, useState } from 'react'
import { formatCurrency, formatPercent } from '@/lib/utils'
import LineChart from '@/components/charts/LineChart'

interface MonthlySummary {
  year: number
  monthlyData: Array<{
    monthName: string
    totalValue: number
    deltaUsd: number
    wallets: Record<string, number>
  }>
}

interface Metrics {
  currentValue: number
  athValue: number
  drawdownPercent: number
  roiPercent: number
}

export default function AnalyticsPage() {
  const [monthlyData, setMonthlyData] = useState<MonthlySummary | null>(null)
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [initialInvestment, setInitialInvestment] = useState(100000)
  const [loading, setLoading] = useState(true)

  async function fetchData() {
    setLoading(true)
    try {
      const [monthlyRes, metricsRes] = await Promise.all([
        fetch(`/api/monthly/summary?year=${new Date().getFullYear()}`),
        fetch(`/api/metrics?initialInvestment=${initialInvestment}`)
      ])

      if (monthlyRes.ok) setMonthlyData(await monthlyRes.json())
      if (metricsRes.ok) setMetrics(await metricsRes.json())
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [initialInvestment])

  const evolutionChartData = monthlyData?.monthlyData ? {
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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Analytics</h1>
        <div className="flex items-center space-x-2">
          <label className="text-sm text-gray-600 dark:text-gray-400">Initial Investment:</label>
          <input
            type="number"
            value={initialInvestment}
            onChange={(e) => setInitialInvestment(parseInt(e.target.value) || 0)}
            className="input w-32"
          />
        </div>
      </div>

      {/* ROI Summary */}
      {metrics && (
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">ROI Analysis</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-500">Initial Investment</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(initialInvestment)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Current Value</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(metrics.currentValue)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Profit/Loss</p>
              <p className={`text-xl font-bold ${
                metrics.currentValue - initialInvestment >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatCurrency(metrics.currentValue - initialInvestment)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">ROI</p>
              <p className={`text-xl font-bold ${
                metrics.roiPercent >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatPercent(metrics.roiPercent)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Portfolio Evolution</h2>
          <div className="h-64">
            {evolutionChartData ? (
              <LineChart data={evolutionChartData} />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">No data</div>
            )}
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
            Drawdown Analysis
            {metrics && (
              <span className="text-sm font-normal text-red-600 ml-2">
                (Current: {formatPercent(metrics.drawdownPercent)})
              </span>
            )}
          </h2>
          <div className="h-64">
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-4xl font-bold text-red-600">{formatPercent(metrics?.drawdownPercent)}</p>
                <p className="text-sm text-gray-500 mt-2">From All-Time High</p>
                <p className="text-lg font-semibold text-gray-700 dark:text-gray-300 mt-4">
                  ATH: {formatCurrency(metrics?.athValue)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Allocation */}
      {monthlyData?.monthlyData && monthlyData.monthlyData.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Current Allocation</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(monthlyData.monthlyData[monthlyData.monthlyData.length - 1]?.wallets || {}).map(([name, value]) => {
              const total = Object.values(monthlyData.monthlyData[monthlyData.monthlyData.length - 1]?.wallets || {}).reduce((a, b) => a + b, 0)
              const percent = total > 0 ? (value / total) * 100 : 0
              return (
                <div key={name} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">{name}</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(value)}</p>
                  <p className="text-sm text-blue-600">{percent.toFixed(1)}%</p>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
