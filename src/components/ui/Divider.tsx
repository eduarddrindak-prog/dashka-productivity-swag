import "./Divider.css";

type DividerProps = {
  orientation?: "horizontal" | "vertical";
  variant?: "default" | "subtle";
  spacing?: "sm" | "md" | "lg";
  className?: string;
};

export function Divider({
  orientation = "horizontal",
  variant = "default",
  spacing = "md",
  className = "",
}: DividerProps) {
  return (
    <div
      className={[
        "divider",
        `divider--${orientation}`,
        `divider--${variant}`,
        `divider--${spacing}`,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      role="separator"
      aria-orientation={orientation}
    />
  );
}