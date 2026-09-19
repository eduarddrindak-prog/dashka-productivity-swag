/// <reference types="@cloudflare/workers-types" />

interface Env {
  DB: D1Database;
  ADMIN_SETUP_SECRET: string;
}

interface UserRow {
  id: string;
  login: string;
  password_hash: string;
  role: string;
  created_at: string;
}

interface SessionRow {
  id: string;
  user_id: string;
  impersonator_id: string | null;
  parent_session_id: string | null;
  created_at: string;
  expires_at: string;
}

interface CurrentSession {
  session: SessionRow;
  user: UserRow;
}

const SESSION_COOKIE = "dashka_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 30;

function corsHeaders(request: Request): Headers {
  const origin = request.headers.get("Origin");

  const headers = new Headers();

  if (
    origin === "http://localhost:5173" ||
    origin === "https://dashka-productivity.pages.dev" ||
    origin === "https://dashka-productivity-swag.eduarddrindak.workers.dev"
  ) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Access-Control-Allow-Credentials", "true");
    headers.set("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
    headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, X-Admin-Setup-Secret",
    );
    headers.set("Vary", "Origin");
  }

  return headers;
}

function json(
  data: unknown,
  status = 200,
  headers: HeadersInit = {},
  request?: Request,
): Response {
  const responseHeaders = new Headers(headers);

  if (request) {
    const cors = corsHeaders(request);

    cors.forEach((value, key) => {
      responseHeaders.set(key, value);
    });
  }

  responseHeaders.set(
    "Content-Type",
    "application/json; charset=utf-8",
  );

  return new Response(JSON.stringify(data), {
    status,
    headers: responseHeaders,
  });
}

function createId(): string {
  return crypto.randomUUID();
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes;
}

/*
 * Makes a real ArrayBuffer instead of ArrayBufferLike.
 * This avoids the TypeScript BufferSource error in newer TS versions.
 */
function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  return buffer;
}

async function sha256Base64(value: string): Promise<string> {
  const hash = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );

  return bytesToBase64(new Uint8Array(hash));
}

async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );

  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: toArrayBuffer(salt),
      iterations: 100_000,
      hash: "SHA-256",
    },
    key,
    256,
  );

  const hash = new Uint8Array(bits);

  return `${bytesToBase64(salt)}.${bytesToBase64(hash)}`;
}

async function verifyPassword(
  password: string,
  storedHash: string,
): Promise<boolean> {
  const [saltBase64, hashBase64] = storedHash.split(".");

  if (!saltBase64 || !hashBase64) {
    return false;
  }

  try {
    const salt = base64ToBytes(saltBase64);
    const expectedHash = base64ToBytes(hashBase64);

    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(password),
      "PBKDF2",
      false,
      ["deriveBits"],
    );

    const bits = await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt: toArrayBuffer(salt),
        iterations: 100_000,
        hash: "SHA-256",
      },
      key,
      256,
    );

    const actualHash = new Uint8Array(bits);

    if (actualHash.length !== expectedHash.length) {
      return false;
    }

    let difference = 0;

    for (let i = 0; i < actualHash.length; i++) {
      difference |= actualHash[i] ^ expectedHash[i];
    }

    return difference === 0;
  } catch {
    return false;
  }
}

function getCookie(request: Request, name: string): string | null {
  const cookieHeader = request.headers.get("Cookie");

  if (!cookieHeader) {
    return null;
  }

  for (const cookie of cookieHeader.split(";")) {
    const [key, ...valueParts] = cookie.trim().split("=");

    if (key === name) {
      return decodeURIComponent(valueParts.join("="));
    }
  }

  return null;
}

function sessionCookie(token: string, request: Request): string {
  const url = new URL(request.url);

  return [
    `${SESSION_COOKIE}=${encodeURIComponent(token)}`,
    "HttpOnly",
    ...(url.protocol === "https:" ? ["Secure"] : []),
    "SameSite=None",
    "Path=/",
    `Max-Age=${SESSION_DURATION_SECONDS}`,
  ].join("; ");
}

function clearSessionCookie(request: Request): string {
  const url = new URL(request.url);

  return [
    `${SESSION_COOKIE}=`,
    "HttpOnly",
    ...(url.protocol === "https:" ? ["Secure"] : []),
    "SameSite=None",
    "Path=/",
    "Max-Age=0",
  ].join("; ");
}

