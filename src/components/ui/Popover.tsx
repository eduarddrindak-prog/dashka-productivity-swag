import {
  cloneElement,
  isValidElement,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactElement,
  type ReactNode,
} from "react";

import { Motion } from "./Motion";
import "./Popover.css";

type PopoverPlacement =
  | "top"
  | "bottom"
  | "left"
  | "right";

type PopoverAlign =
  | "start"
  | "center"
  | "end";

type PopoverProps = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;

  trigger: ReactNode;
  children: ReactNode;

  placement?: PopoverPlacement;
  align?: PopoverAlign;

  disabled?: boolean;

  closeOnEscape?: boolean;
  closeOnOutsideClick?: boolean;

  className?: string;
  contentClassName?: string;
};

type Position = {
  top: number;
  left: number;
};

type TriggerProps = {
  onClick?: (
    event: ReactMouseEvent<HTMLElement>
  ) => void;
  onKeyDown?: (
    event: ReactKeyboardEvent<HTMLElement>
  ) => void;
};

const GAP = 8;
const VIEWPORT_PADDING = 12;

const FOCUSABLE_SELECTOR = [
  "button:not([disabled])",
  "a[href]",
  "input:not([disabled])",
  "textarea:not([disabled])",
  "select:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

function clamp(
  value: number,
  min: number,
  max: number
) {
  return Math.min(
    Math.max(value, min),
    max
  );
}

function getPopoverPosition(
  triggerRect: DOMRect,
  contentRect: DOMRect,
  placement: PopoverPlacement,
  align: PopoverAlign
): Position {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  let resolvedPlacement = placement;

  const spaceTop =
    triggerRect.top - VIEWPORT_PADDING;

  const spaceBottom =
    viewportHeight -
    triggerRect.bottom -
    VIEWPORT_PADDING;

  const spaceLeft =
    triggerRect.left -
    VIEWPORT_PADDING;

  const spaceRight =
    viewportWidth -
    triggerRect.right -
    VIEWPORT_PADDING;

  if (
    placement === "top" &&
    contentRect.height + GAP > spaceTop &&
    spaceBottom > spaceTop
  ) {
    resolvedPlacement = "bottom";
  }

  if (
    placement === "bottom" &&
    contentRect.height + GAP > spaceBottom &&
    spaceTop > spaceBottom
  ) {
    resolvedPlacement = "top";
  }

  if (
    placement === "left" &&
    contentRect.width + GAP > spaceLeft &&
    spaceRight > spaceLeft
  ) {
    resolvedPlacement = "right";
  }

  if (
    placement === "right" &&
    contentRect.width + GAP > spaceRight &&
    spaceLeft > spaceRight
  ) {
    resolvedPlacement = "left";
  }

  let left = 0;
  let top = 0;

  if (
    resolvedPlacement === "top" ||
    resolvedPlacement === "bottom"
  ) {
    if (align === "start") {
      left = triggerRect.left;
    } else if (align === "center") {
      left =
        triggerRect.left +
        triggerRect.width / 2 -
        contentRect.width / 2;
    } else {
      left =
        triggerRect.right -
        contentRect.width;
    }

    top =
      resolvedPlacement === "top"
        ? triggerRect.top -
          contentRect.height -
          GAP
        : triggerRect.bottom + GAP;
  } else {
    if (align === "start") {
      top = triggerRect.top;
    } else if (align === "center") {
      top =
        triggerRect.top +
        triggerRect.height / 2 -
        contentRect.height / 2;
    } else {
      top =
        triggerRect.bottom -
        contentRect.height;
    }

    left =
      resolvedPlacement === "left"
        ? triggerRect.left -
          contentRect.width -
          GAP
        : triggerRect.right + GAP;
  }

  const maxLeft = Math.max(
    VIEWPORT_PADDING,
    viewportWidth -
      contentRect.width -
      VIEWPORT_PADDING
  );

  const maxTop = Math.max(
    VIEWPORT_PADDING,
    viewportHeight -
      contentRect.height -
      VIEWPORT_PADDING
  );

  return {
    left: clamp(
      left,
      VIEWPORT_PADDING,
      maxLeft
    ),
    top: clamp(
      top,
      VIEWPORT_PADDING,
      maxTop
    ),
  };
}

export function Popover({
  open: controlledOpen,
  onOpenChange,

  trigger,
  children,

  placement = "bottom",
  align = "center",

  disabled = false,

  closeOnEscape = true,
  closeOnOutsideClick = true,

  className = "",
  contentClassName = "",
}: PopoverProps) {
  const [internalOpen, setInternalOpen] =
    useState(false);

  const triggerRef =
    useRef<HTMLElement | null>(null);

  const contentRef =
    useRef<HTMLDivElement | null>(null);

  const lastFocusedRef =
    useRef<HTMLElement | null>(null);

  const contentId =
    `popover-${useId().replace(/:/g, "")}`;

  const isControlled =
    controlledOpen !== undefined;

  const isOpen = isControlled
    ? controlledOpen
    : internalOpen;

  const setIsOpen = (
    nextOpen: boolean,
    restoreFocus = false
  ) => {
    if (!isControlled) {
      setInternalOpen(nextOpen);
    }

    onOpenChange?.(nextOpen);

    if (
      !nextOpen &&
      restoreFocus
    ) {
      requestAnimationFrame(() => {
        triggerRef.current?.focus();
      });
    }
  };

  const close = (
    restoreFocus = true
  ) => {
    setIsOpen(
      false,
      restoreFocus
    );
  };

  const updatePosition = () => {
    if (
      !triggerRef.current ||
      !contentRef.current
    ) {
      return;
    }

    const triggerRect =
      triggerRef.current.getBoundingClientRect();

    const contentRect =
      contentRef.current.getBoundingClientRect();

    const position =
      getPopoverPosition(
        triggerRect,
        contentRect,
        placement,
        align
      );

    contentRef.current.style.left =
      `${position.left}px`;

    contentRef.current.style.top =
      `${position.top}px`;
  };

  useLayoutEffect(() => {
    if (!isOpen) {
      return;
    }

    updatePosition();
  }, [
    isOpen,
    placement,
    align,
    children,
  ]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    lastFocusedRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    const focusTarget =
      contentRef.current?.querySelector<HTMLElement>(
        FOCUSABLE_SELECTOR
      );

    focusTarget?.focus();

    const handlePointerDown = (
      event: PointerEvent
    ) => {
      if (!closeOnOutsideClick) {
        return;
      }

      const target =
        event.target as Node;

      if (
        !contentRef.current?.contains(
          target
        ) &&
        !triggerRef.current?.contains(
          target
        )
      ) {
        close(false);
      }
    };

    const handleKeyDown = (
      event: globalThis.KeyboardEvent
    ) => {
      if (
        closeOnEscape &&
        event.key === "Escape"
      ) {
        event.preventDefault();
        close();
      }
    };

    document.addEventListener(
      "pointerdown",
      handlePointerDown
    );

    document.addEventListener(
      "keydown",
      handleKeyDown
    );

    window.addEventListener(
      "resize",
      updatePosition
    );

    window.addEventListener(
      "scroll",
      updatePosition,
      true
    );

    return () => {
      document.removeEventListener(
        "pointerdown",
        handlePointerDown
      );

      document.removeEventListener(
        "keydown",
        handleKeyDown
      );

      window.removeEventListener(
        "resize",
        updatePosition
      );

      window.removeEventListener(
        "scroll",
        updatePosition,
        true
      );
    };
  }, [
    isOpen,
    closeOnEscape,
    closeOnOutsideClick,
  ]);

  useEffect(() => {
    if (isOpen) {
      return;
    }

    lastFocusedRef.current = null;
  }, [isOpen]);

  const handleTriggerKeyDown = (
    event: ReactKeyboardEvent<HTMLElement>
  ) => {
    if (disabled) {
      return;
    }

    if (
      event.key === "Enter" ||
      event.key === " "
    ) {
      event.preventDefault();

      if (isOpen) {
        close();
      } else {
        lastFocusedRef.current =
          triggerRef.current;

        setIsOpen(true);
      }
    }

    if (
      event.key === "Escape" &&
      isOpen
    ) {
      event.preventDefault();
      close();
    }
  };

  const handleTriggerClick = (
    event: ReactMouseEvent<HTMLElement>
  ) => {
    if (disabled) {
      return;
    }

    if (isValidElement<TriggerProps>(trigger)) {
      trigger.props.onClick?.(event);

      if (event.defaultPrevented) {
        return;
      }
    }

    if (isOpen) {
      close();
    } else {
      lastFocusedRef.current =
        triggerRef.current;

      setIsOpen(true);
    }
  };

  const triggerElement = (() => {
    if (isValidElement<TriggerProps>(trigger)) {
      const originalRef =
        (
          trigger as ReactElement & {
            ref?: unknown;
          }
        ).ref;

      return cloneElement(
        trigger as ReactElement<any>,
        {
          ref: (
            node: HTMLElement | null
          ) => {
            triggerRef.current =
              node;

            if (
              typeof originalRef ===
              "function"
            ) {
              originalRef(node);
            }
          },

          onClick:
            handleTriggerClick,

          onKeyDown: (
            event: ReactKeyboardEvent<HTMLElement>
          ) => {
            trigger.props.onKeyDown?.(
              event
            );

            if (
              !event.defaultPrevented
            ) {
              handleTriggerKeyDown(
                event
              );
            }
          },

          "aria-expanded":
            isOpen,

          "aria-haspopup":
            "dialog",

          "aria-controls":
            isOpen
              ? contentId
              : undefined,

          "aria-disabled":
            disabled
              ? true
              : undefined,
        }
      );
    }

    return (
      <button
        type="button"
        ref={(node) => {
          triggerRef.current =
            node;
        }}
        className="popover__trigger"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-controls={
          isOpen
            ? contentId
            : undefined
        }
        disabled={disabled}
        onClick={() => {
          if (isOpen) {
            close();
          } else {
            lastFocusedRef.current =
              triggerRef.current;

            setIsOpen(true);
          }
        }}
        onKeyDown={
          handleTriggerKeyDown
        }
      >
        {trigger}
      </button>
    );
  })();

  return (
    <div
      className={[
        "popover",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {triggerElement}

      {isOpen && (
        <Motion
          as="div"
          preset="fade"
          id={contentId}
          ref={contentRef}
          className={[
            "popover__content",
            contentClassName,
          ]
            .filter(Boolean)
            .join(" ")}
          role="dialog"
          aria-modal="false"
          style={
            {
              position: "fixed",
              left: 0,
              top: 0,
              zIndex: 1000,
            } as CSSProperties
          }
        >
          {children}
        </Motion>
      )}
    </div>
  );
}