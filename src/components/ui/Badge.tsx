import type { HTMLAttributes, ReactNode } from "react";
import "./Badge.css";

type BadgeTone = "accent" | "neutral" | "success" | "danger";
type BadgeVariant = "filled" | "outlined" | "subtle";
type BadgeSize = "sm" | "md";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: BadgeTone;
  variant?: BadgeVariant;
  size?: BadgeSize;
  children: ReactNode;
};

export function Badge({
  tone = "accent",
  variant = "filled",
  size = "md",
  className = "",
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={["badge", `badge--${tone}`, `badge--${variant}`, `badge--${size}`, className]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {children}
    </span>
  );
}
