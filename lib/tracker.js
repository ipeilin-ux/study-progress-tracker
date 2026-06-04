const TASK_STATUSES = new Set(["not-started", "in-progress", "completed"]);
const TASK_PRIORITIES = new Set(["low", "medium", "high"]);
const DAY_MS = 24 * 60 * 60 * 1000;

export function createInitialState() {
  return {
    exam: null,
    tasks: [],
    scores: [],
  };
}

export function daysUntil(dateValue, today = new Date()) {
  const target = parseCalendarDate(dateValue);
  if (!target || Number.isNaN(today.getTime())) {
    return null;
  }

  const current = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((target.getTime() - current.getTime()) / DAY_MS);
}

export function overallProgress(tasks) {
  if (!Array.isArray(tasks) || tasks.length === 0) {
    return 0;
  }

  const completed = tasks.filter((task) => task.status === "completed").length;
  return Math.round((completed / tasks.length) * 100);
}

export function subjectProgress(tasks) {
  if (!Array.isArray(tasks)) {
    return [];
  }

  const subjects = new Map();

  for (const task of tasks) {
    if (!task.subject) {
      continue;
    }

    const current = subjects.get(task.subject) ?? { completed: 0, total: 0 };
    current.total += 1;
    if (task.status === "completed") {
      current.completed += 1;
    }
    subjects.set(task.subject, current);
  }

  return [...subjects.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([subject, values]) => ({
      subject,
      completed: values.completed,
      total: values.total,
      percent: Math.round((values.completed / values.total) * 100),
    }));
}

export function scoreStats(scores) {
  if (!Array.isArray(scores) || scores.length === 0) {
    return {
      latest: null,
      highest: null,
      average: null,
    };
  }

  const ordered = [...scores].sort((left, right) =>
    right.date.localeCompare(left.date),
  );
  const values = scores.map((entry) => entry.score);
  const average = values.reduce((sum, value) => sum + value, 0) / values.length;

  return {
    latest: ordered[0].score,
    highest: Math.max(...values),
    average: Math.round(average * 10) / 10,
  };
}

export function parseStoredState(rawValue) {
  try {
    const value = JSON.parse(rawValue);
    if (!value || !Array.isArray(value.tasks) || !Array.isArray(value.scores)) {
      return createInitialState();
    }

    return {
      exam: isValidExam(value.exam) ? normalizeExam(value.exam) : null,
      tasks: value.tasks.filter(isValidTask).map(normalizeTask),
      scores: value.scores.filter(isValidScore).map(normalizeScore),
    };
  } catch {
    return createInitialState();
  }
}

export function setExam(state, exam) {
  if (!isValidExam(exam)) {
    throw new Error("Exam name, date, and target score are required.");
  }

  return {
    ...state,
    exam: normalizeExam(exam),
  };
}

export function addTask(state, task) {
  assertValidTask(task);
  return {
    ...state,
    tasks: [...state.tasks, normalizeTask(task)],
  };
}

export function updateTask(state, taskId, task) {
  assertValidTask(task);
  assertHasId(state.tasks, taskId, "Task");

  return {
    ...state,
    tasks: state.tasks.map((entry) =>
      entry.id === taskId ? normalizeTask({ ...task, id: taskId }) : entry,
    ),
  };
}

export function updateTaskStatus(state, taskId, status) {
  if (!TASK_STATUSES.has(status)) {
    throw new Error("Task status is invalid.");
  }
  assertHasId(state.tasks, taskId, "Task");

  return {
    ...state,
    tasks: state.tasks.map((task) =>
      task.id === taskId ? { ...task, status } : task,
    ),
  };
}

export function deleteTask(state, taskId) {
  return {
    ...state,
    tasks: state.tasks.filter((task) => task.id !== taskId),
  };
}

export function addScore(state, score) {
  if (!isValidScore(score)) {
    throw new Error("Score must be between 0 and 100 and include a valid date.");
  }

  return {
    ...state,
    scores: [...state.scores, normalizeScore(score)],
  };
}

export function deleteScore(state, scoreId) {
  return {
    ...state,
    scores: state.scores.filter((score) => score.id !== scoreId),
  };
}

function parseCalendarDate(value) {
  if (typeof value !== "string") {
    return null;
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    return null;
  }

  const [, year, month, day] = match.map(Number);
  const parsed = new Date(year, month - 1, day);
  const isSameDate =
    parsed.getFullYear() === year &&
    parsed.getMonth() === month - 1 &&
    parsed.getDate() === day;

  return isSameDate ? parsed : null;
}

function isValidExam(exam) {
  return Boolean(
    exam &&
      typeof exam.name === "string" &&
      exam.name.trim() &&
      parseCalendarDate(exam.date) &&
      Number.isFinite(Number(exam.targetScore)) &&
      Number(exam.targetScore) >= 0 &&
      Number(exam.targetScore) <= 100,
  );
}

function isValidTask(task) {
  return Boolean(
    task &&
      typeof task.id === "string" &&
      task.id &&
      typeof task.title === "string" &&
      task.title.trim() &&
      typeof task.subject === "string" &&
      task.subject.trim() &&
      parseCalendarDate(task.dueDate) &&
      TASK_PRIORITIES.has(task.priority) &&
      TASK_STATUSES.has(task.status),
  );
}

function isValidScore(score) {
  return Boolean(
    score &&
      typeof score.id === "string" &&
      score.id &&
      Number.isFinite(Number(score.score)) &&
      Number(score.score) >= 0 &&
      Number(score.score) <= 100 &&
      parseCalendarDate(score.date),
  );
}

function normalizeExam(exam) {
  return {
    name: exam.name.trim(),
    date: exam.date,
    targetScore: Number(exam.targetScore),
  };
}

function normalizeTask(task) {
  return {
    id: task.id,
    title: task.title.trim(),
    subject: task.subject.trim(),
    dueDate: task.dueDate,
    priority: task.priority,
    status: task.status,
  };
}

function normalizeScore(score) {
  return {
    id: score.id,
    score: Number(score.score),
    date: score.date,
  };
}

function assertValidTask(task) {
  if (!isValidTask(task)) {
    throw new Error("Task fields, priority, or task status are invalid.");
  }
}

function assertHasId(collection, id, label) {
  if (!collection.some((entry) => entry.id === id)) {
    throw new Error(`${label} was not found.`);
  }
}
