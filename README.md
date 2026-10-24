# Studyflow — Student Study Tracker Dashboard

A polished, responsive, local-first dashboard to help students organize assignments, track focused study time, monitor subjects, and build consistent study habits.

## Features

- **Overview dashboard:** weekly study hours, completed-task rate, upcoming deadlines, study streak, weekly activity chart, and subject progress.
- **Assignments:** create, edit, complete, search, filter, sort, and delete tasks. Track subject, due date, priority, estimate, and notes.
- **Study sessions:** log past study time manually or use the focus timer (25-minute focus, 5-minute short break, 15-minute long break). Completed focus sessions are logged automatically.
- **Subjects:** create, rename, and delete subjects; view linked task counts and logged study time.
- **Personalization:** dark mode and responsive layouts for desktop, tablet, and mobile.
- **Data portability:** export and import JSON backups; reset local workspace when needed.
- **Privacy-first:** data is stored in the browser's `localStorage`; no account, server, analytics, or external API is required.
- **Accessible basics:** semantic page regions, form labels, keyboard-visible focus states, dialog semantics, and reduced-motion support.

## Technology

- HTML5, CSS3, vanilla JavaScript (ES2020+)
- Browser `localStorage` for persistence
- No build step, package installation, API keys, or database server required

This is intentionally a static app. It is suitable for a personal student dashboard. It does not sync across devices or provide accounts/shared workspaces.

## Run on Windows 10/11

### Option A — simplest

1. Install a modern browser (Edge or Chrome).
2. Download and extract the project ZIP.
3. Open the extracted `student-study-tracker-dashboard` folder.
4. Double-click `index.html`.

Most features work directly from the file. For the most consistent browser behavior, use Option B.

### Option B — VS Code + local server (recommended)

1. Install **Visual Studio Code**: https://code.visualstudio.com/
2. Install **Python 3** from https://www.python.org/downloads/windows/ and check **Add Python to PATH** during installation. (Or install the VS Code Live Server extension instead.)
3. Extract the ZIP and open the `student-study-tracker-dashboard` folder in VS Code: **File → Open Folder**.
4. Open VS Code's terminal: **Terminal → New Terminal**. Make sure the terminal is in the project folder (the folder containing `index.html`).
5. Verify Python:

   ```powershell
   py --version
   ```

6. Start a local web server:

   ```powershell
   py -m http.server 8000
   ```

7. Open http://localhost:8000 in your browser.
8. Stop the server by returning to the terminal and pressing **Ctrl+C**.

If `py` is not recognized, try `python --version` and then `python -m http.server 8000`. If neither works, reinstall Python and enable PATH, or use VS Code's Live Server extension (right-click `index.html` → **Open with Live Server**).

## First use

- The first launch includes example subjects, tasks, and study sessions so you can explore the dashboard. These are editable sample records.
- Use **Add task** to create assignments; choose a subject and due date.
- Use **Subjects** to rename or remove sample subjects, or create your own.
- Open **Study sessions** to log study time or start a timer.
- Use **Settings & data → Export JSON** to save a backup before clearing browser data.
- Data is separate per browser profile and device. Clearing site/browser storage can erase it; export backups regularly.

## Testing

A dependency-free smoke test is included in `tests/smoke.test.cjs`. With Node.js installed, run from the project folder:

```powershell
node --test tests/smoke.test.cjs
```

It verifies required page structure, application feature hooks, data validation logic presence, and deployment assets. It is a static smoke test; it does not replace end-to-end browser testing.

## Deploy for free

### GitHub Pages (recommended for this static app)

1. Create/sign in to GitHub: https://github.com/
2. Create a **public** repository, for example `student-study-tracker-dashboard`.
3. In the project folder, open PowerShell / VS Code terminal and run:

   ```powershell
   git init
   git add .
   git commit -m "Build Studyflow student dashboard"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/student-study-tracker-dashboard.git
   git push -u origin main
   ```

   Install Git for Windows first if `git --version` does not work: https://git-scm.com/download/win. Replace `YOUR-USERNAME` with your GitHub username. If Git asks you to sign in, complete GitHub's browser authentication; do not put passwords or tokens into project files.

4. On GitHub, open the repository → **Settings → Pages**.
5. Under **Build and deployment**, choose **Deploy from a branch**, select `main` and `/(root)`, then **Save**.
6. Wait for the Pages deployment to finish. Your site URL will normally be `https://YOUR-USERNAME.github.io/student-study-tracker-dashboard/`. The Pages section shows the actual published URL and deployment status.
7. Open the URL and test adding a task, logging a session, refreshing the page, exporting data, and switching theme.

Official docs: https://docs.github.com/en/pages/getting-started-with-github-pages

### Alternative: Netlify Drop

You can publish the extracted project folder (containing `index.html`) using Netlify's manual deploy / drag-and-drop workflow: https://docs.netlify.com/welcome/add-new-site/. A free account may be required. Pricing and quotas can change; check Netlify's current pricing before choosing a plan. This app itself requires no paid hosting or backend.

### Custom domain and HTTPS

GitHub Pages serves the site over HTTPS after deployment. To use a custom domain, buy/register a domain with a registrar, configure it in repository **Settings → Pages → Custom domain**, and add the DNS records GitHub specifies. Domain registration generally costs extra; DNS propagation can take time.

### Updating the live version

After editing files, run:

```powershell
git add .
git commit -m "Describe your update"
git push
```

GitHub Pages redeploys from the selected branch. Verify the Actions / Pages deployment status and reload the site.

## Troubleshooting

- **The page looks unstyled:** ensure `styles.css` and `app.js` remain beside `index.html`, and the `assets` folder was extracted too. Hard refresh with `Ctrl+F5`.
- **Your tasks disappeared:** browser storage may have been cleared, or you may have switched browsers/profiles. Restore via **Settings & data → Import JSON** if you have a backup.
- **The app doesn't save:** use a normal browser window, check available storage, and avoid private browsing sessions that discard storage. Browser settings/extensions can block storage for local files; run via `http://localhost:8000`.
- **The page is blank after an edit:** open browser DevTools with `F12` → **Console**, check the error, and undo the latest edit. Keep the original ZIP as a clean copy.
- **Git push asks for a password:** use GitHub's supported browser sign-in / credential manager; account passwords are not accepted for Git HTTPS authentication.
- **GitHub Pages shows a 404:** ensure Pages is configured for `main` and `/(root)`, `index.html` is at the repository root, and the deployment has completed.

## Project structure

```text
student-study-tracker-dashboard/
├── index.html
├── styles.css
├── app.js
├── assets/
│   └── favicon.svg
├── tests/
│   └── smoke.test.cjs
├── .gitignore
├── .nojekyll
└── README.md
```

## Privacy and limitations

- This static app does not transmit data to a server. There is no authentication, multi-user mode, cloud sync, email reminders, or cross-device database.
- Exported JSON backups contain your study records; keep them private.
- The timer uses a browser interval while the page is open. Browsers can throttle background tabs, so it is not a precision alarm.
- Study streaks are based on dates that have logged sessions, not on a minimum daily study duration.
- Subject progress is calculated from logged study hours against the weekly goal on the dashboard; the subject cards show logged hours against the same goal overall, as a simple progress indicator.
