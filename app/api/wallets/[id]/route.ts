import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const wallet = await prisma.wallet.findUnique({
      where: { id: parseInt(params.id) }
    })

    if (!wallet) {
      return NextResponse.json({ error: 'Wallet not found' }, { status: 404 })
    }

    return NextResponse.json(wallet)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch wallet' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { name, description, color } = body

    const wallet = await prisma.wallet.update({
      where: { id: parseInt(params.id) },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(color && { color })
      }
    })

    return NextResponse.json(wallet)
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Wallet not found' }, { status: 404 })
    }
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Wallet with this name already exists' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to update wallet' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.wallet.delete({
      where: { id: parseInt(params.id) }
    })

    return new NextResponse(null, { status: 204 })
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Wallet not found' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Failed to delete wallet' }, { status: 500 })
  }
}
