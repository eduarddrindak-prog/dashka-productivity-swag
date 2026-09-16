import type { HTMLAttributes } from "react";

import "./Progress.css";

export type ProgressProps =
  HTMLAttributes<HTMLDivElement> & {
    value: number;
    max?: number;
    size?: "sm" | "md" | "lg";
    label?: string;
  };

export function Progress({
  value,
  max = 100,
  size = "md",
  label,
  className = "",
  ...props
}: ProgressProps) {
  const safeMax = Math.max(max, 0);

  const clampedValue =
    safeMax > 0
      ? Math.min(
          Math.max(value, 0),
          safeMax
        )
      : 0;

  const percentage =
    safeMax > 0
      ? (clampedValue / safeMax) * 100
      : 0;

  return (
    <div
      {...props}
      className={[
        "progress",
        `progress--${size}`,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      role="progressbar"
      aria-valuenow={clampedValue}
      aria-valuemin={0}
      aria-valuemax={safeMax}
      aria-label={label}
    >
      <div className="progress__track">
        <div
          className="progress__fill"
          style={{
            width: `${percentage}%`,
          }}
        />
      </div>
    </div>
  );
}