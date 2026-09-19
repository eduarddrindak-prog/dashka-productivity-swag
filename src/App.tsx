import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
  Settings,
} from "lucide-react";

import { AdminPanel } from "./components/admin/AdminPanel";

import { Button, IconButton } from "./components/ui";
import { WeekCalendar } from "./components/calendar/WeekCalendar";
import { TaskModal } from "./components/tasks/TaskModal";
import { WeekPicker } from "./components/week-picker/WeekPicker";
import { SettingsModal } from "./components/settings/SettingsModal";

import type {
  AppData,
  Category,
  Task,
  TaskInstance,
} from "./data/types";

import {
  loadAppData,
  loadRemoteAppData,
  saveAppData,
} from "./data/storage";

import {
  createId,
  createTask,
  createTaskInstance,
  ensureRecurringInstances,
  getInstancesForWeek,
} from "./lib/tasks";

import {
  formatDateKey,
  formatWeekRange,
  startOfWeek,
} from "./lib/dates";

import type { TaskFormValue } from "./components/tasks/TaskForm";

import "./styles/app.css";

import { AuthScreen } from "./components/auth/AuthScreen";
import {
  getCurrentUser,
  logoutUser,
} from "./data/auth";

interface ModalState {
  open: boolean;
  date: string;
  task?: Task;
  instance?: TaskInstance;
  initialStartTime?: string;
  initialEndTime?: string;
}

