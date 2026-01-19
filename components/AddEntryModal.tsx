'use client'

import { useState } from 'react'
import { formatCurrency } from '@/lib/utils'

interface Wallet {
  id: number
  name: string
}

interface AddEntryModalProps {
  wallets: Wallet[]
  year: number
  month?: number
  type: 'monthly' | 'daily'
  onClose: () => void
  onAdded: () => void
}

const MONTHS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' }
]

// Generate years from 2020 to current year
const currentYear = new Date().getFullYear()
const YEARS = Array.from({ length: currentYear - 2019 }, (_, i) => currentYear - i)

export default function AddEntryModal({ wallets, year, month, type, onClose, onAdded }: AddEntryModalProps) {
  const [selectedYear, setSelectedYear] = useState(year)
  const [selectedMonth, setSelectedMonth] = useState(month || new Date().getMonth() + 1)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [btcPrice, setBtcPrice] = useState('')
  const [entries, setEntries] = useState(
    wallets.map(w => ({ walletId: w.id, walletName: w.name, valueUsd: '' }))
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const totalValue = entries.reduce((sum, e) => {
    const val = parseFloat(e.valueUsd) || 0
    return sum + val
  }, 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const validEntries = entries.filter(e => e.valueUsd && parseFloat(e.valueUsd) > 0)

      if (validEntries.length === 0) {
        setError('Please enter at least one wallet value')
        setLoading(false)
        return
      }

      if (type === 'monthly') {
        const res = await fetch('/api/monthly/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            year: selectedYear,
            month: selectedMonth,
            btcPrice: btcPrice ? parseFloat(btcPrice) : null,
            entries: validEntries.map(e => ({
              walletId: e.walletId,
              valueUsd: parseFloat(e.valueUsd)
            }))
          })
        })

        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Failed to add entries')
        }
      } else {
        for (const entry of validEntries) {
          const res = await fetch('/api/daily', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              walletId: entry.walletId,
              date: selectedDate,
              valueUsd: parseFloat(entry.valueUsd)
            })
          })

          if (!res.ok) {
            const data = await res.json()
            throw new Error(data.error || 'Failed to add entry')
          }
        }
      }

      onAdded()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const updateEntry = (index: number, value: string) => {
    const newEntries = [...entries]
    newEntries[index].valueUsd = value
    setEntries(newEntries)
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50" onClick={onClose}></div>

      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Add {type === 'monthly' ? 'Monthly' : 'Daily'} Entry
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-3 text-red-700 dark:text-red-300 text-sm">
                {error}
              </div>
            )}

            {type === 'monthly' ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Year</label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    className="input"
                  >
                    {YEARS.map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Month</label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                    className="input"
                  >
                    {MONTHS.map(m => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              <div>
                <label className="label">Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="input"
                />
                <p className="text-xs text-gray-500 mt-1">You can select any past date</p>
              </div>
            )}

            {type === 'monthly' && (
              <div>
                <label className="label">BTC Price (optional)</label>
                <input
                  type="number"
                  value={btcPrice}
                  onChange={(e) => setBtcPrice(e.target.value)}
                  step="0.01"
                  placeholder="e.g., 94500.00"
                  className="input"
                />
              </div>
            )}

            <div>
              <label className="label">Wallet Values</label>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {entries.map((entry, index) => (
                  <div key={entry.walletId} className="flex items-center space-x-2">
                    <span className="w-32 text-sm text-gray-600 dark:text-gray-400 truncate">
                      {entry.walletName}
                    </span>
                    <div className="flex-1 relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                      <input
                        type="number"
                        value={entry.valueUsd}
                        onChange={(e) => updateEntry(index, e.target.value)}
                        step="0.01"
                        placeholder="0.00"
                        className="input pl-7"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-700 dark:text-gray-300">Total</span>
                <span className="text-xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(totalValue)}
                </span>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button type="button" onClick={onClose} className="btn btn-secondary">
                Cancel
              </button>
              <button type="submit" disabled={loading} className="btn btn-primary">
                {loading ? 'Saving...' : 'Save Entry'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
