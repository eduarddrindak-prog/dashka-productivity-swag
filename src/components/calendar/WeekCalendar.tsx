import { useEffect, useMemo, useRef } from "react";

import {
  DAY_NAMES_LONG,
  DAY_NAMES_SHORT,
  getWeekDays,
  isToday,
} from "../../lib/dates";

import type {
  Task,
  TaskInstance,
} from "../../data/types";

import "./WeekCalendar.css";

interface WeekCalendarProps {
  week: Date;

  tasks: Task[];

  taskInstances: TaskInstance[];

  onCreateAtDate: (
    date: string,
  ) => void;

  onToggleTask: (
    instanceId: string,
  ) => void;

  onEditTask: (
    taskId: string,
    instanceId: string,
  ) => void;
}

const HOUR_HEIGHT = 68;

const DAY_END = 24 * 60;

function timeToMinutes(
  time: string,
): number {
  const [
    hours,
    minutes,
  ] = time
    .split(":")
    .map(Number);

  return (
    hours * 60 +
    minutes
  );
}

function formatTime(
  minutes: number,
): string {
  const hours =
    Math.floor(
      minutes / 60,
    );

  const mins =
    minutes % 60;

  return `${String(
    hours,
  ).padStart(
    2,
    "0",
  )}:${String(
    mins,
  ).padStart(
    2,
    "0",
  )}`;
}

function taskColorClass(
  color: Task["color"],
) {
  return `task-block--${color}`;
}

