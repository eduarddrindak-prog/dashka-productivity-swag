import type {
  Category,
  Task,
  TaskInstance,
} from "../../data/types";

import type { TaskFormValue } from "./TaskForm";
import { TaskForm } from "./TaskForm";

import "./TaskModal.css";

interface TaskModalProps {
  open: boolean;

  categories: Category[];
  existingTasks: Task[];

  initialDate: string;

  initialTask?: Task;
  initialInstance?: TaskInstance;

  initialStartTime?: string;
  initialEndTime?: string;

  onSubmit: (value: TaskFormValue) => void;

  onCreateCategory: (name: string) => Category;

  onDelete?: () => void;

  onClose: () => void;
}

export function TaskModal({
  open,
  categories,
  existingTasks,

  initialDate,

  initialTask,
  initialInstance,

  initialStartTime,
  initialEndTime,

  onSubmit,
  onCreateCategory,

  onDelete,

  onClose,
}: TaskModalProps) {
  if (!open) {
    return null;
  }

  const isEditing =
    Boolean(initialTask && initialInstance);

  return (
    <div
      className="task-modal"
      role="presentation"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }
      }}
    >
      <section
        className="task-modal__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-modal-title"
      >
        <header className="task-modal__header">
          <h2 id="task-modal-title">
            {isEditing
              ? "Редактировать задачу"
              : "Новая задача"}
          </h2>

          <button
            type="button"
            className="task-modal__close"
            aria-label="Закрыть"
            onClick={onClose}
          >
            ×
          </button>
        </header>

        <div className="task-modal__body">
          <TaskForm
            categories={categories}
            existingTasks={existingTasks}

            initialDate={
              initialInstance?.date ??
              initialDate
            }

            initialStartTime={
              initialInstance?.startTime ??
              initialStartTime
            }

            initialEndTime={
              initialInstance?.endTime ??
              initialEndTime
            }

            initialTask={
              initialTask
            }

            initialInstance={
              initialInstance
            }

            isEditing={
              isEditing
            }

            onSubmit={
              onSubmit
            }

            onCreateCategory={
              onCreateCategory
            }

            onDelete={
              onDelete
            }

            onCancel={
              onClose
            }
          />
        </div>
      </section>
    </div>
  );
}