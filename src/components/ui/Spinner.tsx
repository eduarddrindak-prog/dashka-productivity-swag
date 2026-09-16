import type { HTMLAttributes } from "react";
import "./Spinner.css";

export type SpinnerSize =
  | "sm"
  | "md"
  | "lg";

export type SpinnerProps =
  HTMLAttributes<HTMLSpanElement> & {
    size?: SpinnerSize;
    label?: string;
  };

export function Spinner({
  size = "md",
  label = "Loading",
  className = "",
  ...props
}: SpinnerProps) {
  return (
    <span
      {...props}
      className={[
        "spinner",
        `spinner--${size}`,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      role="status"
      aria-label={label}
    >
      <span
        className="spinner__ring"
        aria-hidden="true"
      />
    </span>
  );
}