import * as React from "react"
import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-[80px] w-full rounded-lg border border-[var(--c-gray-200)] bg-white px-3 py-2 text-sm text-[var(--c-gray-800)] placeholder:text-[var(--c-gray-400)] transition-colors resize-y",
        "focus:outline-none focus:border-[var(--c-navy-400)] focus:ring-1 focus:ring-[var(--c-navy-400)]/20",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
