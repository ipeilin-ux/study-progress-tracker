# Open Source Approval Improvements Design

## Context

This repository is already a small, privacy-first static app with CI, a preview
image, and a public MIT-licensed source tree. That is a good base, but it still
looks like a personal practice project unless a reviewer can quickly see three
things:

1. There is a live demo.
2. The project is actively maintained.
3. The repository is easy to evaluate without guessing at intent.

The goal of this change is to improve those public signals without changing the
scope of the app itself.

## Goals

- Make the repository look actively maintained.
- Provide a visible public demo path for the static app.
- Keep the project dependency-free, client-side only, and free of personal data.
- Add a concise public blurb the maintainer can reuse in the Codex for Open
  Source application.

## Non-Goals

- No backend, authentication, sync, analytics, or external API work.
- No course material, exam dumps, copyrighted question banks, or licensed assets.
- No runtime dependencies or build tooling.
- No changes to the core tracker behavior.

## Design

### 1. Public release marker

Add a `CHANGELOG.md` file with a clear `v1.0.0` entry. The entry will describe
the current public state of the project, the privacy-first storage model, and
the fact that the repository is already being maintained with CI and reviewable
documentation.

This is a low-risk way to make the project look like a maintained open-source
release rather than a one-off prototype.

### 2. Live demo path

Publish the existing static site through GitHub Pages from the repository root.
The site must remain build-free and dependency-free.

Implementation shape:

- Keep the current static files as the source of truth.
- Publish only the browser-facing assets needed for the demo.
- Avoid adding a bundler or any server-side code.
- Once Pages is active, expose the URL in the README.

If Pages settings cannot be completed automatically, keep the repository
Pages-ready and document the exact GitHub setting required.

### 3. README refinement

Update the README so a reviewer can understand the project in one pass:

- keep the existing preview image near the top
- add a direct demo link once Pages is active
- make the repository-health section explicit about CI, privacy, and the lack
  of external dependencies
- keep the practice-project disclaimer visible so the repo does not imply
  course or exam-content ownership

### 4. Reusable application blurb

Add a short document for the Codex for Open Source application draft. The blurb
will emphasize:

- active maintenance
- CI-backed public source control
- a public demo
- privacy-first local storage
- no licensed or third-party course content

This document is not part of the app runtime. It exists to keep the application
message consistent and specific.

## Verification

- `node --test`
- Markdown link and path sanity check
- Confirm no new runtime dependencies were introduced
- Confirm no personal data or licensed content was added
- Confirm the static app still serves correctly from the repository root

## Risks And Constraints

- GitHub Pages activation still depends on repository settings.
- The repo will only have a true live demo after Pages is enabled and the URL
  is visible from GitHub.
- The changes must stay narrow so the repository continues to read as a simple
  privacy-first practice project rather than a larger platform.
