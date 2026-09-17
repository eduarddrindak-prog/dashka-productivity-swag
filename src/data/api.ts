export interface ApiUser {
  id: string;
  login: string;
  role: "user" | "admin";
  createdAt: string;
}

interface AuthResponse {
  user: ApiUser;
}

interface MeResponse {
  authenticated: boolean;
  user: ApiUser | null;
}

interface ErrorResponse {
  error?: string;
}

async function parseResponse<T>(
  response: Response,
): Promise<T> {
  const data = (await response.json().catch(() => null)) as
    | T
    | ErrorResponse
    | null;

  if (!response.ok) {
    const error =
      typeof data === "object" &&
      data !== null &&
      "error" in data &&
      typeof data.error === "string"
        ? data.error
        : "Произошла ошибка. Попробуйте ещё раз.";

    throw new Error(error);
  }

  return data as T;
}

export async function registerApi(
  login: string,
  password: string,
): Promise<ApiUser> {
  const response = await fetch(
    "/api/auth/register",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        login,
        password,
      }),
    },
  );

  const data =
    await parseResponse<AuthResponse>(
      response,
    );

  return data.user;
}

export async function loginApi(
  login: string,
  password: string,
): Promise<ApiUser> {
  const response = await fetch(
    "/api/auth/login",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        login,
        password,
      }),
    },
  );

  const data =
    await parseResponse<AuthResponse>(
      response,
    );

  return data.user;
}

export async function getCurrentUserApi(): Promise<
  ApiUser | null
> {
  const response = await fetch(
    "/api/auth/me",
    {
      method: "GET",
      credentials: "include",
    },
  );

  const data =
    await parseResponse<MeResponse>(
      response,
    );

  return data.authenticated
    ? data.user
    : null;
}

export async function logoutApi(): Promise<void> {
  const response = await fetch(
    "/api/auth/logout",
    {
      method: "POST",
      credentials: "include",
    },
  );

  await parseResponse<{
    success: boolean;
  }>(response);
}