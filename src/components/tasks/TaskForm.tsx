import { useMemo, useState } from "react";

import type {
  Category,
  Task,
  TaskColor,
  TaskInstance,
  TaskType,
  WeeklyRecurrence,
} from "../../data/types";

import {
  TASK_COLORS,
  isValidTimeRange,
} from "../../lib/tasks";

import "./TaskForm.css";

export interface TaskFormValue {
  name: string;
  description: string;

  categoryId: string;
  color: TaskColor;

  type: TaskType;

  date: string;
  startTime: string;
  endTime: string;

  recurrence?: WeeklyRecurrence;
}

interface TaskFormProps {
  categories: Category[];
  existingTasks: Task[];

  initialDate: string;

  initialStartTime?: string;
  initialEndTime?: string;

  initialTask?: Task;
  initialInstance?: TaskInstance;

  isEditing?: boolean;

  onSubmit: (value: TaskFormValue) => void;

  onCreateCategory: (name: string) => Category;

  onDelete?: () => void;

  onCancel: () => void;
}

const DEFAULT_COLOR: TaskColor = "green";

const WEEK_DAYS = [
  "Пн",
  "Вт",
  "Ср",
  "Чт",
  "Пт",
  "Сб",
  "Вс",
];

function dayIndexFromDate(date: string): number {
  const parsed = new Date(`${date}T12:00:00`);
  const day = parsed.getDay();

  return day === 0 ? 6 : day - 1;
}

