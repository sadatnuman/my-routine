# My Routine

Your day, organized. A private, offline-first routine planner for iPhone and Mac. The interface is in English and uses an olive clock identity with a very light grid background.

## Features

- Today dashboard with current activities, next activity, countdown, progress, flexible tasks and overdue tasks.
- Saturday-to-Friday weekly planner, weekly progress, category filtering, search and calculated open windows.
- Recurring activity editor with multiple weekdays, optional time or flexible scheduling, overnight entries, notes, reminders, color, tracking and enable/disable controls.
- Completion and skip records attached to a calendar date. Repeating templates stay separate from daily records.
- In-app reminders, app-open summaries and a local notification center with read, dismiss and clear controls.
- IndexedDB storage, versioned JSON export/import and restore defaults.
- Installable PWA with an offline app shell and safe update prompt.
- Light, dark and system themes; 12-hour and 24-hour time formats.
- No account, ads, analytics, remote database or paid service.

## Default routine

The initial routine uses Asia/Dhaka wall-clock times. The app reads the device's local clock, so set the device time zone to Asia/Dhaka for the intended schedule. Changes to the default are seeded only on first use; app updates never replace saved edits.

| Day | Activities |
| --- | --- |
| Saturday | 9:00 AM Wake Up; 10:00 AM–6:00 PM Office; 6:30–8:30 PM IELTS Class; 12:00–1:00 AM early Sunday Bedtime Window |
| Sunday | 9:00 AM Wake Up; 10:00 AM–12:00 PM Self Study; 2:00–5:00 PM Gym; 8:00–10:00 PM Self Study; 12:00–1:00 AM early Monday Bedtime Window |
| Monday | Same as Sunday, with bedtime early Tuesday |
| Tuesday | 9:00 AM Wake Up; 10:00 AM–1:00 PM Gym; 2:00–10:00 PM Work From Home; Flexible Self Study during work breaks; 12:00–1:00 AM early Wednesday Bedtime Window |
| Wednesday | Same as Tuesday, with bedtime early Thursday |
| Thursday | Same daytime routine as Tuesday; 12:00 AM early Friday Bedtime Target |
| Friday | 8:00 AM Wake Up and 8:00 AM–3:00 PM Work From Home (intentional overlap); 4:00–8:30 PM IELTS Class; 12:00–1:00 AM early Saturday Bedtime Window |

The bedtime entry is shown under the prior routine day. Flexible study has no invented time. Sleep entries are informational and excluded from progress by default.

## Status and reminders

- **Upcoming:** a timed activity has not started.
- **In Progress:** a duration activity is between its start and end.
- **Pending:** a flexible activity, a point activity within one hour of its start, or a non-trackable entry after its time.
- **Overdue:** a trackable duration activity has passed its end, or a trackable point activity is at least one hour past its start.
- **Completed / Skipped:** set explicitly by the user for one date. Nothing completes automatically.

Each activity can choose Off, at start, 5/10/15/30 minutes before, or a custom lead time. The app checks reminders every 30 seconds while open and whenever it regains focus or visibility. Upcoming and start notices appear in-app; start popups only appear within five minutes of the start. Overdue notices are generated for the current day. Notices use stable IDs so reopening does not duplicate them. A dismissed notice stays dismissed.

**Closed-app notifications are not guaranteed.** iOS may suspend the PWA; there is no server, Web Push subscription or background scheduler. Open the app to refresh reminders. No notification permission is requested.

## Local development

Requirements: Node.js 24 and npm. Tested on macOS 27.0.1 with Node 24.13.0.

```bash
npm ci
npm run dev
```

Open the URL printed by Vite. Useful checks:

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm run preview
```

The production app lives under `/my-routine/`, matching the GitHub repository path.

## Free deployment with GitHub Pages

The repository is `sadatnuman/my-routine`. The included GitHub Actions workflow builds and tests on pushes to `main`. It deploys only when the repository is public. GitHub Free supports Pages for public repositories; a private repository would need an eligible paid plan. No personal routine data is committed: only code and default templates are in Git. Local edits stay in each device's IndexedDB.

After the repository is public, open **Settings → Pages** on GitHub and choose **GitHub Actions** as the build and deployment source. Run the workflow or push a new commit. The intended URL is `https://sadatnuman.github.io/my-routine/`. Open it once online and wait for the app shell to cache. Check the workflow status before relying on the URL.

## Install on iPhone 14

1. Open the deployed HTTPS URL in **Safari**.
2. Tap **Share** (or Page Menu, then Share), then **Add to Home Screen**. If missing, use **Edit Actions** to add it.
3. Enable **Open as Web App** if offered, then tap **Add**.
4. Launch **My Routine** from the Home Screen while online once.
5. Turn on Airplane Mode, relaunch, edit an activity and reload to verify offline operation and local persistence.

Safari wording can vary by iOS version. If the web app toggle is absent, Add to Home Screen is still the supported path.

## Install on Mac

macOS Sonoma 14 or later supports Safari web apps. This Mac runs macOS 27.0.1.

1. Open the deployed HTTPS URL in **Safari**.
2. Choose **File → Add to Dock**, name it **My Routine**, then click **Add**.
3. Launch it from the Dock. Open once online, then test with Wi-Fi off.
4. Import a JSON backup in Settings if transferring the routine from another device.

On older macOS versions, use a browser bookmark instead of Safari Add to Dock.

## Backups and privacy

Use **Settings → Export backup** to save a JSON file regularly. On another device, open **Settings → Import backup** and select the file. Import validates its schema before asking to replace existing data. Export a fresh backup before importing or restoring defaults. The backup format is `my-routine-backup`, version `1`, with activities, completion records, notices and settings. It contains your personal edits and should be stored privately.

Mac and iPhone data are separate. Safari/iCloud does not sync this IndexedDB data. Clearing browser data, uninstalling the web app or storage eviction can remove it. The app requests persistent storage where available but cannot guarantee retention.

## Architecture

React + TypeScript + Vite + Tailwind CSS + Lucide icons. Dexie stores local records in IndexedDB. `src/lib/routine.ts` handles recurrence, status and open windows; `src/lib/notifications.ts` handles reminder rules and IDs; `src/storage/db.ts` handles schema, seed and backup validation. Vite PWA generates a versioned service worker and app shell cache. The app does not require a server after static deployment.
