import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const checks: Record<string, any> = {
    timestamp: new Date().toISOString(),
    env: {
      DATABASE_URL: process.env.DATABASE_URL ? 'SET (hidden)' : 'NOT SET',
      NODE_ENV: process.env.NODE_ENV
    }
  }

  // Test database connection
  try {
    await prisma.$queryRaw`SELECT 1`
    checks.database = 'connected'

    // Count tables
    const walletCount = await prisma.wallet.count()
    checks.walletCount = walletCount
  } catch (error: any) {
    checks.database = 'error'
    checks.databaseError = error.message
  }

  return NextResponse.json(checks)
}
