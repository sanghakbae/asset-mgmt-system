import type { HTMLAttributes } from "react";

type BadgeVariant = "default" | "outline";
type BadgeProps = HTMLAttributes<HTMLDivElement> & {
  variant?: BadgeVariant;
};

export function Badge({ className = "", variant = "default", ...props }: BadgeProps) {
  const variantClassName =
    variant === "outline" ? "border px-2.5 py-1 text-xs font-medium" : "px-2.5 py-1 text-xs font-medium";
  return <div className={[variantClassName, className].filter(Boolean).join(" ")} {...props} />;
}
