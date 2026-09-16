import type { ReactNode } from "react";
import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Motion } from "./Motion";
import "./Select.css";

export type SelectOption = {
  value: string;
  label: ReactNode;
  disabled?: boolean;
};

type SelectProps = {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  invalid?: boolean;
  name?: string;
  className?: string;
  triggerClassName?: string;
  contentClassName?: string;
};

const GAP = 8;
const VIEWPORT_PADDING = 12;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getEnabledIndex(
  options: SelectOption[],
  startIndex: number,
  direction: 1 | -1
) {
  let index = startIndex;

  while (index >= 0 && index < options.length) {
    if (!options[index].disabled) {
      return index;
    }

    index += direction;
  }

  return -1;
}

export function Select({
  value,
  defaultValue,
  onValueChange,
  options,
  placeholder = "Select an option",
  disabled = false,
  required = false,
  invalid = false,
  name,
  className = "",
  triggerClassName = "",
  contentClassName = "",
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const [internalValue, setInternalValue] = useState(defaultValue ?? "");
  const [highlightedValue, setHighlightedValue] = useState<string | null>(
    defaultValue ?? null
  );

  const triggerRef = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const contentId = useId();

  const isControlled = value !== undefined;
  const displayValue = isControlled ? value : internalValue;

  const selectedOption = options.find(
    (option) => option.value === displayValue
  );

  const displayLabel = selectedOption?.label ?? placeholder;

  const selectedIndex = options.findIndex(
    (option) => option.value === displayValue
  );

  const highlightedIndex = options.findIndex(
    (option) => option.value === highlightedValue
  );

  const setHighlight = (index: number) => {
    if (index < 0 || index >= options.length) {
      return;
    }

    const option = options[index];

    if (option.disabled) {
      return;
    }

    setHighlightedValue(option.value);

    requestAnimationFrame(() => {
      optionRefs.current[option.value]?.scrollIntoView({
        block: "nearest",
      });
    });
  };

  const close = (restoreFocus = true) => {
    setOpen(false);

    if (restoreFocus) {
      requestAnimationFrame(() => {
        triggerRef.current?.focus();
      });
    }
  };

  const handleValueChange = (newValue: string) => {
    const option = options.find(
      (item) => item.value === newValue
    );

    if (!option || option.disabled) {
      return;
    }

    if (!isControlled) {
      setInternalValue(newValue);
    }

    setHighlightedValue(newValue);
    onValueChange?.(newValue);
    close();
  };

  const openSelect = () => {
    if (disabled || options.length === 0) {
      return;
    }

    const initialIndex =
      selectedIndex >= 0
        ? selectedIndex
        : getEnabledIndex(options, 0, 1);

    setHighlightedValue(
      initialIndex >= 0 ? options[initialIndex].value : null
    );

    setOpen(true);
  };

  const moveHighlight = (direction: 1 | -1) => {
    if (options.length === 0) {
      return;
    }

    const currentIndex =
      highlightedIndex >= 0
        ? highlightedIndex
        : selectedIndex >= 0
          ? selectedIndex
          : direction === 1
            ? -1
            : options.length;

    let nextIndex = currentIndex + direction;

    if (nextIndex < 0) {
      nextIndex = options.length - 1;
    }

    if (nextIndex >= options.length) {
      nextIndex = 0;
    }

    const startIndex = nextIndex;

    while (options[nextIndex]?.disabled) {
      nextIndex += direction;

      if (nextIndex < 0) {
        nextIndex = options.length - 1;
      }

      if (nextIndex >= options.length) {
        nextIndex = 0;
      }

      if (nextIndex === startIndex) {
        return;
      }
    }

    setHighlight(nextIndex);
  };

  // Position the dropdown.
  useEffect(() => {
    if (!open || !triggerRef.current || !contentRef.current) {
      return;
    }

    const updatePosition = () => {
      const triggerRect =
        triggerRef.current?.getBoundingClientRect();

      const content = contentRef.current;

      if (!triggerRect || !content) {
        return;
      }

      const contentRect = content.getBoundingClientRect();

      const spaceBelow =
        window.innerHeight - triggerRect.bottom - VIEWPORT_PADDING;

      const spaceAbove =
        triggerRect.top - VIEWPORT_PADDING;

      const openAbove =
        contentRect.height > spaceBelow &&
        spaceAbove > spaceBelow;

      const maxTop = Math.max(
        VIEWPORT_PADDING,
        window.innerHeight - contentRect.height - VIEWPORT_PADDING
      );

      const preferredTop = openAbove
        ? triggerRect.top - contentRect.height - GAP
        : triggerRect.bottom + GAP;

      const top = clamp(
        preferredTop,
        VIEWPORT_PADDING,
        maxTop
      );

      const maxLeft = Math.max(
        VIEWPORT_PADDING,
        window.innerWidth - triggerRect.width - VIEWPORT_PADDING
      );

      const left = clamp(
        triggerRect.left,
        VIEWPORT_PADDING,
        maxLeft
      );

      content.style.top = `${top}px`;
      content.style.left = `${left}px`;
      content.style.width = `${triggerRect.width}px`;
    };

    updatePosition();

    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open]);

  // Outside click.
  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;

      if (
        !triggerRef.current?.contains(target) &&
        !contentRef.current?.contains(target)
      ) {
        close(false);
      }
    };

    document.addEventListener(
      "pointerdown",
      handlePointerDown
    );

    return () => {
      document.removeEventListener(
        "pointerdown",
        handlePointerDown
      );
    };
  }, [open]);

  // Keep highlight aligned with current value.
  useEffect(() => {
    if (!open) {
      return;
    }

    if (selectedIndex >= 0 && !options[selectedIndex].disabled) {
      setHighlightedValue(options[selectedIndex].value);
    }
  }, [open, displayValue]);

  const handleTriggerKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>
  ) => {
    if (disabled) {
      return;
    }

    switch (event.key) {
      case "Enter":
      case " ":
      case "ArrowDown":
        event.preventDefault();

        if (!open) {
          openSelect();
        } else {
          moveHighlight(1);
        }
        break;

      case "ArrowUp":
        event.preventDefault();

        if (!open) {
          openSelect();
        } else {
          moveHighlight(-1);
        }
        break;

      case "Home":
        if (open) {
          event.preventDefault();

          const index = getEnabledIndex(options, 0, 1);

          if (index >= 0) {
            setHighlight(index);
          }
        }
        break;

      case "End":
        if (open) {
          event.preventDefault();

          const index = getEnabledIndex(
            options,
            options.length - 1,
            -1
          );

          if (index >= 0) {
            setHighlight(index);
          }
        }
        break;

      case "Escape":
        if (open) {
          event.preventDefault();
          close();
        }
        break;
    }
  };

  return (
    <div className={`select ${className}`.trim()}>
      <button
        ref={triggerRef}
        type="button"
        className={`select__trigger ${triggerClassName}`.trim()}
        onClick={() => {
          if (open) {
            close();
          } else {
            openSelect();
          }
        }}
        onKeyDown={handleTriggerKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? contentId : undefined}
        aria-invalid={invalid || undefined}
        aria-required={required || undefined}
        disabled={disabled}
      >
        <span className="select__label">
          {displayLabel}
        </span>

        <ChevronDown
          className="select__icon"
          size={18}
          aria-hidden="true"
        />
      </button>

      {open && (
        <Motion
          as="div"
          preset="fade"
          className={`select__content ${contentClassName}`.trim()}
          id={contentId}
          role="listbox"
          aria-label="Options"
          ref={contentRef}
        >
          <ul className="select__list">
            {options.map((option) => (
              <li
                key={option.value}
                className="select__item"
              >
                <button
                  ref={(element) => {
                    optionRefs.current[option.value] =
                      element;
                  }}
                  type="button"
                  className="select__option"
                  data-value={option.value}
                  role="option"
                  aria-selected={
                    option.value === displayValue
                  }
                  data-highlighted={
                    option.value === highlightedValue ||
                    undefined
                  }
                  disabled={option.disabled}
                  onMouseEnter={() => {
                    if (!option.disabled) {
                      setHighlightedValue(option.value);
                    }
                  }}
                  onClick={() => {
                    handleValueChange(option.value);
                  }}
                >
                  {option.label}
                </button>
              </li>
            ))}
          </ul>
        </Motion>
      )}

      {name && (
        <input
          type="hidden"
          name={name}
          value={displayValue}
        />
      )}
    </div>
  );
}