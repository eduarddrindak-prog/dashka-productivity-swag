export type TaskColor =
  | "green"
  | "yellow"
  | "blue"
  | "red"
  | "purple"
  | "orange"
  | "cyan"
  | "white";

export type TaskStatus = "todo" | "completed";

export type TaskType = "single" | "recurring";

export interface Category {
  id: string;
  name: string;
  createdAt: string;
}

export interface RecurrenceDayTime {
  startTime: string;
  endTime: string;
}

export interface WeeklyRecurrence {
  days: number[];
  times: Record<string, RecurrenceDayTime>;
}

export interface Task {
  id: string;
  name: string;
  description: string;
  categoryId: string;
  color: TaskColor;
  type: TaskType;
  recurrence?: WeeklyRecurrence;
  createdAt: string;
  updatedAt: string;
}

export interface TaskInstance {
  id: string;
  taskId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AppData {
  categories: Category[];
  tasks: Task[];
  taskInstances: TaskInstance[];
}
