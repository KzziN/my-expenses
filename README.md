# My Expenses

A personal expense tracker for fixed and variable spending, organized by month and category. It is a static, installable web app (PWA): no sign-up, no backend, works offline after the first load.

## Features

- Log **fixed** and **variable** expenses
- Categories and monthly totals
- History with per-entry deletion
- Export and import backups as a file
- Works offline after the first visit (service worker)
- Installable on phone or desktop home screen

## Running locally

There is no build step and no dependencies. Serve the folder with any static server:

```bash
npx serve .
```

Or open `index.html` directly in a browser for a quick preview. To install it as an app, serve it over HTTPS or `localhost`.

## Install on a phone

1. Open the app in Safari (iPhone) or Chrome (Android).
2. Tap **Share** → **Add to Home Screen** (iPhone) or the browser menu → **Install app** (Android).

## Privacy

Expenses are stored only in the browser's `localStorage`. Nothing is sent to a server. Clearing browser data deletes the records, so export a backup regularly.

## Project structure

| File | Purpose |
|---|---|
| `index.html` | Screen layout and the new-expense dialog |
| `app.js` | Business rules, rendering and storage |
| `styles.css` | Styling |
| `sw.js` | Service worker for offline use |
| `manifest.webmanifest` | Install metadata |
