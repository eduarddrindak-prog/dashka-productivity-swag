import type { CSSProperties } from "react";
import "./Skeleton.css";

export type SkeletonVariant =
  | "text"
  | "block"
  | "circle";

export type SkeletonProps = {
  variant?: SkeletonVariant;
  width?: string | number;
  height?: string | number;
  className?: string;
};

export function Skeleton({
  variant = "text",
  width,
  height,
  className = "",
}: SkeletonProps) {
  const style: CSSProperties = {
    width,
    height,
  };

  return (
    <div
      className={[
        "skeleton",
        `skeleton--${variant}`,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={style}
      aria-hidden="true"
    />
  );
}