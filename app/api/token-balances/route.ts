// app/api/token-balances/route.ts
import Moralis from 'moralis'
import { NextResponse, NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const wallet  = searchParams.get('wallet')
  const chainId = searchParams.get('chainId')

  if (!wallet || !chainId) {
    return NextResponse.json(
      { error: 'Missing wallet or chainId' },
      { status: 400 }
    )
  }

  // Initialize Moralis on the server only
  if (!Moralis.Core.isStarted) {
    await Moralis.start({ apiKey: process.env.MORALIS_API! })
  }

  try {
    // Map your chainId to Moralis chain code
    const chainCode = chainId === '0x2105' ? '0x2105' : '0x1'
    const response = await Moralis.EvmApi.token.getWalletTokenBalances({
      chain: chainCode,
      address: wallet,
      excludeSpam: true,
    })

    return NextResponse.json(response.raw)
  } catch (err: any) {
    console.error('Moralis error:', err)
    return NextResponse.json(
      { error: err.message || 'Internal Server Error' },
      { status: 500 }
    )
  }
}
