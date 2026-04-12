import * as React from "react"
import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-9 w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-1 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] transition-colors",
        "focus:outline-none focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]/20",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Input }
