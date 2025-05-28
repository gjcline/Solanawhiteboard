import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Move server-only functions to a separate file
// This function should only be used in Server Components
export async function getSessionServer() {
  // This will be moved to a server-only file
  return null
}
