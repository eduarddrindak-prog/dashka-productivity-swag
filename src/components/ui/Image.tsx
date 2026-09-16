import type {
  CSSProperties,
  ImgHTMLAttributes,
  SyntheticEvent,
} from "react";

import "./Image.css";

export type ImageFit =
  | "cover"
  | "contain"
  | "fill"
  | "none"
  | "scale-down";

export type ImageRadius =
  | "none"
  | "sm"
  | "md"
  | "lg"
  | "full";

export type ImageProps =
  ImgHTMLAttributes<HTMLImageElement> & {
    aspectRatio?: string;
    fit?: ImageFit;
    position?: string;
    radius?: ImageRadius;
    fallback?: string;
    onLoadError?: (
      event: SyntheticEvent<HTMLImageElement>
    ) => void;
  };

export function Image({
  aspectRatio,
  fit = "cover",
  position = "center",
  radius = "none",
  fallback,
  className = "",
  style,
  onError,
  onLoadError,
  ...props
}: ImageProps) {
  const imageStyle = {
    "--image-aspect-ratio": aspectRatio,
    "--image-fit": fit,
    "--image-position": position,
    ...style,
  } as CSSProperties;

  const handleError = (
    event: SyntheticEvent<HTMLImageElement>
  ) => {
    onError?.(event);
    onLoadError?.(event);

    if (
      fallback &&
      event.currentTarget.src !== fallback
    ) {
      event.currentTarget.src = fallback;
    }
  };

  return (
    <img
      {...props}
      className={[
        "image",
        `image--radius-${radius}`,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={imageStyle}
      onError={handleError}
    />
  );
}