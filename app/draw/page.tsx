"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import DrawingCanvas from "@/components/drawing-canvas"
import SolanaPayment from "@/components/solana-payment"
import { useToast } from "@/hooks/use-toast"

// Storage key for payment status
const PAYMENT_STATUS_KEY = "whiteboard-payment-status"

export default function DrawPage() {
  const [isPaid, setIsPaid] = useState(false)
  const { toast } = useToast()

  // Check if user has already paid
  useEffect(() => {
    const paymentStatus = localStorage.getItem(PAYMENT_STATUS_KEY)
    if (paymentStatus === "paid") {
      setIsPaid(true)
    }
  }, [])

  const handlePaymentSuccess = () => {
    setIsPaid(true)
    localStorage.setItem(PAYMENT_STATUS_KEY, "paid")
    toast({
      title: "Payment successful!",
      description: "You can now start drawing.",
    })
  }

  const handlePaymentError = (errorMessage: string) => {
    toast({
      title: "Payment failed",
      description: errorMessage,
      variant: "destructive",
    })
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Drawing Board</h1>
        <Link href="/view">
          <Button variant="outline">Switch to View Mode</Button>
        </Link>
      </div>

      {!isPaid ? (
        <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md dark:bg-gray-800">
          <h2 className="text-xl font-semibold mb-4">Pay to Start Drawing</h2>
          <p className="mb-6 text-gray-600 dark:text-gray-300">
            Connect your Solana wallet and pay 0.01 SOL to start your drawing session.
          </p>
          <SolanaPayment amount={0.01} onSuccess={handlePaymentSuccess} onError={handlePaymentError} />
        </div>
      ) : (
        <div className="bg-white p-4 rounded-lg shadow-md w-full dark:bg-gray-800">
          <DrawingCanvas isReadOnly={false} />
        </div>
      )}
    </div>
  )
}
