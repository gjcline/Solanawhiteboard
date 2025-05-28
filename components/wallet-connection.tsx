"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, ExternalLink, Wallet, AlertCircle, CheckCircle, Copy, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  connectPhantomWallet,
  disconnectPhantomWallet,
  isPhantomWalletInstalled,
  getWalletBalance,
} from "@/lib/solana-utils"

interface WalletConnectionProps {
  onWalletConnected: (address: string, balance: number) => void
  onWalletDisconnected: () => void
  onBalanceUpdate: (balance: number) => void
  showBalance?: boolean
  compact?: boolean
}

export default function WalletConnection({
  onWalletConnected,
  onWalletDisconnected,
  onBalanceUpdate,
  showBalance = true,
  compact = false,
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
    const installed = isPhantomWalletInstalled()
    setIsPhantomInstalled(installed)

    if (!installed) {
      console.log("Phantom wallet not detected")
    }
  }

  const checkExistingConnection = async () => {
    try {
      if (!isPhantomWalletInstalled()) return

      const phantom = (window as any).phantom.solana
      if (phantom && phantom.isConnected) {
        const address = phantom.publicKey.toString()
        console.log("Found existing wallet connection:", address)

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
      console.log("Fetching balance for:", address)
      const walletBalance = await getWalletBalance(address, "devnet")
      console.log("Fetched balance:", walletBalance)

      setBalance(walletBalance)
      onBalanceUpdate(walletBalance)
      return walletBalance
    } catch (error) {
      console.error("Error fetching balance:", error)
      toast({
        title: "Balance fetch failed",
        description: "Could not fetch wallet balance. Using demo balance.",
        variant: "destructive",
      })

      // Fallback to demo balance
      const demoBalance = Math.random() * 2 + 0.1
      setBalance(demoBalance)
      onBalanceUpdate(demoBalance)
      return demoBalance
    }
  }

  const connectWallet = async () => {
    if (!isPhantomInstalled) {
      toast({
        title: "Phantom wallet required",
        description: "Please install Phantom wallet to purchase tokens.",
        variant: "destructive",
      })
      return
    }

    setIsConnecting(true)

    try {
      console.log("Attempting to connect to Phantom wallet...")
      const wallet = await connectPhantomWallet()
      console.log("Wallet connected:", wallet.publicKey)

      setWalletAddress(wallet.publicKey)
      setIsConnected(true)

      const walletBalance = await fetchBalance(wallet.publicKey)
      onWalletConnected(wallet.publicKey, walletBalance)

      toast({
        title: "Wallet connected!",
        description: "You can now purchase tokens and start drawing.",
      })
    } catch (error) {
      console.error("Connection error:", error)
      toast({
        title: "Connection failed",
        description: error instanceof Error ? error.message : "Failed to connect to Phantom wallet. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsConnecting(false)
    }
  }

  const disconnectWallet = async () => {
    try {
      console.log("Disconnecting wallet...")
      await disconnectPhantomWallet()

      setIsConnected(false)
      setWalletAddress(null)
      setBalance(null)
      onWalletDisconnected()

      toast({
        title: "Wallet disconnected",
        description: "Your wallet has been disconnected.",
      })
    } catch (error) {
      console.error("Disconnect error:", error)
      toast({
        title: "Disconnect failed",
        description: "Failed to disconnect wallet properly.",
        variant: "destructive",
      })
    }
  }

  const refreshBalance = async () => {
    if (!walletAddress) return

    setIsRefreshingBalance(true)
    try {
      await fetchBalance(walletAddress)
      toast({
        title: "Balance updated",
        description: "Your wallet balance has been refreshed.",
      })
    } catch (error) {
      toast({
        title: "Refresh failed",
        description: "Could not refresh balance. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsRefreshingBalance(false)
    }
  }

  const copyAddress = async () => {
    if (!walletAddress) return

    try {
      await navigator.clipboard.writeText(walletAddress)
      toast({
        title: "Address copied",
        description: "Wallet address copied to clipboard.",
      })
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Could not copy address to clipboard.",
        variant: "destructive",
      })
    }
  }

  // Compact view for when wallet is already connected
  if (compact && isConnected) {
    return (
      <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-950 rounded-lg">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <span className="text-sm text-green-800 dark:text-green-200">
          {walletAddress?.slice(0, 4)}...{walletAddress?.slice(-4)}
        </span>
        {showBalance && balance && (
          <span className="text-sm font-semibold text-green-600">{balance.toFixed(4)} SOL</span>
        )}
        <Button variant="ghost" size="sm" onClick={disconnectWallet}>
          Disconnect
        </Button>
      </div>
    )
  }

  if (!isPhantomInstalled) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span>Phantom wallet is required to purchase tokens and draw.</span>
          <Button asChild variant="outline" size="sm">
            <a href="https://phantom.app" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              Install Phantom
            </a>
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  if (!isConnected) {
    return (
      <div className="space-y-4">
        <Alert>
          <Wallet className="h-4 w-4" />
          <AlertDescription>
            Connect your Phantom wallet to purchase drawing tokens. Choose from single lines, bundles, or nuke tokens.
          </AlertDescription>
        </Alert>
        <Button onClick={connectWallet} disabled={isConnecting} className="w-full pump-button text-black font-semibold">
          {isConnecting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Connecting...
            </>
          ) : (
            <>
              <Wallet className="mr-2 h-4 w-4" />
              Connect Phantom Wallet
            </>
          )}
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Alert>
        <CheckCircle className="h-4 w-4" />
        <AlertDescription>
          <div className="flex items-center justify-between">
            <span>Wallet connected! Ready to purchase tokens.</span>
            <Button variant="ghost" size="sm" onClick={disconnectWallet}>
              Disconnect
            </Button>
          </div>
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
        <div>
          <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300 mb-2">Wallet Address</h4>
          <div className="flex items-center gap-2">
            <p className="text-xs font-mono text-gray-600 dark:text-gray-400 break-all flex-1">{walletAddress}</p>
            <Button variant="outline" size="sm" onClick={copyAddress}>
              <Copy className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {showBalance && (
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300">Balance</h4>
              <p className="text-sm font-semibold text-green-600 dark:text-green-400">{balance?.toFixed(4)} SOL</p>
            </div>
            <Button variant="outline" size="sm" onClick={refreshBalance} disabled={isRefreshingBalance}>
              <RefreshCw className={`h-4 w-4 ${isRefreshingBalance ? "animate-spin" : ""}`} />
            </Button>
          </div>
        )}
      </div>

      <div className="text-center p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          💡 <strong>Token system:</strong> Purchase line tokens (0.005 SOL), bundles (0.02 SOL), or nuke tokens (0.03
          SOL) to interact with the whiteboard. 50% goes to streamer, 50% to D3vCav3.
        </p>
      </div>
    </div>
  )
}
