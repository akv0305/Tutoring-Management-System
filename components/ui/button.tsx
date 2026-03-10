import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-[#1E3A5F] text-white hover:bg-[#162d4a]",
        destructive:
          "bg-[#EF4444] text-white hover:bg-red-600",
        outline:
          "border border-gray-200 bg-white hover:bg-gray-50 text-gray-700",
        secondary:
          "border border-[#0D9488] text-[#0D9488] bg-white hover:bg-teal-50",
        ghost:
          "hover:bg-gray-100 text-gray-700",
        link:
          "text-[#1E3A5F] underline-offset-4 hover:underline",
        success:
          "bg-[#22C55E] text-white hover:bg-green-600",
        warning:
          "bg-[#F59E0B] text-white hover:bg-amber-600",
        amber:
          "bg-[#F59E0B] text-white hover:bg-amber-600",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-12 rounded-lg px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
