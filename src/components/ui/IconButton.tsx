import type {
  ButtonHTMLAttributes,
  ReactNode,
} from "react";

import "./IconButton.css";

export type IconButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "danger";

export type IconButtonSize =
  | "sm"
  | "md"
  | "lg";

export type IconButtonProps =
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: IconButtonVariant;
    size?: IconButtonSize;
    icon: ReactNode;
    label: string;
  };

export function IconButton({
  variant = "primary",
  size = "md",
  icon,
  label,
  className = "",
  type = "button",
  ...props
}: IconButtonProps) {
  return (
    <button
      {...props}
      type={type}
      className={[
        "icon-button",
        `icon-button--${variant}`,
        `icon-button--${size}`,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label={label}
      title={label}
    >
      <span
        className="icon-button__icon"
        aria-hidden="true"
      >
        {icon}
      </span>
    </button>
  );
}