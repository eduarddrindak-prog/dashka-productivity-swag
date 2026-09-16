import type { ReactNode } from "react";
import { X } from "lucide-react";
import "./Pill.css";

type PillVariant = "filled" | "outlined" | "subtle";

type PillProps = {
  children: ReactNode;
  variant?: PillVariant;
  onRemove?: () => void;
  className?: string;
};

export function Pill({ children, variant = "filled", onRemove, className = "" }: PillProps) {
  return (
    <div className={`pill pill--${variant} ${className}`.trim()}>
      <span>{children}</span>
      {onRemove && (
        <button className="pill__remove" onClick={onRemove} aria-label="Remove">
          <X size={14} />
        </button>
      )}
    </div>
  );
}
