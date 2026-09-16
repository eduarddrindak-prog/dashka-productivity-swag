import type { InputHTMLAttributes } from "react";
import { Check } from "lucide-react";

import "./Checkbox.css";

type CheckboxSize =
  | "sm"
  | "md"
  | "lg";

type CheckboxProps =
  Omit<
    InputHTMLAttributes<HTMLInputElement>,
    "size"
  > & {
    label?: string;
    size?: CheckboxSize;
  };

export function Checkbox({
  label,
  size = "md",
  className = "",
  disabled,
  ...props
}: CheckboxProps) {
  return (
    <label
      className={[
        "checkbox",
        `checkbox--${size}`,
        disabled &&
          "checkbox--disabled",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <input
        {...props}
        type="checkbox"
        className="checkbox__input"
        disabled={disabled}
      />

      <span
        className="checkbox__box"
        aria-hidden="true"
      >
        <Check
          className="checkbox__icon"
          aria-hidden="true"
        />
      </span>

      {label && (
        <span className="checkbox__label">
          {label}
        </span>
      )}
    </label>
  );
}