import {
  addScore,
  addTask,
  createInitialState,
  daysUntil,
  deleteScore,
  deleteTask,
  overallProgress,
  parseStoredState,
  scoreStats,
  setExam,
  subjectProgress,
  updateTask,
  updateTaskStatus,
} from "./lib/tracker.js";

const STORAGE_KEY = "study-progress-tracker-state";
const DATE_FORMATTER = new Intl.DateTimeFormat(undefined, {
  year: "numeric",
  month: "short",
  day: "numeric",
});
const STATUS_LABELS = {
  "not-started": "Not started",
  "in-progress": "In progress",
  completed: "Completed",
};

let state = loadState();
let toastTimer;

const elements = {
  examName: document.querySelector("#exam-name"),
  examDate: document.querySelector("#exam-date"),
  daysRemaining: document.querySelector("#days-remaining"),
  targetScore: document.querySelector("#target-score"),
  overallProgress: document.querySelector("#overall-progress"),
  summaryProgress: document.querySelector(".summary-progress"),
  summaryProgressBar: document.querySelector("#summary-progress-bar"),
  editExamButton: document.querySelector("#edit-exam-button"),
  examDialog: document.querySelector("#exam-dialog"),
  examForm: document.querySelector("#exam-form"),
  examNameInput: document.querySelector("#exam-name-input"),
  examDateInput: document.querySelector("#exam-date-input"),
  examTargetInput: document.querySelector("#exam-target-input"),
  addTaskButton: document.querySelector("#add-task-button"),
  taskDialog: document.querySelector("#task-dialog"),
  taskDialogTitle: document.querySelector("#task-dialog-title"),
  taskForm: document.querySelector("#task-form"),
  taskIdInput: document.querySelector("#task-id-input"),
  taskTitleInput: document.querySelector("#task-title-input"),
  taskSubjectInput: document.querySelector("#task-subject-input"),
  taskDateInput: document.querySelector("#task-date-input"),
  taskPriorityInput: document.querySelector("#task-priority-input"),
  taskStatusInput: document.querySelector("#task-status-input"),
  statusFilter: document.querySelector("#status-filter"),
  subjectFilter: document.querySelector("#subject-filter"),
  taskCount: document.querySelector("#task-count"),
  taskList: document.querySelector("#task-list"),
  subjectProgressList: document.querySelector("#subject-progress-list"),
  scoreForm: document.querySelector("#score-form"),
  scoreValue: document.querySelector("#score-value"),
  scoreDate: document.querySelector("#score-date"),
  latestScore: document.querySelector("#latest-score"),
  highestScore: document.querySelector("#highest-score"),
  averageScore: document.querySelector("#average-score"),
  scoreList: document.querySelector("#score-list"),
  toast: document.querySelector("#toast"),
};

initialize();

function initialize() {
  elements.scoreDate.value = todayValue();
  bindEvents();
  render();
}

function bindEvents() {
  elements.editExamButton.addEventListener("click", openExamDialog);
  elements.addTaskButton.addEventListener("click", () => openTaskDialog());
  elements.examForm.addEventListener("submit", saveExam);
  elements.taskForm.addEventListener("submit", saveTask);
  elements.scoreForm.addEventListener("submit", saveScore);
  elements.statusFilter.addEventListener("change", renderTasks);
  elements.subjectFilter.addEventListener("change", renderTasks);
  elements.taskList.addEventListener("change", handleTaskListChange);
  elements.taskList.addEventListener("click", handleTaskListClick);
  elements.scoreList.addEventListener("click", handleScoreListClick);

  document.querySelectorAll("[data-close-dialog]").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelector(`#${button.dataset.closeDialog}`).close();
    });
  });
}

function render() {
  renderSummary();
  renderSubjectFilter();
  renderTasks();
  renderScores();
  renderSubjectProgress();
}