export function TaskForm({
  categories,
  existingTasks,

  initialDate,

  initialStartTime = "09:00",
  initialEndTime = "10:00",

  initialTask,
  initialInstance,

  isEditing = false,

  onSubmit,
  onCreateCategory,
  onDelete,
  onCancel,
}: TaskFormProps) {
  /*
   * =========================================================
   * ОСНОВНЫЕ ПОЛЯ
   * =========================================================
   */

  const [name, setName] = useState(
  initialTask?.name ?? "",
);

  const [description, setDescription] =
    useState(
      initialTask?.description ?? "",
    );

  const [categoryId, setCategoryId] =
    useState(
      initialTask?.categoryId ??
        categories[0]?.id ??
        "",
    );

  const [color, setColor] =
    useState<TaskColor>(
      initialTask?.color ??
        DEFAULT_COLOR,
    );

  const [type, setType] =
    useState<TaskType>(
      initialTask?.type ??
        "single",
    );

  /*
   * =========================================================
   * ДАТА / ВРЕМЯ
   * =========================================================
   */

  const [date, setDate] =
    useState(
      initialInstance?.date ??
        initialDate,
    );

  const [startTime, setStartTime] =
    useState(
      initialInstance?.startTime ??
        initialStartTime,
    );

  const [endTime, setEndTime] =
    useState(
      initialInstance?.endTime ??
        initialEndTime,
    );

  /*
   * =========================================================
   * ШАБЛОН — СУЩЕСТВУЮЩАЯ ЗАДАЧА
   * =========================================================
   *
   * Это НЕ существующая задача,
   * которую мы будем использовать.
   *
   * Это только источник данных,
   * на основе которого создаётся новая.
   */

  const [templateTaskId, setTemplateTaskId] =
    useState("");

  const selectedTemplateTask =
    useMemo(
      () =>
        existingTasks.find(
          (task) =>
            task.id ===
            templateTaskId,
        ),
      [
        existingTasks,
        templateTaskId,
      ],
    );

  /*
   * =========================================================
   * RECURRING
   * =========================================================
   */

  const initialDay =
    dayIndexFromDate(
      initialInstance?.date ??
        initialDate,
    );

  const [recurrenceDays, setRecurrenceDays] =
    useState<number[]>(
      initialTask?.recurrence?.days ??
        [initialDay],
    );

  const [recurrenceTimes, setRecurrenceTimes] =
    useState<
      Record<
        string,
        {
          startTime: string;
          endTime: string;
        }
      >
    >(
      initialTask?.recurrence?.times ??
        {
          [String(initialDay)]: {
            startTime:
              initialInstance?.startTime ??
              initialStartTime,

            endTime:
              initialInstance?.endTime ??
              initialEndTime,
          },
        },
    );

  /*
   * =========================================================
   * CATEGORY
   * =========================================================
   */

  const [newCategoryName, setNewCategoryName] =
    useState("");

  const [error, setError] =
    useState("");

  /*
   * =========================================================
   * ЗАГРУЗКА ШАБЛОНА
   * =========================================================
   */

  const handleTemplateChange = (
    taskId: string,
  ) => {
    setTemplateTaskId(taskId);
    setError("");

    if (!taskId) {
      return;
    }

    const task =
      existingTasks.find(
        (item) =>
          item.id === taskId,
      );

    if (!task) {
      return;
    }

    /*
     * ВАЖНО:
     *
     * name специально НЕ трогаем.
     *
     * Пользователь должен придумать
     * новое название.
     */

    setDescription(
      task.description,
    );

    setCategoryId(
      task.categoryId,
    );

    setColor(
      task.color,
    );

    setType(
      task.type,
    );

    /*
     * Если задача recurring —
     * копируем все дни и времена.
     */

    if (task.recurrence) {
      setRecurrenceDays(
        [...task.recurrence.days],
      );

      setRecurrenceTimes(
        {
          ...task.recurrence.times,
        },
      );
    }
  };

  /*
   * =========================================================
   * DAYS
   * =========================================================
   */

  const toggleDay = (
    day: number,
  ) => {
    setRecurrenceDays(
      (current) => {
        if (
          current.includes(day)
        ) {
          const next =
            current.filter(
              (item) =>
                item !== day,
            );

          if (
            next.length === 0
          ) {
            return current;
          }

          return next;
        }

        return [
          ...current,
          day,
        ].sort(
          (a, b) => a - b,
        );
      },
    );

    setRecurrenceTimes(
      (current) => {
        if (
          current[String(day)]
        ) {
          return current;
        }

        return {
          ...current,

          [String(day)]: {
            startTime,
            endTime,
          },
        };
      },
    );
  };

  /*
   * =========================================================
   * RECURRENCE TIME
   * =========================================================
   */

  const updateRecurrenceTime = (
    day: number,
    field:
      | "startTime"
      | "endTime",
    value: string,
  ) => {
    setRecurrenceTimes(
      (current) => ({
        ...current,

        [String(day)]: {
          ...(current[
            String(day)
          ] ?? {
            startTime,
            endTime,
          }),

          [field]: value,
        },
      }),
    );
  };

  /*
   * =========================================================
   * CATEGORY
   * =========================================================
   */

  const handleCreateCategory =
    () => {
      const categoryName =
        newCategoryName.trim();

      if (!categoryName) {
        return;
      }

      const category =
        onCreateCategory(
          categoryName,
        );

      setCategoryId(
        category.id,
      );

      setNewCategoryName("");
    };

  /*
   * =========================================================
   * SUBMIT
   * =========================================================
   */

  const handleSubmit = () => {
    setError("");

    /*
     * Название обязательно.
     *
     * Даже если использовали шаблон.
     */

    if (!name.trim()) {
      setError(
        "Введите название новой задачи.",
      );

      return;
    }

    if (!categoryId) {
      setError(
        "Выберите категорию.",
      );

      return;
    }

    /*
     * SINGLE
     */

    if (
      type === "single" &&
      !isValidTimeRange(
        startTime,
        endTime,
      )
    ) {
      setError(
        "Время окончания должно быть позже времени начала.",
      );

      return;
    }

    /*
     * RECURRING
     */

    if (
      type === "recurring"
    ) {
      if (
        recurrenceDays.length ===
        0
      ) {
        setError(
          "Выберите хотя бы один день.",
        );

        return;
      }

      const invalidDay =
        recurrenceDays.find(
          (day) => {
            const time =
              recurrenceTimes[
                String(day)
              ];

            return (
              !time ||
              !isValidTimeRange(
                time.startTime,
                time.endTime,
              )
            );
          },
        );

      if (
        invalidDay !==
        undefined
      ) {
        setError(
          `Проверьте время для дня «${WEEK_DAYS[invalidDay]}».`,
        );

        return;
      }
    }

    const recurrence =
      type === "recurring"
        ? {
            days:
              [...recurrenceDays],

            times:
              {
                ...recurrenceTimes,
              },
          }
        : undefined;

    /*
     * Здесь НЕТ existingTaskId.
     *
     * Мы всегда создаём новую задачу.
     */

    onSubmit({
      name: name.trim(),

      description:
        description.trim(),

      categoryId,

      color,

      type,

      date,

      startTime,

      endTime,

      recurrence,
    });
  };

  /*
   * =========================================================
   * RENDER
   * =========================================================
   */

  return (
    <div className="task-form">

      {/*
       * =====================================================
       * ШАБЛОН
       * =====================================================
       *
       * Только при создании.
       *
       * При редактировании существующей задачи
       * это меню не показываем.
       */}

      {!isEditing && (
        <label className="task-form__field task-form__template">
          <span>
            Создать на основе
            <em>
              необязательно
            </em>
          </span>

          <select
            value={
              templateTaskId
            }
            onChange={(event) =>
              handleTemplateChange(
                event.target.value,
              )
            }
          >
            <option value="">
              Без шаблона — новая задача
            </option>

            {existingTasks.map(
              (task) => (
                <option
                  key={task.id}
                  value={task.id}
                >
                  {task.name}
                </option>
              ),
            )}
          </select>

          {selectedTemplateTask && (
            <small className="task-form__template-hint">
              Данные задачи загружены.
              Название нужно ввести
              заново.
            </small>
          )}
        </label>
      )}

      {/*
       * =====================================================
       * NAME
       * =====================================================
       */}

      <label className="task-form__field">
        <span>
          Название
        </span>

        <input
          value={name}
          onChange={(event) =>
            setName(
              event.target.value,
            )
          }
          placeholder="Например: Математика"
          autoFocus
        />
      </label>

      {/*
       * =====================================================
       * DESCRIPTION
       * =====================================================
       */}

      <label className="task-form__field">
        <span>
          Описание{" "}
          <em>
            необязательно
          </em>
        </span>

        <textarea
          value={description}
          onChange={(event) =>
            setDescription(
              event.target.value,
            )
          }
          placeholder="Добавьте описание задачи..."
          rows={3}
        />
      </label>

      {/*
       * =====================================================
       * CATEGORY
       * =====================================================
       */}

      <div className="task-form__row">

        <label className="task-form__field">
          <span>
            Категория
          </span>

          <select
            value={categoryId}
            onChange={(event) =>
              setCategoryId(
                event.target.value,
              )
            }
          >
            <option value="">
              Выберите категорию
            </option>

            {categories.map(
              (category) => (
                <option
                  value={
                    category.id
                  }
                  key={
                    category.id
                  }
                >
                  {
                    category.name
                  }
                </option>
              ),
            )}
          </select>
        </label>

        <div className="task-form__category-create">
          <span>
            Новая категория
          </span>

          <div>
            <input
              value={
                newCategoryName
              }
              onChange={(event) =>
                setNewCategoryName(
                  event.target.value,
                )
              }
              placeholder="Название"
              onKeyDown={(event) => {
                if (
                  event.key ===
                  "Enter"
                ) {
                  event.preventDefault();

                  handleCreateCategory();
                }
              }}
            />

            <button
              type="button"
              onClick={
                handleCreateCategory
              }
              disabled={
                !newCategoryName.trim()
              }
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/*
       * =====================================================
       * COLOR
       * =====================================================
       */}

      <fieldset className="task-form__field task-form__colors">
        <legend>
          Цвет
        </legend>

        <div className="task-color-picker">
          {TASK_COLORS.map(
            (taskColor) => (
              <button
                type="button"
                key={
                  taskColor
                }
                className={`task-color-dot task-color-dot--${taskColor} ${
                  color ===
                  taskColor
                    ? "is-selected"
                    : ""
                }`}
                aria-label={`Цвет ${taskColor}`}
                onClick={() =>
                  setColor(
                    taskColor,
                  )
                }
              />
            ),
          )}
        </div>
      </fieldset>

      {/*
       * =====================================================
       * TYPE
       * =====================================================
       */}

      {!isEditing && (
        <fieldset className="task-form__field">
          <legend>
            Тип задачи
          </legend>

          <div className="task-type-picker">

            <label>
              <input
                type="radio"
                checked={
                  type ===
                  "single"
                }
                onChange={() =>
                  setType(
                    "single",
                  )
                }
              />

              <span>
                Одноразовая
              </span>
            </label>

            <label>
              <input
                type="radio"
                checked={
                  type ===
                  "recurring"
                }
                onChange={() =>
                  setType(
                    "recurring",
                  )
                }
              />

              <span>
                Повторяющаяся
              </span>
            </label>

          </div>
        </fieldset>
      )}

      {/*
       * =====================================================
       * SINGLE
       * =====================================================
       */}

      {type === "single" ? (
        <>
          <label className="task-form__field">
            <span>
              Дата
            </span>

            <input
              type="date"
              value={date}
              onChange={(event) =>
                setDate(
                  event.target.value,
                )
              }
            />
          </label>

          <div className="task-form__row">

            <label className="task-form__field">
              <span>
                Начало
              </span>

              <input
                type="time"
                step={60}
                value={startTime}
                onChange={(event) =>
                  setStartTime(
                    event.target
                      .value,
                  )
                }
              />
            </label>

            <label className="task-form__field">
              <span>
                Окончание
              </span>

              <input
                type="time"
                step={60}
                value={endTime}
                onChange={(event) =>
                  setEndTime(
                    event.target
                      .value,
                  )
                }
              />
            </label>

          </div>
        </>
      ) : (
        /*
         * ===================================================
         * RECURRING
         * ===================================================
         */

        <fieldset className="task-form__recurrence">
          <legend>
            Дни и время
          </legend>

          <div className="task-form__days">
            {WEEK_DAYS.map(
              (
                day,
                index,
              ) => (
                <button
                  type="button"
                  key={day}
                  className={
                    recurrenceDays.includes(
                      index,
                    )
                      ? "is-selected"
                      : ""
                  }
                  onClick={() =>
                    toggleDay(
                      index,
                    )
                  }
                >
                  {day}
                </button>
              ),
            )}
          </div>

          <div className="task-form__recurrence-list">
            {recurrenceDays.map(
              (day) => {
                const time =
                  recurrenceTimes[
                    String(day)
                  ] ?? {
                    startTime:
                      "09:00",
                    endTime:
                      "10:00",
                  };

                return (
                  <div
                    className="task-form__recurrence-row"
                    key={
                      day
                    }
                  >
                    <strong>
                      {
                        WEEK_DAYS[
                          day
                        ]
                      }
                    </strong>

                    <input
                      type="time"
                      step={60}
                      value={
                        time.startTime
                      }
                      onChange={(
                        event,
                      ) =>
                        updateRecurrenceTime(
                          day,
                          "startTime",
                          event
                            .target
                            .value,
                        )
                      }
                    />

                    <span>
                      —
                    </span>

                    <input
                      type="time"
                      step={60}
                      value={
                        time.endTime
                      }
                      onChange={(
                        event,
                      ) =>
                        updateRecurrenceTime(
                          day,
                          "endTime",
                          event
                            .target
                            .value,
                        )
                      }
                    />
                  </div>
                );
              },
            )}
          </div>
        </fieldset>
      )}

      {/*
       * =====================================================
       * ERROR
       * =====================================================
       */}

      {error && (
        <p className="task-form__error">
          {error}
        </p>
      )}

      {/*
       * =====================================================
       * ACTIONS
       * =====================================================
       */}

      <div className="task-form__actions">

        {isEditing &&
        onDelete ? (
          <button
            type="button"
            className="task-form__delete"
            onClick={
              onDelete
            }
          >
            Удалить
          </button>
        ) : (
          <span />
        )}

        <div className="task-form__actions-right">

          <button
            type="button"
            className="task-form__cancel"
            onClick={
              onCancel
            }
          >
            Отмена
          </button>

          <button
            type="button"
            className="task-form__submit"
            onClick={
              handleSubmit
            }
          >
            {isEditing
              ? "Сохранить"
              : "Создать"}
          </button>

        </div>
      </div>
    </div>
  );
}