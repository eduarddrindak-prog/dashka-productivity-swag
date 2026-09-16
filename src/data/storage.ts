import type { AppData } from "./types";
import { getCurrentUser } from "./auth";

const DEFAULT_DATA: AppData = {
  categories: [],
  tasks: [],
  taskInstances: [],
};

function getStorageKey(): string | null {
  const user = getCurrentUser();

  if (!user) {
    return null;
  }

  return `dashka-productivity-data-${user.id}`;
}

export function loadAppData(): AppData {
  const key = getStorageKey();

  if (!key) {
    return {
      categories: [],
      tasks: [],
      taskInstances: [],
    };
  }

  try {
    const raw = localStorage.getItem(key);

    if (!raw) {
      return {
        ...DEFAULT_DATA,
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
      ...DEFAULT_DATA,
    };
  }
}

export function saveAppData(data: AppData) {
  const key = getStorageKey();

  if (!key) {
    return;
  }

  localStorage.setItem(
    key,
    JSON.stringify(data),
  );
}

export function clearAppData() {
  const key = getStorageKey();

  if (!key) {
    return;
  }

  localStorage.removeItem(key);
}