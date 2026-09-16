import {
  cloneElement,
  isValidElement,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
} from "react";

import "./DropdownMenu.css";

export type DropdownMenuItem = {
  id: string;
  label: ReactNode;
  onSelect?: () => void;
  disabled?: boolean;
  destructive?: boolean;
  separatorBefore?: boolean;
};

export type DropdownMenuProps = {
  trigger: ReactElement;
  items: DropdownMenuItem[];
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  align?: "start" | "center" | "end";
  className?: string;
  menuClassName?: string;
  ariaLabel?: string;
};

type TriggerProps = {
  ref?: React.Ref<HTMLElement>;
  "aria-haspopup"?: string;
  "aria-expanded"?: boolean;
  "aria-controls"?: string;
  onClick?: (event: MouseEvent) => void;
  onKeyDown?: (event: KeyboardEvent) => void;
};

const ITEM_SELECTOR =
  "[data-dropdown-item-index]";

export function DropdownMenu({
  trigger,
  items,
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  align = "start",
  className = "",
  menuClassName = "",
  ariaLabel = "Menu",
}: DropdownMenuProps) {
  const id = useId().replace(/:/g, "");
  const menuId = `dropdown-menu-${id}`;

  const [internalOpen, setInternalOpen] =
    useState(defaultOpen);

  const [highlightedIndex, setHighlightedIndex] =
    useState<number | null>(null);

  const open =
    controlledOpen !== undefined
      ? controlledOpen
      : internalOpen;

  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef =
    useRef<HTMLElement | null>(null);

  const typeaheadRef = useRef("");
  const typeaheadTimerRef =
    useRef<number | null>(null);

  const enabledIndexes = items
    .map((item, index) =>
      item.disabled ? null : index
    )
    .filter(
      (index): index is number =>
        index !== null
    );

  const setOpen = (nextOpen: boolean) => {
    if (controlledOpen === undefined) {
      setInternalOpen(nextOpen);
    }

    onOpenChange?.(nextOpen);

    if (!nextOpen) {
      setHighlightedIndex(null);
      typeaheadRef.current = "";
    }
  };

  const getItemElement = (index: number) => {
    return menuRef.current?.querySelector<HTMLElement>(
      `[data-dropdown-item-index="${index}"]`
    );
  };

  const focusItem = (index: number) => {
    if (
      index < 0 ||
      index >= items.length ||
      items[index].disabled
    ) {
      return;
    }

    setHighlightedIndex(index);

    requestAnimationFrame(() => {
      const element = getItemElement(index);

      element?.focus();

      element?.scrollIntoView({
        block: "nearest",
      });
    });
  };

  const getFirstEnabledIndex = () =>
    enabledIndexes[0];

  const getLastEnabledIndex = () =>
    enabledIndexes[
      enabledIndexes.length - 1
    ];

  const openMenu = (
    initialIndex?: number
  ) => {
    setOpen(true);

    requestAnimationFrame(() => {
      const index =
        initialIndex ??
        getFirstEnabledIndex();

      if (index !== undefined) {
        focusItem(index);
      }
    });
  };

  const closeMenu = (
    restoreFocus = true
  ) => {
    setOpen(false);

    if (restoreFocus) {
      requestAnimationFrame(() => {
        triggerRef.current?.focus();
      });
    }
  };

  const moveHighlight = (
    direction: 1 | -1
  ) => {
    if (!enabledIndexes.length) {
      return;
    }

    const currentPosition =
      highlightedIndex === null
        ? -1
        : enabledIndexes.indexOf(
            highlightedIndex
          );

    const nextPosition =
      currentPosition === -1
        ? direction === 1
          ? 0
          : enabledIndexes.length - 1
        : (
            currentPosition +
            direction +
            enabledIndexes.length
          ) %
          enabledIndexes.length;

    focusItem(
      enabledIndexes[nextPosition]
    );
  };

  const searchByCharacter = (
    character: string
  ) => {
    if (!enabledIndexes.length) {
      return;
    }

    typeaheadRef.current +=
      character.toLowerCase();

    if (typeaheadTimerRef.current) {
      window.clearTimeout(
        typeaheadTimerRef.current
      );
    }

    typeaheadTimerRef.current =
      window.setTimeout(() => {
        typeaheadRef.current = "";
      }, 500);

    const query =
      typeaheadRef.current;

    const startPosition =
      highlightedIndex === null
        ? 0
        : enabledIndexes.indexOf(
            highlightedIndex
          ) + 1;

    for (
      let offset = 0;
      offset < enabledIndexes.length;
      offset++
    ) {
      const position =
        (startPosition + offset) %
        enabledIndexes.length;

      const index =
        enabledIndexes[position];

      const label =
        typeof items[index].label === "string"
          ? items[index].label.toLowerCase()
          : "";

      if (label.startsWith(query)) {
        focusItem(index);
        return;
      }
    }
  };

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (
      event: PointerEvent
    ) => {
      const target = event.target as Node;

      if (
        !rootRef.current?.contains(target)
      ) {
        closeMenu(false);
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

  useEffect(() => {
    return () => {
      if (typeaheadTimerRef.current) {
        window.clearTimeout(
          typeaheadTimerRef.current
        );
      }
    };
  }, []);

  const handleTriggerKeyDown = (
    event: KeyboardEvent
  ) => {
    if (
      event.key === "Enter" ||
      event.key === " "
    ) {
      event.preventDefault();

      if (open) {
        closeMenu();
      } else {
        openMenu();
      }

      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();

      if (!open) {
        openMenu();
      } else {
        moveHighlight(1);
      }

      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();

      if (!open) {
        const last =
          getLastEnabledIndex();

        if (last !== undefined) {
          openMenu(last);
        }
      } else {
        moveHighlight(-1);
      }

      return;
    }

    if (event.key === "Escape") {
      if (open) {
        event.preventDefault();
        closeMenu();
      }
    }
  };

  const handleMenuKeyDown = (
    event: KeyboardEvent
  ) => {
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        moveHighlight(1);
        return;

      case "ArrowUp":
        event.preventDefault();
        moveHighlight(-1);
        return;

      case "Home": {
        event.preventDefault();

        const first =
          getFirstEnabledIndex();

        if (first !== undefined) {
          focusItem(first);
        }

        return;
      }

      case "End": {
        event.preventDefault();

        const last =
          getLastEnabledIndex();

        if (last !== undefined) {
          focusItem(last);
        }

        return;
      }

      case "Escape":
        event.preventDefault();
        closeMenu();
        return;

      case "Tab":
        closeMenu(false);
        return;
    }

    if (
      event.key.length === 1 &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.altKey
    ) {
      searchByCharacter(event.key);
    }
  };

  const handleItemSelect = (
    item: DropdownMenuItem
  ) => {
    if (item.disabled) {
      return;
    }

    item.onSelect?.();
    closeMenu();
  };

  const triggerElement = (() => {
    if (!isValidElement(trigger)) {
      return trigger;
    }

    const typedTrigger =
      trigger as ReactElement<TriggerProps>;

    return cloneElement(typedTrigger, {
      ref: (node: HTMLElement | null) => {
        triggerRef.current = node;
      },

      "aria-haspopup": "menu",
      "aria-expanded": open,
      "aria-controls": open
        ? menuId
        : undefined,

      onClick: (event) => {
        typedTrigger.props.onClick?.(
          event
        );

        if (event.defaultPrevented) {
          return;
        }

        if (open) {
          closeMenu();
        } else {
          openMenu();
        }
      },

      onKeyDown: (event) => {
        typedTrigger.props.onKeyDown?.(
          event
        );

        if (!event.defaultPrevented) {
          handleTriggerKeyDown(event);
        }
      },
    });
  })();

  return (
    <div
      ref={rootRef}
      className={`dropdown-menu ${className}`.trim()}
    >
      {triggerElement}

      {open && (
        <div
          ref={menuRef}
          id={menuId}
          className={[
            "dropdown-menu__content",
            `dropdown-menu__content--${align}`,
            menuClassName,
          ]
            .filter(Boolean)
            .join(" ")}
          role="menu"
          aria-label={ariaLabel}
          onKeyDown={handleMenuKeyDown}
        >
          {items.map((item, index) => (
            <div key={item.id}>
              {item.separatorBefore && (
                <div
                  className="dropdown-menu__separator"
                  role="separator"
                />
              )}

              <button
                type="button"
                className={[
                  "dropdown-menu__item",
                  item.destructive &&
                    "dropdown-menu__item--destructive",
                ]
                  .filter(Boolean)
                  .join(" ")}
                data-dropdown-item-index={
                  index
                }
                role="menuitem"
                disabled={item.disabled}
                tabIndex={
                  highlightedIndex === index
                    ? 0
                    : -1
                }
                onMouseEnter={() => {
                  if (!item.disabled) {
                    setHighlightedIndex(index);
                  }
                }}
                onFocus={() => {
                  setHighlightedIndex(index);
                }}
                onClick={() => {
                  handleItemSelect(item);
                }}
              >
                {item.label}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}