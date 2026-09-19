import { useEffect, useState } from "react";
import {
  ArrowLeft,
  LogIn,
  RefreshCw,
  Trash2,
  Users,
} from "lucide-react";

import { Button, IconButton } from "../ui";
import type { AuthUser } from "../../data/auth";

interface AdminUser extends AuthUser {
  activeSessions: number;
}

interface AdminPanelProps {
  onBack: () => void;
  onImpersonated: (user: AuthUser) => void;
}

const API_BASE =
  "https://dashka-productivity.eduarddrindak.workers.dev";

export function AdminPanel({
  onBack,
  onImpersonated,
}: AdminPanelProps) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyUserId, setBusyUserId] = useState<string | null>(null);

  const loadUsers = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API_BASE}/api/admin/users`,
        {
          method: "GET",
          credentials: "include",
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.error ||
            "Не удалось загрузить пользователей.",
        );
      }

      setUsers(
        Array.isArray(result.users)
          ? result.users
          : [],
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Не удалось подключиться к серверу.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadUsers();
  }, []);

  const deleteUser = async (user: AdminUser) => {
    const confirmed = window.confirm(
      `Удалить пользователя "${user.login}"?\n\nВсе его данные и сессии будут удалены.`,
    );

    if (!confirmed) {
      return;
    }

    setBusyUserId(user.id);
    setError("");

    try {
      const response = await fetch(
        `${API_BASE}/api/admin/users/${encodeURIComponent(
          user.id,
        )}`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.error ||
            "Не удалось удалить пользователя.",
        );
      }

      setUsers((current) =>
        current.filter(
          (item) => item.id !== user.id,
        ),
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Не удалось удалить пользователя.",
      );
    } finally {
      setBusyUserId(null);
    }
  };

  const impersonateUser = async (user: AdminUser) => {
    const confirmed = window.confirm(
      `Войти как "${user.login}"?\n\nПосле этого ты увидишь приложение от имени этого пользователя.`,
    );

    if (!confirmed) {
      return;
    }

    setBusyUserId(user.id);
    setError("");

    try {
      const response = await fetch(
        `${API_BASE}/api/admin/users/${encodeURIComponent(
          user.id,
        )}/impersonate`,
        {
          method: "POST",
          credentials: "include",
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.error ||
            "Не удалось войти как пользователь.",
        );
      }

      if (!result.user) {
        throw new Error(
          "Сервер не вернул данные пользователя.",
        );
      }

      onImpersonated(result.user as AuthUser);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Не удалось войти как пользователь.",
      );
    } finally {
      setBusyUserId(null);
    }
  };

  return (
    <main className="dashka-app">
      <div className="dashka-shell">
        <header className="dashka-header">
          <div className="dashka-brand">
            <span className="dashka-brand__name">
              Dashka
            </span>

            <span className="dashka-brand__accent">
              Admin
            </span>
          </div>

          <div className="dashka-header-actions">
            <IconButton
              variant="ghost"
              size="md"
              icon={<RefreshCw size={19} />}
              label="Обновить пользователей"
              onClick={loadUsers}
            />

            <IconButton
              variant="ghost"
              size="md"
              icon={<ArrowLeft size={20} />}
              label="Назад"
              onClick={onBack}
            />
          </div>
        </header>

        <section
          style={{
            padding: "24px 0 120px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 20,
            }}
          >
            <Users size={24} />

            <div>
              <h1
                style={{
                  margin: 0,
                  fontSize: 24,
                }}
              >
                Пользователи
              </h1>

              <p
                style={{
                  margin: "4px 0 0",
                  opacity: 0.6,
                }}
              >
                Всего: {users.length}
              </p>
            </div>
          </div>

          {error && (
            <div
              style={{
                marginBottom: 16,
                padding: 14,
                borderRadius: 12,
                background:
                  "rgba(255, 70, 70, 0.1)",
              }}
            >
              {error}
            </div>
          )}

          {loading ? (
            <div
              style={{
                padding: 30,
                opacity: 0.6,
              }}
            >
              Загрузка пользователей...
            </div>
          ) : users.length === 0 ? (
            <div
              style={{
                padding: 30,
                opacity: 0.6,
              }}
            >
              Пользователей пока нет.
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              {users.map((user) => {
                const isBusy =
                  busyUserId === user.id;

                return (
                  <article
                    key={user.id}
                    style={{
                      padding: 18,
                      borderRadius: 16,
                      border:
                        "1px solid rgba(255,255,255,0.08)",
                      background:
                        "rgba(255,255,255,0.025)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent:
                          "space-between",
                        gap: 16,
                        flexWrap: "wrap",
                      }}
                    >
                      <div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            marginBottom: 6,
                          }}
                        >
                          <strong
                            style={{
                              fontSize: 18,
                            }}
                          >
                            {user.login}
                          </strong>

                          <span
                            style={{
                              fontSize: 12,
                              padding: "3px 7px",
                              borderRadius: 999,
                              background:
                                user.role === "admin"
                                  ? "rgba(150,255,100,0.12)"
                                  : "rgba(255,255,255,0.07)",
                            }}
                          >
                            {user.role}
                          </span>
                        </div>

                        <div
                          style={{
                            fontSize: 13,
                            opacity: 0.55,
                          }}
                        >
                          Создан:{" "}
                          {new Date(
                            user.createdAt,
                          ).toLocaleString("ru-RU")}
                        </div>

                        <div
                          style={{
                            fontSize: 13,
                            opacity: 0.55,
                            marginTop: 3,
                          }}
                        >
                          Активных сессий:{" "}
                          {user.activeSessions}
                        </div>
                      </div>

                      {user.role !== "admin" && (
                        <div
                          style={{
                            display: "flex",
                            gap: 8,
                            flexWrap: "wrap",
                          }}
                        >
                          <Button
                            size="md"
                            iconLeft={
                              <LogIn size={17} />
                            }
                            disabled={isBusy}
                            onClick={() =>
                              void impersonateUser(user)
                            }
                          >
                            Войти как
                          </Button>

                          <Button
                            size="md"
                            iconLeft={
                              <Trash2 size={17} />
                            }
                            disabled={isBusy}
                            onClick={() =>
                              void deleteUser(user)
                            }
                          >
                            Удалить
                          </Button>
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}