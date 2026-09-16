import type { HTMLAttributes, ReactNode } from "react";
import "./Card.css";

type CardVariant =
  | "default"
  | "outlined"
  | "subtle"
  | "elevated";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  variant?: CardVariant;
  interactive?: boolean;
};

type CardHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  className?: string;
};

export function Card({
  className = "",
  variant = "default",
  interactive = false,
  children,
  ...props
}: CardProps) {
  return (
    <div
      {...props}
      className={[
        "card",
        `card--${variant}`,
        interactive && "card--interactive",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  eyebrow,
  title,
  description,
  className = "",
}: CardHeaderProps) {
  return (
    <div
      className={[
        "card-header",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {eyebrow && (
        <p className="card-eyebrow">
          {eyebrow}
        </p>
      )}

      <h3 className="card-title">
        {title}
      </h3>

      {description && (
        <p className="card-description">
          {description}
        </p>
      )}
    </div>
  );
}