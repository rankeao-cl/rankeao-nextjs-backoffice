import * as React from "react"
import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-9 w-full rounded-lg border border-[var(--c-gray-200)] bg-white px-3 py-1 text-sm text-[var(--c-gray-800)] placeholder:text-[var(--c-gray-400)] transition-colors",
        "focus:outline-none focus:border-[var(--c-navy-400)] focus:ring-1 focus:ring-[var(--c-navy-400)]/20",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Input }
