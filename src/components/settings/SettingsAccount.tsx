import type { AuthUser } from "../../data/auth";

interface SettingsAccountProps {
  user: AuthUser;

  statistics: {
    categories: number;
    tasks: number;
    instances: number;
    completed: number;
  };

  onLogout?: () => void;
}

export function SettingsAccount({
  user,
  statistics,
  onLogout,
}: SettingsAccountProps) {
  const createdDate = new Date(
    user.createdAt,
  ).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="settings-account">
      <div className="settings-page-title">
        <h3>Аккаунт</h3>

        <p>
          Информация о твоём аккаунте и
          данные приложения.
        </p>
      </div>

      {/* PROFILE */}

      <section className="settings-section">
        <div className="settings-section__header">
          <div>
            <h4>Профиль</h4>

            <p>
              Основная информация об аккаунте.
            </p>
          </div>
        </div>

        <div className="settings-profile">
          <div className="settings-profile__avatar">
            {user.login
              .charAt(0)
              .toUpperCase()}
          </div>

          <div className="settings-profile__info">
            <strong>{user.login}</strong>

            <span>
              Аккаунт создан {createdDate}
            </span>
          </div>
        </div>
      </section>

      {/* STATISTICS */}

      <section className="settings-section">
        <div className="settings-section__header">
          <div>
            <h4>Статистика</h4>

            <p>
              Количество данных в твоём
              расписании.
            </p>
          </div>
        </div>

        <div className="settings-statistics">
          <div className="settings-stat">
            <strong>
              {statistics.tasks}
            </strong>

            <span>Задач</span>
          </div>

          <div className="settings-stat">
            <strong>
              {statistics.categories}
            </strong>

            <span>Категорий</span>
          </div>

          <div className="settings-stat">
            <strong>
              {statistics.instances}
            </strong>

            <span>Запланировано</span>
          </div>

          <div className="settings-stat">
            <strong>
              {statistics.completed}
            </strong>

            <span>Выполнено</span>
          </div>
        </div>
      </section>

      {/* LOGOUT */}

      <section className="settings-section settings-section--danger">
        <div className="settings-section__header">
          <div>
            <h4>Выход</h4>

            <p>
              Выйти из текущего аккаунта на
              этом устройстве.
            </p>
          </div>
        </div>

        <button
          type="button"
          className="settings-logout-button"
          onClick={onLogout}
        >
          Выйти из аккаунта
        </button>
      </section>
    </div>
  );
}