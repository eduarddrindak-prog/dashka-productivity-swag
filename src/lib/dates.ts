export const DAY_NAMES_SHORT = [
  "Пн",
  "Вт",
  "Ср",
  "Чт",
  "Пт",
  "Сб",
  "Вс",
] as const;

export const DAY_NAMES_LONG = [
  "Понедельник",
  "Вторник",
  "Среда",
  "Четверг",
  "Пятница",
  "Суббота",
  "Воскресенье",
] as const;

export interface WeekDay {
  date: Date;
  dateKey: string;
  dayOfWeek: number;
}

/**
 * Приводит дату к началу дня.
 */
export function startOfDay(date: Date): Date {
  const result = new Date(date);

  result.setHours(0, 0, 0, 0);

  return result;
}

/**
 * Получает понедельник недели, в которую входит дата.
 */
export function startOfWeek(date: Date): Date {
  const result = startOfDay(date);

  const day = result.getDay();

  // JS:
  // Sunday = 0
  // Monday = 1
  // ...
  //
  // Нам нужна неделя с понедельника.

  const daysFromMonday = day === 0 ? 6 : day - 1;

  result.setDate(result.getDate() - daysFromMonday);

  return result;
}

/**
 * Возвращает все 7 дней выбранной недели.
 */
export function getWeekDays(date: Date): WeekDay[] {
  const monday = startOfWeek(date);

  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(monday);

    day.setDate(monday.getDate() + index);

    return {
      date: day,
      dateKey: formatDateKey(day),
      dayOfWeek: index,
    };
  });
}

/**
 * Формат:
 * YYYY-MM-DD
 *
 * Именно такой формат будем использовать
 * внутри данных приложения.
 */
export function formatDateKey(date: Date): string {
  const year = date.getFullYear();

  const month = String(date.getMonth() + 1).padStart(2, "0");

  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

/**
 * Преобразует YYYY-MM-DD обратно в Date.
 */
export function parseDateKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split("-").map(Number);

  return new Date(year, month - 1, day);
}

/**
 * Добавляет указанное количество дней.
 */
export function addDays(date: Date, amount: number): Date {
  const result = new Date(date);

  result.setDate(result.getDate() + amount);

  return result;
}

/**
 * Проверяет, является ли дата сегодняшней.
 */
export function isToday(date: Date): boolean {
  return formatDateKey(date) === formatDateKey(new Date());
}

/**
 * Возвращает ключ недели.
 *
 * Например:
 * 2026-09-14
 *
 * Это дата понедельника.
 */
export function getWeekKey(date: Date): string {
  return formatDateKey(startOfWeek(date));
}

export function formatWeekRange(date: Date): string {
  const days = getWeekDays(date);

  const first = days[0].date;
  const last = days[6].date;

  const firstDay = first.getDate();
  const lastDay = last.getDate();

  const firstMonth = first.toLocaleDateString("ru-RU", {
    month: "long",
  });

  const lastMonth = last.toLocaleDateString("ru-RU", {
    month: "long",
  });

  const year = last.getFullYear();

  if (first.getMonth() === last.getMonth()) {
    return `${firstDay}–${lastDay} ${firstMonth} ${year}`;
  }

  return `${firstDay} ${firstMonth} – ${lastDay} ${lastMonth} ${year}`;
}