import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())
    const month = parseInt(searchParams.get('month') || (new Date().getMonth() + 1).toString())

    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0, 23, 59, 59)

    const entries = await prisma.dailyEntry.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      include: { wallet: true },
      orderBy: { date: 'asc' }
    })

    // Group by date
    const dailyData: Record<string, { total: number; wallets: Record<string, number> }> = {}

    for (const entry of entries) {
      const dateKey = entry.date.toISOString().split('T')[0]
      if (!dailyData[dateKey]) {
        dailyData[dateKey] = { total: 0, wallets: {} }
      }
      dailyData[dateKey].total += entry.valueUsd
      dailyData[dateKey].wallets[entry.wallet.name] = entry.valueUsd
    }

    // Calculate variations
    const sortedDates = Object.keys(dailyData).sort()
    const snapshots = []
    let prevTotal: number | null = null

    for (const date of sortedDates) {
      const data = dailyData[date]
      const total = data.total
      let deltaPercent = 0

      if (prevTotal && prevTotal > 0) {
        deltaPercent = ((total - prevTotal) / prevTotal) * 100
      }

      snapshots.push({
        date,
        totalValue: Math.round(total * 100) / 100,
        deltaPercent: Math.round(deltaPercent * 100) / 100,
        wallets: data.wallets
      })
      prevTotal = total
    }

    return NextResponse.json(snapshots)
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Failed to fetch snapshots' }, { status: 500 })
  }
}