function renderSummary() {
  const progress = overallProgress(state.tasks);
  elements.overallProgress.textContent = `${progress}%`;
  elements.summaryProgressBar.style.width = `${progress}%`;
  elements.summaryProgress.setAttribute("aria-valuenow", String(progress));

  if (!state.exam) {
    elements.examName.textContent = "Set your exam";
    elements.examDate.textContent = "No exam date configured";
    elements.daysRemaining.textContent = "-";
    elements.targetScore.textContent = "-";
    return;
  }

  const remaining = daysUntil(state.exam.date);
  elements.examName.textContent = state.exam.name;
  elements.examDate.textContent = `Exam date: ${formatDate(state.exam.date)}`;
  elements.daysRemaining.textContent = formatDaysRemaining(remaining);
  elements.targetScore.textContent = `${state.exam.targetScore}%`;
}

function renderSubjectFilter() {
  const currentValue = elements.subjectFilter.value;
  const subjects = [...new Set(state.tasks.map((task) => task.subject))].sort((a, b) =>
    a.localeCompare(b),
  );

  elements.subjectFilter.replaceChildren(createOption("all", "All subjects"));
  subjects.forEach((subject) => {
    elements.subjectFilter.append(createOption(subject, subject));
  });
  elements.subjectFilter.value = subjects.includes(currentValue) ? currentValue : "all";
}

function renderTasks() {
  const tasks = filteredTasks();
  elements.taskCount.textContent = `${tasks.length} ${tasks.length === 1 ? "task" : "tasks"}`;
  elements.taskList.replaceChildren();

  if (tasks.length === 0) {
    elements.taskList.append(
      createEmptyState(
        state.tasks.length === 0 ? "No study tasks yet" : "No tasks match these filters",
        state.tasks.length === 0
          ? "Add your first task to start tracking progress."
          : "Change the filters to see other tasks.",
      ),
    );
    return;
  }

  tasks.forEach((task) => {
    elements.taskList.append(createTaskRow(task));
  });
}

function renderScores() {
  const stats = scoreStats(state.scores);
  elements.latestScore.textContent = formatStat(stats.latest);
  elements.highestScore.textContent = formatStat(stats.highest);
  elements.averageScore.textContent = formatStat(stats.average);
  elements.scoreList.replaceChildren();

  const ordered = [...state.scores].sort((left, right) =>
    right.date.localeCompare(left.date),
  );

  if (ordered.length === 0) {
    elements.scoreList.append(
      createEmptyState("No mock scores yet", "Add a score to track your trend."),
    );
    return;
  }

  ordered.forEach((entry) => {
    const row = element("div", "score-row");
    const value = element("span", "score-value", `${entry.score}%`);
    const date = element("span", "score-date", formatDate(entry.date));
    const deleteButton = iconButton("×", "Delete score", "delete-score", entry.id);
    row.append(value, date, deleteButton);
    elements.scoreList.append(row);
  });
}

function renderSubjectProgress() {
  const subjects = subjectProgress(state.tasks);
  elements.subjectProgressList.replaceChildren();

  if (subjects.length === 0) {
    elements.subjectProgressList.append(
      createEmptyState("No subject progress yet", "Subjects appear after you add tasks."),
    );
    return;
  }

  subjects.forEach((entry) => {
    const row = element("div", "subject-row");
    const meta = element("div", "subject-meta");
    const name = element("span", "subject-name", entry.subject);
    const count = element(
      "span",
      "subject-count",
      `${entry.completed}/${entry.total} · ${entry.percent}%`,
    );
    const track = element("div", "progress-track");
    const bar = document.createElement("span");
    bar.style.width = `${entry.percent}%`;
    track.setAttribute("role", "progressbar");
    track.setAttribute("aria-label", `${entry.subject} progress`);
    track.setAttribute("aria-valuemin", "0");
    track.setAttribute("aria-valuemax", "100");
    track.setAttribute("aria-valuenow", String(entry.percent));
    track.append(bar);
    meta.append(name, count);
    row.append(meta, track);
    elements.subjectProgressList.append(row);
  });
}

