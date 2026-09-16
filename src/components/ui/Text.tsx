import type { ReactNode } from "react";
import "./Text.css";

type TextVariant = "display" | "heading" | "subtitle" | "body" | "small" | "caption" | "code";
type TextSize = "xs" | "sm" | "base" | "lg" | "xl" | "2xl" | "3xl";
type TextWeight = "regular" | "medium" | "semibold";
type TextAlign = "left" | "center" | "right";

type TextProps = {
  children: ReactNode;
  variant?: TextVariant;
  size?: TextSize;
  weight?: TextWeight;
  align?: TextAlign;
  color?: string;
  className?: string;
  as?: "p" | "span" | "div" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
};

export function Text({
  children,
  variant = "body",
  size,
  weight,
  align = "left",
  color = "inherit",
  className = "",
  as = "p",
}: TextProps) {
  const Component = as as any;

  // Default sizing based on variant
  const variantSize: Record<TextVariant, TextSize> = {
    display: "3xl",
    heading: "2xl",
    subtitle: "lg",
    body: "base",
    small: "sm",
    caption: "xs",
    code: "sm",
  };

  const variantWeight: Record<TextVariant, TextWeight> = {
    display: "semibold",
    heading: "semibold",
    subtitle: "medium",
    body: "regular",
    small: "regular",
    caption: "regular",
    code: "regular",
  };

  const finalSize = size || variantSize[variant];
  const finalWeight = weight || variantWeight[variant];

  return (
    <Component
      className={`text text--${variant} text--${finalSize} text--${finalWeight} text--${align} ${className}`.trim()}
      style={{
        color: color !== "inherit" ? `var(--color-${color}, ${color})` : color,
      }}
    >
      {children}
    </Component>
  );
}
