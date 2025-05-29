"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, ExternalLink, CheckCircle, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DEVCAVE_WALLET } from "@/lib/pricing"
import { createPurchaseTransaction } from "@/lib/solana-transactions"

interface SolanaPaymentProps {
  amount: number
  sessionId?: string
  onSuccess: () => void
  onError: (error: string) => void
}

// Solana network configuration
const SOLANA_NETWORK = "mainnet-beta" // Using mainnet for real transactions

export default function SolanaPayment({ amount, sessionId, onSuccess, onError }: SolanaPaymentProps) {
  const [isConnecting, setIsConnecting] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [wallet, setWallet] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [balance, setBalance] = useState<number | null>(null)
  const [transactionSignature, setTransactionSignature] = useState<string | null>(null)

  // Get wallet balance when connected
  useEffect(() => {
    if (isConnected && wallet) {
      getWalletBalance()
    }
  }, [isConnected, wallet])

  const getWalletBalance = async () => {
    if (!wallet) return

    try {
      // Use the server-side balance fetching we implemented earlier
      const response = await fetch(`/api/wallet/balance?address=${wallet}&network=${SOLANA_NETWORK}`)
      const data = await response.json()

      if (data.success) {
        setBalance(data.balance)
        console.log(`💰 Real balance fetched: ${data.balance} SOL`)
      } else {
        console.error("Failed to fetch balance:", data.error)
        // Fallback to estimated balance
        setBalance(1.5)
      }
    } catch (error) {
      console.error("Error fetching balance:", error)
      // Fallback to estimated balance
      setBalance(1.5)
    }
  }

  const connectWallet = async () => {
    setIsConnecting(true)

    try {
      const phantom = (window as any).phantom?.solana

      if (!phantom) {
        throw new Error("Phantom wallet not found. Please install the Phantom browser extension from phantom.app")
      }

      if (!phantom.isConnected) {
        try {
          const response = await phantom.connect()
          const address = response.publicKey.toString()
          setWallet(address)
          setIsConnected(true)
          console.log(`🔗 Wallet connected: ${address}`)
        } catch (err) {
          throw new Error("Failed to connect to wallet. User rejected the request.")
        }
      } else {
        const address = phantom.publicKey.toString()
        setWallet(address)
        setIsConnected(true)
        console.log(`🔗 Wallet already connected: ${address}`)
      }
    } catch (error) {
      onError(error instanceof Error ? error.message : "Unknown error connecting wallet")
    } finally {
      setIsConnecting(false)
    }
  }

  const disconnectWallet = async () => {
    try {
      const phantom = (window as any).phantom?.solana
      if (phantom) {
        await phantom.disconnect()
      }
      setIsConnected(false)
      setWallet(null)
      setBalance(null)
      setTransactionSignature(null)
      console.log("🔌 Wallet disconnected")
    } catch (error) {
      console.error("Error disconnecting wallet:", error)
    }
  }

  const handlePayment = async () => {
    if (!isConnected || !wallet) {
      onError("Wallet not connected")
      return
    }

    if (balance !== null && balance < amount) {
      onError(`Insufficient balance. You need at least ${amount} SOL but only have ${balance} SOL.`)
      return
    }

    setIsProcessing(true)

    try {
      const phantom = (window as any).phantom?.solana

      if (!phantom) {
        throw new Error("Phantom wallet not found")
      }

      console.log("💳 Creating purchase transaction:", {
        from: wallet,
        to: DEVCAVE_WALLET,
        amount: amount,
        network: SOLANA_NETWORK,
      })

      // Create the actual Solana transaction
      const { transaction, signature } = await createPurchaseTransaction({
        fromWallet: wallet,
        toWallet: DEVCAVE_WALLET,
        amount: amount,
        phantom: phantom,
        network: SOLANA_NETWORK,
      })

      console.log(`✅ Transaction successful: ${signature}`)
      setTransactionSignature(signature)

      // Update balance (deduct the amount)
      if (balance !== null) {
        setBalance(balance - amount)
      }

      onSuccess()
    } catch (error) {
      console.error("❌ Payment failed:", error)
      onError(error instanceof Error ? error.message : "Payment failed")
    } finally {
      setIsProcessing(false)
    }
  }

  const openTransactionInExplorer = () => {
    if (transactionSignature) {
      const explorerUrl = `https://explorer.solana.com/tx/${transactionSignature}?cluster=${SOLANA_NETWORK}`
      window.open(explorerUrl, "_blank")
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Solana Payment
          {transactionSignature && <CheckCircle className="h-5 w-5 text-green-500" />}
        </CardTitle>
        <CardDescription>Pay {amount} SOL to DevCave escrow for drawing tokens</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isConnected ? (
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You need a Solana wallet to make payments. We recommend using{" "}
                <a
                  href="https://phantom.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  Phantom Wallet
                </a>
                .
              </AlertDescription>
            </Alert>
            <Button onClick={connectWallet} disabled={isConnecting} className="w-full">
              {isConnecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                "Connect Solana Wallet"
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-3 bg-gray-100 rounded-md dark:bg-gray-700">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium">Connected Wallet</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{wallet}</p>
                  {balance !== null && (
                    <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">Balance: {balance.toFixed(4)} SOL</p>
                  )}
                </div>
                <Button variant="ghost" size="sm" onClick={disconnectWallet}>
                  Disconnect
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Amount:</span>
                <span className="font-medium">{amount} SOL</span>
              </div>
              <div className="flex justify-between">
                <span>Escrow Wallet:</span>
                <span className="text-xs text-gray-500 truncate max-w-[200px]">{DEVCAVE_WALLET}</span>
              </div>
              <div className="flex justify-between">
                <span>Network:</span>
                <span className="text-xs text-gray-500 uppercase">{SOLANA_NETWORK}</span>
              </div>
            </div>

            {transactionSignature ? (
              <div className="space-y-2">
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>Payment successful! Funds sent to DevCave escrow wallet.</AlertDescription>
                </Alert>
                <Button variant="outline" onClick={openTransactionInExplorer} className="w-full">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View Transaction
                </Button>
              </div>
            ) : (
              <Button
                onClick={handlePayment}
                disabled={isProcessing || (balance !== null && balance < amount)}
                className="w-full"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing Payment...
                  </>
                ) : balance !== null && balance < amount ? (
                  "Insufficient Balance"
                ) : (
                  `Pay ${amount} SOL to Escrow`
                )}
              </Button>
            )}

            {balance !== null && balance < amount && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  You need at least {amount} SOL to make this payment. Your current balance is {balance.toFixed(4)} SOL.
                  Please add more SOL to your wallet.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
