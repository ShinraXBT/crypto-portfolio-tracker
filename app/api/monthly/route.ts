import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const year = searchParams.get('year')
    const walletId = searchParams.get('walletId')

    const entries = await prisma.monthlyEntry.findMany({
      where: {
        ...(year && { year: parseInt(year) }),
        ...(walletId && { walletId: parseInt(walletId) })
      },
      include: { wallet: true },
      orderBy: [{ year: 'asc' }, { month: 'asc' }]
    })

    return NextResponse.json(entries)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch entries' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { walletId, year, month, valueUsd, btcPrice, notes } = body

    const entry = await prisma.monthlyEntry.create({
      data: {
        walletId,
        year,
        month,
        valueUsd,
        btcPrice,
        notes
      }
    })

    return NextResponse.json(entry, { status: 201 })
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Entry already exists for this wallet/month' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create entry' }, { status: 500 })
  }
}
