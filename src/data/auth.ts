export interface AuthUser {
  id: string;
  login: string;
  role: "user" | "admin";
  createdAt: string;
}

interface AuthResponse {
  user?: AuthUser;
  error?: string;
}

const API_BASE =
  "https://dashka-productivity.eduarddrindak.workers.dev";

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const response = await fetch(
      `${API_BASE}/api/auth/me`,
      {
        method: "GET",
        credentials: "include",
      },
    );

    if (!response.ok) {
      return null;
    }

    const data =
      (await response.json()) as AuthResponse;

    return data.user ?? null;
  } catch {
    return null;
  }
}

export async function registerUser(
  login: string,
  password: string,
): Promise<
  | {
      success: true;
      user: AuthUser;
    }
  | {
      success: false;
      error: string;
    }
> {
  const normalizedLogin = login.trim();

  if (!normalizedLogin) {
    return {
      success: false,
      error: "Введите логин.",
    };
  }

  if (normalizedLogin.length < 3) {
    return {
      success: false,
      error:
        "Логин должен содержать минимум 3 символа.",
    };
  }

  if (!password) {
    return {
      success: false,
      error: "Введите пароль.",
    };
  }

  if (password.length < 8) {
    return {
      success: false,
      error:
        "Пароль должен содержать минимум 8 символов.",
    };
  }

  try {
    const response = await fetch(
      `${API_BASE}/api/auth/register`,
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          login: normalizedLogin,
          password,
        }),
      },
    );

    const data =
      (await response.json()) as AuthResponse;

    if (!response.ok || !data.user) {
      return {
        success: false,
        error:
          data.error ??
          "Не удалось создать аккаунт.",
      };
    }

    return {
      success: true,
      user: data.user,
    };
  } catch {
    return {
      success: false,
      error:
        "Не удалось подключиться к серверу.",
    };
  }
}

export async function loginUser(
  login: string,
  password: string,
): Promise<
  | {
      success: true;
      user: AuthUser;
    }
  | {
      success: false;
      error: string;
    }
> {
  const normalizedLogin = login.trim();

  if (!normalizedLogin) {
    return {
      success: false,
      error: "Введите логин.",
    };
  }

  if (!password) {
    return {
      success: false,
      error: "Введите пароль.",
    };
  }

  try {
    const response = await fetch(
      `${API_BASE}/api/auth/login`,
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          login: normalizedLogin,
          password,
        }),
      },
    );

    const data =
      (await response.json()) as AuthResponse;

    if (!response.ok || !data.user) {
      return {
        success: false,
        error:
          data.error ??
          "Неверный логин или пароль.",
      };
    }

    return {
      success: true,
      user: data.user,
    };
  } catch {
    return {
      success: false,
      error:
        "Не удалось подключиться к серверу.",
    };
  }
}

export async function logoutUser(): Promise<void> {
  try {
    await fetch(
      `${API_BASE}/api/auth/logout`,
      {
        method: "POST",
        credentials: "include",
      },
    );
  } catch {
    // Даже если запрос завершился ошибкой,
    // локальное состояние приложения всё равно
    // будет сброшено через App.tsx.
  }
}