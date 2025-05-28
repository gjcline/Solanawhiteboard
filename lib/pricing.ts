// Pricing configuration for draw.fun
export const PRICING = {
  SINGLE_LINE: 0.005, // SOL per single line (5 seconds max)
  BUNDLE_10_LINES: 0.02, // SOL for 10 lines bundle (60% discount)
  NUKE_BOARD: 0.03, // SOL to nuke the entire board
} as const

export const REVENUE_SPLIT = {
  DEVCAVE_PERCENTAGE: 0.5, // 50% to D3vCav3
  STREAMER_PERCENTAGE: 0.5, // 50% to streamer
} as const

// D3vCav3 wallet address (replace with actual address)
export const DEVCAVE_WALLET = process.env.DEVCAVE_WALLET || "D3vCav3WalletAddressHere123456789"

export const DRAWING_TIME_LIMIT = 5000 // 5 seconds per line in milliseconds

export type PurchaseType = "single" | "bundle" | "nuke"

export interface PurchaseOption {
  type: PurchaseType
  price: number
  title: string
  description: string
  value: string
  discount?: string
}

export const PURCHASE_OPTIONS: PurchaseOption[] = [
  {
    type: "single",
    price: PRICING.SINGLE_LINE,
    title: "🎨 Single Line",
    description: "One continuous line (up to 5 seconds of drawing)",
    value: "1 line",
  },
  {
    type: "bundle",
    price: PRICING.BUNDLE_10_LINES,
    title: "📦 Bundle: 10 Lines",
    description: "10 draw tokens, use anytime during session",
    value: "10 lines",
    discount: "60% off",
  },
  {
    type: "nuke",
    price: PRICING.NUKE_BOARD,
    title: "💥 Nuke the Board",
    description: "Instantly wipe the canvas with dramatic effect",
    value: "clear board",
  },
]