function createTaskRow(task) {
  const row = element("article", `task-row${task.status === "completed" ? " is-completed" : ""}`);
  row.dataset.taskId = task.id;

  const checkbox = document.createElement("input");
  checkbox.className = "task-complete";
  checkbox.type = "checkbox";
  checkbox.checked = task.status === "completed";
  checkbox.dataset.action = "toggle-task";
  checkbox.setAttribute("aria-label", `Mark ${task.title} complete`);

  const details = element("div", "task-details");
  details.append(
    element("div", "task-title", task.title),
    element("div", "task-subject", task.subject),
  );

  const dueCell = element("div", "task-due-cell");
  dueCell.append(
    element("div", "task-due", "Due date"),
    element("div", "", formatDate(task.dueDate)),
  );

  const status = document.createElement("select");
  status.className = "task-status";
  status.dataset.action = "change-status";
  status.setAttribute("aria-label", `Change status for ${task.title}`);
  Object.entries(STATUS_LABELS).forEach(([value, label]) => {
    status.append(createOption(value, label));
  });
  status.value = task.status;

  const priority = element("span", `priority priority-${task.priority}`, task.priority);
  const actions = element("div", "task-actions");
  actions.append(
    iconButton("Edit", "Edit task", "edit-task", task.id),
    iconButton("×", "Delete task", "delete-task", task.id),
  );

  row.append(checkbox, details, dueCell, status, priority, actions);
  return row;
}

function filteredTasks() {
  const status = elements.statusFilter.value;
  const subject = elements.subjectFilter.value;

  return [...state.tasks]
    .filter((task) => status === "all" || task.status === status)
    .filter((task) => subject === "all" || task.subject === subject)
    .sort((left, right) => {
      if (left.status === "completed" && right.status !== "completed") {
        return 1;
      }
      if (right.status === "completed" && left.status !== "completed") {
        return -1;
      }
      return left.dueDate.localeCompare(right.dueDate);
    });
}

function openExamDialog() {
  elements.examNameInput.value = state.exam?.name ?? "";
  elements.examDateInput.value = state.exam?.date ?? "";
  elements.examTargetInput.value = state.exam?.targetScore ?? 80;
  elements.examDialog.showModal();
  elements.examNameInput.focus();
}

function openTaskDialog(task = null) {
  elements.taskForm.reset();
  elements.taskDialogTitle.textContent = task ? "Edit task" : "Add task";
  elements.taskIdInput.value = task?.id ?? "";
  elements.taskTitleInput.value = task?.title ?? "";
  elements.taskSubjectInput.value = task?.subject ?? "";
  elements.taskDateInput.value = task?.dueDate ?? state.exam?.date ?? todayValue();
  elements.taskPriorityInput.value = task?.priority ?? "medium";
  elements.taskStatusInput.value = task?.status ?? "not-started";
  elements.taskDialog.showModal();
  elements.taskTitleInput.focus();
}

function saveExam(event) {
  event.preventDefault();

  try {
    state = setExam(state, {
      name: elements.examNameInput.value,
      date: elements.examDateInput.value,
      targetScore: elements.examTargetInput.value,
    });
    commitState("Exam settings saved.");
    elements.examDialog.close();
  } catch (error) {
    showToast(error.message);
  }
}

function saveTask(event) {
  event.preventDefault();

  const task = {
    id: elements.taskIdInput.value || createId("task"),
    title: elements.taskTitleInput.value,
    subject: elements.taskSubjectInput.value,
    dueDate: elements.taskDateInput.value,
    priority: elements.taskPriorityInput.value,
    status: elements.taskStatusInput.value,
  };

  try {
    state = elements.taskIdInput.value
      ? updateTask(state, elements.taskIdInput.value, task)
      : addTask(state, task);
    commitState(elements.taskIdInput.value ? "Task updated." : "Task added.");
    elements.taskDialog.close();
  } catch (error) {
    showToast(error.message);
  }
}

