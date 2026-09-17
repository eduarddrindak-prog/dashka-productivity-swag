import type { AppData } from "./types";

const DEFAULT_DATA: AppData = {
  categories: [],
  tasks: [],
  taskInstances: [],
};

function getStorageKey(): string {
  return "dashka-productivity-data";
}

export function loadAppData(): AppData {
  const key = getStorageKey();

  try {
    const raw = localStorage.getItem(key);

    if (!raw) {
      return {
        categories: [],
        tasks: [],
        taskInstances: [],
      };
    }

    const parsed = JSON.parse(raw) as Partial<AppData>;

    return {
      categories: Array.isArray(parsed.categories)
        ? parsed.categories
        : [],
      tasks: Array.isArray(parsed.tasks)
        ? parsed.tasks
        : [],
      taskInstances: Array.isArray(
        parsed.taskInstances,
      )
        ? parsed.taskInstances
        : [],
    };
  } catch {
    return {
      categories: [],
      tasks: [],
      taskInstances: [],
    };
  }
}

export function saveAppData(data: AppData) {
  const key = getStorageKey();

  localStorage.setItem(
    key,
    JSON.stringify(data),
  );
}

export function clearAppData() {
  const key = getStorageKey();

  localStorage.removeItem(key);
}