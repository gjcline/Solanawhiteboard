// Solana transaction fee calculation utilities

// Current Solana network fees (in SOL)
const BASE_FEE = 0.000005 // ~5,000 lamports per signature
const COMPUTE_UNIT_PRICE = 0.000001 // Additional compute fees

// Fee tolerance settings
const FEE_TOLERANCE_PERCENTAGE = 50 // Allow 50% variance in fees
const MAX_ACCEPTABLE_FEE = 0.001 // Never pay more than 0.001 SOL in fees
const MIN_TRANSFER_AMOUNT = 0.0001 // Don't transfer less than 0.0001 SOL

export interface FeeCalculation {
  baseFee: number
  computeFee: number
  totalFee: number
  toleranceRange: {
    min: number
    max: number
  }
}

export interface AdjustedAmounts {
  adjustedStreamerAmount: number
  adjustedDevcaveAmount: number
  actualFeesDeducted: number
  feeVariance: number
}

/**
 * Calculate transaction fees with tolerance range
 * @param instructionCount Number of transfer instructions in the transaction
 * @returns Fee calculation with tolerance range
 */
export function calculateTransactionFeesWithTolerance(instructionCount = 1): FeeCalculation {
  // Base fee for transaction signature
  const baseFee = BASE_FEE

  // Additional compute fees based on instruction complexity
  const computeFee = COMPUTE_UNIT_PRICE * instructionCount * 200 // ~200 compute units per transfer

  const totalFee = baseFee + computeFee

  // Calculate tolerance range
  const tolerance = totalFee * (FEE_TOLERANCE_PERCENTAGE / 100)
  const toleranceRange = {
    min: Math.max(0, totalFee - tolerance),
    max: Math.min(MAX_ACCEPTABLE_FEE, totalFee + tolerance),
  }

  console.log(`💸 Fee calculation with tolerance:`, {
    instructions: instructionCount,
    estimated_fee: totalFee,
    tolerance_range: toleranceRange,
    max_acceptable: MAX_ACCEPTABLE_FEE,
  })

  return {
    baseFee,
    computeFee,
    totalFee,
    toleranceRange,
  }
}

/**
 * Legacy function for backward compatibility
 */
export function calculateTransactionFees(instructionCount = 1): number {
  return calculateTransactionFeesWithTolerance(instructionCount).totalFee
}

/**
 * Validate if actual fee is within acceptable range
 * @param estimatedFee Originally estimated fee
 * @param actualFee Actual fee charged by network
 * @returns Whether the fee is acceptable
 */
export function isFeesAcceptable(estimatedFee: number, actualFee: number): boolean {
  const feeCalc = calculateTransactionFeesWithTolerance(1)

  // Check if actual fee is within tolerance range
  const withinTolerance = actualFee >= feeCalc.toleranceRange.min && actualFee <= feeCalc.toleranceRange.max

  // Check if actual fee is below maximum acceptable
  const belowMaximum = actualFee <= MAX_ACCEPTABLE_FEE

  const acceptable = withinTolerance && belowMaximum

  if (!acceptable) {
    console.warn(`⚠️ Fee outside acceptable range:`, {
      estimated: estimatedFee,
      actual: actualFee,
      tolerance_range: feeCalc.toleranceRange,
      max_acceptable: MAX_ACCEPTABLE_FEE,
      within_tolerance: withinTolerance,
      below_maximum: belowMaximum,
    })
  } else {
    console.log(`✅ Fee within acceptable range:`, {
      estimated: estimatedFee,
      actual: actualFee,
      variance: (((actualFee - estimatedFee) / estimatedFee) * 100).toFixed(2) + "%",
    })
  }

  return acceptable
}

/**
 * Deduct transaction fees with flexible tolerance
 * @param streamerAmount Original amount for streamer
 * @param devcaveAmount Original amount for DevCave
 * @param actualTransactionFee Actual fee charged by network
 * @param estimatedFee Originally estimated fee
 * @returns Adjusted amounts after fee deduction
 */
