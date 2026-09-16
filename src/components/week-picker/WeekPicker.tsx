import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getWeekDays, isToday, startOfWeek } from "../../lib/dates";
import "./WeekPicker.css";

interface WeekPickerProps {
  open: boolean;
  value: Date;
  onSelect: (week: Date) => void;
  onClose: () => void;
}

function monthTitle(date: Date): string {
  return date.toLocaleDateString("ru-RU", {
    month: "long",
    year: "numeric",
  });
}

export function WeekPicker({
  open,
  value,
  onSelect,
  onClose,
}: WeekPickerProps) {
  const [month, setMonth] = useState(() => new Date(value));

  useEffect(() => {
    if (open) setMonth(new Date(value));
  }, [open, value]);

  const weeks = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const firstWeek = startOfWeek(first);

    return Array.from({ length: 6 }, (_, index) => {
      const weekStart = new Date(firstWeek);
      weekStart.setDate(firstWeek.getDate() + index * 7);
      return getWeekDays(weekStart).map((day) => day.date);
    });
  }, [month]);

  if (!open) return null;

  const selectedKey = startOfWeek(value).toISOString().slice(0, 10);

  return (
    <div
      className="week-picker__overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section className="week-picker" role="dialog" aria-modal="true">
        <header className="week-picker__header">
          <button type="button" className="week-picker__nav"
            onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
            aria-label="Предыдущий месяц">
            <ChevronLeft size={18} />
          </button>

          <strong>{monthTitle(month)}</strong>

          <button type="button" className="week-picker__nav"
            onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
            aria-label="Следующий месяц">
            <ChevronRight size={18} />
          </button>
        </header>

        <div className="week-picker__weekdays">
          {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map((day) => (
            <span key={day}>{day}</span>
          ))}
        </div>

        <div className="week-picker__weeks">
          {weeks.map((days) => {
            const weekStart = startOfWeek(days[0]);
            const key = weekStart.toISOString().slice(0, 10);
            const selected = key === selectedKey;

            return (
              <button type="button"
                className={`week-picker__week ${selected ? "is-selected" : ""}`}
                key={key}
                onClick={() => {
                  onSelect(weekStart);
                  onClose();
                }}>
                {days.map((day) => (
                  <span key={day.toISOString()}
                    className={isToday(day) ? "is-today" : ""}>
                    {day.getDate()}
                  </span>
                ))}
              </button>
            );
          })}
        </div>

        <button type="button" className="week-picker__today"
          onClick={() => {
            onSelect(startOfWeek(new Date()));
            onClose();
          }}>
          Сегодня
        </button>
      </section>
    </div>
  );
}
