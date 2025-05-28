import { cookies } from "next/headers"
import { jwtVerify } from "jose"

// Server-only utilities that use next/headers
export async function getSession() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth-token")?.value

    if (!token) {
      return null
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET || "your-secret-key")

    const { payload } = await jwtVerify(token, secret)

    return {
      id: payload.userId as number,
      username: payload.username as string,
      wallet_address: payload.wallet_address as string | null,
    }
  } catch (error) {
    console.error("Error verifying session:", error)
    return null
  }
}
