import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { MONTH_NAMES } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())

    // Get all entries for the year
    const entries = await prisma.monthlyEntry.findMany({
      where: { year },
      include: { wallet: true }
    })

    // Get previous December for calculating January delta
    const prevDecEntries = await prisma.monthlyEntry.findMany({
      where: { year: year - 1, month: 12 }
    })
    const prevDecTotal = prevDecEntries.reduce((sum, e) => sum + e.valueUsd, 0)

    // Get all wallets
    const wallets = await prisma.wallet.findMany()
    const walletMap = Object.fromEntries(wallets.map(w => [w.id, w.name]))

    // Group entries by month
    const monthlyData: Record<number, { total: number; btcPrice: number | null; wallets: Record<string, number> }> = {}

    for (const entry of entries) {
      if (!monthlyData[entry.month]) {
        monthlyData[entry.month] = { total: 0, btcPrice: entry.btcPrice, wallets: {} }
      }
      monthlyData[entry.month].total += entry.valueUsd
      const walletName = walletMap[entry.walletId] || `Wallet ${entry.walletId}`
      monthlyData[entry.month].wallets[walletName] = entry.valueUsd
    }

    // Calculate deltas
    const resultMonths = []
    let prevTotal = prevDecTotal

    for (let month = 1; month <= 12; month++) {
      if (monthlyData[month]) {
        const data = monthlyData[month]
        const total = data.total
        const deltaUsd = prevTotal > 0 ? total - prevTotal : 0
        const deltaPercent = prevTotal > 0 ? (deltaUsd / prevTotal) * 100 : 0

        resultMonths.push({
          year,
          month,
          monthName: MONTH_NAMES[month],
          totalValue: total,
          deltaUsd: Math.round(deltaUsd * 100) / 100,
          deltaPercent: Math.round(deltaPercent * 100) / 100,
          btcPrice: data.btcPrice,
          wallets: data.wallets
        })
        prevTotal = total
      }
    }

    // Calculate yearly summary
    const startValue = prevDecTotal > 0 ? prevDecTotal : (resultMonths[0]?.totalValue || 0)
    const endValue = resultMonths[resultMonths.length - 1]?.totalValue || 0
    const yearlyDelta = endValue - startValue
    const yearlyPercent = startValue > 0 ? (yearlyDelta / startValue) * 100 : 0

    return NextResponse.json({
      year,
      startValue: Math.round(startValue * 100) / 100,
      endValue: Math.round(endValue * 100) / 100,
      deltaUsd: Math.round(yearlyDelta * 100) / 100,
      deltaPercent: Math.round(yearlyPercent * 100) / 100,
      monthlyData: resultMonths
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Failed to fetch summary' }, { status: 500 })
  }
}
