import type { ImgHTMLAttributes } from "react";
import "./Avatar.css";

type AvatarSize = "sm" | "md" | "lg";

type AvatarProps =
  Omit<
    ImgHTMLAttributes<HTMLImageElement>,
    "alt"
  > & {
    src?: string;
    alt?: string;
    size?: AvatarSize;
    initials?: string;
    variant?: "circle" | "square";
  };

function getInitials(
  alt?: string
) {
  if (!alt?.trim()) {
    return "?";
  }

  const words = alt
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 1) {
    return words[0]
      .slice(0, 2)
      .toUpperCase();
  }

  return (
    words[0][0] +
    words[words.length - 1][0]
  ).toUpperCase();
}

export function Avatar({
  src,
  alt = "",
  size = "md",
  initials,
  variant = "circle",
  className = "",
  ...props
}: AvatarProps) {
  const avatarClassName = [
    "avatar",
    `avatar--${size}`,
    `avatar--${variant}`,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const fallback =
    initials?.trim() ||
    getInitials(alt);

  return (
    <span
      className={avatarClassName}
    >
      {src ? (
        <img
          src={src}
          alt={alt}
          {...props}
        />
      ) : (
        <span
          className="avatar__initials"
          aria-hidden="true"
        >
          {fallback}
        </span>
      )}
    </span>
  );
}