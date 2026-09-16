import type {
  AppData,
  Task,
  TaskColor,
  TaskInstance,
  WeeklyRecurrence,
} from "../data/types";
import { formatDateKey, getWeekDays } from "./dates";

export const TASK_COLORS: TaskColor[] = [
  "green",
  "yellow",
  "blue",
  "red",
  "purple",
  "orange",
  "cyan",
  "white",
];

export function createId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`;
}

export function createTask(
  name: string,
  description: string,
  categoryId: string,
  color: TaskColor,
  type: Task["type"],
  recurrence?: WeeklyRecurrence,
): Task {
  const now = new Date().toISOString();

  return {
    id: createId("task"),
    name: name.trim(),
    description: description.trim(),
    categoryId,
    color,
    type,
    recurrence,
    createdAt: now,
    updatedAt: now,
  };
}

export function createTaskInstance(
  taskId: string,
  date: string,
  startTime: string,
  endTime: string,
): TaskInstance {
  const now = new Date().toISOString();

  return {
    id: createId("instance"),
    taskId,
    date,
    startTime,
    endTime,
    status: "todo",
    createdAt: now,
    updatedAt: now,
  };
}

export function getMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export function isValidTimeRange(
  startTime: string,
  endTime: string,
): boolean {
  return getMinutes(endTime) > getMinutes(startTime);
}

export function ensureRecurringInstances(
  data: AppData,
  week: Date,
): AppData {
  const next: AppData = {
    ...data,
    taskInstances: [...data.taskInstances],
  };

  const days = getWeekDays(week);

  for (const task of next.tasks) {
    if (task.type !== "recurring" || !task.recurrence) {
      continue;
    }

    for (const day of days) {
      if (!task.recurrence.days.includes(day.dayOfWeek)) {
        continue;
      }

      const date = formatDateKey(day.date);
      const time = task.recurrence.times[String(day.dayOfWeek)];

      if (!time) {
        continue;
      }

      const exists = next.taskInstances.some(
        (instance) =>
          instance.taskId === task.id && instance.date === date,
      );

      if (!exists) {
        next.taskInstances.push(
          createTaskInstance(
            task.id,
            date,
            time.startTime,
            time.endTime,
          ),
        );
      }
    }
  }

  return next;
}

export function getInstancesForWeek(
  data: AppData,
  week: Date,
): TaskInstance[] {
  const dates = new Set(getWeekDays(week).map((day) => day.dateKey));

  return data.taskInstances.filter((instance) =>
    dates.has(instance.date),
  );
}
