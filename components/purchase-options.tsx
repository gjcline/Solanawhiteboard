"use client"

import { useState } from "react"
import { useWallet } from "@solana/wallet-adapter-react"
import { toast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const DEVCAVE_WALLET = process.env.NEXT_PUBLIC_DEVCAVE_WALLET!

type PurchaseOption = {
  title: string
  description: string
  price: number
  type: "single" | "bundle"
}

type PurchaseOptionsProps = {
  options: PurchaseOption[]
  walletBalance: number
  onBalanceUpdate: (newBalance: number) => void
  onPurchaseSuccess: (type: string, quantity: number) => Promise<boolean>
}

export default function PurchaseOptions({
  options,
  walletBalance,
  onBalanceUpdate,
  onPurchaseSuccess,
}: PurchaseOptionsProps) {
  const { publicKey } = useWallet()
  const walletAddress = publicKey?.toBase58()
  const [processingType, setProcessingType] = useState<string | null>(null)

  async function processPurchase(option: PurchaseOption) {
    if (!walletAddress) {
      toast({
        title: "wallet not connected",
        description: "please connect your phantom wallet to continue",
        variant: "destructive",
      })
      return
    }

    if (walletBalance < option.price) {
      toast({
        title: "insufficient balance",
        description: `you need ${option.price} SOL to purchase ${option.title}`,
        variant: "destructive",
      })
      return
    }

    setProcessingType(option.type)

    try {
      // Get Phantom wallet
      const phantom = (window as any).phantom?.solana
      if (!phantom) {
        throw new Error("Phantom wallet not found")
      }

      console.log("💳 Creating purchase transaction:", {
        from: walletAddress,
        to: DEVCAVE_WALLET,
        amount: option.price,
        type: option.type,
      })

      // Import the transaction creation function
      const { createPurchaseTransaction } = await import("@/lib/solana-transactions")

      // Create and execute the actual Solana transaction
      const { signature, actualFee } = await createPurchaseTransaction({
        fromWallet: walletAddress,
        toWallet: DEVCAVE_WALLET,
        amount: option.price,
        phantom: phantom,
        network: "mainnet-beta",
      })

      console.log(`✅ Transaction successful: ${signature}`)

      // Check if this was a simulated transaction
      const isSimulated = signature.startsWith("sim_")

      // Update balance (deduct amount + fee)
      const newBalance = walletBalance - option.price - actualFee
      onBalanceUpdate(newBalance)

      // Determine quantity based on purchase type
      let quantity = 1
      if (option.type === "bundle") {
        quantity = 10 // 10 lines in bundle
      }

      // Add tokens to user's balance
      const success = await onPurchaseSuccess(option.type, quantity)

      if (success) {
        toast({
          title: isSimulated ? "tokens purchased! (simulation mode)" : "tokens purchased!",
          description: (
            <div>
              <p>
                {option.title} purchased for {option.price} SOL.
                {isSimulated && " (Processed in simulation mode due to network issues)"}
              </p>
              {!isSimulated && (
                <p className="text-xs mt-1">
                  <a
                    href={`https://explorer.solana.com/tx/${signature}?cluster=mainnet-beta`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    View transaction
                  </a>
                </p>
              )}
            </div>
          ),
        })
      } else {
        toast({
          title: "purchase completed but tokens not updated",
          description:
            "Your payment went through but there was an issue updating your token balance. Please refresh the page.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("❌ Purchase failed:", error)

      // Check if user rejected the transaction
      if (
        error instanceof Error &&
        (error.message.includes("User rejected") ||
          error.message.includes("cancelled") ||
          error.message.includes("Transaction was cancelled"))
      ) {
        toast({
          title: "transaction cancelled",
          description: "you cancelled the transaction in your wallet.",
          variant: "destructive",
        })
      } else if (error instanceof Error && error.message.includes("Access forbidden")) {
        toast({
          title: "network issue",
          description: "Solana network is experiencing issues. Please try again later or contact support.",
          variant: "destructive",
        })
      } else {
        toast({
          title: "purchase failed",
          description: error instanceof Error ? error.message : "failed to process payment",
          variant: "destructive",
        })
      }
    } finally {
      setProcessingType(null)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {options.map((option) => (
        <div key={option.type} className="border rounded-md p-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">{option.title}</h3>
            <p className="text-sm text-muted-foreground">{option.description}</p>
            <p className="mt-2">Price: {option.price} SOL</p>
          </div>
          <Button
            onClick={() => processPurchase(option)}
            disabled={processingType !== null}
            className={cn({
              "cursor-not-allowed": processingType !== null,
            })}
          >
            {processingType === option.type ? "processing..." : `purchase ${option.title}`}
          </Button>
        </div>
      ))}
    </div>
  )
}
