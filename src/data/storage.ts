import type { AppData } from "./types";

const API_BASE =
  "https://dashka-productivity.eduarddrindak.workers.dev";

const EMPTY_DATA: AppData = {
  categories: [],
  tasks: [],
  taskInstances: [],
};

function getStorageKey(userId: string): string {
  return `dashka-productivity-data:${userId}`;
}

function normalizeData(value: unknown): AppData {
  if (!value || typeof value !== "object") {
    return { ...EMPTY_DATA };
  }

  const parsed = value as Partial<AppData>;

  return {
    categories: Array.isArray(parsed.categories)
      ? parsed.categories
      : [],
    tasks: Array.isArray(parsed.tasks)
      ? parsed.tasks
      : [],
    taskInstances: Array.isArray(parsed.taskInstances)
      ? parsed.taskInstances
      : [],
  };
}

export function loadAppData(userId: string): AppData {
  const key = getStorageKey(userId);

  try {
    const raw = localStorage.getItem(key);

    if (!raw) {
      return { ...EMPTY_DATA };
    }

    return normalizeData(JSON.parse(raw));
  } catch {
    return { ...EMPTY_DATA };
  }
}

export function saveLocalAppData(
  data: AppData,
  userId: string,
): void {
  try {
    localStorage.setItem(
      getStorageKey(userId),
      JSON.stringify(data),
    );
  } catch {
    // Локальный cache не должен ломать работу приложения.
  }
}

export async function loadRemoteAppData(
  userId: string,
): Promise<AppData | null> {
  try {
    const response = await fetch(
      `${API_BASE}/api/data`,
      {
        method: "GET",
        credentials: "include",
      },
    );

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as {
      categories?: unknown;
      tasks?: unknown;
      taskInstances?: unknown;
    };

    const data = normalizeData(payload);

    saveLocalAppData(data, userId);

    return data;
  } catch {
    return null;
  }
}

export async function saveAppData(
  data: AppData,
  userId: string,
): Promise<boolean> {
  saveLocalAppData(data, userId);

  try {
    const response = await fetch(
      `${API_BASE}/api/data`,
      {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      },
    );

    return response.ok;
  } catch {
    return false;
  }
}

export function clearAppData(userId: string): void {
  try {
    localStorage.removeItem(getStorageKey(userId));
  } catch {
    // Ничего не делаем, если localStorage недоступен.
  }
}
