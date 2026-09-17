import { FormEvent, useState } from "react";
import {
  loginUser,
  registerUser,
} from "../../data/auth";
import type { AuthUser } from "../../data/auth";
import "./AuthScreen.css";

interface AuthScreenProps {
  onAuthenticated: (user: AuthUser) => void;
}

export function AuthScreen({
  onAuthenticated,
}: AuthScreenProps) {
  const [mode, setMode] =
    useState<"login" | "register">("login");

  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [passwordRepeat, setPasswordRepeat] =
    useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isRegister = mode === "register";

  const switchMode = (
    nextMode: "login" | "register",
  ) => {
    setMode(nextMode);
    setLogin("");
    setPassword("");
    setPasswordRepeat("");
    setError("");
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {

    console.log("🔥 HANDLE SUBMIT WORKS");
    
    event.preventDefault();

    setError("");

    if (
      isRegister &&
      password !== passwordRepeat
    ) {
      setError("Пароли не совпадают.");
      return;
    }

    setLoading(true);

    const result = isRegister
      ? await registerUser(login, password)
      : await loginUser(login, password);

    if (!result.success) {
      setError(result.error);
      setLoading(false);
      return;
    }

    onAuthenticated(result.user);
  };

  return (
    <main className="auth-screen">
      <div className="auth-screen__glow" />

      <section className="auth-card">
        <div className="auth-card__brand">
          <span>Dashka</span>
          <strong>Productivity</strong>
        </div>

        <div className="auth-card__header">
          <h1>
            {isRegister
              ? "Создать аккаунт"
              : "С возвращением"}
          </h1>

          <p>
            {isRegister
              ? "Создай аккаунт для своего расписания."
              : "Войди, чтобы открыть своё расписание."}
          </p>
        </div>

        <form
          className="auth-form"
          onSubmit={handleSubmit}
        >
          <label className="auth-field">
            <span>Логин</span>

            <input
              type="text"
              value={login}
              autoComplete="username"
              placeholder="Введите логин"
              maxLength={50}
              disabled={loading}
              onChange={(event) => {
                setLogin(event.target.value);
                setError("");
              }}
            />
          </label>

          <label className="auth-field">
            <span>Пароль</span>

            <input
              type="password"
              value={password}
              autoComplete={
                isRegister
                  ? "new-password"
                  : "current-password"
              }
              placeholder="Введите пароль"
              maxLength={100}
              disabled={loading}
              onChange={(event) => {
                setPassword(event.target.value);
                setError("");
              }}
            />
          </label>

          {isRegister && (
            <label className="auth-field">
              <span>Повторите пароль</span>

              <input
                type="password"
                value={passwordRepeat}
                autoComplete="new-password"
                placeholder="Повторите пароль"
                maxLength={100}
                disabled={loading}
                onChange={(event) => {
                  setPasswordRepeat(
                    event.target.value,
                  );
                  setError("");
                }}
              />
            </label>
          )}

          {error && (
            <div className="auth-error">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="auth-submit"
            disabled={loading}
          >
            {loading
              ? "Подождите..."
              : isRegister
                ? "Создать аккаунт"
                : "Войти"}
          </button>
        </form>

        <div className="auth-switch">
          <span>
            {isRegister
              ? "Уже есть аккаунт?"
              : "Нет аккаунта?"}
          </span>

          <button
            type="button"
            disabled={loading}
            onClick={() =>
              switchMode(
                isRegister
                  ? "login"
                  : "register",
              )
            }
          >
            {isRegister
              ? "Войти"
              : "Создать аккаунт"}
          </button>
        </div>
      </section>
    </main>
  );
}