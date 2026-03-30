import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "success" | "warning" | "danger" | "admin" | "stock" | "outline";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold font-mono tracking-tight transition-colors",
        {
          "bg-muted text-muted-foreground border border-border": variant === "default",
          "bg-primary-light text-primary": variant === "success",
          "bg-warning-light text-warning": variant === "warning",
          "bg-danger-light text-danger": variant === "danger",
          "bg-admin-light text-admin": variant === "admin",
          "bg-stock-light text-stock": variant === "stock",
          "text-foreground border border-border": variant === "outline",
        },
        className
      )}
      {...props}
    />
  );
}
