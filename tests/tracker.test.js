import test from "node:test";
import assert from "node:assert/strict";

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
} from "../lib/tracker.js";

test("creates an empty initial state", () => {
  assert.deepEqual(createInitialState(), {
    exam: null,
    tasks: [],
    scores: [],
  });
});

test("calculates calendar days remaining without partial-day drift", () => {
  assert.equal(daysUntil("2026-06-10", new Date("2026-06-04T23:59:00")), 6);
  assert.equal(daysUntil("2026-06-04", new Date("2026-06-04T00:01:00")), 0);
  assert.equal(daysUntil("not-a-date", new Date("2026-06-04T00:01:00")), null);
});

test("calculates overall progress and handles an empty task list", () => {
  const tasks = [
    { status: "completed" },
    { status: "in-progress" },
    { status: "completed" },
  ];

  assert.equal(overallProgress(tasks), 67);
  assert.equal(overallProgress([]), 0);
});

test("calculates subject progress in alphabetical order", () => {
  const tasks = [
    { subject: "Risk", status: "completed" },
    { subject: "Network", status: "in-progress" },
    { subject: "Network", status: "completed" },
  ];

  assert.deepEqual(subjectProgress(tasks), [
    { subject: "Network", completed: 1, total: 2, percent: 50 },
    { subject: "Risk", completed: 1, total: 1, percent: 100 },
  ]);
});

test("calculates latest, highest, and average score statistics", () => {
  const scores = [
    { id: "score-1", score: 72, date: "2026-06-01" },
    { id: "score-2", score: 88, date: "2026-06-03" },
    { id: "score-3", score: 79, date: "2026-06-02" },
  ];

  assert.deepEqual(scoreStats(scores), {
    latest: 88,
    highest: 88,
    average: 79.7,
  });
  assert.deepEqual(scoreStats([]), {
    latest: null,
    highest: null,
    average: null,
  });
});

test("falls back to an initial state for malformed stored data", () => {
  assert.deepEqual(parseStoredState("not-json"), createInitialState());
  assert.deepEqual(
    parseStoredState(JSON.stringify({ exam: {}, tasks: "bad", scores: null })),
    createInitialState(),
  );
});

test("accepts valid stored data and drops invalid task and score entries", () => {
  const validState = {
    exam: { name: "Security", date: "2026-07-10", targetScore: 80 },
    tasks: [
      {
        id: "task-1",
        title: "Review logs",
        subject: "Operations",
        dueDate: "2026-06-10",
        priority: "high",
        status: "in-progress",
      },
      { id: "bad-task" },
    ],
    scores: [
      { id: "score-1", score: 85, date: "2026-06-04" },
      { id: "bad-score", score: 105, date: "2026-06-04" },
    ],
  };

  assert.deepEqual(parseStoredState(JSON.stringify(validState)), {
    exam: validState.exam,
    tasks: [validState.tasks[0]],
    scores: [validState.scores[0]],
  });
});

test("sets a validated exam without mutating the previous state", () => {
  const state = createInitialState();
  const next = setExam(state, {
    name: "Security",
    date: "2026-07-10",
    targetScore: 80,
  });

  assert.equal(state.exam, null);
  assert.deepEqual(next.exam, {
    name: "Security",
    date: "2026-07-10",
    targetScore: 80,
  });
  assert.throws(
    () => setExam(state, { name: "", date: "2026-07-10", targetScore: 80 }),
    /exam name/i,
  );
});

test("adds, edits, completes, and deletes tasks immutably", () => {
  const state = createInitialState();
  const task = {
    id: "task-1",
    title: "Review access controls",
    subject: "IAM",
    dueDate: "2026-06-10",
    priority: "medium",
    status: "not-started",
  };

  const added = addTask(state, task);
  const edited = updateTask(added, "task-1", {
    ...task,
    title: "Review ABAC and RBAC",
  });
  const completed = updateTaskStatus(edited, "task-1", "completed");
  const deleted = deleteTask(completed, "task-1");

  assert.equal(state.tasks.length, 0);
  assert.equal(added.tasks[0].title, "Review access controls");
  assert.equal(edited.tasks[0].title, "Review ABAC and RBAC");
  assert.equal(completed.tasks[0].status, "completed");
  assert.equal(deleted.tasks.length, 0);
  assert.throws(
    () => updateTaskStatus(added, "task-1", "unknown"),
    /task status/i,
  );
});

test("adds and deletes validated mock scores immutably", () => {
  const state = createInitialState();
  const added = addScore(state, {
    id: "score-1",
    score: 85,
    date: "2026-06-04",
  });
  const deleted = deleteScore(added, "score-1");

  assert.equal(state.scores.length, 0);
  assert.equal(added.scores.length, 1);
  assert.equal(deleted.scores.length, 0);
  assert.throws(
    () => addScore(state, { id: "bad", score: 101, date: "2026-06-04" }),
    /between 0 and 100/i,
  );
});
