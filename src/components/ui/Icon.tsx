import type { LucideIcon } from "lucide-react";
import "./Icon.css";

type IconSize = "xs" | "sm" | "md" | "lg" | "xl";
type IconColor = "default" | "muted" | "accent" | "success" | "danger";

type IconProps = {
  icon: LucideIcon;
  size?: IconSize;
  color?: IconColor;
  className?: string;
};

export function Icon({ icon: LucideIcon, size = "md", color = "default", className = "" }: IconProps) {
  const sizeMap: Record<IconSize, number> = {
    xs: 16,
    sm: 20,
    md: 24,
    lg: 32,
    xl: 40,
  };

  const colorMap: Record<IconColor, string> = {
    default: "var(--color-text)",
    muted: "var(--color-text-muted)",
    accent: "var(--color-accent)",
    success: "var(--color-success)",
    danger: "var(--color-danger)",
  };

  return (
    <span className={`icon icon--${size} icon--${color} ${className}`.trim()}>
      <LucideIcon size={sizeMap[size]} color={colorMap[color]} />
    </span>
  );
}