async function createSession(
  env: Env,
  userId: string,
  impersonatorId: string | null = null,
  parentSessionId: string | null = null,
): Promise<string> {
  const token = crypto.randomUUID() + crypto.randomUUID();
  const sessionId = await sha256Base64(token);

  const now = new Date();
  const expiresAt = new Date(
    now.getTime() + SESSION_DURATION_SECONDS * 1000,
  );

  await env.DB.prepare(
    `
      INSERT INTO sessions (
        id,
        user_id,
        impersonator_id,
        parent_session_id,
        created_at,
        expires_at
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `,
  )
    .bind(
      sessionId,
      userId,
      impersonatorId,
      parentSessionId,
      now.toISOString(),
      expiresAt.toISOString(),
    )
    .run();

  return token;
}

async function getCurrentSession(
  request: Request,
  env: Env,
): Promise<CurrentSession | null> {
  const token = getCookie(request, SESSION_COOKIE);

  if (!token) {
    return null;
  }

  const hashedToken = await sha256Base64(token);

  const result = await env.DB.prepare(
    `
      SELECT
        s.id,
        s.user_id,
        s.impersonator_id,
        s.parent_session_id,
        s.created_at,
        s.expires_at,
        u.login,
        u.password_hash,
        u.role,
        u.created_at AS user_created_at
      FROM sessions s
      JOIN users u ON u.id = s.user_id
      WHERE s.id = ?
      LIMIT 1
    `,
  )
    .bind(hashedToken)
    .first<{
      id: string;
      user_id: string;
      impersonator_id: string | null;
      parent_session_id: string | null;
      created_at: string;
      expires_at: string;
      login: string;
      password_hash: string;
      role: string;
      user_created_at: string;
    }>();

  if (!result) {
    return null;
  }

  if (new Date(result.expires_at).getTime() <= Date.now()) {
    await env.DB.prepare("DELETE FROM sessions WHERE id = ?")
      .bind(hashedToken)
      .run();

    return null;
  }

  return {
    session: {
      id: result.id,
      user_id: result.user_id,
      impersonator_id: result.impersonator_id,
      parent_session_id: result.parent_session_id,
      created_at: result.created_at,
      expires_at: result.expires_at,
    },
    user: {
      id: result.user_id,
      login: result.login,
      password_hash: result.password_hash,
      role: result.role,
      created_at: result.user_created_at,
    },
  };
}

function publicUser(user: UserRow) {
  return {
    id: user.id,
    login: user.login,
    role: user.role,
    createdAt: user.created_at,
  };
}

async function requireAdmin(
  request: Request,
  env: Env,
): Promise<CurrentSession | Response> {
  const current = await getCurrentSession(request, env);

  if (!current) {
    return json({ error: "Требуется авторизация." }, 401);
  }

  if (current.user.role !== "admin") {
    return json({ error: "Доступ запрещён." }, 403);
  }

  return current;
}

async function handleRegister(
  request: Request,
  env: Env,
): Promise<Response> {
  let body: { login?: unknown; password?: unknown };

  try {
    body = await request.json();
  } catch {
    return json({ error: "Некорректный JSON." }, 400);
  }

  const login =
    typeof body.login === "string" ? body.login.trim() : "";

  const password =
    typeof body.password === "string" ? body.password : "";

  if (!login) {
    return json({ error: "Введите логин." }, 400);
  }

  if (login.length < 3) {
    return json(
      { error: "Логин должен содержать минимум 3 символа." },
      400,
    );
  }

  if (login.length > 50) {
    return json({ error: "Логин слишком длинный." }, 400);
  }

  if (!password) {
    return json({ error: "Введите пароль." }, 400);
  }

  if (password.length < 4) {
    return json(
      { error: "Пароль должен содержать минимум 4 символа." },
      400,
    );
  }

  const existingUser = await env.DB.prepare(
    `
      SELECT id
      FROM users
      WHERE lower(login) = lower(?)
      LIMIT 1
    `,
  )
    .bind(login)
    .first();

  if (existingUser) {
    return json(
      { error: "Такой логин уже существует." },
      409,
    );
  }

  const userId = createId();
  const passwordHash = await hashPassword(password);
  const createdAt = new Date().toISOString();

  await env.DB.prepare(
    `
      INSERT INTO users (
        id,
        login,
        password_hash,
        role,
        created_at
      )
      VALUES (?, ?, ?, 'user', ?)
    `,
  )
    .bind(userId, login, passwordHash, createdAt)
    .run();

  const token = await createSession(env, userId);

  return new Response(
    JSON.stringify({
      user: {
        id: userId,
        login,
        role: "user",
        createdAt,
      },
    }),
    {
      status: 201,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Set-Cookie": sessionCookie(token, request),
      },
    },
  );
}

