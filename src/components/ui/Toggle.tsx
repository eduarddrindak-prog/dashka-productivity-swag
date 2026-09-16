import type { InputHTMLAttributes } from "react";
import "./Toggle.css";

type ToggleSize = "sm" | "md" | "lg";

type ToggleProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "size"
> & {
  label?: string;
  size?: ToggleSize;
};

export function Toggle({
  label,
  size = "md",
  className = "",
  disabled,
  ...props
}: ToggleProps) {
  return (
    <label
      className={[
        "toggle",
        `toggle--${size}`,
        disabled && "toggle--disabled",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <input
        {...props}
        type="checkbox"
        className="toggle__input"
        disabled={disabled}
      />

      <span
        className="toggle__switch"
        aria-hidden="true"
      >
        <span className="toggle__thumb" />
      </span>

      {label && (
        <span className="toggle__label">
          {label}
        </span>
      )}
    </label>
  );
}