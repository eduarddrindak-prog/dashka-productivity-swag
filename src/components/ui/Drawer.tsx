import {
  useEffect,
  useId,
  useRef,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { X } from "lucide-react";

import "./Drawer.css";

export type DrawerSide =
  | "left"
  | "right"
  | "top"
  | "bottom";

export type DrawerSize =
  | "sm"
  | "md"
  | "lg"
  | "full";

export type DrawerProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  side?: DrawerSide;
  size?: DrawerSize;
  title?: string;
  description?: string;
  closeButton?: boolean;
  className?: string;
  contentClassName?: string;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
};

const FOCUSABLE_SELECTOR = [
  "button:not([disabled])",
  "a[href]",
  "input:not([disabled])",
  "textarea:not([disabled])",
  "select:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

export function Drawer({
  open,
  onClose,
  children,
  side = "right",
  size = "md",
  title,
  description,
  closeButton = true,
  className = "",
  contentClassName = "",
  closeOnOverlayClick = true,
  closeOnEscape = true,
}: DrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const lastFocusedRef = useRef<HTMLElement | null>(null);

  const bodyOverflowRef = useRef("");
  const bodyPaddingRef = useRef("");

  const titleId = useId();
  const descriptionId = useId();

  const hasTitle = Boolean(title);
  const hasDescription = Boolean(description);

  useEffect(() => {
    if (!open) {
      return;
    }

    lastFocusedRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    bodyOverflowRef.current =
      document.body.style.overflow;

    bodyPaddingRef.current =
      document.body.style.paddingRight;

    const scrollbarWidth =
      window.innerWidth -
      document.documentElement.clientWidth;

    document.body.style.overflow = "hidden";

    if (scrollbarWidth > 0) {
      document.body.style.paddingRight =
        `${scrollbarWidth}px`;
    }

    const focusTimer = window.setTimeout(() => {
      if (closeButton && closeRef.current) {
        closeRef.current.focus();
        return;
      }

      const firstFocusable =
        drawerRef.current?.querySelector<HTMLElement>(
          FOCUSABLE_SELECTOR
        );

      firstFocusable?.focus();
    }, 0);

    const handleKeyDown = (
      event: globalThis.KeyboardEvent
    ) => {
      const drawer = drawerRef.current;

      if (!drawer) {
        return;
      }

      if (
        closeOnEscape &&
        event.key === "Escape"
      ) {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const focusable =
        drawer.querySelectorAll<HTMLElement>(
          FOCUSABLE_SELECTOR
        );

      if (focusable.length === 0) {
        event.preventDefault();
        drawer.focus();
        return;
      }

      const first = focusable[0];
      const last =
        focusable[focusable.length - 1];

      if (
        event.shiftKey &&
        document.activeElement === first
      ) {
        event.preventDefault();
        last.focus();
      } else if (
        !event.shiftKey &&
        document.activeElement === last
      ) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.clearTimeout(focusTimer);

      document.body.style.overflow =
        bodyOverflowRef.current;

      document.body.style.paddingRight =
        bodyPaddingRef.current;

      document.removeEventListener(
        "keydown",
        handleKeyDown
      );

      requestAnimationFrame(() => {
        lastFocusedRef.current?.focus();
      });
    };
  }, [
    open,
    onClose,
    closeButton,
    closeOnEscape,
  ]);

  if (!open) {
    return null;
  }

  return (
    <div
      className={`drawer drawer--${side} ${className}`.trim()}
    >
      <div
        className="drawer__overlay"
        aria-hidden="true"
        onClick={() => {
          if (closeOnOverlayClick) {
            onClose();
          }
        }}
      />

      <div
        ref={drawerRef}
        className={`drawer__panel drawer__panel--${size} ${contentClassName}`.trim()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={
          hasTitle ? titleId : undefined
        }
        aria-describedby={
          hasDescription
            ? descriptionId
            : undefined
        }
        tabIndex={-1}
      >
        {(hasTitle || hasDescription || closeButton) && (
          <div className="drawer__header">
            {(hasTitle || hasDescription) && (
              <div className="drawer__heading">
                {hasTitle && (
                  <h2
                    id={titleId}
                    className="drawer__title"
                  >
                    {title}
                  </h2>
                )}

                {hasDescription && (
                  <p
                    id={descriptionId}
                    className="drawer__description"
                  >
                    {description}
                  </p>
                )}
              </div>
            )}

            {closeButton && (
              <button
                ref={closeRef}
                type="button"
                className="drawer__close"
                aria-label="Close drawer"
                onClick={onClose}
              >
                <X
                  size={18}
                  aria-hidden="true"
                />
              </button>
            )}
          </div>
        )}

        <div className="drawer__body">
          {children}
        </div>
      </div>
    </div>
  );
}