async function handleLogin(
  request: Request,
  env: Env,
): Promise<Response> {
  let body: { login?: unknown; password?: unknown };

  try {
    body = await request.json();
  } catch {
    return json({ error: "Некорректный JSON." }, 400);
  }

  const login =
    typeof body.login === "string" ? body.login.trim() : "";

  const password =
    typeof body.password === "string" ? body.password : "";

  if (!login || !password) {
    return json(
      { error: "Введите логин и пароль." },
      400,
    );
  }

  const user = await env.DB.prepare(
    `
      SELECT
        id,
        login,
        password_hash,
        role,
        created_at
      FROM users
      WHERE lower(login) = lower(?)
      LIMIT 1
    `,
  )
    .bind(login)
    .first<UserRow>();

  if (!user) {
    return json(
      { error: "Неверный логин или пароль." },
      401,
    );
  }

  const validPassword = await verifyPassword(
    password,
    user.password_hash,
  );

  if (!validPassword) {
    return json(
      { error: "Неверный логин или пароль." },
      401,
    );
  }

  const token = await createSession(env, user.id);

  return new Response(
    JSON.stringify({
      user: publicUser(user),
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Set-Cookie": sessionCookie(token, request),
      },
    },
  );
}

async function handleMe(
  request: Request,
  env: Env,
): Promise<Response> {
  const current = await getCurrentSession(request, env);

  if (!current) {
    return json({
      authenticated: false,
      user: null,
      impersonating: false,
    });
  }

  return json({
    authenticated: true,
    user: publicUser(current.user),
    impersonating: Boolean(current.session.impersonator_id),
    impersonatorId: current.session.impersonator_id,
  });
}

async function handleLogout(
  request: Request,
  env: Env,
): Promise<Response> {
  const token = getCookie(request, SESSION_COOKIE);

  if (token) {
    const hashedToken = await sha256Base64(token);

    await env.DB.prepare("DELETE FROM sessions WHERE id = ?")
      .bind(hashedToken)
      .run();
  }

  return new Response(
    JSON.stringify({ success: true }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Set-Cookie": clearSessionCookie(request),
      },
    },
  );
}

/* =========================
   ADMIN API
   ========================= */

async function handleAdminUsers(
  request: Request,
  env: Env,
): Promise<Response> {
  const auth = await requireAdmin(request, env);

  if (auth instanceof Response) {
    return auth;
  }

  const result = await env.DB.prepare(
    `
      SELECT
        u.id,
        u.login,
        u.role,
        u.created_at,
        COUNT(s.id) AS session_count
      FROM users u
      LEFT JOIN sessions s
        ON s.user_id = u.id
        AND datetime(s.expires_at) > datetime('now')
      GROUP BY
        u.id,
        u.login,
        u.role,
        u.created_at
      ORDER BY datetime(u.created_at) DESC
    `,
  ).all<{
    id: string;
    login: string;
    role: string;
    created_at: string;
    session_count: number;
  }>();

  return json({
    users: result.results.map((user) => ({
      id: user.id,
      login: user.login,
      role: user.role,
      createdAt: user.created_at,
      activeSessions: Number(user.session_count ?? 0),
    })),
  });
}

async function handleAdminDeleteUser(
  request: Request,
  env: Env,
  userId: string,
): Promise<Response> {
  const auth = await requireAdmin(request, env);

  if (auth instanceof Response) {
    return auth;
  }

  if (!userId) {
    return json({ error: "Не указан ID пользователя." }, 400);
  }

  if (userId === auth.user.id) {
    return json(
      { error: "Нельзя удалить текущий аккаунт администратора." },
      400,
    );
  }

  const target = await env.DB.prepare(
    `
      SELECT id, login, role
      FROM users
      WHERE id = ?
      LIMIT 1
    `,
  )
    .bind(userId)
    .first<{
      id: string;
      login: string;
      role: string;
    }>();

  if (!target) {
    return json({ error: "Пользователь не найден." }, 404);
  }

  if (target.role === "admin") {
    return json(
      { error: "Удаление другого администратора запрещено." },
      403,
    );
  }

  await env.DB.prepare("DELETE FROM sessions WHERE user_id = ?")
    .bind(userId)
    .run();

  await env.DB.prepare("DELETE FROM users WHERE id = ?")
    .bind(userId)
    .run();

  return json({
    success: true,
    deletedUserId: userId,
  });
}

