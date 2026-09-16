import type {
  InputHTMLAttributes,
  ReactElement,
  ReactNode,
  TextareaHTMLAttributes,
} from "react";
import { cloneElement, isValidElement, useId } from "react";
import "./Field.css";

type FieldControlProps = {
  id?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
  disabled?: boolean;
  required?: boolean;
};

type FieldProps = {
  label: string;
  hint?: string;
  error?: string;
  success?: string;
  required?: boolean;
  disabled?: boolean;
  children: ReactNode;
  className?: string;
};

export function Field({
  label,
  hint,
  error,
  success,
  required = false,
  disabled = false,
  children,
  className = "",
}: FieldProps) {
  const controlId = useId();
  const hintId = `${controlId}-hint`;
  const errorId = `${controlId}-error`;
  const successId = `${controlId}-success`;

  const describedBy = [
    hint && hintId,
    error && errorId,
    !error && success && successId,
  ]
    .filter(Boolean)
    .join(" ");

  const child = isValidElement<FieldControlProps>(children)
    ? children
    : null;

  const control = child
    ? cloneElement(child as ReactElement<any>, {
        id: child.props.id ?? controlId,
        "aria-describedby": [
          child.props["aria-describedby"],
          describedBy,
        ]
          .filter(Boolean)
          .join(" ") || undefined,
        "aria-invalid": error
          ? true
          : child.props["aria-invalid"],
        disabled: child.props.disabled ?? disabled,
        required: child.props.required ?? required,
      })
    : children;

  return (
    <div
      className={`field ${className}`.trim()}
      data-disabled={disabled || undefined}
      data-error={error ? true : undefined}
      data-success={!error && success ? true : undefined}
    >
      <div className="field__header">
        <label
          className="field__label"
          htmlFor={controlId}
        >
          {label}

          {required && (
            <span
              className="field__required"
              aria-hidden="true"
            >
              *
            </span>
          )}
        </label>
      </div>

      <div className="field__control">
        {control}
      </div>

      {(hint || error || success) && (
        <div className="field__footer">
          {error && (
            <span
              className="field__error"
              id={errorId}
              role="alert"
            >
              {error}
            </span>
          )}

          {!error && success && (
            <span
              className="field__success"
              id={successId}
            >
              {success}
            </span>
          )}

          {hint && !error && !success && (
            <span
              className="field__hint"
              id={hintId}
            >
              {hint}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export function Input(
  props: InputHTMLAttributes<HTMLInputElement>
) {
  return (
    <input
      {...props}
      className={`field-control ${props.className ?? ""}`.trim()}
    />
  );
}

export function Textarea(
  props: TextareaHTMLAttributes<HTMLTextAreaElement>
) {
  return (
    <textarea
      {...props}
      className={`field-control field-control--textarea ${props.className ?? ""}`.trim()}
    />
  );
}