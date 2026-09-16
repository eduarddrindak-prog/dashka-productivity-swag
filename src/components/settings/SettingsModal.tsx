import { useMemo, useState } from "react";
import type { AppData, Category, Task, TaskInstance } from "../../data/types";
import "./SettingsModal.css";
import { SettingsData } from "./SettingsData";
import { SettingsAccount } from "./SettingsAccount";
import type { AuthUser } from "../../data/auth";

export type SettingsSection = "data" | "account";

interface SettingsModalProps {
    user: AuthUser;
  open: boolean;
  data: AppData;
  onClose: () => void;

  onCreateCategory: (name: string) => Category;
  onRenameCategory: (categoryId: string, name: string) => void;
  onDeleteCategory: (categoryId: string) => void;

  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onCreateTask: () => void;

  onLogout?: () => void;
}

export function SettingsModal({
  open,
  data,
  onClose,
  onCreateCategory,
  onRenameCategory,
  onDeleteCategory,
  onEditTask,
  onDeleteTask,
  onCreateTask,
  onLogout,
  user,
}: SettingsModalProps) {
  const [section, setSection] = useState<SettingsSection>("data");
  

  const taskInstances = data.taskInstances as TaskInstance[];

  const statistics = useMemo(() => {
    const completed = taskInstances.filter(
      (instance) => instance.status === "completed",
    ).length;

    return {
      categories: data.categories.length,
      tasks: data.tasks.length,
      instances: taskInstances.length,
      completed,
    };
  }, [data]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="settings-modal"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section
        className="settings-modal__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-modal-title"
      >
        <header className="settings-modal__header">
          <div>
            <span className="settings-modal__eyebrow">Dashka Productivity</span>
            <h2 id="settings-modal-title">Настройки</h2>
          </div>

          <button
            className="settings-modal__close"
            type="button"
            aria-label="Закрыть"
            onClick={onClose}
          >
            ×
          </button>
        </header>

        <div className="settings-modal__content">
          <nav className="settings-modal__nav">
            <button
              type="button"
              className={`settings-modal__nav-item ${
                section === "data"
                  ? "settings-modal__nav-item--active"
                  : ""
              }`}
              onClick={() => setSection("data")}
            >
              <span className="settings-modal__nav-icon">▦</span>

              <span className="settings-modal__nav-text">
                <strong>Данные и управление</strong>
                <small>Категории и задачи</small>
              </span>
            </button>

            <button
              type="button"
              className={`settings-modal__nav-item ${
                section === "account"
                  ? "settings-modal__nav-item--active"
                  : ""
              }`}
              onClick={() => setSection("account")}
            >
              <span className="settings-modal__nav-icon">○</span>

              <span className="settings-modal__nav-text">
                <strong>Аккаунт</strong>
                <small>Данные и выход</small>
              </span>
            </button>
          </nav>

          <main className="settings-modal__main">
            {section === "data" ? (
              <SettingsData
                data={data}
                onCreateCategory={onCreateCategory}
                onRenameCategory={onRenameCategory}
                onDeleteCategory={onDeleteCategory}
                onEditTask={onEditTask}
                onDeleteTask={onDeleteTask}
                onCreateTask={onCreateTask}
              />
            ) : (
              <SettingsAccount
  user={user}
  statistics={statistics}
  onLogout={onLogout}
/>
              
            )}
          </main>
        </div>
      </section>
    </div>
    
  );
  
}

