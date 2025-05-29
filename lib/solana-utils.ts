// Enhanced Solana utilities with Web3.js support
export interface SolanaWallet {
  publicKey: string
  balance: number
  isConnected: boolean
}

export interface SolanaTransaction {
  signature: string
  amount: number
  from: string
  to: string
  timestamp: number
  status: "confirmed" | "pending" | "failed"
  network: string
}

// Solana Web3.js imports (dynamic)
let Connection: any = null
let PublicKey: any = null
let Transaction: any = null
let SystemProgram: any = null
let LAMPORTS_PER_SOL = 1000000000

// Initialize Solana Web3.js
export const initializeSolanaWeb3 = async (): Promise<boolean> => {
  try {
    const solanaWeb3 = await import("@solana/web3.js")
    Connection = solanaWeb3.Connection
    PublicKey = solanaWeb3.PublicKey
    Transaction = solanaWeb3.Transaction
    SystemProgram = solanaWeb3.SystemProgram
    LAMPORTS_PER_SOL = solanaWeb3.LAMPORTS_PER_SOL
    console.log("Solana Web3.js initialized successfully")
    return true
  } catch (error) {
    console.warn("Failed to initialize Solana Web3.js:", error)
    return false
  }
}

// Check if Phantom wallet is installed
export function isPhantomWalletInstalled(): boolean {
  return typeof window !== "undefined" && !!(window as any).phantom?.solana
}

// Connect to Phantom wallet
export async function connectPhantomWallet(): Promise<SolanaWallet> {
  if (!isPhantomWalletInstalled()) {
    throw new Error("Phantom wallet is not installed")
  }

  const phantom = (window as any).phantom.solana

  try {
    const response = await phantom.connect()
    return {
      publicKey: response.publicKey.toString(),
      balance: 0, // Will be fetched separately
      isConnected: true,
    }
  } catch (error) {
    throw new Error("Failed to connect to Phantom wallet")
  }
}

// Disconnect from Phantom wallet
export async function disconnectPhantomWallet(): Promise<void> {
  if (!isPhantomWalletInstalled()) {
    return
  }

  const phantom = (window as any).phantom.solana
  await phantom.disconnect()
}

// Get wallet balance using Web3.js or fallback to RPC
export async function getWalletBalance(publicKey: string, network = "devnet"): Promise<number> {
  const rpcUrl = `https://api.${network}.solana.com`

  // Try Web3.js first
  if (Connection && PublicKey) {
    try {
      const connection = new Connection(rpcUrl, "confirmed")
      const pubKey = new PublicKey(publicKey)
      const balance = await connection.getBalance(pubKey)
      return balance / LAMPORTS_PER_SOL
    } catch (error) {
      console.warn("Web3.js balance fetch failed, falling back to RPC:", error)
    }
  }

  // Fallback to direct RPC call
  try {
    const response = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getBalance",
        params: [publicKey],
      }),
    })

    const data = await response.json()
    if (data.result && typeof data.result.value === "number") {
      return data.result.value / 1000000000
    }
    throw new Error("RPC call failed")
  } catch (error) {
    console.error("All balance fetch methods failed:", error)
    return 0
  }
}

// Send SOL transaction using Web3.js or fallback
export async function sendSolanaTransaction(
  fromWallet: string,
  toWallet: string,
  amount: number,
  network = "devnet",
): Promise<SolanaTransaction> {
  const rpcUrl = `https://api.${network}.solana.com`

  // Try Web3.js implementation
  if (Connection && PublicKey && Transaction && SystemProgram) {
    try {
      const connection = new Connection(rpcUrl, "confirmed")
      const fromPubkey = new PublicKey(fromWallet)
      const toPubkey = new PublicKey(toWallet)

      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey,
          toPubkey,
          lamports: Math.floor(amount * LAMPORTS_PER_SOL),
        }),
      )

      const { blockhash } = await connection.getLatestBlockhash()
      transaction.recentBlockhash = blockhash
      transaction.feePayer = fromPubkey

      const phantom = (window as any).phantom.solana
      const signedTransaction = await phantom.signTransaction(transaction)
      const signature = await connection.sendRawTransaction(signedTransaction.serialize())

      console.log("Transaction sent with Web3.js:", signature)

      return {
        signature,
        amount,
        from: fromWallet,
        to: toWallet,
        timestamp: Date.now(),
        status: "pending",
        network,
      }
    } catch (error) {
      console.error("Web3.js transaction failed:", error)
      throw error
    }
  }

  // Fallback to mock implementation for demo
  console.warn("Web3.js not available, using mock transaction")
  return {
    signature: `mock_${Math.random().toString(36).substring(2)}`,
    amount,
    from: fromWallet,
    to: toWallet,
    timestamp: Date.now(),
    status: "confirmed",
    network,
  }
}

// Verify transaction on blockchain
export async function verifyTransaction(signature: string, network = "devnet"): Promise<boolean> {
  const rpcUrl = `https://api.${network}.solana.com`

  // Try Web3.js first
  if (Connection) {
    try {
      const connection = new Connection(rpcUrl, "confirmed")
      const result = await connection.getSignatureStatus(signature)
      return result.value?.confirmationStatus === "confirmed"
    } catch (error) {
      console.warn("Web3.js verification failed, falling back to RPC:", error)
    }
  }

  // Fallback to RPC call
  try {
    const response = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getSignatureStatuses",
        params: [[signature]],
      }),
    })

    const data = await response.json()
    return data.result?.value?.[0]?.confirmationStatus === "confirmed"
  } catch (error) {
    console.error("Transaction verification failed:", error)
    return false
  }
}

// Validate Solana address format
export function isValidSolanaAddress(address: string): boolean {
  // Basic validation for Solana address format
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)
}

// Get Solana explorer URL
export function getSolanaExplorerUrl(signature: string, network = "devnet"): string {
  return `https://explorer.solana.com/tx/${signature}?cluster=${network}`
}
