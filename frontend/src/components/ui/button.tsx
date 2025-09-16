import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 relative overflow-hidden group",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg hover:from-blue-700 hover:to-blue-800 hover:shadow-xl hover:shadow-blue-500/25 transform hover:scale-105 hover:-translate-y-0.5",
        destructive:
          "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg hover:from-red-700 hover:to-red-800 hover:shadow-xl hover:shadow-red-500/25 transform hover:scale-105 hover:-translate-y-0.5",
        outline:
          "border-2 border-blue-500/30 bg-transparent text-blue-300 backdrop-blur-sm hover:border-blue-400 hover:bg-blue-500/10 hover:text-blue-200 hover:shadow-lg hover:shadow-blue-500/20 transform hover:scale-105",
        secondary:
          "bg-gradient-to-r from-gray-600 to-gray-700 text-white shadow-md hover:from-gray-700 hover:to-gray-800 hover:shadow-lg transform hover:scale-105",
        ghost: "hover:bg-white/10 hover:text-white backdrop-blur-sm transform hover:scale-105",
        link: "text-blue-400 underline-offset-4 hover:underline hover:text-blue-300",
        premium: "bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 text-white shadow-xl hover:shadow-2xl hover:shadow-purple-500/30 transform hover:scale-110 hover:-translate-y-1 bg-size-200 bg-pos-0 hover:bg-pos-100 transition-all duration-500",
        glow: "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/50 hover:shadow-xl hover:shadow-blue-500/75 transform hover:scale-110 hover:-translate-y-1 animate-pulse hover:animate-none",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3 text-xs",
        lg: "h-12 rounded-lg px-8 text-base font-semibold",
        xl: "h-14 rounded-xl px-10 text-lg font-bold",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
