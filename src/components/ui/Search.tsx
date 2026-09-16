import type { InputHTMLAttributes } from "react";
import { useRef } from "react";
import {
  Loader,
  Search as SearchIcon,
  X,
} from "lucide-react";

import "./Search.css";

type SearchProps =
  Omit<
    InputHTMLAttributes<HTMLInputElement>,
    "type"
  > & {
    onClear?: () => void;
    loading?: boolean;
    clearable?: boolean;
    iconClassName?: string;
    wrapperClassName?: string;
    "aria-label"?: string;
  };

export function Search({
  value,
  onClear,
  loading = false,
  clearable = true,
  placeholder = "Search...",
  disabled = false,
  className = "",
  iconClassName = "",
  wrapperClassName = "",
  "aria-label": ariaLabel = "Search",
  ...props
}: SearchProps) {
  const inputRef =
    useRef<HTMLInputElement>(null);

  const hasValue =
    value !== undefined &&
    value !== null &&
    String(value).length > 0;

  const handleClear = () => {
    onClear?.();
    inputRef.current?.focus();
  };

  const isDisabled = disabled;

  return (
    <div
      className={[
        "search",
        wrapperClassName,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="search__inner">
        <SearchIcon
          className={[
            "search__icon",
            "search__icon--start",
            iconClassName,
          ]
            .filter(Boolean)
            .join(" ")}
          size={18}
          aria-hidden="true"
        />

        <input
          {...props}
          ref={inputRef}
          type="search"
          value={value}
          placeholder={placeholder}
          disabled={isDisabled}
          className={[
            "search__input",
            className,
          ]
            .filter(Boolean)
            .join(" ")}
          aria-label={ariaLabel}
          aria-busy={loading || undefined}
        />

        {loading && (
          <Loader
            className={[
              "search__icon",
              "search__icon--end",
              "search__icon--loading",
              iconClassName,
            ]
              .filter(Boolean)
              .join(" ")}
            size={18}
            aria-hidden="true"
          />
        )}

        {!loading &&
          clearable &&
          hasValue && (
            <button
              type="button"
              className="search__clear"
              onClick={handleClear}
              disabled={isDisabled}
              aria-label="Clear search"
            >
              <X
                size={18}
                aria-hidden="true"
              />
            </button>
          )}
      </div>
    </div>
  );
}