export function WeekCalendar({
  week,
  tasks,
  taskInstances,
  onCreateAtDate,
  onToggleTask,
  onEditTask,
}: WeekCalendarProps) {
  const scrollRef =
    useRef<HTMLDivElement>(
      null,
    );

  /*
   * Таймер используется для разделения
   * обычного клика и двойного клика.
   *
   * При двойном клике первый click
   * не успевает переключить статус.
   */

  const clickTimerRef =
    useRef<
      ReturnType<
        typeof setTimeout
      > | null
    >(null);

  const days = useMemo(
    () =>
      getWeekDays(
        week,
      ),
    [week],
  );

  /*
   * При смене недели
   * возвращаем календарь
   * примерно к 08:00.
   */

  useEffect(() => {
    const element =
      scrollRef.current;

    if (!element) {
      return;
    }

    requestAnimationFrame(
      () => {
        element.scrollTop =
          8 *
          HOUR_HEIGHT;
      },
    );
  }, [week]);

  /*
   * Очищаем таймер,
   * если компонент уничтожается.
   */

  useEffect(() => {
    return () => {
      if (
        clickTimerRef.current
      ) {
        clearTimeout(
          clickTimerRef.current,
        );
      }
    };
  }, []);

  const hours =
    Array.from(
      {
        length: 25,
      },
      (_, index) =>
        index,
    );

  const now =
    new Date();

  const todayMinutes =
    now.getHours() *
      60 +
    now.getMinutes();

  /*
   * Группируем экземпляры
   * по датам.
   */

  const instancesByDate =
    useMemo(() => {
      const map =
        new Map<
          string,
          TaskInstance[]
        >();

      for (const instance of taskInstances) {
        const current =
          map.get(
            instance.date,
          ) ?? [];

        current.push(
          instance,
        );

        map.set(
          instance.date,
          current,
        );
      }

      return map;
    }, [taskInstances]);

  /*
   * Быстрый поиск задачи
   * по taskId.
   */

  const taskMap =
    useMemo(
      () =>
        new Map(
          tasks.map(
            (task) => [
              task.id,
              task,
            ],
          ),
        ),
      [tasks],
    );

  /*
   * =========================================================
   * CLICK
   * =========================================================
   */

  const handleTaskClick = (
    instanceId: string,
  ) => {
    /*
     * Если предыдущий click
     * ещё ожидает проверки —
     * отменяем его.
     */

    if (
      clickTimerRef.current
    ) {
      clearTimeout(
        clickTimerRef.current,
      );
    }

    /*
     * Ждём немного.
     *
     * Если второго click нет —
     * это обычный click.
     *
     * Если будет double-click —
     * timer будет отменён.
     */

    clickTimerRef.current =
      setTimeout(() => {
        onToggleTask(
          instanceId,
        );

        clickTimerRef.current =
          null;
      }, 220);
  };

  /*
   * =========================================================
   * DOUBLE CLICK
   * =========================================================
   */

  const handleTaskDoubleClick =
    (
      taskId: string,
      instanceId: string,
    ) => {
      /*
       * Самое важное:
       *
       * отменяем ожидающий
       * одиночный click.
       *
       * Поэтому статус
       * НЕ переключится.
       */

      if (
        clickTimerRef.current
      ) {
        clearTimeout(
          clickTimerRef.current,
        );

        clickTimerRef.current =
          null;
      }

      onEditTask(
        taskId,
        instanceId,
      );
    };

  return (
    <div className="week-calendar">

      {/* =====================================================
          DAYS HEADER
          ===================================================== */}

      <div className="week-calendar__days">

        <div className="week-calendar__time-header" />

        {days.map(
          (
            day,
            index,
          ) => (
            <button
              type="button"
              className={`week-calendar__day-header ${
                isToday(
                  day.date,
                )
                  ? "week-calendar__day-header--today"
                  : ""
              }`}
              key={
                day.dateKey
              }
              onClick={() =>
                onCreateAtDate(
                  day.dateKey,
                )
              }
              title={`Создать задачу: ${DAY_NAMES_LONG[index]}`}
            >
              <span>
                {
                  DAY_NAMES_SHORT[
                    index
                  ]
                }
              </span>

              <strong>
                {
                  day.date.getDate()
                }
              </strong>
            </button>
          ),
        )}
      </div>

      {/* =====================================================
          SCROLL AREA
          ===================================================== */}

      <div
        className="week-calendar__scroll"
        ref={scrollRef}
      >
        <div
          className="week-calendar__grid"
          style={{
            height:
              (DAY_END /
                60) *
              HOUR_HEIGHT,
          }}
        >

          {/* =================================================
              TIME COLUMN
              ================================================= */}

          <div className="week-calendar__time-column">

            {hours.map(
              (hour) => (
                <div
                  className="week-calendar__time-label"
                  style={{
                    height:
                      HOUR_HEIGHT,
                  }}
                  key={
                    hour
                  }
                >
                  {String(
                    hour,
                  ).padStart(
                    2,
                    "0",
                  )}
                  :00
                </div>
              ),
            )}

          </div>

          {/* =================================================
              DAYS
              ================================================= */}

          <div className="week-calendar__columns">

            {days.map(
              (
                day,
                index,
              ) => {
                const instances =
                  instancesByDate.get(
                    day.dateKey,
                  ) ?? [];

                const today =
                  isToday(
                    day.date,
                  );

                return (
                  <div
                    className={`week-calendar__day-column ${
                      today
                        ? "week-calendar__day-column--today"
                        : ""
                    }`}
                    key={
                      day.dateKey
                    }
                    role="button"
                    tabIndex={0}
                    onClick={(
                      event,
                    ) => {
                      if (
                        event.target ===
                        event.currentTarget
                      ) {
                        onCreateAtDate(
                          day.dateKey,
                        );
                      }
                    }}
                    onKeyDown={(
                      event,
                    ) => {
                      if (
                        event.key ===
                          "Enter" ||
                        event.key ===
                          " "
                      ) {
                        onCreateAtDate(
                          day.dateKey,
                        );
                      }
                    }}
                    aria-label={`Добавить задачу на ${DAY_NAMES_LONG[index]}`}
                  >

                    {/* Часовые линии */}

                    {hours
                      .slice(
                        0,
                        24,
                      )
                      .map(
                        (
                          hour,
                        ) => (
                          <span
                            className="week-calendar__hour-line"
                            style={{
                              height:
                                HOUR_HEIGHT,
                            }}
                            key={
                              hour
                            }
                          />
                        ),
                      )}

                    {/* =================================================
                        TASKS
                        ================================================= */}

                    {instances.map(
                      (
                        instance,
                      ) => {
                        const task =
                          taskMap.get(
                            instance.taskId,
                          );

                        if (
                          !task
                        ) {
                          return null;
                        }

                        const start =
                          timeToMinutes(
                            instance.startTime,
                          );

                        const end =
                          timeToMinutes(
                            instance.endTime,
                          );

                        const top =
                          (start /
                            60) *
                          HOUR_HEIGHT;

                        const height =
                          Math.max(
                            ((end -
                              start) /
                              60) *
                              HOUR_HEIGHT,
                            42,
                          );

                        return (
                          <button
                            type="button"
                            className={`task-block ${taskColorClass(
                              task.color,
                            )} ${
                              instance.status ===
                              "completed"
                                ? "task-block--completed"
                                : ""
                            }`}
                            style={{
                              top,
                              height,
                            }}
                            key={
                              instance.id
                            }
                            onClick={(
                              event,
                            ) => {
                              event.stopPropagation();

                              handleTaskClick(
                                instance.id,
                              );
                            }}
                            onDoubleClick={(
                              event,
                            ) => {
                              event.stopPropagation();

                              handleTaskDoubleClick(
                                task.id,
                                instance.id,
                              );
                            }}
                            title="Клик — выполнить. Двойной клик — редактировать."
                          >

                            <span className="task-block__status" />

                            <span className="task-block__time">
                              {formatTime(
                                start,
                              )}
                              –
                              {formatTime(
                                end,
                              )}
                            </span>

                            <strong className="task-block__name">
                              {
                                task.name
                              }
                            </strong>

                            {task.description && (
                              <span className="task-block__description">
                                {
                                  task.description
                                }
                              </span>
                            )}

                          </button>
                        );
                      },
                    )}

                  </div>
                );
              },
            )}

            {/* =================================================
                CURRENT TIME LINE
                ================================================= */}

            {(() => {
              const currentDayIndex =
                days.findIndex(
                  (
                    day,
                  ) =>
                    isToday(
                      day.date,
                    ),
                );

              if (
                currentDayIndex ===
                -1
              ) {
                return null;
              }

              return (
                <div
                  className="week-calendar__now-line"
                  style={{
                    top:
                      (todayMinutes /
                        60) *
                      HOUR_HEIGHT,
                  }}
                  aria-hidden="true"
                />
              );
            })()}

          </div>
        </div>
      </div>
    </div>
  );
}