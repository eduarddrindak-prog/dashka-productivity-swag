-- Users
CREATE TABLE users (
  id TEXT PRIMARY KEY NOT NULL,
  login TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  created_at TEXT NOT NULL
);

-- Categories
CREATE TABLE categories (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Tasks
CREATE TABLE tasks (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category_id TEXT NOT NULL,
  color TEXT NOT NULL,
  type TEXT NOT NULL,
  recurrence_json TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
);

-- Task instances
CREATE TABLE task_instances (
  id TEXT PRIMARY KEY NOT NULL,
  task_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  date TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'todo',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,

  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Sessions
CREATE TABLE sessions (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  impersonator_id TEXT,
  parent_session_id TEXT,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (impersonator_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX idx_categories_user_id
  ON categories(user_id);

CREATE INDEX idx_tasks_user_id
  ON tasks(user_id);

CREATE INDEX idx_task_instances_user_id
  ON task_instances(user_id);

CREATE INDEX idx_task_instances_task_id
  ON task_instances(task_id);

CREATE INDEX idx_task_instances_date
  ON task_instances(user_id, date);

CREATE INDEX idx_sessions_user_id
  ON sessions(user_id);

CREATE INDEX idx_sessions_expires_at
  ON sessions(expires_at);