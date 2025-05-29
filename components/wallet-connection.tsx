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

// Import Solana Web3.js dynamically
let Connection: any = null
let PublicKey: any = null
let LAMPORTS_PER_SOL = 1000000000

// Initialize Solana Web3.js
const initializeSolana = async () => {
  try {
    const solanaWeb3 = await import("@solana/web3.js")
    Connection = solanaWeb3.Connection
    PublicKey = solanaWeb3.PublicKey
    LAMPORTS_PER_SOL = solanaWeb3.LAMPORTS_PER_SOL
    console.log("Solana Web3.js loaded successfully")
    return true
  } catch (error) {
    console.warn("Failed to load Solana Web3.js, falling back to RPC calls:", error)
    return false
  }
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
  const [isRefreshingBalance, setIsRefreshingBalance] = useState(false)
  const [phantomVersion, setPhantomVersion] = useState<string | null>(null)
  const [solanaWeb3Available, setSolanaWeb3Available] = useState(false)
  const [connection, setConnection] = useState<any>(null)
  const { toast } = useToast()

  useEffect(() => {
    const init = async () => {
      const web3Available = await initializeSolana()
      setSolanaWeb3Available(web3Available)

      if (web3Available && Connection) {
        const conn = new Connection(SOLANA_RPC_URL, "confirmed")
        setConnection(conn)
        console.log("Solana connection established:", SOLANA_RPC_URL)
      }

      checkPhantomInstallation()
      checkExistingConnection()
    }

    init()

    // Listen for account changes
    const phantom = (window as any).phantom?.solana
    if (phantom) {
      phantom.on("accountChanged", (publicKey: any) => {
        if (publicKey) {
          const address = publicKey.toString()
          setWalletAddress(address)
          fetchBalance(address)
        } else {
          handleDisconnect()
        }
      })

      phantom.on("disconnect", () => {
        handleDisconnect()
      })
    }

    return () => {
      // Cleanup listeners
      if (phantom) {
        phantom.removeAllListeners("accountChanged")
        phantom.removeAllListeners("disconnect")
      }
    }
  }, [])

  const checkPhantomInstallation = () => {
    const phantom = (window as any).phantom?.solana
    setIsPhantomInstalled(!!phantom)

    if (phantom) {
      setPhantomVersion(phantom.version || "unknown")
      console.log("Phantom detected:", {
        version: phantom.version,
        isConnected: phantom.isConnected,
        publicKey: phantom.publicKey?.toString(),
      })
    }
  }

  const checkExistingConnection = async () => {
    try {
      const phantom = (window as any).phantom?.solana
      if (phantom && phantom.isConnected && phantom.publicKey) {
        const address = phantom.publicKey.toString()
        setWalletAddress(address)
        setIsConnected(true)
        const walletBalance = await fetchBalance(address)
        onWalletConnected(address, walletBalance)

        console.log("Existing connection found:", address)
      }
    } catch (error) {
      console.error("Error checking existing connection:", error)
    }
  }

  const fetchBalanceWithWeb3 = async (address: string): Promise<number> => {
    try {
      if (!connection || !PublicKey) {
        throw new Error("Solana Web3.js not available")
      }

      console.log("Fetching balance with Web3.js for:", address)

      const publicKey = new PublicKey(address)
      const balanceInLamports = await connection.getBalance(publicKey)
      const balanceInSOL = balanceInLamports / LAMPORTS_PER_SOL

      console.log("Web3.js balance fetched:", {
        lamports: balanceInLamports,
        sol: balanceInSOL,
        network: SOLANA_NETWORK,
      })

      return balanceInSOL
    } catch (error) {
      console.error("Web3.js balance fetch failed:", error)
      throw error
    }
  }

  const fetchBalanceWithRPC = async (address: string): Promise<number> => {
    try {
      console.log("Fetching balance with RPC for:", address)

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
      console.log("RPC balance response:", data)

      if (data.result && typeof data.result.value === "number") {
        const balanceInSOL = data.result.value / 1000000000
        console.log("RPC balance fetched:", balanceInSOL, "SOL")
        return balanceInSOL
      } else {
        throw new Error("RPC call failed: " + JSON.stringify(data.error))
      }
    } catch (error) {
      console.error("RPC balance fetch failed:", error)
      throw error
    }
  }

  const fetchBalance = async (address: string): Promise<number> => {
    try {
      setIsRefreshingBalance(true)

      let balanceInSOL: number

      // Try Web3.js first, fallback to RPC
      if (solanaWeb3Available && connection) {
        try {
          balanceInSOL = await fetchBalanceWithWeb3(address)
        } catch (web3Error) {
          console.warn("Web3.js failed, falling back to RPC:", web3Error)
          balanceInSOL = await fetchBalanceWithRPC(address)
        }
      } else {
        balanceInSOL = await fetchBalanceWithRPC(address)
      }

      setBalance(balanceInSOL)
      onBalanceUpdate(balanceInSOL)

      return balanceInSOL
    } catch (error) {
      console.error("All balance fetch methods failed:", error)

      // For devnet, provide some test SOL if balance fetch fails
      if (SOLANA_NETWORK === "devnet") {
        const mockBalance = 1.0
        setBalance(mockBalance)
        onBalanceUpdate(mockBalance)

        toast({
          title: "devnet mode",
          description: "using test balance. get devnet SOL from faucet for real testing.",
        })

        return mockBalance
      } else {
        setBalance(0)
        onBalanceUpdate(0)
        return 0
      }
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

      const response = await phantom.connect({ onlyIfTrusted: false })
      const address = response.publicKey.toString()

      setWalletAddress(address)
      setIsConnected(true)

      console.log("Wallet connected:", address)

      const walletBalance = await fetchBalance(address)
      onWalletConnected(address, walletBalance)

      toast({
        title: "wallet connected!",
        description: `connected to ${address.slice(0, 8)}...${address.slice(-8)}`,
      })
    } catch (error: any) {
      console.error("Connection error:", error)

      let errorMessage = "failed to connect to phantom wallet."
      if (error.code === 4001) {
        errorMessage = "connection request was rejected by user."
      } else if (error.code === -32002) {
        errorMessage = "connection request is already pending."
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
      await fetchBalance(walletAddress)
      toast({
        title: "balance updated",
        description: "your wallet balance has been refreshed.",
      })
    }
  }

  const openDevnetFaucet = () => {
    window.open("https://faucet.solana.com/", "_blank")
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
              <div className="text-xs text-gray-500 mt-1">
                phantom v{phantomVersion} detected
                {solanaWeb3Available && " • web3.js loaded"}
              </div>
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
            <span className="text-sm">wallet connected & ready</span>
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
              {balance !== null ? `${balance.toFixed(4)} SOL` : "loading..."}
            </div>
            {balance !== null && balance < 0.01 && SOLANA_NETWORK === "devnet" && (
              <Button variant="outline" size="sm" onClick={openDevnetFaucet} className="mt-2 text-xs">
                get devnet SOL
              </Button>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={refreshBalance} disabled={isRefreshingBalance}>
            {isRefreshingBalance ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
          </Button>
        </div>
      </div>

      <div className="text-xs text-gray-500 text-center space-y-1">
        <div>
          network: <span className="uppercase font-mono text-[#00ff88]">{SOLANA_NETWORK}</span>
          {solanaWeb3Available && " • web3.js"}
        </div>
        {phantomVersion && (
          <div>
            phantom: <span className="font-mono">v{phantomVersion}</span>
          </div>
        )}
      </div>
    </div>
  )
}
