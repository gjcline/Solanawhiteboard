"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Zap, Users, DollarSign, Paintbrush2, Timer, Bomb, ArrowRight } from "lucide-react"
import DrawingBackground from "@/components/drawing-background"

export default function Home() {
  const [sessionId, setSessionId] = useState("")
  const router = useRouter()

  const joinSession = () => {
    if (sessionId.trim()) {
      router.push(`/draw/${sessionId.trim()}`)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      joinSession()
    }
  }

  return (
    <div className="min-h-screen w-full relative">
      <DrawingBackground density={15} speed={0.3} />

      {/* Hero Section */}
      <section className="relative w-full py-12 md:py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#00ff88]/10 via-transparent to-[#00cc6a]/5"></div>
        <div className="container mx-auto px-4 md:px-6 relative">
          <div className="flex flex-col items-center justify-center space-y-6 text-center max-w-4xl mx-auto">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#00ff88]/10 border border-[#00ff88]/20">
                <Zap className="h-4 w-4 text-[#00ff88]" />
                <span className="text-sm text-[#00ff88] font-medium">powered by solana</span>
              </div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-5xl md:text-6xl">
                <span className="pump-text-gradient">draw.fun</span>
                <br />
                <span className="text-white">for streamers</span>
              </h1>
              <p className="mx-auto max-w-[600px] text-gray-400 text-base md:text-lg leading-relaxed">
                the first token-based drawing platform on solana. viewers buy drawing tokens to interact with your
                stream. single lines, bundles, or nuke the entire board!
              </p>
            </div>
            <div>
              <Link href="/login">
                <Button size="lg" className="pump-button text-black font-semibold px-8 py-3">
                  start pumping draws
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Join Session Section */}
      <section className="w-full py-8 bg-gradient-to-b from-transparent to-gray-900/20 relative">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-2xl mx-auto">
            <Card className="pump-card border-[#00ff88]/50 glow-effect">
              <CardHeader className="text-center pb-4">
                <CardTitle className="flex items-center justify-center gap-2 text-white text-xl">
                  <Paintbrush2 className="h-5 w-5 text-[#00ff88]" />
                  join a drawing session
                </CardTitle>
                <CardDescription className="text-gray-400">
                  enter the session ID from your favorite streamer to start drawing and pumping tokens!
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3">
                  <Input
                    placeholder="enter session ID (e.g., abc123def456)"
                    value={sessionId}
                    onChange={(e) => setSessionId(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="flex-1 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 text-base py-4"
                  />
                  <Button
                    onClick={joinSession}
                    disabled={!sessionId.trim()}
                    size="lg"
                    className="pump-button text-black font-semibold px-6"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
                <div className="text-center space-y-1">
                  <p className="text-sm text-gray-400">
                    💡 <strong>how it works:</strong> streamers display their session ID on screen. enter it above to
                    access their interactive whiteboard!
                  </p>
                  <p className="text-xs text-gray-500">
                    you'll need a phantom wallet and SOL tokens to purchase drawing credits
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Made by section */}
      <section className="w-full py-6 relative">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex items-center justify-center gap-8 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-[#00ff88] rounded-full animate-pulse"></div>
              <span>live on solana devnet</span>
            </div>
            <div className="flex items-center gap-2">
              <span>made by</span>
              <span className="text-[#00ff88] font-medium">D3vCav3</span>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="w-full py-20 bg-gradient-to-b from-transparent to-gray-900/20 relative">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-16 max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-4">token-based pricing</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              viewers purchase tokens to interact with your whiteboard. 50% goes to you, 50% to D3vCav3 for platform
              maintenance.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3 max-w-4xl mx-auto">
            {/* Single Line */}
            <div className="pump-card rounded-xl p-8 text-center glow-effect">
              <div className="pump-gradient p-4 rounded-xl w-fit mx-auto mb-6">
                <Zap className="h-8 w-8 text-black" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">🎨 Single Line</h3>
              <div className="text-3xl font-bold text-[#00ff88] mb-4">0.005 SOL</div>
              <p className="text-gray-400 text-sm mb-6">
                One continuous line with up to 5 seconds of drawing time. Perfect for quick sketches and doodles.
              </p>
              <div className="space-y-2 text-sm text-gray-300">
                <div className="flex items-center justify-center gap-2">
                  <Timer className="h-4 w-4" />
                  <span>5-second drawing limit</span>
                </div>
                <div>Auto-stops when time expires</div>
                <div>Visual timer countdown</div>
              </div>
            </div>

            {/* Bundle */}
            <div className="pump-card rounded-xl p-8 text-center border-[#00ff88]/50 relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-[#00ff88] text-black px-3 py-1 rounded-full text-xs font-bold">60% OFF</span>
              </div>
              <div className="pump-gradient p-4 rounded-xl w-fit mx-auto mb-6">
                <Paintbrush2 className="h-8 w-8 text-black" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">📦 Bundle: 10 Lines</h3>
              <div className="text-3xl font-bold text-[#00ff88] mb-4">0.02 SOL</div>
              <p className="text-gray-400 text-sm mb-6">
                10 drawing tokens to use anytime during the session. Best value for active artists!
              </p>
              <div className="space-y-2 text-sm text-gray-300">
                <div>Effective rate: 0.002 SOL per line</div>
                <div>Use tokens anytime</div>
                <div>Perfect for detailed artwork</div>
              </div>
            </div>

            {/* Nuke */}
            <div className="pump-card rounded-xl p-8 text-center border-red-500/30">
              <div className="bg-red-500/20 p-4 rounded-xl w-fit mx-auto mb-6">
                <Bomb className="h-8 w-8 text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">💥 Nuke the Board</h3>
              <div className="text-3xl font-bold text-red-400 mb-4">0.03 SOL</div>
              <p className="text-gray-400 text-sm mb-6">
                Instantly wipe the canvas clean with a dramatic explosion effect visible to all viewers.
              </p>
              <div className="space-y-2 text-sm text-gray-300">
                <div>10-second dramatic overlay</div>
                <div>Shows who nuked the board</div>
                <div>Perfect for trolling or resets</div>
              </div>
            </div>
          </div>

          <div className="text-center mt-12">
            <p className="text-gray-400 mb-4">
              <strong>Revenue Split:</strong> 50% to streamer • 50% to D3vCav3
            </p>
            <p className="text-sm text-gray-500">All payments processed instantly on Solana blockchain</p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="w-full py-20 relative">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-16 max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-4">how it works</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              draw.fun uses a token-based system where viewers purchase drawing tokens to interact with your whiteboard.
              each token type offers different interaction possibilities.
            </p>
          </div>

          <div className="grid gap-8 md:gap-12 lg:gap-16 max-w-4xl mx-auto">
            <div className="pump-card rounded-xl p-8 glow-effect">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="pump-gradient p-4 rounded-xl flex-shrink-0">
                  <span className="text-2xl font-bold text-black">1</span>
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-xl font-semibold text-white mb-2">streamer creates session</h3>
                  <p className="text-gray-400">
                    create a unique whiteboard session with your solana wallet. get two URLs: one for your stream view,
                    one for viewers to purchase tokens and draw.
                  </p>
                </div>
              </div>
            </div>

            <div className="pump-card rounded-xl p-8">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="pump-gradient p-4 rounded-xl flex-shrink-0">
                  <span className="text-2xl font-bold text-black">2</span>
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-xl font-semibold text-white mb-2">viewers join with session ID</h3>
                  <p className="text-gray-400">
                    viewers see the session ID on your stream and enter it above to access the interactive whiteboard.
                    they connect their phantom wallet and purchase tokens to start drawing.
                  </p>
                </div>
              </div>
            </div>

            <div className="pump-card rounded-xl p-8">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="pump-gradient p-4 rounded-xl flex-shrink-0">
                  <span className="text-2xl font-bold text-black">3</span>
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-xl font-semibold text-white mb-2">draw and earn in real-time</h3>
                  <p className="text-gray-400">
                    viewers use their tokens to draw (5-second limit per line) or nuke the board. you earn 50% of all
                    purchases instantly while D3vCav3 gets 50% for platform maintenance.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="w-full py-20 relative">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
            <div className="pump-card rounded-xl p-6 text-center">
              <div className="pump-gradient p-3 rounded-lg w-fit mx-auto mb-4">
                <Users className="h-6 w-6 text-black" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">token-based engagement</h3>
              <p className="text-gray-400 text-sm">
                viewers purchase tokens to interact with your stream. single lines, bundles, or dramatic board nukes.
              </p>
            </div>

            <div className="pump-card rounded-xl p-6 text-center">
              <div className="pump-gradient p-3 rounded-lg w-fit mx-auto mb-4">
                <DollarSign className="h-6 w-6 text-black" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">50/50 revenue split</h3>
              <p className="text-gray-400 text-sm">
                earn 50% of all token purchases instantly. payments are processed on the solana blockchain.
              </p>
            </div>

            <div className="pump-card rounded-xl p-6 text-center">
              <div className="pump-gradient p-3 rounded-lg w-fit mx-auto mb-4">
                <Timer className="h-6 w-6 text-black" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">timed drawing sessions</h3>
              <p className="text-gray-400 text-sm">
                each line token provides 5 seconds of drawing time with visual countdown and auto-stop features.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="w-full py-20 bg-gradient-to-t from-gray-900/50 to-transparent relative">
        <div className="container mx-auto px-4 md:px-6">
          <div className="pump-card rounded-2xl p-12 text-center glow-effect max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-4">ready to pump some draws?</h2>
            <p className="text-gray-400 mb-8 max-w-md mx-auto">
              join the first token-based drawing platform on solana. start monetizing your viewer engagement with our
              innovative pricing structure.
            </p>
            <Link href="/login">
              <Button size="lg" className="pump-button text-black font-semibold px-8 py-3 text-lg">
                launch your board
              </Button>
            </Link>
            <div className="mt-6 flex items-center justify-center gap-8 text-sm text-gray-500 flex-wrap">
              <span>🎨 0.005 SOL per line</span>
              <span>📦 0.02 SOL for 10 lines</span>
              <span>💥 0.03 SOL to nuke</span>
            </div>
            <p className="text-xs text-gray-500 mt-4">
              by clicking this button you agree to the terms and conditions and certify that you are over 18 years old
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
