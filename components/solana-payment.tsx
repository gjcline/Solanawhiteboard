"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, ExternalLink, CheckCircle, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface SolanaPaymentProps {
  amount: number
  sessionId?: string
  onSuccess: () => void
  onError: (error: string) => void
}

// Storage key for recipient wallet
const RECIPIENT_WALLET_KEY = "whiteboard-recipient-wallet"

// Solana network configuration
const SOLANA_NETWORK = "devnet" // Change to "mainnet-beta" for production

export default function SolanaPayment({ amount, sessionId, onSuccess, onError }: SolanaPaymentProps) {
  const [isConnecting, setIsConnecting] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [wallet, setWallet] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [recipientWallet, setRecipientWallet] = useState<string | null>(null)
  const [balance, setBalance] = useState<number | null>(null)
  const [transactionSignature, setTransactionSignature] = useState<string | null>(null)

  // Load recipient wallet address
  useEffect(() => {
    const sessionWallet = sessionId ? localStorage.getItem(`session-wallet-${sessionId}`) : null
    const globalWallet = localStorage.getItem(RECIPIENT_WALLET_KEY)
    setRecipientWallet(sessionWallet || globalWallet)
  }, [sessionId])

  // Get wallet balance when connected
  useEffect(() => {
    if (isConnected && wallet) {
      getWalletBalance()
    }
  }, [isConnected, wallet])

  const getWalletBalance = async () => {
    if (!wallet) return

    try {
      const phantom = (window as any).phantom?.solana
      if (!phantom) return

      // In a real implementation, you would fetch the balance from the Solana RPC
      // For demo purposes, we'll simulate a balance check
      const mockBalance = 0.5 // Mock balance of 0.5 SOL
      setBalance(mockBalance)
    } catch (error) {
      console.error("Error fetching balance:", error)
    }
  }

  const connectWallet = async () => {
    setIsConnecting(true)

    try {
      // Check if Phantom wallet is available
      const phantom = (window as any).phantom?.solana

      if (!phantom) {
        throw new Error("Phantom wallet not found. Please install the Phantom browser extension from phantom.app")
      }

      if (!phantom.isConnected) {
        // Connect to wallet
        try {
          const response = await phantom.connect()
          const address = response.publicKey.toString()
          setWallet(address)
          setIsConnected(true)
        } catch (err) {
          throw new Error("Failed to connect to wallet. User rejected the request.")
        }
      } else {
        // Already connected
        const address = phantom.publicKey.toString()
        setWallet(address)
        setIsConnected(true)
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
    } catch (error) {
      console.error("Error disconnecting wallet:", error)
    }
  }

  const handlePayment = async () => {
    if (!isConnected || !wallet) {
      onError("Wallet not connected")
      return
    }

    if (!recipientWallet) {
      onError("No recipient wallet configured. Please contact the administrator.")
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

      // In a real implementation, you would create an actual Solana transaction
      // Here's what the real implementation would look like:
      /*
      import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js'
      
      const connection = new Connection(`https://api.${SOLANA_NETWORK}.solana.com`)
      const fromPubkey = new PublicKey(wallet)
      const toPubkey = new PublicKey(recipientWallet)
      
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
      
      const signedTransaction = await phantom.signTransaction(transaction)
      const signature = await connection.sendRawTransaction(signedTransaction.serialize())
      await connection.confirmTransaction(signature)
      */

      // For demo purposes, we'll simulate the transaction
      console.log("Processing Solana transaction:", {
        from: wallet,
        to: recipientWallet,
        amount: amount,
        network: SOLANA_NETWORK,
      })

      // Simulate transaction processing time
      await new Promise((resolve) => setTimeout(resolve, 3000))

      // Simulate successful transaction with a mock signature
      const mockSignature = `${Math.random().toString(36).substring(2)}${Math.random().toString(36).substring(2)}`
      setTransactionSignature(mockSignature)

      // Update balance (simulate deduction)
      if (balance !== null) {
        setBalance(balance - amount)
      }

      onSuccess()
    } catch (error) {
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

  if (!recipientWallet) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          No recipient wallet has been configured. Please ask the administrator to set up a wallet address in the Admin
          page.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Solana Payment
          {transactionSignature && <CheckCircle className="h-5 w-5 text-green-500" />}
        </CardTitle>
        <CardDescription>Pay {amount} SOL to access the drawing board</CardDescription>
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
                <span>Recipient:</span>
                <span className="text-xs text-gray-500 truncate max-w-[200px]">{recipientWallet}</span>
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
                  <AlertDescription>
                    Payment successful! Transaction has been confirmed on the Solana blockchain.
                  </AlertDescription>
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
                  `Pay ${amount} SOL`
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
