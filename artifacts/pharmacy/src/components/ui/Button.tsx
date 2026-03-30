import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "admin" | "stock";
  size?: "sm" | "md" | "lg" | "icon";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
          {
            "bg-primary text-primary-foreground hover:bg-primary-hover shadow-soft": variant === "primary",
            "bg-surface text-foreground border border-border shadow-soft hover:bg-muted": variant === "secondary",
            "border-2 border-border bg-transparent hover:bg-muted text-foreground": variant === "outline",
            "hover:bg-muted text-muted-foreground hover:text-foreground": variant === "ghost",
            "bg-danger-light text-danger border border-danger/20 hover:bg-danger/10": variant === "danger",
            "bg-admin-light text-admin border border-admin/20 hover:bg-admin/10": variant === "admin",
            "bg-stock-light text-stock border border-stock/20 hover:bg-stock/10": variant === "stock",
            "h-8 px-3 text-xs": size === "sm",
            "h-10 px-4 py-2 text-sm": size === "md",
            "h-12 px-6 text-base font-semibold": size === "lg",
            "h-10 w-10": size === "icon",
          },
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
