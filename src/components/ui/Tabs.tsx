import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";

import { Motion } from "./Motion";
import "./Tabs.css";

export type TabsItem = {
  id: string;
  label: ReactNode;
  content: ReactNode;
  disabled?: boolean;
};

export type TabsProps = {
  items: TabsItem[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  className?: string;
  listClassName?: string;
  tabClassName?: string;
  panelClassName?: string;
};

export function Tabs({
  items,
  value,
  defaultValue,
  onValueChange,
  className = "",
  listClassName = "",
  tabClassName = "",
  panelClassName = "",
}: TabsProps) {
  const tabsRef =
    useRef<Array<HTMLButtonElement | null>>([]);

  const generatedId = useId();

  const firstEnabledItem =
    items.find((item) => !item.disabled);

  const initialValue =
    defaultValue ??
    firstEnabledItem?.id ??
    "";

  const [internalValue, setInternalValue] =
    useState(initialValue);

  const isControlled =
    value !== undefined;

  const requestedValue = isControlled
    ? value
    : internalValue;

  const activeItem =
    items.find(
      (item) =>
        item.id === requestedValue &&
        !item.disabled
    ) ?? firstEnabledItem;

  const activeValue =
    activeItem?.id ?? "";

  useEffect(() => {
    if (
      !isControlled &&
      activeValue &&
      activeValue !== internalValue
    ) {
      setInternalValue(activeValue);
    }
  }, [
    activeValue,
    internalValue,
    isControlled,
  ]);

  const setActiveValue = (
    nextValue: string
  ) => {
    const nextItem = items.find(
      (item) =>
        item.id === nextValue &&
        !item.disabled
    );

    if (!nextItem) {
      return;
    }

    if (!isControlled) {
      setInternalValue(nextItem.id);
    }

    onValueChange?.(nextItem.id);
  };

  const getEnabledItems = () =>
    items.filter(
      (item) => !item.disabled
    );

  const focusTab = (
    itemId: string
  ) => {
    const button =
      tabsRef.current.find(
        (node) =>
          node?.dataset.tabId === itemId
      );

    button?.focus();
  };

  const handleKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    itemId: string
  ) => {
    const enabledItems =
      getEnabledItems();

    if (!enabledItems.length) {
      return;
    }

    const currentIndex =
      enabledItems.findIndex(
        (item) => item.id === itemId
      );

    if (currentIndex === -1) {
      return;
    }

    let nextIndex: number | null =
      null;

    switch (event.key) {
      case "ArrowRight":
        nextIndex =
          (currentIndex + 1) %
          enabledItems.length;
        break;

      case "ArrowLeft":
        nextIndex =
          (currentIndex -
            1 +
            enabledItems.length) %
          enabledItems.length;
        break;

      case "Home":
        nextIndex = 0;
        break;

      case "End":
        nextIndex =
          enabledItems.length - 1;
        break;

      default:
        return;
    }

    event.preventDefault();

    const nextItem =
      enabledItems[nextIndex];

    if (!nextItem) {
      return;
    }

    setActiveValue(nextItem.id);
    focusTab(nextItem.id);
  };

  if (!items.length) {
    return null;
  }

  return (
    <div
      className={[
        "tabs",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div
        role="tablist"
        aria-label="Tabs"
        className={[
          "tabs__list",
          listClassName,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {items.map((item, index) => {
          const isSelected =
            item.id === activeValue;

          const tabId =
            `${generatedId}-tab-${item.id}`;

          const panelId =
            `${generatedId}-panel-${item.id}`;

          return (
            <button
              key={item.id}
              ref={(node) => {
                tabsRef.current[index] =
                  node;
              }}
              type="button"
              role="tab"
              id={tabId}
              aria-selected={isSelected}
              aria-controls={panelId}
              tabIndex={
                isSelected ? 0 : -1
              }
              disabled={item.disabled}
              data-tab-id={item.id}
              className={[
                "tabs__tab",
                isSelected &&
                  "tabs__tab--active",
                tabClassName,
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => {
                setActiveValue(item.id);
              }}
              onKeyDown={(event) => {
                handleKeyDown(
                  event,
                  item.id
                );
              }}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {activeItem && (
        <Motion
          key={activeItem.id}
          as="div"
          preset="fade"
          className={[
            "tabs__panel",
            panelClassName,
          ]
            .filter(Boolean)
            .join(" ")}
          role="tabpanel"
          id={`${generatedId}-panel-${activeItem.id}`}
          aria-labelledby={`${generatedId}-tab-${activeItem.id}`}
          tabIndex={0}
        >
          {activeItem.content}
        </Motion>
      )}
    </div>
  );
}