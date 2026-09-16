import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import {
  CheckCircle2,
  Info,
  TriangleAlert,
  X,
  CircleAlert,
} from "lucide-react";

import { Motion } from "./Motion";
import "./Toast.css";

export type ToastVariant =
  | "info"
  | "success"
  | "warning"
  | "danger";

export type ToastItem = {
  id: string;
  title?: ReactNode;
  message?: ReactNode;
  variant?: ToastVariant;
  duration?: number;
};

type ToastContextValue = {
  addToast: (
    toast: Omit<ToastItem, "id">
  ) => string;

  removeToast: (
    id: string
  ) => void;
};

const ToastContext =
  createContext<ToastContextValue | null>(
    null
  );

const MAX_TOASTS = 5;

const icons: Record<
  ToastVariant,
  ReactNode
> = {
  info: (
    <Info
      size={16}
      aria-hidden="true"
    />
  ),
  success: (
    <CheckCircle2
      size={16}
      aria-hidden="true"
    />
  ),
  warning: (
    <TriangleAlert
      size={16}
      aria-hidden="true"
    />
  ),
  danger: (
    <CircleAlert
      size={16}
      aria-hidden="true"
    />
  ),
};

export function Toast({
  title,
  message,
  variant = "info",
  duration = 4200,
  onClose,
  className = "",
}: Omit<ToastItem, "id"> & {
  onClose?: () => void;
  className?: string;
}) {
  const closeTimerRef =
    useRef<number | null>(null);

  useEffect(() => {
    if (
      duration <= 0 ||
      !onClose
    ) {
      return;
    }

    closeTimerRef.current =
      window.setTimeout(() => {
        onClose();
      }, duration);

    return () => {
      if (
        closeTimerRef.current !== null
      ) {
        window.clearTimeout(
          closeTimerRef.current
        );
      }
    };
  }, [duration, onClose]);

  const role =
    variant === "danger" ||
    variant === "warning"
      ? "alert"
      : "status";

  return (
    <Motion
      preset="fade"
      className={[
        "toast",
        `toast--${variant}`,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      role={role}
      aria-atomic="true"
    >
      <span
        className="toast__icon"
        aria-hidden="true"
      >
        {icons[variant]}
      </span>

      <div className="toast__body">
        {title && (
          <strong className="toast__title">
            {title}
          </strong>
        )}

        {message && (
          <span className="toast__message">
            {message}
          </span>
        )}
      </div>

      {onClose && (
        <button
          type="button"
          className="toast__close"
          aria-label="Close notification"
          onClick={onClose}
        >
          <X
            size={14}
            aria-hidden="true"
          />
        </button>
      )}
    </Motion>
  );
}

export function ToastViewport({
  toasts,
  onDismiss,
  className = "",
}: {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
  className?: string;
}) {
  return (
    <div
      className={[
        "toast-viewport",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label="Notifications"
    >
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          title={toast.title}
          message={toast.message}
          variant={toast.variant}
          duration={toast.duration}
          onClose={() =>
            onDismiss(toast.id)
          }
        />
      ))}
    </div>
  );
}

export function ToastProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [toasts, setToasts] =
    useState<ToastItem[]>([]);

  const idCounterRef =
    useRef(0);

  const addToast = useCallback(
    (
      toast: Omit<ToastItem, "id">
    ) => {
      idCounterRef.current += 1;

      const id =
        `toast-${Date.now()}-${idCounterRef.current}`;

      setToasts((current) => [
        ...current,
        {
          ...toast,
          id,
        },
      ].slice(-MAX_TOASTS));

      return id;
    },
    []
  );

  const removeToast = useCallback(
    (id: string) => {
      setToasts((current) =>
        current.filter(
          (toast) =>
            toast.id !== id
        )
      );
    },
    []
  );

  const value =
    useMemo<ToastContextValue>(
      () => ({
        addToast,
        removeToast,
      }),
      [
        addToast,
        removeToast,
      ]
    );

  return (
    <ToastContext.Provider
      value={value}
    >
      {children}

      <ToastViewport
        toasts={toasts}
        onDismiss={removeToast}
      />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context =
    useContext(ToastContext);

  if (!context) {
    throw new Error(
      "useToast must be used within a ToastProvider"
    );
  }

  return context;
}