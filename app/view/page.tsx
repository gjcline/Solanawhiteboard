"use client"

import { useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import DrawingCanvas from "@/components/drawing-canvas"
import { useToast } from "@/hooks/use-toast"

export default function ViewPage() {
  const { toast } = useToast()

  useEffect(() => {
    // Notify users they are in view-only mode
    toast({
      title: "View Mode",
      description: "This is a mirror of the drawing board. Switch to Draw mode to make changes.",
    })
  }, [toast])

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">View Board</h1>
        <Link href="/draw">
          <Button>Switch to Drawing Mode</Button>
        </Link>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-md w-full dark:bg-gray-800">
        <DrawingCanvas isReadOnly={true} />
      </div>
    </div>
  )
}
