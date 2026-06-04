# Study Progress Tracker

A small, private-by-default browser app for tracking study tasks, subject
coverage, mock exam scores, and the countdown to an upcoming exam.

> **Practice project:** This repository was created only for programming
> practice and testing. It is not an official course, certification service,
> exam-preparation product, or source of exam materials. Do not enter real
> personal or confidential information.

The project uses plain HTML, CSS, and JavaScript. It has no runtime dependencies,
account system, analytics, or backend.

## Features

- Set an exam date and target score
- Track days remaining and overall task completion
- Add, edit, filter, complete, and delete study tasks
- Group progress automatically by subject
- Record mock exam scores
- View latest, highest, and average scores
- Keep data locally in the current browser
- Use the app on desktop and mobile

## Run Locally

ES modules require a local web server. From the repository root:

```bash
python3 -m http.server 8000 --directory study-progress-tracker
```

Open <http://localhost:8000>.

## Run Tests

The tests use Node.js's built-in test runner and require no installed packages:

```bash
cd study-progress-tracker
node --test
```

## Deploy With GitHub Pages

1. Create a GitHub repository using the contents of this folder as its root.
2. Push the repository to GitHub.
3. Open the repository's **Settings**.
4. Select **Pages**.
5. Choose **Deploy from a branch**.
6. Select your branch and the `/(root)` folder, then save.

## Data And Privacy

All exam, task, and score data is stored in the browser's `localStorage`.
Nothing is transmitted to a server. Clearing browser site data removes the
saved tracker data.

## Project Structure

```text
study-progress-tracker/
├── app.js
├── index.html
├── lib/
│   └── tracker.js
├── styles.css
├── tests/
│   └── tracker.test.js
├── LICENSE
├── package.json
└── README.md
```

`lib/tracker.js` contains pure state and calculation functions. `app.js`
connects those functions to the browser interface and local storage.

## License

MIT
