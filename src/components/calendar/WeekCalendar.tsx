import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import type {
  CSSProperties,
  TouchEvent,
  TouchList,
} from "react";

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

const MIN_CALENDAR_ZOOM = 0.75;
const MAX_CALENDAR_ZOOM = 2;

function getTouchDistance(
  touches: TouchList,
): number {
  const first = touches[0];
  const second = touches[1];

  if (!first || !second) {
    return 0;
  }

  const dx =
    second.clientX -
    first.clientX;

  const dy =
    second.clientY -
    first.clientY;

  return Math.sqrt(
    dx * dx +
    dy * dy,
  );
}

function clamp(
  value: number,
  min: number,
  max: number,
): number {
  return Math.min(
    Math.max(value, min),
    max,
  );
}

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
): string {
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
  /*
   * =========================================================
   * CALENDAR ZOOM
   * =========================================================
   */

  const [
    calendarZoom,
    setCalendarZoom,
  ] = useState(1);

  const pinchStartDistanceRef =
    useRef<number | null>(null);

  const pinchStartZoomRef =
    useRef(1);

  /*
   * =========================================================
   * SCROLL
   * =========================================================
   */

  const scrollRef =
    useRef<HTMLDivElement | null>(
      null,
    );

  /*
   * =========================================================
   * CLICK / DOUBLE CLICK
   * =========================================================
   */

  const clickTimerRef =
    useRef<
      ReturnType<
        typeof setTimeout
      > | null
    >(null);

  /*
   * После touch-double-tap браузер
   * может дополнительно отправить click.
   * Этот ref позволяет его поглотить.
   */

  const suppressNextClickRef =
    useRef(false);

  /*
   * =========================================================
   * MOBILE DOUBLE TAP
   * =========================================================
   */

  const lastTaskTouchRef =
    useRef<{
      taskId: string;
      instanceId: string;
      time: number;
      x: number;
      y: number;
    } | null>(null);

  /*
   * =========================================================
   * DAYS
   * =========================================================
   */

  const days = useMemo(
    () =>
      getWeekDays(
        week,
      ),
    [week],
  );

  /*
   * =========================================================
   * HOUR HEIGHT
   * =========================================================
   */

  const zoomedHourHeight =
    HOUR_HEIGHT *
    calendarZoom;

  /*
   * =========================================================
   * PINCH ZOOM
   * =========================================================
   */

  const handleTouchStart = (
    event: TouchEvent<HTMLDivElement>,
  ) => {
    if (
      event.touches.length !==
      2
    ) {
      return;
    }

    const distance =
      getTouchDistance(
        event.touches,
      );

    if (distance <= 0) {
      return;
    }

    pinchStartDistanceRef.current =
      distance;

    pinchStartZoomRef.current =
      calendarZoom;
  };

  const handleTouchMove = (
    event: TouchEvent<HTMLDivElement>,
  ) => {
    if (
      event.touches.length !==
        2 ||
      pinchStartDistanceRef.current ===
        null
    ) {
      return;
    }

    const currentDistance =
      getTouchDistance(
        event.touches,
      );

    if (
      currentDistance <= 0
    ) {
      return;
    }

    const scale =
      currentDistance /
      pinchStartDistanceRef.current;

    const nextZoom =
      clamp(
        pinchStartZoomRef.current *
          scale,
        MIN_CALENDAR_ZOOM,
        MAX_CALENDAR_ZOOM,
      );

    event.preventDefault();

    setCalendarZoom(
      nextZoom,
    );
  };

  const handleTouchEnd = (
    event: TouchEvent<HTMLDivElement>,
  ) => {
    if (
      event.touches.length ===
      2
    ) {
      return;
    }

    pinchStartDistanceRef.current =
      null;
  };

  /*
   * =========================================================
   * RESET SCROLL ON WEEK CHANGE
   * =========================================================
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
          zoomedHourHeight;
      },
    );
  }, [week]);

  /*
   * =========================================================
   * CLEANUP
   * =========================================================
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

  /*
   * =========================================================
   * HOURS
   * =========================================================
   */

  const hours =
    Array.from(
      {
        length: 25,
      },
      (_, index) =>
        index,
    );

  /*
   * =========================================================
   * CURRENT TIME
   * =========================================================
   */

  const now =
    new Date();

  const todayMinutes =
    now.getHours() *
      60 +
    now.getMinutes();

  /*
   * =========================================================
   * INSTANCES BY DATE
   * =========================================================
   */

  const instancesByDate =
    useMemo(() => {
      const map =
        new Map<
          string,
          TaskInstance[]
        >();

      for (
        const instance of
        taskInstances
      ) {
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
   * =========================================================
   * TASK MAP
   * =========================================================
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
     * После mobile double-tap
     * следующий synthetic click
     * ничего не должен делать.
     */

    if (
      suppressNextClickRef.current
    ) {
      suppressNextClickRef.current =
        false;

      return;
    }

    if (
      clickTimerRef.current
    ) {
      clearTimeout(
        clickTimerRef.current,
      );
    }

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
   * DESKTOP DOUBLE CLICK
   * =========================================================
   */

  const handleTaskDoubleClick = (
    taskId: string,
    instanceId: string,
  ) => {
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

  /*
   * =========================================================
   * MOBILE DOUBLE TAP
   * =========================================================
   */

  const handleTaskTouchEnd = (
    event: TouchEvent<HTMLButtonElement>,
    taskId: string,
    instanceId: string,
  ) => {
    if (
      event.changedTouches.length !==
      1
    ) {
      return;
    }

    const touch =
      event.changedTouches[0];

    if (!touch) {
      return;
    }

    const currentTime =
      Date.now();

    const previous =
      lastTaskTouchRef.current;

    const distance =
      previous
        ? Math.hypot(
            touch.clientX -
              previous.x,
            touch.clientY -
              previous.y,
          )
        : Infinity;

    const isDoubleTap =
      Boolean(
        previous &&
          previous.taskId ===
            taskId &&
          previous.instanceId ===
            instanceId &&
          currentTime -
            previous.time <=
            320 &&
          distance <= 36,
      );

    if (
      isDoubleTap
    ) {
      if (
        clickTimerRef.current
      ) {
        clearTimeout(
          clickTimerRef.current,
        );

        clickTimerRef.current =
          null;
      }

      suppressNextClickRef.current =
        true;

      lastTaskTouchRef.current =
        null;

      onEditTask(
        taskId,
        instanceId,
      );

      return;
    }

    lastTaskTouchRef.current =
      {
        taskId,
        instanceId,
        time: currentTime,
        x: touch.clientX,
        y: touch.clientY,
      };
  };

  /*
   * =========================================================
   * CALENDAR STYLE
   * =========================================================
   */

  const calendarStyle =
    {
      "--calendar-zoom":
        calendarZoom,
    } as CSSProperties;

  /*
   * =========================================================
   * RENDER
   * =========================================================
   */

  return (
    <div className="week-calendar">
      <div
        className="week-calendar__scroll"
        ref={scrollRef}
        style={calendarStyle}
        onTouchStart={
          handleTouchStart
        }
        onTouchMove={
          handleTouchMove
        }
        onTouchEnd={
          handleTouchEnd
        }
        onTouchCancel={
          handleTouchEnd
        }
      >
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
            CALENDAR GRID
            ===================================================== */}

        <div
          className="week-calendar__grid"
          style={{
            height:
              (DAY_END / 60) *
              zoomedHourHeight,
          }}
        >
          {/* ===================================================
              TIME COLUMN
              =================================================== */}

          <div className="week-calendar__time-column">
            {hours.map(
              (hour) => (
                <div
                  className="week-calendar__time-label"
                  style={{
                    height:
                      zoomedHourHeight,
                  }}
                  key={hour}
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

          {/* ===================================================
              DAYS
              =================================================== */}

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
                    {/* HOUR LINES */}

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
                                zoomedHourHeight,
                            }}
                            key={
                              hour
                            }
                          />
                        ),
                      )}

                    {/* TASKS */}

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
                          zoomedHourHeight;

                        const height =
                          Math.max(
                            ((end -
                              start) /
                              60) *
                              zoomedHourHeight,
                            42 *
                              calendarZoom,
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
                            onTouchEnd={(
                              event,
                            ) => {
                              event.stopPropagation();

                              handleTaskTouchEnd(
                                event,
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

            {/* CURRENT TIME LINE */}

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
                      zoomedHourHeight,
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