function App() {
  const [currentUser, setCurrentUser] = useState<
  Awaited<ReturnType<typeof getCurrentUser>> | null
>(null);

const [authLoading, setAuthLoading] = useState(true);

useEffect(() => {
  let cancelled = false;

  const checkAuth = async () => {
    const user = await getCurrentUser();

    if (cancelled) {
      return;
    }

    setCurrentUser(user);
    setAuthLoading(false);
  };

  checkAuth();

  return () => {
    cancelled = true;
  };
}, []);

  const [selectedWeek, setSelectedWeek] = useState(() =>
    startOfWeek(new Date()),
  );

  const [data, setData] = useState<AppData>({
    categories: [],
    tasks: [],
    taskInstances: [],
  });

  const [weekPickerOpen, setWeekPickerOpen] =
    useState(false);

  const [settingsOpen, setSettingsOpen] =
    useState(false);

  const [adminOpen, setAdminOpen] =
  useState(false);

  const [modal, setModal] = useState<ModalState>({
    open: false,
    date: formatDateKey(new Date()),
  });

  /*
   * Когда меняется пользователь,
   * загружаем его собственные данные.
   */

  useEffect(() => {
    if (!currentUser) {
      setData({
        categories: [],
        tasks: [],
        taskInstances: [],
      });
      return;
    }

    const userId = currentUser.id;
let cancelled = false;

const loadLocal = async () => {
  const localData = await loadAppData(userId);

  if (!cancelled) {
    setData(localData);
  }
};

void loadLocal();

const loadRemote = async () => {
  const remoteData = await loadRemoteAppData(userId);

  if (!cancelled && remoteData) {
    setData(remoteData);
  }
};

    void loadRemote();

    return () => {
      cancelled = true;
    };
  }, [currentUser?.id]);

  const persistData = (next: AppData) => {
    if (!currentUser) {
      return;
    }

    void saveAppData(next, currentUser.id);
  };

  const weekData = useMemo(() => {
    return ensureRecurringInstances(
      data,
      selectedWeek,
    );
  }, [data, selectedWeek]);

  useEffect(() => {
    if (
      weekData.taskInstances.length !==
      data.taskInstances.length
    ) {
      setData(weekData);
      persistData(weekData);
    }
  }, [
    weekData,
    data.taskInstances.length,
  ]);

  const weekLabel = useMemo(
    () => formatWeekRange(selectedWeek),
    [selectedWeek],
  );

  const weekInstances = useMemo(
    () =>
      getInstancesForWeek(
        weekData,
        selectedWeek,
      ),
    [weekData, selectedWeek],
  );

  const changeWeek = (amount: number) => {
    setSelectedWeek((current) => {
      const next = new Date(current);
      next.setDate(next.getDate() + amount * 7);
      return next;
    });
  };

  const goToCurrentWeek = () => {
    setSelectedWeek(startOfWeek(new Date()));
  };

  /*
   * ============================================================
   * TASK MODAL
   * ============================================================
   */

  const openCreateModal = (
    date = formatDateKey(new Date()),
    startTime = "09:00",
    endTime = "10:00",
  ) => {
    setModal({
      open: true,
      date,
      initialStartTime: startTime,
      initialEndTime: endTime,
    });
  };

  const openEditModal = (taskId: string, instanceId: string) => {
    const task = data.tasks.find((item) => item.id === taskId);

    const instance = data.taskInstances.find(
      (item) => item.id === instanceId,
    );

    if (!task || !instance) {
      return;
    }

    setModal({
      open: true,
      date: instance.date,
      task,
      instance,
      initialStartTime: instance.startTime,
      initialEndTime: instance.endTime,
    });
  };

  const closeModal = () => {
    setModal((current) => ({
      ...current,
      open: false,
    }));
  };

  /*
   * ============================================================
   * CATEGORIES
   * ============================================================
   */

  const createCategory = (name: string): Category => {
    const category: Category = {
      id: createId("category"),
      name: name.trim(),
      createdAt: new Date().toISOString(),
    };

    setData((current) => {
      const next: AppData = {
        ...current,
        categories: [...current.categories, category],
      };

      persistData(next);

      return next;
    });

    return category;
  };

  const renameCategory = (categoryId: string, name: string) => {
    setData((current) => {
      const next: AppData = {
        ...current,
        categories: current.categories.map((category) =>
          category.id === categoryId
            ? {
                ...category,
                name: name.trim(),
              }
            : category,
        ),
      };

      persistData(next);

      return next;
    });
  };

  const deleteCategory = (categoryId: string) => {
    setData((current) => {
      const next: AppData = {
        ...current,

        categories: current.categories.filter(
          (category) => category.id !== categoryId,
        ),

        tasks: current.tasks.map((task) =>
          task.categoryId === categoryId
            ? {
                ...task,
                categoryId: "",
              }
            : task,
        ),
      };

      persistData(next);

      return next;
    });
  };

  /*
   * ============================================================
   * CREATE / EDIT TASK
   * ============================================================
   */

  const handleTaskSubmit = (value: TaskFormValue) => {
    setData((current) => {
      let next: AppData = {
        categories: [...current.categories],
        tasks: [...current.tasks],
        taskInstances: [...current.taskInstances],
      };

      /*
       * --------------------------------------------------------
       * РЕДАКТИРОВАНИЕ СУЩЕСТВУЮЩЕЙ ЗАДАЧИ
       * --------------------------------------------------------
       */

      if (modal.task && modal.instance) {
        const taskIndex = next.tasks.findIndex(
          (task) => task.id === modal.task?.id,
        );

        const instanceIndex = next.taskInstances.findIndex(
          (instance) => instance.id === modal.instance?.id,
        );

        /*
         * Обновляем саму задачу.
         */

        if (taskIndex !== -1) {
          next.tasks[taskIndex] = {
            ...next.tasks[taskIndex],

            name: value.name.trim(),

            description: value.description.trim(),

            categoryId: value.categoryId,

            color: value.color,

            type: value.type,

            recurrence: value.recurrence,

            updatedAt: new Date().toISOString(),
          };
        }

        /*
         * Обновляем конкретное вхождение
         * задачи в календаре.
         */

        if (instanceIndex !== -1) {
          next.taskInstances[instanceIndex] = {
            ...next.taskInstances[instanceIndex],

            date: value.date,

            startTime: value.startTime,

            endTime: value.endTime,

            updatedAt: new Date().toISOString(),
          };
        }

        /*
         * Если редактируем повторяющуюся задачу,
         * убеждаемся, что её экземпляры существуют
         * для выбранной недели.
         */

        if (
          value.type === "recurring" &&
          value.recurrence
        ) {
          next = ensureRecurringInstances(
            next,
            selectedWeek,
          );
        }
      }

      /*
       * --------------------------------------------------------
       * СОЗДАНИЕ НОВОЙ ЗАДАЧИ
       * --------------------------------------------------------
       *
       * Даже если задача была создана "на основе"
       * существующей, здесь создаётся новый Task
       * с новым ID.
       */

      else {
        const task = createTask(
          value.name,
          value.description,
          value.categoryId,
          value.color,
          value.type,
          value.recurrence,
        );

        next.tasks.push(task);

        /*
         * Одноразовая задача.
         */

        if (task.type === "single") {
          next.taskInstances.push(
            createTaskInstance(
              task.id,
              value.date,
              value.startTime,
              value.endTime,
            ),
          );
        }

        /*
         * Повторяющаяся задача.
         */

        else if (task.recurrence) {
          next = ensureRecurringInstances(
            next,
            selectedWeek,
          );
        }
      }

      persistData(next);

      return next;
    });

    closeModal();
  };

  /*
   * ============================================================
   * TOGGLE TASK
   * ============================================================
   */

  const toggleTask = (instanceId: string) => {
    setData((current) => {
      const next: AppData = {
        ...current,

        taskInstances: current.taskInstances.map(
          (instance) =>
            instance.id === instanceId
              ? {
                  ...instance,

                  status:
                    instance.status === "completed"
                      ? "todo"
                      : "completed",

                  updatedAt: new Date().toISOString(),
                }
              : instance,
        ),
      };

      persistData(next);

      return next;
    });
  };

  /*
   * ============================================================
   * DELETE TASK
   * ============================================================
   *
   * Универсальная функция:
   * принимает ID задачи и удаляет сам Task
   * + все его TaskInstance.
   */

  const deleteTask = (taskId: string) => {
    setData((current) => {
      const next: AppData = {
        ...current,

        tasks: current.tasks.filter(
          (task) => task.id !== taskId,
        ),

        taskInstances: current.taskInstances.filter(
          (instance) => instance.taskId !== taskId,
        ),
      };

      persistData(next);

      return next;
    });

    /*
     * Если удаление произошло из TaskModal,
     * закрываем его.
     */

    if (modal.task?.id === taskId) {
      closeModal();
    }
  };

  /*
   * ============================================================
   * SETTINGS
   * ============================================================
   */

  const openCreateTaskFromSettings = () => {
    setSettingsOpen(false);

    openCreateModal(
      formatDateKey(new Date()),
    );
  };

  const openTaskFromSettings = (task: Task) => {
    /*
     * Ищем любое существующее вхождение этой задачи.
     */

    const instance = data.taskInstances.find(
      (item) => item.taskId === task.id,
    );

    /*
     * Если экземпляр существует —
     * открываем обычное редактирование.
     */

    if (instance) {
      setSettingsOpen(false);

      openEditModal(
        task.id,
        instance.id,
      );

      return;
    }

    /*
     * Если экземпляра пока нет
     * (например, повторяющаяся задача ещё
     * не получила экземпляр),
     * создаём временный экземпляр для
     * открытия редактирования.

     * Здесь используем сегодняшнюю дату
     * и стандартное время.
     */

    const temporaryInstance: TaskInstance = {
      id: createId("instance"),
      taskId: task.id,
      date: formatDateKey(new Date()),
      startTime: "09:00",
      endTime: "10:00",
      status: "todo",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setSettingsOpen(false);

    setModal({
      open: true,
      date: temporaryInstance.date,
      task,
      instance: temporaryInstance,
      initialStartTime: temporaryInstance.startTime,
      initialEndTime: temporaryInstance.endTime,
    });
  };

  if (authLoading) {
  return null;
}

if (!currentUser) {
  return (
    <AuthScreen
  onAuthenticated={(user) => {
    setCurrentUser(user);
  }}
/>
  );
}

if (adminOpen && currentUser.role === "admin") {
  return (
    <AdminPanel
      onBack={() => setAdminOpen(false)}
      onImpersonated={async (user) => {
        setCurrentUser(user);
        setAdminOpen(false);

        const userData = await loadAppData(user.id);
        setData(userData);
      }}
    />
  );
}
  /*
   * ============================================================
   * RENDER
   * ============================================================
   */

  return (
    <main className="dashka-app">
      <div className="dashka-shell">

        {/* HEADER */}

        <header className="dashka-header">
          <div
            className="dashka-brand"
            aria-label="Dashka Productivity"
          >
            <span className="dashka-brand__name">
              Dashka
            </span>

            <span className="dashka-brand__accent">
              Productivity
            </span>
          </div>

          <div className="dashka-week-nav">
            <IconButton
              variant="ghost"
              size="md"
              icon={<ChevronLeft size={20} />}
              label="Предыдущая неделя"
              onClick={() => changeWeek(-1)}
            />

            <button
              type="button"
              className="dashka-week-button"
              onClick={() =>
                setWeekPickerOpen(
                  (current) => !current,
                )
              }
              title="Выбрать неделю"
            >
              <span>{weekLabel}</span>

              <CalendarDays
                size={17}
                aria-hidden="true"
              />
            </button>

            <IconButton
              variant="ghost"
              size="md"
              icon={<ChevronRight size={20} />}
              label="Следующая неделя"
              onClick={() => changeWeek(1)}
            />
          </div>

          <div className="dashka-header-actions">
  {currentUser.role === "admin" && (
    <Button
      size="md"
      onClick={() => setAdminOpen(true)}
    >
      Admin
    </Button>
  )}

  <IconButton
    variant="ghost"
    size="md"
    icon={<Settings size={20} />}
    label="Настройки"
    onClick={() =>
      setSettingsOpen(true)
    }
  />
</div>
        </header>

        {/* WEEK PICKER */}

        <WeekPicker
          open={weekPickerOpen}
          value={selectedWeek}
          onSelect={(week) => {
            setSelectedWeek(
              startOfWeek(week),
            );
          }}
          onClose={() => {
            setWeekPickerOpen(false);
          }}
        />

        {/* CALENDAR */}

        <section
          className="dashka-calendar-section"
          aria-label="Недельный календарь"
        >
          <WeekCalendar
            week={selectedWeek}
            tasks={data.tasks}
            taskInstances={weekInstances}
            onCreateAtDate={openCreateModal}
            onToggleTask={toggleTask}
            onEditTask={openEditModal}
          />
        </section>

        {/* BOTTOM MENU */}

        <nav
          className="dashka-bottom-menu"
          aria-label="Основные функции"
        >
          <Button
            size="lg"
            iconLeft={<Plus size={19} />}
            onClick={() => openCreateModal()}
          >
            Создать задачу
          </Button>

          <button
            type="button"
            className="dashka-menu-item"
            onClick={() =>
              setSettingsOpen(true)
            }
          >
            <span className="dashka-menu-item__icon">
              ◈
            </span>

            <span>
              <strong>Категории</strong>

              <small>
                {data.categories.length} создано
              </small>
            </span>
          </button>

          <button
            type="button"
            className="dashka-menu-item"
            onClick={() =>
              setSettingsOpen(true)
            }
          >
            <span className="dashka-menu-item__icon">
              □
            </span>

            <span>
              <strong>Задачи</strong>

              <small>
                {data.tasks.length} создано
              </small>
            </span>
          </button>

          <button
            type="button"
            className="dashka-menu-item dashka-menu-item--active"
            onClick={goToCurrentWeek}
          >
            <span className="dashka-menu-item__icon">
              <CalendarDays size={18} />
            </span>

            <span>
              <strong>Текущая неделя</strong>

              <small>{weekLabel}</small>
            </span>
          </button>

          <button
            type="button"
            className="dashka-menu-item"
            onClick={() =>
              setWeekPickerOpen(true)
            }
          >
            <span className="dashka-menu-item__icon">
              <CalendarDays size={18} />
            </span>

            <span>
              <strong>Календарь</strong>

              <small>
                Выбрать неделю
              </small>
            </span>
          </button>
        </nav>
      </div>

      {/* TASK MODAL */}

      <TaskModal
        open={modal.open}
        categories={data.categories}
        existingTasks={data.tasks}
        initialDate={modal.date}
        initialTask={modal.task}
        initialInstance={modal.instance}
        initialStartTime={modal.initialStartTime}
        initialEndTime={modal.initialEndTime}
        onSubmit={handleTaskSubmit}
        onCreateCategory={createCategory}
        onDelete={() => {
  if (modal.task) {
    deleteTask(modal.task.id);
  }
}}
        onClose={closeModal}
      />

      {/* SETTINGS MODAL */}

      <SettingsModal
        open={settingsOpen}
        user={currentUser}
        data={data}
        onClose={() =>
          setSettingsOpen(false)
        }
        onCreateCategory={createCategory}
        onRenameCategory={renameCategory}
        onDeleteCategory={deleteCategory}
        onEditTask={openTaskFromSettings}
        onDeleteTask={deleteTask}
        onCreateTask={
          openCreateTaskFromSettings
        }
        onLogout={() => {
  logoutUser();

  setCurrentUser(null);

  setData({
    categories: [],
    tasks: [],
    taskInstances: [],
  });

  setSettingsOpen(false);
}}
      />
    </main>
  );
}

export default App;