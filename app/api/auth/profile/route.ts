import { type NextRequest, NextResponse } from "next/server"
import { UserService } from "@/lib/services/users"

export async function PUT(request: NextRequest) {
  try {
    const { id, username, email, wallet_address } = await request.json()
    console.log("Profile update request:", {
      id,
      username,
      email,
      wallet_address: wallet_address ? "provided" : "not provided",
    })

    if (!id) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 })
    }

    // Ensure ID is a number
    const userId = Number.parseInt(id, 10)
    if (isNaN(userId)) {
      return NextResponse.json({ error: "Invalid user ID format" }, { status: 400 })
    }

    // Build update data object
    const updateData: any = {}
    if (username !== undefined) updateData.username = username
    if (email !== undefined) updateData.email = email
    if (wallet_address !== undefined) updateData.wallet_address = wallet_address

    // Only proceed if we have data to update
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No update data provided" }, { status: 400 })
    }

    console.log("Updating user with data:", updateData)

    // Update user in database
    const user = await UserService.update(userId, updateData)

    if (!user) {
      console.log("User not found for ID:", userId)
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    console.log("User updated successfully:", user)
    return NextResponse.json({ user })
  } catch (error) {
    console.error("Profile update error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
