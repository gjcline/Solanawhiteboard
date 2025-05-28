"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Loader2, Check, AlertCircle } from "lucide-react"
import { isValidSolanaAddress } from "@/lib/wallet-utils"

interface WalletAddressInputProps {
  value: string
  onChange: (value: string) => void
  onSave?: (value: string) => Promise<void>
  placeholder?: string
  className?: string
  disabled?: boolean
}

export default function WalletAddressInput({
  value,
  onChange,
  onSave,
  placeholder = "enter your solana wallet address",
  className = "",
  disabled = false,
}: WalletAddressInputProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [isValid, setIsValid] = useState<boolean | null>(null)
  const [touched, setTouched] = useState(false)

  // Validate the wallet address when it changes
  useEffect(() => {
    if (value && touched) {
      setIsValid(isValidSolanaAddress(value))
    } else if (!value) {
      setIsValid(null)
    }
  }, [value, touched])

  const handleSave = async () => {
    if (!onSave || !isValid) return

    setIsSaving(true)
    try {
      await onSave(value)
    } finally {
      setIsSaving(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value)
    setTouched(true)
  }

  return (
    <div className="relative">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            value={value}
            onChange={handleChange}
            placeholder={placeholder}
            className={`${className} pr-8 ${
              isValid === false ? "border-red-500" : isValid === true ? "border-green-500" : ""
            }`}
            disabled={disabled || isSaving}
            onBlur={() => setTouched(true)}
          />
          {touched && value && (
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
              {isValid ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-500" />
              )}
            </div>
          )}
        </div>
        {onSave && (
          <Button
            onClick={handleSave}
            disabled={isSaving || !isValid || disabled}
            className="pump-button text-black font-semibold"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                saving...
              </>
            ) : (
              "save"
            )}
          </Button>
        )}
      </div>
      {touched && value && !isValid && (
        <p className="text-xs text-red-500 mt-1">Please enter a valid Solana wallet address</p>
      )}
    </div>
  )
}
