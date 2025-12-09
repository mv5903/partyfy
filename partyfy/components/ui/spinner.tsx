import * as React from "react"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "wave" | "dots"
  size?: "sm" | "default" | "lg"
}

const Spinner = React.forwardRef<HTMLDivElement, SpinnerProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    const sizeClasses = {
      sm: "w-4 h-4",
      default: "w-6 h-6",
      lg: "w-8 h-8",
    }

    if (variant === "default") {
      return (
        <div ref={ref} className={cn("inline-block", className)} {...props}>
          <Loader2 className={cn("animate-spin", sizeClasses[size])} />
        </div>
      )
    }

    if (variant === "wave") {
      return (
        <div
          ref={ref}
          className={cn("flex items-center justify-center gap-1", className)}
          {...props}
        >
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={cn(
                "rounded-full bg-current animate-wave",
                size === "sm" ? "w-1 h-1" : size === "lg" ? "w-3 h-3" : "w-2 h-2"
              )}
              style={{
                animationDelay: `${i * 0.15}s`,
              }}
            />
          ))}
        </div>
      )
    }

    if (variant === "dots") {
      return (
        <div
          ref={ref}
          className={cn("flex items-center justify-center gap-1", className)}
          {...props}
        >
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={cn(
                "rounded-full bg-current animate-pulse",
                size === "sm" ? "w-1 h-1" : size === "lg" ? "w-3 h-3" : "w-2 h-2"
              )}
              style={{
                animationDelay: `${i * 0.2}s`,
              }}
            />
          ))}
        </div>
      )
    }

    return null
  }
)
Spinner.displayName = "Spinner"

export { Spinner }
