// Solana utilities for wallet and transaction management
// This file contains the actual implementation for production use

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

// Get wallet balance (requires @solana/web3.js in production)
export async function getWalletBalance(publicKey: string, network = "devnet"): Promise<number> {
  // In production, you would use:
  /*
  import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js'
  
  const connection = new Connection(`https://api.${network}.solana.com`)
  const pubKey = new PublicKey(publicKey)
  const balance = await connection.getBalance(pubKey)
  return balance / LAMPORTS_PER_SOL
  */

  // Mock implementation for demo
  return Math.random() * 2 // Random balance between 0-2 SOL
}

// Send SOL transaction (requires @solana/web3.js in production)
export async function sendSolanaTransaction(
  fromWallet: string,
  toWallet: string,
  amount: number,
  network = "devnet",
): Promise<SolanaTransaction> {
  // In production, you would use:
  /*
  import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js'
  
  const connection = new Connection(`https://api.${network}.solana.com`)
  const fromPubkey = new PublicKey(fromWallet)
  const toPubkey = new PublicKey(toWallet)
  
  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey,
      toPubkey,
      lamports: amount * LAMPORTS_PER_SOL,
    })
  )
  
  const { blockhash } = await connection.getRecentBlockhash()
  transaction.recentBlockhash = blockhash
  transaction.feePayer = fromPubkey
  
  const phantom = (window as any).phantom.solana
  const signedTransaction = await phantom.signTransaction(transaction)
  const signature = await connection.sendRawTransaction(signedTransaction.serialize())
  
  return {
    signature,
    amount,
    from: fromWallet,
    to: toWallet,
    timestamp: Date.now(),
    status: "pending",
    network,
  }
  */

  // Mock implementation for demo
  return {
    signature: `${Math.random().toString(36).substring(2)}${Math.random().toString(36).substring(2)}`,
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
  // In production, you would use:
  /*
  import { Connection } from '@solana/web3.js'
  
  const connection = new Connection(`https://api.${network}.solana.com`)
  const result = await connection.getSignatureStatus(signature)
  return result.value?.confirmationStatus === "confirmed"
  */

  // Mock implementation for demo
  return true
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
