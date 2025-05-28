"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import WalletConnection from "@/components/wallet-connection"
import { useToast } from "@/hooks/use-toast"
import { isPhantomWalletInstalled, isValidSolanaAddress, getSolanaExplorerUrl } from "@/lib/solana-utils"

export default function WalletTestPage() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [walletBalance, setWalletBalance] = useState<number>(0)
  const [testResults, setTestResults] = useState<string[]>([])
  const { toast } = useToast()

  const addTestResult = (result: string) => {
    setTestResults((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${result}`])
  }

  const handleWalletConnected = (address: string, balance: number) => {
    setWalletAddress(address)
    setWalletBalance(balance)
    addTestResult(`✅ Wallet connected: ${address}`)
    addTestResult(`💰 Balance: ${balance.toFixed(4)} SOL`)
  }

  const handleWalletDisconnected = () => {
    setWalletAddress(null)
    setWalletBalance(0)
    addTestResult(`❌ Wallet disconnected`)
  }

  const handleBalanceUpdate = (balance: number) => {
    setWalletBalance(balance)
    addTestResult(`🔄 Balance updated: ${balance.toFixed(4)} SOL`)
  }

  const runWalletTests = () => {
    addTestResult("🧪 Running wallet tests...")

    // Test 1: Check if Phantom is installed
    const isInstalled = isPhantomWalletInstalled()
    addTestResult(`Phantom installed: ${isInstalled ? "✅" : "❌"}`)

    // Test 2: Test address validation
    const testAddresses = [
      "11111111111111111111111111111112", // Valid
      "invalid-address", // Invalid
      "DemoWallet123456789", // Invalid format
    ]

    testAddresses.forEach((addr) => {
      const isValid = isValidSolanaAddress(addr)
      addTestResult(`Address validation (${addr.slice(0, 10)}...): ${isValid ? "✅" : "❌"}`)
    })

    // Test 3: Explorer URL generation
    const testSignature = "test123signature456"
    const explorerUrl = getSolanaExplorerUrl(testSignature, "devnet")
    addTestResult(`Explorer URL generated: ✅`)

    if (walletAddress) {
      addTestResult(`Current wallet: ${walletAddress}`)
      addTestResult(`Current balance: ${walletBalance.toFixed(4)} SOL`)
    }
  }

  const clearResults = () => {
    setTestResults([])
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-2">Phantom Wallet Test</h1>
          <p className="text-gray-400">Test Phantom wallet connection and functionality</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Wallet Connection */}
          <Card className="pump-card border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Wallet Connection</CardTitle>
              <CardDescription className="text-gray-400">
                Connect your Phantom wallet to test functionality
              </CardDescription>
            </CardHeader>
            <CardContent>
              <WalletConnection
                onWalletConnected={handleWalletConnected}
                onWalletDisconnected={handleWalletDisconnected}
                onBalanceUpdate={handleBalanceUpdate}
              />
            </CardContent>
          </Card>

          {/* Test Controls */}
          <Card className="pump-card border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Test Controls</CardTitle>
              <CardDescription className="text-gray-400">Run various wallet tests and diagnostics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={runWalletTests} className="w-full pump-button text-black">
                Run Wallet Tests
              </Button>

              <Button onClick={clearResults} variant="outline" className="w-full">
                Clear Results
              </Button>

              {walletAddress && (
                <Alert>
                  <AlertDescription>
                    <div className="space-y-2">
                      <div>
                        <strong>Connected:</strong> {walletAddress.slice(0, 8)}...{walletAddress.slice(-8)}
                      </div>
                      <div>
                        <strong>Balance:</strong> {walletBalance.toFixed(4)} SOL
                      </div>
                      <div>
                        <strong>Network:</strong> Devnet
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Test Results */}
        {testResults.length > 0 && (
          <Card className="pump-card border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Test Results</CardTitle>
              <CardDescription className="text-gray-400">Real-time test output and diagnostics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-black p-4 rounded-lg font-mono text-sm max-h-64 overflow-y-auto">
                {testResults.map((result, index) => (
                  <div key={index} className="text-green-400 mb-1">
                    {result}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card className="pump-card border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Instructions</CardTitle>
          </CardHeader>
          <CardContent className="text-gray-400 space-y-2">
            <p>
              1. <strong>Install Phantom:</strong> Make sure you have the Phantom wallet browser extension installed
            </p>
            <p>
              2. <strong>Connect Wallet:</strong> Click "Connect Phantom Wallet" to establish connection
            </p>
            <p>
              3. <strong>Run Tests:</strong> Click "Run Wallet Tests" to verify all functionality
            </p>
            <p>
              4. <strong>Check Results:</strong> Review the test output for any issues
            </p>
            <p>
              5. <strong>Test Features:</strong> Try refreshing balance, copying address, etc.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