async function handleAdminImpersonate(
  request: Request,
  env: Env,
  userId: string,
): Promise<Response> {
  const auth = await requireAdmin(request, env);

  if (auth instanceof Response) {
    return auth;
  }

  if (!userId) {
    return json({ error: "Не указан ID пользователя." }, 400);
  }

  if (userId === auth.user.id) {
    return json(
      { error: "Нельзя войти как текущий администратор." },
      400,
    );
  }

  const target = await env.DB.prepare(
    `
      SELECT
        id,
        login,
        password_hash,
        role,
        created_at
      FROM users
      WHERE id = ?
      LIMIT 1
    `,
  )
    .bind(userId)
    .first<UserRow>();

  if (!target) {
    return json({ error: "Пользователь не найден." }, 404);
  }

  if (target.role === "admin") {
    return json(
      { error: "Нельзя войти как другой администратор." },
      403,
    );
  }

  /*
   * We keep the admin identity server-side.
   * The browser receives only a new normal session cookie.
   */
  const token = await createSession(
    env,
    target.id,
    auth.user.id,
    auth.session.id,
  );

  return json(
    {
      success: true,
      user: publicUser(target),
      impersonating: true,
    },
    200,
    {
      "Set-Cookie": sessionCookie(token, request),
    },
  );
}

async function handleStopImpersonation(
  request: Request,
  env: Env,
): Promise<Response> {
  const current = await getCurrentSession(request, env);

  if (!current) {
    return json({ error: "Требуется авторизация." }, 401);
  }

  if (!current.session.impersonator_id) {
    return json(
      { error: "Сейчас нет активного режима входа как пользователь." },
      400,
    );
  }

  const admin = await env.DB.prepare(
    `
      SELECT
        id,
        login,
        password_hash,
        role,
        created_at
      FROM users
      WHERE id = ?
      LIMIT 1
    `,
  )
    .bind(current.session.impersonator_id)
    .first<UserRow>();

  if (!admin || admin.role !== "admin") {
    return json(
      { error: "Исходный администратор больше недоступен." },
      403,
    );
  }

  /*
   * The original admin session is intentionally not restored from
   * the browser cookie because its raw token is never stored in D1.
   * Instead we create a fresh admin session.
   */
  const adminToken = await createSession(env, admin.id);

  await env.DB.prepare(
    "DELETE FROM sessions WHERE id = ?",
  )
    .bind(current.session.id)
    .run();

  return json(
    {
      success: true,
      user: publicUser(admin),
      impersonating: false,
    },
    200,
    {
      "Set-Cookie": sessionCookie(adminToken, request),
    },
  );
}


interface DataCategoryInput {
  id: string;
  name: string;
  createdAt: string;
}

interface DataTaskInput {
  id: string;
  name: string;
  description: string;
  categoryId: string;
  color: string;
  type: string;
  recurrence?: unknown;
  createdAt: string;
  updatedAt: string;
}

