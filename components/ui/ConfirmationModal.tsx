"use client"

import React from "react"
import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type ConfirmationModalProps = {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: "default" | "danger" | "success"
}

type VariantConfig = {
  icon: React.ElementType
  iconBg: string
  iconColor: string
  confirmButtonClass: string
}

const VARIANT_CONFIG: Record<NonNullable<ConfirmationModalProps["variant"]>, VariantConfig> = {
  default: {
    icon: Info,
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
    confirmButtonClass: "bg-[#1E3A5F] hover:bg-[#162d4a] text-white",
  },
  danger: {
    icon: AlertTriangle,
    iconBg: "bg-red-100",
    iconColor: "text-red-500",
    confirmButtonClass: "bg-red-500 hover:bg-red-600 text-white",
  },
  success: {
    icon: CheckCircle2,
    iconBg: "bg-green-100",
    iconColor: "text-green-600",
    confirmButtonClass: "bg-[#22C55E] hover:bg-green-600 text-white",
  },
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "default",
}: ConfirmationModalProps) {
  const config = VARIANT_CONFIG[variant]
  const Icon = config.icon

  const handleConfirm = () => {
    onConfirm()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md rounded-xl p-0 overflow-hidden gap-0 border-0 shadow-2xl">
        <div className="p-6">
          {/* Icon */}
          <div className="flex justify-center mb-4">
            <div
              className={cn(
                "w-14 h-14 rounded-full flex items-center justify-center",
                config.iconBg
              )}
            >
              <Icon className={cn("w-7 h-7", config.iconColor)} />
            </div>
          </div>

          <DialogHeader className="text-center space-y-2">
            <DialogTitle className="text-lg font-semibold text-[#1E293B] text-center">
              {title}
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500 text-center leading-relaxed">
              {message}
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 pt-2">
          <div className="flex items-center justify-end gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="border-gray-200 text-gray-600 hover:bg-gray-50"
            >
              {cancelText}
            </Button>
            <Button
              onClick={handleConfirm}
              className={cn("font-medium", config.confirmButtonClass)}
            >
              {confirmText}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
