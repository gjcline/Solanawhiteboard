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

// Solana network configuration - MAINNET
const SOLANA_NETWORK = "mainnet-beta"
const SOLANA_RPC_ENDPOINTS = [
  "https://api.mainnet-beta.solana.com",
  "https://solana-api.projectserum.com",
  "https://rpc.ankr.com/solana",
  "https://solana.public-rpc.com",
]

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
  const [phantomVersion, setPhantomVersion] = useState<string | null>(null)
  const [currentRpcIndex, setCurrentRpcIndex] = useState(0)
  const { toast } = useToast()

  useEffect(() => {
    checkPhantomInstallation()
    checkExistingConnection()

    // Listen for account changes
    const phantom = (window as any).phantom?.solana
    if (phantom) {
      phantom.on("accountChanged", (publicKey: any) => {
        console.log("Account changed:", publicKey?.toString())
        if (publicKey) {
          const address = publicKey.toString()
          setWalletAddress(address)
          fetchBalance(address)
        } else {
          handleDisconnect()
        }
      })

      phantom.on("disconnect", () => {
        console.log("Phantom disconnected")
        handleDisconnect()
      })
    }

    return () => {
      if (phantom) {
        phantom.removeAllListeners("accountChanged")
        phantom.removeAllListeners("disconnect")
      }
    }
  }, [])

  const checkPhantomInstallation = () => {
    const phantom = (window as any).phantom?.solana
    const isInstalled = !!phantom
    setIsPhantomInstalled(isInstalled)

    if (phantom) {
      setPhantomVersion(phantom.version || "unknown")
      console.log("Phantom wallet detected:", {
        version: phantom.version,
        isConnected: phantom.isConnected,
        publicKey: phantom.publicKey?.toString(),
      })
    } else {
      console.log("Phantom wallet not detected")
    }
  }

  const checkExistingConnection = async () => {
    try {
      const phantom = (window as any).phantom?.solana
      if (phantom && phantom.isConnected && phantom.publicKey) {
        const address = phantom.publicKey.toString()
        console.log("Existing connection found:", address)
        setWalletAddress(address)
        setIsConnected(true)
        const walletBalance = await fetchBalance(address)
        onWalletConnected(address, walletBalance)
      }
    } catch (error) {
      console.error("Error checking existing connection:", error)
    }
  }

  const fetchBalanceFromRPC = async (address: string, rpcUrl: string): Promise<number> => {
    console.log(`Fetching balance from ${rpcUrl} for address:`, address)

    const response = await fetch(rpcUrl, {
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

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    console.log(`Balance response from ${rpcUrl}:`, data)

    if (data.error) {
      throw new Error(`RPC Error: ${data.error.message}`)
    }

    if (data.result && typeof data.result.value === "number") {
      const balanceInSOL = data.result.value / 1000000000
      console.log(`Balance fetched: ${balanceInSOL} SOL`)
      return balanceInSOL
    }

    throw new Error("Invalid response format")
  }

  const fetchBalance = async (address: string): Promise<number> => {
    if (!address) {
      console.error("No address provided for balance fetch")
      return 0
    }

    setIsRefreshingBalance(true)

    try {
      // Try multiple RPC endpoints for reliability
      let lastError: Error | null = null

      for (let i = 0; i < SOLANA_RPC_ENDPOINTS.length; i++) {
        const rpcIndex = (currentRpcIndex + i) % SOLANA_RPC_ENDPOINTS.length
        const rpcUrl = SOLANA_RPC_ENDPOINTS[rpcIndex]

        try {
          const balanceInSOL = await fetchBalanceFromRPC(address, rpcUrl)

          // Update state
          setBalance(balanceInSOL)
          onBalanceUpdate(balanceInSOL)

          // Update successful RPC endpoint
          setCurrentRpcIndex(rpcIndex)

          console.log(`Successfully fetched balance: ${balanceInSOL} SOL from ${rpcUrl}`)
          return balanceInSOL
        } catch (error) {
          console.warn(`Failed to fetch from ${rpcUrl}:`, error)
          lastError = error as Error
          continue
        }
      }

      // All RPC endpoints failed
      throw lastError || new Error("All RPC endpoints failed")
    } catch (error) {
      console.error("Failed to fetch balance from all endpoints:", error)

      // Set balance to 0 and show error
      setBalance(0)
      onBalanceUpdate(0)

      toast({
        title: "balance fetch failed",
        description: "unable to fetch wallet balance. please try refreshing.",
        variant: "destructive",
      })

      return 0
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
      console.log("Attempting to connect to Phantom...")

      // Request connection
      const response = await phantom.connect({ onlyIfTrusted: false })
      const address = response.publicKey.toString()

      console.log("Phantom connected successfully:", address)

      setWalletAddress(address)
      setIsConnected(true)

      // Fetch balance immediately after connection
      const walletBalance = await fetchBalance(address)
      onWalletConnected(address, walletBalance)

      toast({
        title: "wallet connected!",
        description: `connected to mainnet: ${address.slice(0, 8)}...${address.slice(-8)}`,
      })
    } catch (error: any) {
      console.error("Connection error:", error)

      let errorMessage = "failed to connect to phantom wallet."
      if (error.code === 4001) {
        errorMessage = "connection request was rejected by user."
      } else if (error.code === -32002) {
        errorMessage = "connection request is already pending."
      } else if (error.message) {
        errorMessage = error.message
      }

      toast({
        title: "connection failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsConnecting(false)
    }
  }

  const handleDisconnect = () => {
    console.log("Handling wallet disconnect")
    setIsConnected(false)
    setWalletAddress(null)
    setBalance(null)
    onWalletDisconnected()
  }

  const disconnectWallet = async () => {
    try {
      const phantom = (window as any).phantom?.solana
      if (phantom && phantom.isConnected) {
        await phantom.disconnect()
      }

      handleDisconnect()

      toast({
        title: "wallet disconnected",
        description: "your wallet has been disconnected.",
      })
    } catch (error) {
      console.error("Disconnect error:", error)
      handleDisconnect()
    }
  }

  const refreshBalance = async () => {
    if (walletAddress) {
      console.log("Manual balance refresh requested")
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
        <AlertDescription className="space-y-2">
          <div className="text-sm">phantom wallet required for purchases</div>
          <Button asChild variant="outline" size="sm" className="w-full">
            <a href="https://phantom.app" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3 w-3 mr-1" />
              install phantom wallet
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
          <AlertDescription className="text-sm">
            connect phantom to purchase drawing tokens
            {phantomVersion && (
              <div className="text-xs text-gray-500 mt-1">phantom v{phantomVersion} detected • mainnet ready</div>
            )}
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
            <span className="text-sm">mainnet wallet connected</span>
            <Button variant="ghost" size="sm" onClick={disconnectWallet}>
              disconnect
            </Button>
          </div>
        </AlertDescription>
      </Alert>

      <div className="bg-gray-700/50 rounded-lg p-3 space-y-3">
        <div>
          <div className="text-xs text-gray-400 uppercase tracking-wide">wallet address</div>
          <div className="text-xs font-mono text-gray-300 break-all">
            {walletAddress?.slice(0, 12)}...{walletAddress?.slice(-12)}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-gray-400 uppercase tracking-wide">sol balance</div>
            <div className="text-lg font-bold text-[#00ff88]">
              {isRefreshingBalance ? (
                <div className="flex items-center">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  loading...
                </div>
              ) : balance !== null ? (
                `${balance.toFixed(4)} SOL`
              ) : (
                "failed to load"
              )}
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={refreshBalance} disabled={isRefreshingBalance}>
            {isRefreshingBalance ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
          </Button>
        </div>
      </div>

      <div className="text-xs text-gray-500 text-center space-y-1">
        <div>
          network: <span className="uppercase font-mono text-[#00ff88]">mainnet-beta</span>
        </div>
        {phantomVersion && (
          <div>
            phantom: <span className="font-mono">v{phantomVersion}</span>
          </div>
        )}
        <div className="text-xs text-gray-600">
          rpc: {SOLANA_RPC_ENDPOINTS[currentRpcIndex].replace("https://", "")}
        </div>
      </div>
    </div>
  )
}
