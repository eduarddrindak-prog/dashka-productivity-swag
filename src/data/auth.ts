export interface AuthUser {
  id: string;
  login: string;
  password: string;
  createdAt: string;
}

const USERS_KEY = "dashka-productivity-users";
const CURRENT_USER_KEY = "dashka-productivity-current-user";

function createId(): string {
  return `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 9)}`;
}

function getUsers(): AuthUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);

    if (!raw) {
      return [];
    }

    const users = JSON.parse(raw);

    if (!Array.isArray(users)) {
      return [];
    }

    return users;
  } catch {
    return [];
  }
}

function saveUsers(users: AuthUser[]) {
  localStorage.setItem(
    USERS_KEY,
    JSON.stringify(users),
  );
}

export function getCurrentUser(): AuthUser | null {
  try {
    const userId = localStorage.getItem(
      CURRENT_USER_KEY,
    );

    if (!userId) {
      return null;
    }

    const user = getUsers().find(
      (item) => item.id === userId,
    );

    return user ?? null;
  } catch {
    return null;
  }
}

export function registerUser(
  login: string,
  password: string,
):
  | {
      success: true;
      user: AuthUser;
    }
  | {
      success: false;
      error: string;
    } {
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
      error: "Логин должен содержать минимум 3 символа.",
    };
  }

  if (!password) {
    return {
      success: false,
      error: "Введите пароль.",
    };
  }

  if (password.length < 4) {
    return {
      success: false,
      error: "Пароль должен содержать минимум 4 символа.",
    };
  }

  const users = getUsers();

  const alreadyExists = users.some(
    (user) =>
      user.login.toLowerCase() ===
      normalizedLogin.toLowerCase(),
  );

  if (alreadyExists) {
    return {
      success: false,
      error: "Такой логин уже существует.",
    };
  }

  const user: AuthUser = {
    id: createId(),
    login: normalizedLogin,
    password,
    createdAt: new Date().toISOString(),
  };

  saveUsers([
    ...users,
    user,
  ]);

  localStorage.setItem(
    CURRENT_USER_KEY,
    user.id,
  );

  return {
    success: true,
    user,
  };
}

export function loginUser(
  login: string,
  password: string,
):
  | {
      success: true;
      user: AuthUser;
    }
  | {
      success: false;
      error: string;
    } {
  const normalizedLogin = login.trim();

  const user = getUsers().find(
    (item) =>
      item.login.toLowerCase() ===
      normalizedLogin.toLowerCase(),
  );

  if (!user) {
    return {
      success: false,
      error: "Неверный логин или пароль.",
    };
  }

  if (user.password !== password) {
    return {
      success: false,
      error: "Неверный логин или пароль.",
    };
  }

  localStorage.setItem(
    CURRENT_USER_KEY,
    user.id,
  );

  return {
    success: true,
    user,
  };
}

export function logoutUser() {
  localStorage.removeItem(
    CURRENT_USER_KEY,
  );
}