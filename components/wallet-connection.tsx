"use client"

import { useWallet } from "@solana/wallet-adapter-react"
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui"
import { useEffect, useState } from "react"
import { Connection, LAMPORTS_PER_SOL } from "@solana/web3.js"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"

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
  const { publicKey, connected, disconnect } = useWallet()
  const [balance, setBalance] = useState<number>(0)
  const [isLoadingBalance, setIsLoadingBalance] = useState(false)

  const fetchBalance = async () => {
    if (!publicKey || !connected) return

    setIsLoadingBalance(true)
    try {
      const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com"
      const connection = new Connection(rpcUrl, "confirmed")
      const balance = await connection.getBalance(publicKey)
      const solBalance = balance / LAMPORTS_PER_SOL
      setBalance(solBalance)
      onBalanceUpdate(solBalance)
      console.log(`💰 Wallet balance: ${solBalance.toFixed(4)} SOL`)
    } catch (error) {
      console.error("Error fetching balance:", error)
    } finally {
      setIsLoadingBalance(false)
    }
  }

  useEffect(() => {
    if (connected && publicKey) {
      const address = publicKey.toBase58()
      fetchBalance()
      onWalletConnected(address, balance)
    } else {
      setBalance(0)
      onWalletDisconnected()
    }
  }, [connected, publicKey])

  const handleDisconnect = () => {
    disconnect()
    onWalletDisconnected()
  }

  if (!connected) {
    return (
      <div className="space-y-3">
        <WalletMultiButton className="!bg-[#00ff88] !text-black hover:!bg-[#00ff88]/90 !rounded-lg !font-semibold !py-3 !px-6" />
        <p className="text-xs text-gray-500 text-center">connect phantom wallet to purchase tokens</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="text-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-400">wallet:</span>
          <span className="font-mono text-xs text-white">
            {publicKey?.toBase58().slice(0, 4)}...{publicKey?.toBase58().slice(-4)}
          </span>
        </div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-gray-400">balance:</span>
          <div className="flex items-center gap-2">
            <span className="text-[#00ff88] font-bold">{balance.toFixed(4)} SOL</span>
            <Button
              size="sm"
              variant="ghost"
              onClick={fetchBalance}
              disabled={isLoadingBalance}
              className="h-6 w-6 p-0"
            >
              <RefreshCw className={`h-3 w-3 ${isLoadingBalance ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        <WalletMultiButton className="!bg-gray-700 !text-white hover:!bg-gray-600 !rounded-lg !font-semibold !py-2 !px-4 !text-xs flex-1" />
        <Button
          size="sm"
          variant="outline"
          onClick={handleDisconnect}
          className="text-xs border-gray-600 text-gray-400 hover:bg-gray-700"
        >
          disconnect
        </Button>
      </div>
    </div>
  )
}
