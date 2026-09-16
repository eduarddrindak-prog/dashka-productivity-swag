import type {
  HTMLAttributes,
  ReactNode,
} from "react";

import "./ButtonGroup.css";

export type ButtonGroupProps =
  HTMLAttributes<HTMLDivElement> & {
    children: ReactNode;
    attached?: boolean;
    className?: string;
  };

export function ButtonGroup({
  children,
  attached = false,
  className = "",
  ...props
}: ButtonGroupProps) {
  return (
    <div
      {...props}
      className={[
        "button-group",
        attached &&
          "button-group--attached",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      role="group"
    >
      {children}
    </div>
  );
}