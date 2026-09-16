import {
  useEffect,
  useId,
  useRef,
} from "react";
import type {
  KeyboardEvent,
  ReactNode,
} from "react";
import { X } from "lucide-react";
import { Motion } from "./Motion";
import "./Dialog.css";

type DialogSize = "sm" | "md" | "lg" | "xl" | "full";

type DialogProps = {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  closeButton?: boolean;
  size?: DialogSize;
  className?: string;
  contentClassName?: string;
};

const FOCUSABLE_SELECTOR = [
  "button:not([disabled])",
  "[href]",
  "input:not([disabled])",
  "textarea:not([disabled])",
  "select:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  closeButton = true,
  size = "md",
  className = "",
  contentClassName = "",
}: DialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
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
      window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = "hidden";

    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    const focusTimer = window.setTimeout(() => {
      if (closeButton && closeRef.current) {
        closeRef.current.focus();
        return;
      }

      const firstFocusable =
        dialogRef.current?.querySelector<HTMLElement>(
          FOCUSABLE_SELECTOR,
        );

      firstFocusable?.focus();
    }, 0);

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (!dialogRef.current) {
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const focusableElements =
        dialogRef.current.querySelectorAll<HTMLElement>(
          FOCUSABLE_SELECTOR,
        );

      if (focusableElements.length === 0) {
        event.preventDefault();
        dialogRef.current.focus();
        return;
      }

      const first = focusableElements[0];
      const last =
        focusableElements[focusableElements.length - 1];

      if (event.shiftKey) {
        if (document.activeElement === first) {
          event.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      window.clearTimeout(focusTimer);

      document.body.style.overflow =
        bodyOverflowRef.current;

      document.body.style.paddingRight =
        bodyPaddingRef.current;

      document.removeEventListener(
        "keydown",
        handleKeyDown,
      );

      requestAnimationFrame(() => {
        lastFocusedRef.current?.focus();
      });
    };
  }, [open, closeButton, onClose]);

  if (!open) {
    return null;
  }

  return (
    <Motion
      preset="fade"
      className={`dialog-root ${className}`.trim()}
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <Motion
        preset="scale"
        speed="base"
        className={`dialog dialog--${size}`}
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
        ref={dialogRef}
        tabIndex={-1}
        onClick={(event) => {
          event.stopPropagation();
        }}
      >
        {(hasTitle || closeButton) && (
          <div className="dialog__header">
            {hasTitle && (
              <div className="dialog__heading">
                <h2
                  id={titleId}
                  className="dialog__title"
                >
                  {title}
                </h2>

                {hasDescription && (
                  <p
                    id={descriptionId}
                    className="dialog__description"
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
                className="dialog__close"
                onClick={onClose}
                aria-label="Close dialog"
              >
                <X
                  size={16}
                  aria-hidden="true"
                />
              </button>
            )}
          </div>
        )}

        <div
          className={`dialog__content ${contentClassName}`.trim()}
        >
          {children}
        </div>
      </Motion>
    </Motion>
  );
}