export function deductFeesFromAmountsFlexible(
  streamerAmount: number,
  devcaveAmount: number,
  actualTransactionFee: number,
  estimatedFee = 0,
): AdjustedAmounts {
  const totalAmount = streamerAmount + devcaveAmount
  const feeVariance = actualTransactionFee - estimatedFee

  // Check if actual fee is acceptable
  if (!isFeesAcceptable(estimatedFee, actualTransactionFee)) {
    console.error(`❌ Transaction fee too high: ${actualTransactionFee} SOL (max: ${MAX_ACCEPTABLE_FEE} SOL)`)
    throw new Error(`Transaction fee too high: ${actualTransactionFee} SOL`)
  }

  if (totalAmount <= actualTransactionFee) {
    // If fees exceed the total amount, return zero amounts
    console.warn(`⚠️ Transaction fee (${actualTransactionFee}) exceeds total amount (${totalAmount})`)
    return {
      adjustedStreamerAmount: 0,
      adjustedDevcaveAmount: 0,
      actualFeesDeducted: totalAmount,
      feeVariance,
    }
  }

  // Calculate proportional fee deduction
  const streamerFeeShare = (streamerAmount / totalAmount) * actualTransactionFee
  const devcaveFeeShare = (devcaveAmount / totalAmount) * actualTransactionFee

  const adjustedStreamerAmount = Math.max(0, streamerAmount - streamerFeeShare)
  const adjustedDevcaveAmount = Math.max(0, devcaveAmount - devcaveFeeShare)

  // Ensure minimum transfer amount
  const finalStreamerAmount = adjustedStreamerAmount < MIN_TRANSFER_AMOUNT ? 0 : adjustedStreamerAmount
  const finalDevcaveAmount = adjustedDevcaveAmount < MIN_TRANSFER_AMOUNT ? 0 : adjustedDevcaveAmount

  console.log(`💸 Flexible fee deduction:`, {
    original_total: totalAmount,
    estimated_fee: estimatedFee,
    actual_fee: actualTransactionFee,
    fee_variance: feeVariance,
    variance_percentage: estimatedFee > 0 ? ((feeVariance / estimatedFee) * 100).toFixed(2) + "%" : "N/A",
    streamer_fee_share: streamerFeeShare,
    devcave_fee_share: devcaveFeeShare,
    final_streamer: finalStreamerAmount,
    final_devcave: finalDevcaveAmount,
  })

  return {
    adjustedStreamerAmount: finalStreamerAmount,
    adjustedDevcaveAmount: finalDevcaveAmount,
    actualFeesDeducted: actualTransactionFee,
    feeVariance,
  }
}

/**
 * Legacy function for backward compatibility
 */
export function deductFeesFromAmounts(
  streamerAmount: number,
  devcaveAmount: number,
  transactionFee: number,
): AdjustedAmounts {
  return deductFeesFromAmountsFlexible(streamerAmount, devcaveAmount, transactionFee, transactionFee)
}

/**
 * Get current network fee estimate with tolerance
 * @returns Fee estimate with tolerance range
 */
export function getCurrentNetworkFeeWithTolerance(): FeeCalculation {
  return calculateTransactionFeesWithTolerance(1)
}

/**
 * Validate that escrow has sufficient balance to cover fees with tolerance
 * @param escrowBalance Current escrow balance
 * @param plannedTransferAmount Amount planned to transfer
 * @param estimatedFees Estimated transaction fees
 * @returns Whether the transaction can proceed
 */
export function validateSufficientBalanceFlexible(
  escrowBalance: number,
  plannedTransferAmount: number,
  estimatedFees: number,
): boolean {
  const feeCalc = calculateTransactionFeesWithTolerance(1)
  const maxPossibleFee = feeCalc.toleranceRange.max
  const required = plannedTransferAmount + maxPossibleFee
  const sufficient = escrowBalance >= required

  if (!sufficient) {
    console.warn(`⚠️ Insufficient escrow balance for worst-case fees:`, {
      escrow_balance: escrowBalance,
      planned_transfer: plannedTransferAmount,
      estimated_fees: estimatedFees,
      max_possible_fee: maxPossibleFee,
      required: required,
      shortfall: required - escrowBalance,
    })
  } else {
    console.log(`✅ Sufficient balance for fee tolerance:`, {
      escrow_balance: escrowBalance,
      planned_transfer: plannedTransferAmount,
      max_possible_fee: maxPossibleFee,
      buffer: escrowBalance - required,
    })
  }

  return sufficient
}
