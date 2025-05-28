"use client"

import { useState, useEffect } from "react"
import { Loader2 } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

interface Drawing {
  id: string
  title: string
  imageUrl: string
  createdAt: string
  creator: string
}

export default function GalleryPage() {
  const [drawings, setDrawings] = useState<Drawing[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate fetching drawings from an API
    const fetchDrawings = async () => {
      try {
        // In a real app, you would fetch from your API
        await new Promise((resolve) => setTimeout(resolve, 1000))

        // Mock data
        const mockDrawings: Drawing[] = [
          {
            id: "1",
            title: "Abstract Sunset",
            imageUrl: "/placeholder.svg?height=300&width=400&query=abstract art",
            createdAt: "2025-05-20T14:30:00Z",
            creator: "artist123",
          },
          {
            id: "2",
            title: "Mountain Landscape",
            imageUrl: "/placeholder.svg?height=300&width=400&query=mountain landscape drawing",
            createdAt: "2025-05-19T10:15:00Z",
            creator: "nature_lover",
          },
          {
            id: "3",
            title: "Urban Sketch",
            imageUrl: "/placeholder.svg?height=300&width=400&query=urban sketch art",
            createdAt: "2025-05-18T16:45:00Z",
            creator: "city_artist",
          },
        ]

        setDrawings(mockDrawings)
      } catch (error) {
        console.error("Error fetching drawings:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDrawings()
  }, [])

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Drawing Gallery</h1>

      {drawings.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-xl text-gray-500">No drawings found. Create your first masterpiece!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {drawings.map((drawing) => (
            <Card key={drawing.id} className="overflow-hidden">
              <CardHeader className="p-4">
                <CardTitle>{drawing.title}</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <img
                  src={drawing.imageUrl || "/placeholder.svg"}
                  alt={drawing.title}
                  className="w-full h-64 object-cover"
                />
              </CardContent>
              <CardFooter className="flex justify-between p-4 text-sm text-gray-500">
                <span>By {drawing.creator}</span>
                <span>{new Date(drawing.createdAt).toLocaleDateString()}</span>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
