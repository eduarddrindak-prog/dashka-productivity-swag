import {
  cloneElement,
  isValidElement,
  useEffect,
  useId,
  useRef,
  useState,
  type FocusEvent,
  type KeyboardEvent,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
} from "react";

import "./Tooltip.css";

export type TooltipSide =
  | "top"
  | "right"
  | "bottom"
  | "left";

export type TooltipAlign =
  | "start"
  | "center"
  | "end";

export type TooltipProps = {
  content: ReactNode;
  children: ReactNode;

  side?: TooltipSide;
  align?: TooltipAlign;

  delay?: number;

  className?: string;
  disabled?: boolean;
};

type TriggerProps = {
  onMouseEnter?: (
    event: MouseEvent<HTMLElement>
  ) => void;
  onMouseLeave?: (
    event: MouseEvent<HTMLElement>
  ) => void;
  onFocus?: (
    event: FocusEvent<HTMLElement>
  ) => void;
  onBlur?: (
    event: FocusEvent<HTMLElement>
  ) => void;
  onKeyDown?: (
    event: KeyboardEvent<HTMLElement>
  ) => void;
  "aria-describedby"?: string;
};

export function Tooltip({
  content,
  children,
  side = "top",
  align = "center",
  delay = 120,
  className = "",
  disabled = false,
}: TooltipProps) {
  const [open, setOpen] = useState(false);

  const timeoutRef =
    useRef<number | null>(null);

  const tooltipId =
    `tooltip-${useId().replace(/:/g, "")}`;

  const clearTimer = () => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(
        timeoutRef.current
      );

      timeoutRef.current = null;
    }
  };

  const openTooltip = () => {
    if (disabled) {
      return;
    }

    clearTimer();

    if (delay <= 0) {
      setOpen(true);
      return;
    }

    timeoutRef.current =
      window.setTimeout(() => {
        setOpen(true);
        timeoutRef.current = null;
      }, delay);
  };

  const closeTooltip = () => {
    clearTimer();
    setOpen(false);
  };

  const handleEscape = (
    event: KeyboardEvent<HTMLElement>
  ) => {
    if (event.key !== "Escape") {
      return;
    }

    closeTooltip();
  };

  useEffect(() => {
    return () => {
      clearTimer();
    };
  }, []);

  const trigger =
    isValidElement<TriggerProps>(children)
      ? cloneElement(
          children as ReactElement<any>,
          {
            onMouseEnter: (
              event: MouseEvent<HTMLElement>
            ) => {
              children.props.onMouseEnter?.(
                event
              );

              if (
                !event.defaultPrevented
              ) {
                openTooltip();
              }
            },

            onMouseLeave: (
              event: MouseEvent<HTMLElement>
            ) => {
              children.props.onMouseLeave?.(
                event
              );

              if (
                !event.defaultPrevented
              ) {
                closeTooltip();
              }
            },

            onFocus: (
              event: FocusEvent<HTMLElement>
            ) => {
              children.props.onFocus?.(
                event
              );

              if (
                !event.defaultPrevented
              ) {
                openTooltip();
              }
            },

            onBlur: (
              event: FocusEvent<HTMLElement>
            ) => {
              children.props.onBlur?.(
                event
              );

              if (
                !event.defaultPrevented
              ) {
                closeTooltip();
              }
            },

            onKeyDown: (
              event: KeyboardEvent<HTMLElement>
            ) => {
              children.props.onKeyDown?.(
                event
              );

              if (
                !event.defaultPrevented
              ) {
                handleEscape(event);
              }
            },

            "aria-describedby":
              open
                ? tooltipId
                : undefined,
          }
        )
      : (
          <span
            className="tooltip__trigger"
            tabIndex={disabled ? -1 : 0}
            aria-describedby={
              open
                ? tooltipId
                : undefined
            }
            onMouseEnter={
              openTooltip
            }
            onMouseLeave={
              closeTooltip
            }
            onFocus={
              openTooltip
            }
            onBlur={
              closeTooltip
            }
            onKeyDown={
              handleEscape
            }
          >
            {children}
          </span>
        );

  return (
    <span
      className={[
        "tooltip",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {trigger}

      {!disabled && open && (
        <span
          id={tooltipId}
          role="tooltip"
          className={[
            "tooltip__content",
            `tooltip__content--${side}`,
            `tooltip__content--${align}`,
          ].join(" ")}
        >
          {content}
        </span>
      )}
    </span>
  );
}