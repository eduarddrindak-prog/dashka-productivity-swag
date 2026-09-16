import type {
  AnchorHTMLAttributes,
  ReactNode,
} from "react";
import { ArrowUpRight } from "lucide-react";

import "./Link.css";

type LinkVariant =
  | "default"
  | "accent"
  | "muted";

type LinkSize =
  | "sm"
  | "md"
  | "lg";

type LinkProps =
  AnchorHTMLAttributes<HTMLAnchorElement> & {
    children: ReactNode;
    variant?: LinkVariant;
    size?: LinkSize;
    withArrow?: boolean;
    underline?: boolean;
    external?: boolean;
  };

export function Link({
  children,
  variant = "default",
  size = "md",
  withArrow = false,
  underline = false,
  external = false,
  className = "",
  target,
  rel,
  ...props
}: LinkProps) {
  const linkClassName = [
    "link",
    `link--${variant}`,
    `link--${size}`,
    underline &&
      "link--underline",
  ]
    .filter(Boolean)
    .join(" ");

  const resolvedTarget =
    external
      ? "_blank"
      : target;

  const resolvedRel =
    external
      ? [
          rel,
          "noopener",
          "noreferrer",
        ]
          .filter(Boolean)
          .join(" ")
      : rel;

  return (
    <a
      {...props}
      className={[
        linkClassName,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      target={resolvedTarget}
      rel={resolvedRel}
      data-external={
        external
          ? "true"
          : undefined
      }
    >
      <span className="link__content">
        {children}
      </span>

      {withArrow && (
        <ArrowUpRight
          className="link__arrow"
          aria-hidden="true"
        />
      )}
    </a>
  );
}