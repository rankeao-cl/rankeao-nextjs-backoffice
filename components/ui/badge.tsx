import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium transition-colors border",
  {
    variants: {
      variant: {
        default: "bg-[var(--c-gray-100)] text-[var(--c-gray-700)] border-[var(--c-gray-200)]",
        success: "bg-[#ecfdf5] text-[#059669] border-[#a7f3d0]",
        warning: "bg-[#fffbeb] text-[#d97706] border-[#fde68a]",
        danger: "bg-[#fef2f2] text-[#dc2626] border-[#fecaca]",
        navy: "bg-[var(--c-navy-50)] text-[var(--c-navy-700)] border-[var(--c-navy-100)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
