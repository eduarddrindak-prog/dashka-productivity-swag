import type { HTMLAttributes, ReactNode } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Info,
  TriangleAlert,
  X,
} from "lucide-react";

import "./Alert.css";

export type AlertVariant =
  | "info"
  | "success"
  | "warning"
  | "danger";

export type AlertProps = HTMLAttributes<HTMLDivElement> & {
  variant?: AlertVariant;
  title?: ReactNode;
  children?: ReactNode;
  icon?: ReactNode;
  closeButton?: boolean;
  closeLabel?: string;
  onClose?: () => void;
};

const variantIcons: Record<AlertVariant, ReactNode> = {
  info: <Info size={16} aria-hidden="true" />,
  success: <CheckCircle2 size={16} aria-hidden="true" />,
  warning: <TriangleAlert size={16} aria-hidden="true" />,
  danger: <AlertCircle size={16} aria-hidden="true" />,
};

export function Alert({
  variant = "info",
  title,
  children,
  icon,
  closeButton = false,
  closeLabel = "Close alert",
  onClose,
  className = "",
  ...props
}: AlertProps) {
  const resolvedIcon = icon ?? variantIcons[variant];

  return (
    <div
      {...props}
      className={[
        "alert",
        `alert--${variant}`,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      role="alert"
    >
      <div className="alert__content">
        <span
          className="alert__icon"
          aria-hidden="true"
        >
          {resolvedIcon}
        </span>

        <div className="alert__body">
          {title && (
            <div className="alert__title">
              {title}
            </div>
          )}

          {children && (
            <div className="alert__message">
              {children}
            </div>
          )}
        </div>
      </div>

      {closeButton && (
        <button
          type="button"
          className="alert__close"
          onClick={onClose}
          aria-label={closeLabel}
        >
          <X size={16} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}