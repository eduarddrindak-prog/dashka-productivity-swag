import type {
  InputHTMLAttributes,
} from "react";

import "./Radio.css";

type RadioSize =
  | "sm"
  | "md"
  | "lg";

type RadioProps =
  Omit<
    InputHTMLAttributes<HTMLInputElement>,
    "size"
  > & {
    label?: string;
    size?: RadioSize;
  };

export function Radio({
  label,
  size = "md",
  className = "",
  disabled,
  ...props
}: RadioProps) {
  return (
    <label
      className={[
        "radio",
        `radio--${size}`,
        disabled &&
          "radio--disabled",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <input
        {...props}
        type="radio"
        className="radio__input"
        disabled={disabled}
      />

      <span
        className="radio__circle"
        aria-hidden="true"
      >
        <span className="radio__dot" />
      </span>

      {label && (
        <span className="radio__label">
          {label}
        </span>
      )}
    </label>
  );
}