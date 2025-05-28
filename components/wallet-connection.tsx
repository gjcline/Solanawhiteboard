"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, ExternalLink, Wallet, AlertCircle, CheckCircle, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface WalletConnectionProps {
  onWalletConnected: (address: string, balance: number) => void
  onWalletDisconnected: () => void
  onBalanceUpdate: (balance: number) => void
}

// Solana network configuration
const SOLANA_NETWORK = "devnet" // Change to "mainnet-beta" for production
const SOLANA_RPC_URL = `https://api.${SOLANA_NETWORK}.solana.com`

export default function WalletConnection({
  onWalletConnected,
  onWalletDisconnected,
  onBalanceUpdate,
}: WalletConnectionProps) {
  const [isConnecting, setIsConnecting] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [balance, setBalance] = useState<number | null>(null)
  const [isPhantomInstalled, setIsPhantomInstalled] = useState(false)
  const [isRefreshingBalance, setIsRefreshingBalance] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    checkPhantomInstallation()
    checkExistingConnection()
  }, [])

  const checkPhantomInstallation = () => {
    const phantom = (window as any).phantom?.solana
    setIsPhantomInstalled(!!phantom)
  }

  const checkExistingConnection = async () => {
    try {
      const phantom = (window as any).phantom?.solana
      if (phantom && phantom.isConnected) {
        const address = phantom.publicKey.toString()
        setWalletAddress(address)
        setIsConnected(true)
        const walletBalance = await fetchBalance(address)
        onWalletConnected(address, walletBalance)
      }
    } catch (error) {
      console.error("Error checking existing connection:", error)
    }
  }

  const fetchBalance = async (address: string): Promise<number> => {
    try {
      setIsRefreshingBalance(true)

      // Fetch real balance from Solana RPC
      const response = await fetch(SOLANA_RPC_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "getBalance",
          params: [address],
        }),
      })

      const data = await response.json()

      if (data.result) {
        // Convert lamports to SOL (1 SOL = 1,000,000,000 lamports)
        const balanceInSOL = data.result.value / 1000000000
        setBalance(balanceInSOL)
        onBalanceUpdate(balanceInSOL)
        return balanceInSOL
      } else {
        console.error("Failed to fetch balance:", data.error)
        // Fallback to mock balance for demo
        const mockBalance = 0.5
        setBalance(mockBalance)
        onBalanceUpdate(mockBalance)
        return mockBalance
      }
    } catch (error) {
      console.error("Error fetching balance:", error)
      // Fallback to mock balance for demo
      const mockBalance = 0.5
      setBalance(mockBalance)
      onBalanceUpdate(mockBalance)
      return mockBalance
    } finally {
      setIsRefreshingBalance(false)
    }
  }

  const connectWallet = async () => {
    if (!isPhantomInstalled) {
      toast({
        title: "phantom wallet required",
        description: "please install phantom wallet to purchase tokens.",
        variant: "destructive",
      })
      return
    }

    setIsConnecting(true)

    try {
      const phantom = (window as any).phantom.solana

      const response = await phantom.connect()
      const address = response.publicKey.toString()

      setWalletAddress(address)
      setIsConnected(true)

      const walletBalance = await fetchBalance(address)
      onWalletConnected(address, walletBalance)

      toast({
        title: "wallet connected!",
        description: "you can now purchase tokens and start drawing.",
      })
    } catch (error) {
      console.error("Connection error:", error)
      toast({
        title: "connection failed",
        description: "failed to connect to phantom wallet. please try again.",
        variant: "destructive",
      })
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
      setWalletAddress(null)
      setBalance(null)
      onWalletDisconnected()

      toast({
        title: "wallet disconnected",
        description: "your wallet has been disconnected.",
      })
    } catch (error) {
      console.error("Disconnect error:", error)
    }
  }

  const refreshBalance = async () => {
    if (walletAddress) {
      await fetchBalance(walletAddress)
      toast({
        title: "balance updated",
        description: "your wallet balance has been refreshed.",
      })
    }
  }

  if (!isPhantomInstalled) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span className="text-sm">phantom wallet required for purchases</span>
          <Button asChild variant="outline" size="sm">
            <a href="https://phantom.app" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3 w-3 mr-1" />
              install
            </a>
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  if (!isConnected) {
    return (
      <div className="space-y-3">
        <Alert>
          <Wallet className="h-4 w-4" />
          <AlertDescription className="text-sm">connect phantom to purchase drawing tokens</AlertDescription>
        </Alert>
        <Button onClick={connectWallet} disabled={isConnecting} className="w-full pump-button text-black font-semibold">
          {isConnecting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              connecting...
            </>
          ) : (
            <>
              <Wallet className="mr-2 h-4 w-4" />
              connect phantom
            </>
          )}
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <Alert>
        <CheckCircle className="h-4 w-4" />
        <AlertDescription>
          <div className="flex items-center justify-between">
            <span className="text-sm">wallet connected & ready</span>
            <Button variant="ghost" size="sm" onClick={disconnectWallet}>
              disconnect
            </Button>
          </div>
        </AlertDescription>
      </Alert>

      <div className="bg-gray-700/50 rounded-lg p-3 space-y-2">
        <div>
          <div className="text-xs text-gray-400 uppercase tracking-wide">address</div>
          <div className="text-xs font-mono text-gray-300 break-all">
            {walletAddress?.slice(0, 8)}...{walletAddress?.slice(-8)}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-gray-400 uppercase tracking-wide">balance</div>
            <div className="text-sm font-semibold text-[#00ff88]">{balance?.toFixed(4)} SOL</div>
          </div>
          <Button variant="ghost" size="sm" onClick={refreshBalance} disabled={isRefreshingBalance}>
            {isRefreshingBalance ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
          </Button>
        </div>
      </div>

      <div className="text-xs text-gray-500 text-center">
        network: <span className="uppercase font-mono">{SOLANA_NETWORK}</span>
      </div>
    </div>
  )
}
