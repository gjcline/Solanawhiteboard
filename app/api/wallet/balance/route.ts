import { type NextRequest, NextResponse } from "next/server"

// Solana RPC endpoints
const SOLANA_RPC_ENDPOINTS = [
  "https://api.mainnet-beta.solana.com",
  "https://solana-api.projectserum.com",
  "https://rpc.ankr.com/solana",
  "https://solana.public-rpc.com",
]

// Commitment levels to try
const COMMITMENT_LEVELS = ["processed", "confirmed", "finalized"]

async function fetchBalanceFromRPC(address: string, rpcUrl: string, commitment: string): Promise<number> {
  console.log(`[Server] Fetching balance from ${rpcUrl} with ${commitment} commitment`)

  const response = await fetch(rpcUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "getBalance",
      params: [address, { commitment }],
    }),
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }

  const data = await response.json()
  console.log(`[Server] Response from ${rpcUrl}:`, data)

  if (data.error) {
    throw new Error(`RPC Error: ${data.error.message}`)
  }

  if (data.result && typeof data.result.value === "number") {
    const balanceInSOL = data.result.value / 1000000000
    console.log(`[Server] Balance: ${balanceInSOL} SOL from ${rpcUrl} (${commitment})`)
    return balanceInSOL
  }

  throw new Error("Invalid response format")
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const address = searchParams.get("address")
    const network = searchParams.get("network") || "mainnet-beta"

    if (!address) {
      return NextResponse.json({ error: "Address parameter is required" }, { status: 400 })
    }

    console.log(`[Server] Fetching balance for address: ${address} on ${network}`)

    // Try each RPC endpoint with each commitment level
    let lastError: Error | null = null

    for (const rpcUrl of SOLANA_RPC_ENDPOINTS) {
      for (const commitment of COMMITMENT_LEVELS) {
        try {
          const balance = await fetchBalanceFromRPC(address, rpcUrl, commitment)

          console.log(`[Server] ✅ Successfully fetched balance: ${balance} SOL`)

          return NextResponse.json({
            balance,
            address,
            network,
            rpcUrl,
            commitment,
            timestamp: new Date().toISOString(),
          })
        } catch (error) {
          console.log(`[Server] Failed ${rpcUrl} with ${commitment}:`, error)
          lastError = error as Error
          continue
        }
      }
    }

    // All methods failed
    console.error(`[Server] All balance fetch methods failed:`, lastError)

    return NextResponse.json(
      {
        error: "Failed to fetch balance from all RPC endpoints",
        details: lastError?.message,
        address,
        network,
      },
      { status: 500 },
    )
  } catch (error) {
    console.error("[Server] Balance fetch error:", error)

    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
