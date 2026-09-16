import { useState } from "react";
import type { AppData, Category, Task } from "../../data/types";

interface SettingsDataProps {
  data: AppData;

  onCreateCategory: (name: string) => Category;
  onRenameCategory: (categoryId: string, name: string) => void;
  onDeleteCategory: (categoryId: string) => void;

  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onCreateTask: () => void;
}

export function SettingsData({
  data,
  onCreateCategory,
  onRenameCategory,
  onDeleteCategory,
  onEditTask,
  onDeleteTask,
  onCreateTask,
}: SettingsDataProps) {
  const [newCategoryName, setNewCategoryName] = useState("");
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(
    null,
  );
  const [editingCategoryName, setEditingCategoryName] = useState("");

  const getCategoryName = (categoryId: string) => {
    return (
      data.categories.find((category) => category.id === categoryId)?.name ??
      "Без категории"
    );
  };

  const handleCreateCategory = () => {
    const name = newCategoryName.trim();

    if (!name) {
      return;
    }

    onCreateCategory(name);
    setNewCategoryName("");
  };

  const startRename = (category: Category) => {
    setEditingCategoryId(category.id);
    setEditingCategoryName(category.name);
  };

  const saveRename = () => {
    if (!editingCategoryId) {
      return;
    }

    const name = editingCategoryName.trim();

    if (!name) {
      return;
    }

    onRenameCategory(editingCategoryId, name);

    setEditingCategoryId(null);
    setEditingCategoryName("");
  };

  const handleDeleteCategory = (category: Category) => {
    const tasksInCategory = data.tasks.filter(
      (task) => task.categoryId === category.id,
    ).length;

    const message =
      tasksInCategory > 0
        ? `В категории «${category.name}» находится ${tasksInCategory} задач. Удалить категорию? Задачи останутся, но будут без категории.`
        : `Удалить категорию «${category.name}»?`;

    if (!window.confirm(message)) {
      return;
    }

    onDeleteCategory(category.id);
  };

  const handleDeleteTask = (task: Task) => {
    if (
      !window.confirm(
        `Удалить задачу «${task.name}»? Все её запланированные экземпляры тоже будут удалены.`,
      )
    ) {
      return;
    }

    onDeleteTask(task.id);
  };

  return (
    <div className="settings-data">
      <div className="settings-page-title">
        <h3>Данные и управление</h3>
        <p>
          Здесь можно управлять категориями и всеми задачами приложения.
        </p>
      </div>

      <section className="settings-section">
        <div className="settings-section__header">
          <div>
            <h4>Категории</h4>
            <p>Создавай и редактируй категории для задач.</p>
          </div>

          <span className="settings-section__count">
            {data.categories.length}
          </span>
        </div>

        <div className="settings-create-row">
          <input
            type="text"
            value={newCategoryName}
            placeholder="Название новой категории"
            maxLength={40}
            onChange={(event) => setNewCategoryName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                handleCreateCategory();
              }
            }}
          />

          <button
            type="button"
            className="settings-button settings-button--accent"
            onClick={handleCreateCategory}
          >
            Создать
          </button>
        </div>

        <div className="settings-list">
          {data.categories.length === 0 ? (
            <div className="settings-empty">
              <span>Нет категорий</span>
              <small>Создай первую категорию выше.</small>
            </div>
          ) : (
            data.categories.map((category) => (
              <div className="settings-list-item" key={category.id}>
                {editingCategoryId === category.id ? (
                  <div className="settings-edit-row">
                    <input
                      autoFocus
                      type="text"
                      value={editingCategoryName}
                      maxLength={40}
                      onChange={(event) =>
                        setEditingCategoryName(event.target.value)
                      }
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          saveRename();
                        }

                        if (event.key === "Escape") {
                          setEditingCategoryId(null);
                        }
                      }}
                    />

                    <button
                      type="button"
                      className="settings-button settings-button--small settings-button--accent"
                      onClick={saveRename}
                    >
                      Сохранить
                    </button>

                    <button
                      type="button"
                      className="settings-button settings-button--small"
                      onClick={() => setEditingCategoryId(null)}
                    >
                      Отмена
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="settings-list-item__info">
                      <span className="settings-category-dot" />
                      <span>{category.name}</span>
                    </div>

                    <div className="settings-list-item__actions">
                      <button
                        type="button"
                        className="settings-icon-button"
                        title="Переименовать"
                        onClick={() => startRename(category)}
                      >
                        ✎
                      </button>

                      <button
                        type="button"
                        className="settings-icon-button settings-icon-button--danger"
                        title="Удалить"
                        onClick={() => handleDeleteCategory(category)}
                      >
                        ×
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </section>

      <section className="settings-section">
        <div className="settings-section__header">
          <div>
            <h4>Задачи</h4>
            <p>Все созданные задачи и их категории.</p>
          </div>

          <div className="settings-section__right">
            <span className="settings-section__count">
              {data.tasks.length}
            </span>

            <button
              type="button"
              className="settings-button settings-button--accent"
              onClick={onCreateTask}
            >
              + Новая задача
            </button>
          </div>
        </div>

        <div className="settings-list settings-list--tasks">
          {data.tasks.length === 0 ? (
            <div className="settings-empty">
              <span>Нет задач</span>
              <small>Создай первую задачу.</small>
            </div>
          ) : (
            data.tasks.map((task) => (
              <div className="settings-list-item settings-task-item" key={task.id}>
                <div className="settings-task-item__main">
                  <span
                    className={`settings-task-color settings-task-color--${task.color}`}
                  />

                  <div className="settings-task-item__info">
                    <strong>{task.name || "Без названия"}</strong>

                    <span>
                      {getCategoryName(task.categoryId)}
                      {" · "}
                      {task.type === "recurring"
                        ? "Повторяющаяся"
                        : "Одиночная"}
                    </span>
                  </div>
                </div>

                <div className="settings-list-item__actions">
                  <button
                    type="button"
                    className="settings-icon-button"
                    title="Редактировать"
                    onClick={() => onEditTask(task)}
                  >
                    ✎
                  </button>

                  <button
                    type="button"
                    className="settings-icon-button settings-icon-button--danger"
                    title="Удалить"
                    onClick={() => handleDeleteTask(task)}
                  >
                    ×
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}