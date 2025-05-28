import { EscrowService } from "./escrow-service"

export class BatchProcessor {
  private static instance: BatchProcessor
  private processingInterval: NodeJS.Timeout | null = null
  private isProcessing = false

  static getInstance(): BatchProcessor {
    if (!BatchProcessor.instance) {
      BatchProcessor.instance = new BatchProcessor()
    }
    return BatchProcessor.instance
  }

  // Start the batch processor
  start(): void {
    if (this.processingInterval) {
      return // Already running
    }

    console.log("🚀 Starting batch processor...")

    // Process every 30 seconds
    this.processingInterval = setInterval(async () => {
      if (this.isProcessing) {
        console.log("⏳ Batch processor already running, skipping...")
        return
      }

      this.isProcessing = true
      try {
        await EscrowService.processPendingReleases()
      } catch (error) {
        console.error("❌ Batch processing error:", error)
      } finally {
        this.isProcessing = false
      }
    }, 30000) // 30 seconds

    // Also process immediately on start
    setTimeout(() => this.processNow(), 1000)
  }

  // Stop the batch processor
  stop(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval)
      this.processingInterval = null
      console.log("🛑 Batch processor stopped")
    }
  }

  // Force immediate processing
  async processNow(): Promise<void> {
    if (this.isProcessing) {
      console.log("⏳ Batch processor already running")
      return
    }

    this.isProcessing = true
    try {
      console.log("⚡ Force processing batches...")
      await EscrowService.processPendingReleases()
    } catch (error) {
      console.error("❌ Force processing error:", error)
    } finally {
      this.isProcessing = false
    }
  }
}

// Auto-start in production
if (process.env.NODE_ENV === "production") {
  BatchProcessor.getInstance().start()
}
