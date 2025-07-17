
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        hero: "bg-gradient-primary text-primary-foreground hover:shadow-hero transform hover:scale-105 transition-all duration-300 relative overflow-hidden group",
        feature: "bg-accent text-accent-foreground hover:bg-accent/90 shadow-soft hover:shadow-feature transform hover:-translate-y-1 transition-all duration-300",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
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
  showHoverArrows?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, showHoverArrows = false, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    
    if (showHoverArrows && variant === "hero") {
      return (
        <Comp
          className={cn(buttonVariants({ variant, size, className }), "hover:scale-110 hover:px-6")}
          ref={ref}
          {...props}
        >
          <span className="relative z-10 flex items-center justify-center w-full transition-all duration-300">
            <span className="transition-transform duration-300 group-hover:-translate-x-2">
              {children}
            </span>
            <div className="absolute right-0 flex transition-all duration-300 opacity-0 translate-x-6 group-hover:opacity-100 group-hover:translate-x-4 ml-4">
              <ChevronRight className="h-4 w-4 transition-all duration-300 group-hover:animate-pulse" />
              <ChevronRight className="h-4 w-4 transition-all duration-300 delay-75 -ml-2 group-hover:animate-pulse group-hover:[animation-delay:150ms]" />
            </div>
          </span>
        </Comp>
      )
    }
    
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      >
        {children}
      </Comp>
    )
  }
)

Button.displayName = "Button"

export { Button, buttonVariants }
