import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const wallets = await prisma.wallet.findMany({
      orderBy: { name: 'asc' }
    })
    return NextResponse.json(wallets)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch wallets' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, color } = body

    const wallet = await prisma.wallet.create({
      data: {
        name,
        description,
        color: color || '#3b82f6'
      }
    })

    return NextResponse.json(wallet, { status: 201 })
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Wallet with this name already exists' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create wallet' }, { status: 500 })
  }
}