interface DataTaskInstanceInput {
  id: string;
  taskId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface AppDataPayload {
  categories?: unknown;
  tasks?: unknown;
  taskInstances?: unknown;
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

async function handleGetData(
  request: Request,
  env: Env,
): Promise<Response> {
  const current = await getCurrentSession(request, env);

  if (!current) {
    return json({ error: "Требуется авторизация." }, 401);
  }

  const [categoriesResult, tasksResult, instancesResult] =
    await Promise.all([
      env.DB.prepare(
        `
          SELECT id, name, created_at
          FROM categories
          WHERE user_id = ?
          ORDER BY datetime(created_at) ASC
        `,
      )
        .bind(current.user.id)
        .all<{
          id: string;
          name: string;
          created_at: string;
        }>(),

      env.DB.prepare(
        `
          SELECT
            id,
            name,
            description,
            category_id,
            color,
            type,
            recurrence_json,
            created_at,
            updated_at
          FROM tasks
          WHERE user_id = ?
          ORDER BY datetime(created_at) ASC
        `,
      )
        .bind(current.user.id)
        .all<{
          id: string;
          name: string;
          description: string;
          category_id: string;
          color: string;
          type: string;
          recurrence_json: string | null;
          created_at: string;
          updated_at: string;
        }>(),

      env.DB.prepare(
        `
          SELECT
            id,
            task_id,
            date,
            start_time,
            end_time,
            status,
            created_at,
            updated_at
          FROM task_instances
          WHERE user_id = ?
          ORDER BY date ASC, start_time ASC
        `,
      )
        .bind(current.user.id)
        .all<{
          id: string;
          task_id: string;
          date: string;
          start_time: string;
          end_time: string;
          status: string;
          created_at: string;
          updated_at: string;
        }>(),
    ]);

  return json({
    categories: categoriesResult.results.map((category) => ({
      id: category.id,
      name: category.name,
      createdAt: category.created_at,
    })),

    tasks: tasksResult.results.map((task) => ({
      id: task.id,
      name: task.name,
      description: task.description,
      categoryId: task.category_id,
      color: task.color,
      type: task.type,
      ...(task.recurrence_json
        ? { recurrence: JSON.parse(task.recurrence_json) }
        : {}),
      createdAt: task.created_at,
      updatedAt: task.updated_at,
    })),

    taskInstances: instancesResult.results.map((instance) => ({
      id: instance.id,
      taskId: instance.task_id,
      date: instance.date,
      startTime: instance.start_time,
      endTime: instance.end_time,
      status: instance.status,
      createdAt: instance.created_at,
      updatedAt: instance.updated_at,
    })),
  });
}

async function handlePutData(
  request: Request,
  env: Env,
): Promise<Response> {
  const current = await getCurrentSession(request, env);

  if (!current) {
    return json({ error: "Требуется авторизация." }, 401);
  }

  let body: AppDataPayload;

  try {
    body = (await request.json()) as AppDataPayload;
  } catch {
    return json({ error: "Некорректный JSON." }, 400);
  }

  if (
    !Array.isArray(body.categories) ||
    !Array.isArray(body.tasks) ||
    !Array.isArray(body.taskInstances)
  ) {
    return json({ error: "Некорректный формат данных." }, 400);
  }

  const categories = body.categories as DataCategoryInput[];
  const tasks = body.tasks as DataTaskInput[];
  const taskInstances =
    body.taskInstances as DataTaskInstanceInput[];

  if (
    categories.some(
      (category) =>
        !isString(category.id) ||
        !isString(category.name) ||
        !isString(category.createdAt),
    )
  ) {
    return json({ error: "Некорректные данные категорий." }, 400);
  }

  if (
    tasks.some(
      (task) =>
        !isString(task.id) ||
        !isString(task.name) ||
        !isString(task.description) ||
        !isString(task.categoryId) ||
        !isString(task.color) ||
        !isString(task.type) ||
        !isString(task.createdAt) ||
        !isString(task.updatedAt),
    )
  ) {
    return json({ error: "Некорректные данные задач." }, 400);
  }

  if (
    taskInstances.some(
      (instance) =>
        !isString(instance.id) ||
        !isString(instance.taskId) ||
        !isString(instance.date) ||
        !isString(instance.startTime) ||
        !isString(instance.endTime) ||
        !isString(instance.status) ||
        !isString(instance.createdAt) ||
        !isString(instance.updatedAt),
    )
  ) {
    return json(
      { error: "Некорректные данные экземпляров задач." },
      400,
    );
  }

  const userId = current.user.id;

  /*
   * A task needs a real category because tasks.category_id is a
   * foreign key. If the client has an orphaned task with an empty
   * categoryId, keep that task by creating a normal fallback category.
   */
  const normalizedCategories = [...categories];
  const hasOrphanedTasks = tasks.some(
    (task) => !task.categoryId.trim(),
  );

  if (hasOrphanedTasks) {
    const fallbackId = createId();

    normalizedCategories.push({
      id: fallbackId,
      name: "Без категории",
      createdAt: new Date().toISOString(),
    });

    for (const task of tasks) {
      if (!task.categoryId.trim()) {
        task.categoryId = fallbackId;
      }
    }
  }

  const categoryIds = new Set(
    normalizedCategories.map((category) => category.id),
  );

  const taskIds = new Set(
    tasks.map((task) => task.id),
  );

  if (
    new Set(normalizedCategories.map((category) => category.id))
      .size !== normalizedCategories.length
  ) {
    return json({ error: "Обнаружены дублирующиеся категории." }, 400);
  }

  if (new Set(tasks.map((task) => task.id)).size !== tasks.length) {
    return json({ error: "Обнаружены дублирующиеся задачи." }, 400);
  }

  if (
    new Set(taskInstances.map((instance) => instance.id)).size !==
    taskInstances.length
  ) {
    return json(
      { error: "Обнаружены дублирующиеся экземпляры задач." },
      400,
    );
  }

  if (
    tasks.some(
      (task) =>
        !categoryIds.has(task.categoryId) ||
        !["single", "recurring"].includes(task.type),
    )
  ) {
    return json(
      { error: "Задача содержит недопустимую категорию или тип." },
      400,
    );
  }

  if (
    taskInstances.some(
      (instance) =>
        !taskIds.has(instance.taskId) ||
        !["todo", "completed"].includes(instance.status),
    )
  ) {
    return json(
      { error: "Экземпляр задачи содержит недопустимые данные." },
      400,
    );
  }

  /*
   * Replace the current user's data.
   * Delete children first because of the foreign-key constraints.
   */
  await env.DB.prepare(
    "DELETE FROM task_instances WHERE user_id = ?",
  )
    .bind(userId)
    .run();

  await env.DB.prepare(
    "DELETE FROM tasks WHERE user_id = ?",
  )
    .bind(userId)
    .run();

  await env.DB.prepare(
    "DELETE FROM categories WHERE user_id = ?",
  )
    .bind(userId)
    .run();

  /*
   * D1 batches have a finite statement limit, so insert in small
   * chunks. Each chunk is atomic.
   */
  const runInChunks = async (
    statements: D1PreparedStatement[],
  ) => {
    const chunkSize = 50;

    for (let i = 0; i < statements.length; i += chunkSize) {
      await env.DB.batch(
        statements.slice(i, i + chunkSize),
      );
    }
  };

  await runInChunks(
    normalizedCategories.map((category) =>
      env.DB.prepare(
        `
          INSERT INTO categories (
            id,
            user_id,
            name,
            created_at
          )
          VALUES (?, ?, ?, ?)
        `,
      ).bind(
        category.id,
        userId,
        category.name.trim(),
        category.createdAt,
      ),
    ),
  );

  await runInChunks(
    tasks.map((task) =>
      env.DB.prepare(
        `
          INSERT INTO tasks (
            id,
            user_id,
            name,
            description,
            category_id,
            color,
            type,
            recurrence_json,
            created_at,
            updated_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
      ).bind(
        task.id,
        userId,
        task.name.trim(),
        task.description,
        task.categoryId,
        task.color,
        task.type,
        task.recurrence === undefined
          ? null
          : JSON.stringify(task.recurrence),
        task.createdAt,
        task.updatedAt,
      ),
    ),
  );

  await runInChunks(
    taskInstances.map((instance) =>
      env.DB.prepare(
        `
          INSERT INTO task_instances (
            id,
            task_id,
            user_id,
            date,
            start_time,
            end_time,
            status,
            created_at,
            updated_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
      ).bind(
        instance.id,
        instance.taskId,
        userId,
        instance.date,
        instance.startTime,
        instance.endTime,
        instance.status,
        instance.createdAt,
        instance.updatedAt,
      ),
    ),
  );

  return json({
    success: true,
    data: {
      categories: normalizedCategories,
      tasks,
      taskInstances,
    },
  });
}

async function handleAdminSetup(
  request: Request,
  env: Env,
): Promise<Response> {
  const setupSecret = request.headers.get("X-Admin-Setup-Secret");

  if (!setupSecret || setupSecret !== env.ADMIN_SETUP_SECRET) {
    return json({ error: "Доступ запрещён." }, 403);
  }

  const existingAdmin = await env.DB.prepare(
    `
      SELECT id
      FROM users
      WHERE role = 'admin'
      LIMIT 1
    `,
  ).first();

  if (existingAdmin) {
    return json(
      { error: "Администратор уже существует." },
      409,
    );
  }

  let body: {
    login?: unknown;
    password?: unknown;
  };

  try {
    body = await request.json();
  } catch {
    return json({ error: "Некорректный JSON." }, 400);
  }

  const login =
    typeof body.login === "string" ? body.login.trim() : "";

  const password =
    typeof body.password === "string" ? body.password : "";

  if (login.length < 3 || login.length > 50) {
    return json(
      { error: "Логин должен содержать от 3 до 50 символов." },
      400,
    );
  }

  if (password.length < 8) {
    return json(
      { error: "Пароль администратора должен содержать минимум 8 символов." },
      400,
    );
  }

  const existingUser = await env.DB.prepare(
    `
      SELECT id
      FROM users
      WHERE lower(login) = lower(?)
      LIMIT 1
    `,
  )
    .bind(login)
    .first();

  if (existingUser) {
    return json(
      { error: "Такой логин уже существует." },
      409,
    );
  }

  const userId = createId();
  const passwordHash = await hashPassword(password);
  const createdAt = new Date().toISOString();

  await env.DB.prepare(
    `
      INSERT INTO users (
        id,
        login,
        password_hash,
        role,
        created_at
      )
      VALUES (?, ?, ?, 'admin', ?)
    `,
  )
    .bind(
      userId,
      login,
      passwordHash,
      createdAt,
    )
    .run();

  return json({
    success: true,
    user: {
      id: userId,
      login,
      role: "admin",
      createdAt,
    },
  }, 201);
}

export default {
  async fetch(
    request: Request,
    env: Env,
  ): Promise<Response> {
    const url = new URL(request.url);

    const addCors = (response: Response): Response => {
      const headers = new Headers(response.headers);
      const cors = corsHeaders(request);

      cors.forEach((value, key) => {
        headers.set(key, value);
      });

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    };

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(request),
      });
    }

    if (
      request.method === "GET" &&
      url.pathname === "/api/data"
    ) {
      return addCors(await handleGetData(request, env));
    }

    if (
      request.method === "PUT" &&
      url.pathname === "/api/data"
    ) {
      return addCors(await handlePutData(request, env));
    }

    if (
      request.method === "POST" &&
      url.pathname === "/api/admin/setup"
    ) {
      return addCors(await handleAdminSetup(request, env));
    }

    if (
      request.method === "GET" &&
      url.pathname === "/api/health"
    ) {
      return addCors(
        json({
          ok: true,
          database: !!env.DB,
          service: "dashka-productivity-api",
        }),
      );
    }

    if (
      request.method === "POST" &&
      url.pathname === "/api/auth/register"
    ) {
      return addCors(await handleRegister(request, env));
    }

    if (
      request.method === "POST" &&
      url.pathname === "/api/auth/login"
    ) {
      return addCors(await handleLogin(request, env));
    }

    if (
      request.method === "GET" &&
      url.pathname === "/api/auth/me"
    ) {
      return addCors(await handleMe(request, env));
    }

    if (
      request.method === "POST" &&
      url.pathname === "/api/auth/logout"
    ) {
      return addCors(await handleLogout(request, env));
    }

    if (
      request.method === "GET" &&
      url.pathname === "/api/admin/users"
    ) {
      return addCors(await handleAdminUsers(request, env));
    }

    const deleteMatch = url.pathname.match(
      /^\/api\/admin\/users\/([^/]+)$/,
    );

    if (
      request.method === "DELETE" &&
      deleteMatch
    ) {
      return addCors(
        await handleAdminDeleteUser(
          request,
          env,
          decodeURIComponent(deleteMatch[1]),
        ),
      );
    }

    const impersonateMatch = url.pathname.match(
      /^\/api\/admin\/users\/([^/]+)\/impersonate$/,
    );

    if (
      request.method === "POST" &&
      impersonateMatch
    ) {
      return addCors(
        await handleAdminImpersonate(
          request,
          env,
          decodeURIComponent(impersonateMatch[1]),
        ),
      );
    }

    if (
      request.method === "POST" &&
      url.pathname === "/api/admin/stop-impersonation"
    ) {
      return addCors(await handleStopImpersonation(request, env));
    }

    return addCors(
      new Response("Not found", {
        status: 404,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
        },
      }),
    );
  },
} satisfies ExportedHandler<Env>;
