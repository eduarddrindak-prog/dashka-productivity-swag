import {
  useEffect,
  useId,
  useState,
  type ReactNode,
} from "react";
import { ChevronDown } from "lucide-react";

import "./Accordion.css";

export type AccordionItem = {
  id: string;
  title: ReactNode;
  content: ReactNode;
  disabled?: boolean;
};

export type AccordionType =
  | "single"
  | "multiple";

export type AccordionProps = {
  items: AccordionItem[];
  type?: AccordionType;

  value?: string[];
  defaultValue?: string[];

  onValueChange?: (
    value: string[]
  ) => void;

  className?: string;
  itemClassName?: string;
  triggerClassName?: string;
  contentClassName?: string;
};

export function Accordion({
  items,
  type = "single",
  value,
  defaultValue = [],
  onValueChange,
  className = "",
  itemClassName = "",
  triggerClassName = "",
  contentClassName = "",
}: AccordionProps) {
  const generatedId = useId();

  const isControlled =
    value !== undefined;

  const [internalValue, setInternalValue] =
    useState<string[]>(() => {
      if (type === "single") {
        return defaultValue.slice(0, 1);
      }

      return defaultValue;
    });

  const selectedValues = isControlled
    ? value
    : internalValue;

  useEffect(() => {
    if (type !== "single") {
      return;
    }

    if (selectedValues.length <= 1) {
      return;
    }

    const nextValue =
      selectedValues.slice(0, 1);

    if (!isControlled) {
      setInternalValue(nextValue);
    }

    onValueChange?.(nextValue);
  }, [
    type,
    selectedValues,
    isControlled,
    onValueChange,
  ]);

  const setSelectedValues = (
    nextValue: string[]
  ) => {
    const normalizedValue =
      type === "single"
        ? nextValue.slice(0, 1)
        : nextValue;

    if (!isControlled) {
      setInternalValue(normalizedValue);
    }

    onValueChange?.(
      normalizedValue
    );
  };

  const toggleItem = (
    itemId: string
  ) => {
    const item = items.find(
      (entry) => entry.id === itemId
    );

    if (!item || item.disabled) {
      return;
    }

    const isOpen =
      selectedValues.includes(itemId);

    if (type === "single") {
      setSelectedValues(
        isOpen ? [] : [itemId]
      );
      return;
    }

    const nextValue = isOpen
      ? selectedValues.filter(
          (id) => id !== itemId
        )
      : [
          ...selectedValues,
          itemId,
        ];

    setSelectedValues(nextValue);
  };

  return (
    <div
      className={[
        "accordion",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {items.map((item) => {
        const isOpen =
          selectedValues.includes(
            item.id
          );

        const panelId =
          `${generatedId}-panel-${item.id}`;

        const triggerId =
          `${generatedId}-trigger-${item.id}`;

        return (
          <div
            key={item.id}
            className={[
              "accordion__item",
              itemClassName,
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <h3 className="accordion__heading">
              <button
                id={triggerId}
                type="button"
                className={[
                  "accordion__trigger",
                  triggerClassName,
                ]
                  .filter(Boolean)
                  .join(" ")}
                aria-expanded={isOpen}
                aria-controls={panelId}
                disabled={item.disabled}
                onClick={() =>
                  toggleItem(item.id)
                }
              >
                <span className="accordion__title">
                  {item.title}
                </span>

                <span
                  className={[
                    "accordion__icon",
                    isOpen &&
                      "accordion__icon--open",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  aria-hidden="true"
                >
                  <ChevronDown
                    size={16}
                  />
                </span>
              </button>
            </h3>

            <div
              id={panelId}
              role="region"
              aria-labelledby={triggerId}
              className={[
                "accordion__panel",
                isOpen &&
                  "accordion__panel--open",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <div
                className={[
                  "accordion__content",
                  contentClassName,
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {item.content}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}