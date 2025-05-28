"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, ExternalLink, Wallet, AlertCircle, CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface WalletConnectionProps {
  onWalletConnected: (address: string, balance: number) => void
  onWalletDisconnected: () => void
  onBalanceUpdate: (balance: number) => void
}

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
        await fetchBalance(address)
        onWalletConnected(address, balance || 0)
      }
    } catch (error) {
      console.error("Error checking existing connection:", error)
    }
  }

  const fetchBalance = async (address: string) => {
    try {
      // In production, you would fetch real balance from Solana RPC
      // For demo, we'll simulate a balance
      const mockBalance = Math.random() * 2 + 0.1 // Random balance between 0.1-2.1 SOL
      setBalance(mockBalance)
      onBalanceUpdate(mockBalance)
      return mockBalance
    } catch (error) {
      console.error("Error fetching balance:", error)
      return 0
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
          <span>phantom wallet is required to purchase tokens and draw.</span>
          <Button asChild variant="outline" size="sm">
            <a href="https://phantom.app" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              install phantom
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
            connect your phantom wallet to purchase drawing tokens. choose from single lines, bundles, or nuke tokens.
          </AlertDescription>
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
              connect phantom wallet
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
            <span>wallet connected! ready to purchase tokens.</span>
            <Button variant="ghost" size="sm" onClick={disconnectWallet}>
              disconnect
            </Button>
          </div>
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
        <div>
          <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300">wallet address</h4>
          <p className="text-xs font-mono text-gray-600 dark:text-gray-400 break-all">{walletAddress}</p>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300">balance</h4>
            <p className="text-sm font-semibold text-green-600 dark:text-green-400">{balance?.toFixed(4)} SOL</p>
          </div>
          <Button variant="outline" size="sm" onClick={refreshBalance}>
            refresh
          </Button>
        </div>
      </div>

      <div className="text-center p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          💡 <strong>token system:</strong> purchase line tokens (0.005 SOL), bundles (0.02 SOL), or nuke tokens (0.03
          SOL) to interact with the whiteboard. 50% goes to streamer, 50% to D3vCav3.
        </p>
      </div>
    </div>
  )
}