function saveScore(event) {
  event.preventDefault();

  try {
    state = addScore(state, {
      id: createId("score"),
      score: elements.scoreValue.value,
      date: elements.scoreDate.value,
    });
    elements.scoreValue.value = "";
    commitState("Mock score added.");
  } catch (error) {
    showToast(error.message);
  }
}

function handleTaskListChange(event) {
  const row = event.target.closest("[data-task-id]");
  if (!row) {
    return;
  }

  try {
    if (event.target.dataset.action === "toggle-task") {
      const currentTask = state.tasks.find((task) => task.id === row.dataset.taskId);
      const nextStatus = event.target.checked
        ? "completed"
        : currentTask.status === "completed"
          ? "not-started"
          : currentTask.status;
      state = updateTaskStatus(state, row.dataset.taskId, nextStatus);
      commitState(event.target.checked ? "Task completed." : "Task reopened.");
    }

    if (event.target.dataset.action === "change-status") {
      state = updateTaskStatus(state, row.dataset.taskId, event.target.value);
      commitState("Task status updated.");
    }
  } catch (error) {
    showToast(error.message);
    render();
  }
}

function handleTaskListClick(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) {
    return;
  }

  const task = state.tasks.find((entry) => entry.id === button.dataset.id);
  if (!task) {
    return;
  }

  if (button.dataset.action === "edit-task") {
    openTaskDialog(task);
  }

  if (
    button.dataset.action === "delete-task" &&
    window.confirm(`Delete "${task.title}"?`)
  ) {
    state = deleteTask(state, task.id);
    commitState("Task deleted.");
  }
}

function handleScoreListClick(event) {
  const button = event.target.closest("button[data-action='delete-score']");
  if (!button) {
    return;
  }

  if (window.confirm("Delete this mock score?")) {
    state = deleteScore(state, button.dataset.id);
    commitState("Mock score deleted.");
  }
}

function commitState(message) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    render();
    showToast(message);
  } catch {
    render();
    showToast("Changes are visible but could not be saved in this browser.");
  }
}

function loadState() {
  try {
    return parseStoredState(localStorage.getItem(STORAGE_KEY));
  } catch {
    return createInitialState();
  }
}

function createEmptyState(title, message) {
  const container = element("div", "empty-state");
  container.append(element("strong", "", title), element("p", "", message));
  return container;
}

function iconButton(text, label, action, id) {
  const button = element("button", "icon-button", text);
  button.type = "button";
  button.title = label;
  button.setAttribute("aria-label", label);
  button.dataset.action = action;
  button.dataset.id = id;
  return button;
}

function createOption(value, label) {
  const option = document.createElement("option");
  option.value = value;
  option.textContent = label;
  return option;
}

function element(tagName, className = "", text = "") {
  const node = document.createElement(tagName);
  if (className) {
    node.className = className;
  }
  if (text !== "") {
    node.textContent = text;
  }
  return node;
}

function formatDate(dateValue) {
  const [year, month, day] = dateValue.split("-").map(Number);
  return DATE_FORMATTER.format(new Date(year, month - 1, day));
}

function formatDaysRemaining(value) {
  if (value === null) {
    return "-";
  }
  if (value < 0) {
    return `${Math.abs(value)}d overdue`;
  }
  return `${value}d`;
}

function formatStat(value) {
  return value === null ? "-" : `${value}%`;
}

function todayValue() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60 * 1000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

function createId(prefix) {
  const id =
    typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}-${id}`;
}

function showToast(message) {
  clearTimeout(toastTimer);
  elements.toast.textContent = message;
  elements.toast.classList.add("is-visible");
  toastTimer = setTimeout(() => {
    elements.toast.classList.remove("is-visible");
  }, 2600);
}
