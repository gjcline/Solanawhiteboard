/**
 * Validates a Solana wallet address format
 * @param address The wallet address to validate
 * @returns boolean indicating if the address is valid
 */
export function isValidSolanaAddress(address: string): boolean {
  // Basic validation for Solana address format
  // This checks if the address is 32-44 characters long and contains only base58 characters
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)
}

/**
 * Formats a wallet address for display by showing only the first and last few characters
 * @param address The full wallet address
 * @param prefixLength Number of characters to show at the beginning
 * @param suffixLength Number of characters to show at the end
 * @returns Formatted wallet address string
 */
export function formatWalletAddress(address: string, prefixLength = 4, suffixLength = 4): string {
  if (!address || address.length < prefixLength + suffixLength + 3) {
    return address || ""
  }

  return `${address.slice(0, prefixLength)}...${address.slice(-suffixLength)}`
}

/**
 * Stores a wallet address in localStorage with a specific key
 * @param key The key to use for storage
 * @param address The wallet address to store
 */
export function storeWalletAddress(key: string, address: string | null): void {
  if (address) {
    localStorage.setItem(key, address)
  } else {
    localStorage.removeItem(key)
  }
}

/**
 * Retrieves a wallet address from localStorage
 * @param key The key used for storage
 * @returns The stored wallet address or null if not found
 */
export function getStoredWalletAddress(key: string): string | null {
  return localStorage.getItem(key)
}
