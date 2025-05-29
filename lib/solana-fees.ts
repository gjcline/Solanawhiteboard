// Solana transaction fee calculation utilities

// Current Solana network fees (in SOL)
const BASE_FEE = 0.000005 // ~5,000 lamports per signature
const COMPUTE_UNIT_PRICE = 0.000001 // Additional compute fees

export interface FeeCalculation {
  baseFee: number
  computeFee: number
  totalFee: number
}

export interface AdjustedAmounts {
  adjustedStreamerAmount: number
  adjustedDevcaveAmount: number
  actualFeesDeducted: number
}

/**
 * Calculate transaction fees for a given number of instructions
 * @param instructionCount Number of transfer instructions in the transaction
 * @returns Total estimated transaction fee in SOL
 */
export function calculateTransactionFees(instructionCount = 1): number {
  // Base fee for transaction signature
  const baseFee = BASE_FEE

  // Additional compute fees based on instruction complexity
  const computeFee = COMPUTE_UNIT_PRICE * instructionCount * 200 // ~200 compute units per transfer

  const totalFee = baseFee + computeFee

  console.log(`💸 Fee calculation: ${instructionCount} instructions = ${totalFee} SOL`)

  return totalFee
}

/**
 * Deduct transaction fees proportionally from streamer and DevCave amounts
 * @param streamerAmount Original amount for streamer
 * @param devcaveAmount Original amount for DevCave
 * @param transactionFee Total transaction fee to deduct
 * @returns Adjusted amounts after fee deduction
 */
export function deductFeesFromAmounts(
  streamerAmount: number,
  devcaveAmount: number,
  transactionFee: number,
): AdjustedAmounts {
  const totalAmount = streamerAmount + devcaveAmount

  if (totalAmount <= transactionFee) {
    // If fees exceed the total amount, return zero amounts
    console.warn(`⚠️ Transaction fee (${transactionFee}) exceeds total amount (${totalAmount})`)
    return {
      adjustedStreamerAmount: 0,
      adjustedDevcaveAmount: 0,
      actualFeesDeducted: totalAmount,
    }
  }

  // Calculate proportional fee deduction
  const streamerFeeShare = (streamerAmount / totalAmount) * transactionFee
  const devcaveFeeShare = (devcaveAmount / totalAmount) * transactionFee

  const adjustedStreamerAmount = streamerAmount - streamerFeeShare
  const adjustedDevcaveAmount = devcaveAmount - devcaveFeeShare

  console.log(`💸 Fee deduction:`, {
    original_total: totalAmount,
    transaction_fee: transactionFee,
    streamer_fee_share: streamerFeeShare,
    devcave_fee_share: devcaveFeeShare,
    adjusted_streamer: adjustedStreamerAmount,
    adjusted_devcave: adjustedDevcaveAmount,
  })

  return {
    adjustedStreamerAmount,
    adjustedDevcaveAmount,
    actualFeesDeducted: transactionFee,
  }
}

/**
 * Get current network fee estimate (placeholder for dynamic fee fetching)
 * In production, this could fetch real-time fee estimates from Solana RPC
 * @returns Current estimated fee per transaction
 */
export function getCurrentNetworkFee(): number {
  // In production, you might fetch this from:
  // const feeCalculator = await connection.getRecentBlockhash()
  // return feeCalculator.feeCalculator.lamportsPerSignature / LAMPORTS_PER_SOL

  return BASE_FEE
}

/**
 * Validate that escrow has sufficient balance to cover fees
 * @param escrowBalance Current escrow balance
 * @param plannedTransferAmount Amount planned to transfer
 * @param estimatedFees Estimated transaction fees
 * @returns Whether the transaction can proceed
 */
export function validateSufficientBalance(
  escrowBalance: number,
  plannedTransferAmount: number,
  estimatedFees: number,
): boolean {
  const required = plannedTransferAmount + estimatedFees
  const sufficient = escrowBalance >= required

  if (!sufficient) {
    console.warn(`⚠️ Insufficient escrow balance:`, {
      escrow_balance: escrowBalance,
      planned_transfer: plannedTransferAmount,
      estimated_fees: estimatedFees,
      required: required,
      shortfall: required - escrowBalance,
    })
  }

  return sufficient
}
