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

interface EntryField {
  id: number
  name: string
  value: string
}

export default function AddEntryModal({ wallets, year, month, type, onClose, onAdded }: AddEntryModalProps) {
  const [selectedYear, setSelectedYear] = useState(year)
  const [selectedMonth, setSelectedMonth] = useState(month || new Date().getMonth() + 1)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [btcPrice, setBtcPrice] = useState('')
  const [fields, setFields] = useState<EntryField[]>([
    { id: 1, name: '', value: '' }
  ])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Counter for unique IDs
  const [nextId, setNextId] = useState(2)

  const totalValue = fields.reduce((sum, f) => {
    const val = parseFloat(f.value) || 0
    return sum + val
  }, 0)

  const addField = () => {
    setFields([...fields, { id: nextId, name: '', value: '' }])
    setNextId(nextId + 1)
  }

  const removeField = (id: number) => {
    if (fields.length > 1) {
      setFields(fields.filter(f => f.id !== id))
    }
  }

  const updateField = (id: number, key: 'name' | 'value', newValue: string) => {
    setFields(fields.map(f =>
      f.id === id ? { ...f, [key]: newValue } : f
    ))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Filter valid entries (must have name and value)
      const validFields = fields.filter(f => f.name.trim() && f.value && parseFloat(f.value) > 0)

      if (validFields.length === 0) {
        setError('Please add at least one wallet with a name and value')
        setLoading(false)
        return
      }

      // Create wallets that don't exist and get their IDs
      const walletIds: Record<string, number> = {}

      for (const field of validFields) {
        const walletName = field.name.trim()

        // Check if wallet already exists
        const existingWallet = wallets.find(w => w.name.toLowerCase() === walletName.toLowerCase())

        if (existingWallet) {
          walletIds[walletName] = existingWallet.id
        } else {
          // Create new wallet
          const res = await fetch('/api/wallets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: walletName })
          })

          if (res.ok) {
            const newWallet = await res.json()
            walletIds[walletName] = newWallet.id
          } else {
            throw new Error(`Failed to create wallet "${walletName}"`)
          }
        }
      }

      // Now create the entries
      if (type === 'monthly') {
        const entries = validFields.map(f => ({
          walletId: walletIds[f.name.trim()],
          valueUsd: parseFloat(f.value)
        }))

        const res = await fetch('/api/monthly/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            year: selectedYear,
            month: selectedMonth,
            btcPrice: btcPrice ? parseFloat(btcPrice) : null,
            entries
          })
        })

        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Failed to add entries')
        }
      } else {
        // Daily entries
        for (const field of validFields) {
          const res = await fetch('/api/daily', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              walletId: walletIds[field.name.trim()],
              date: selectedDate,
              valueUsd: parseFloat(field.value)
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

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50" onClick={onClose}></div>

      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
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

          <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
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
              <div className="flex items-center justify-between mb-2">
                <label className="label mb-0">Wallet Values</label>
                <button
                  type="button"
                  onClick={addField}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Wallet
                </button>
              </div>

              <div className="space-y-3 max-h-64 overflow-y-auto">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={field.name}
                      onChange={(e) => updateField(field.id, 'name', e.target.value)}
                      placeholder="Wallet name (e.g., Rabby)"
                      className="input flex-1"
                    />
                    <div className="relative w-36">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                      <input
                        type="number"
                        value={field.value}
                        onChange={(e) => updateField(field.id, 'value', e.target.value)}
                        step="0.01"
                        placeholder="0.00"
                        className="input pl-7 w-full"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeField(field.id)}
                      disabled={fields.length === 1}
                      className="p-2 text-gray-400 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
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
