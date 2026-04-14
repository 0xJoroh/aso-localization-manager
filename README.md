# ASO Localization Manager

<p align="center">
  A focused workspace for writing, reviewing, and tracking App Store localization copy country by country.
</p>

<p align="center">
  <img alt="Next.js" src="https://img.shields.io/badge/Next.js-16-black?style=flat-square">
  <img alt="React" src="https://img.shields.io/badge/React-19-149eca?style=flat-square">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5-3178c6?style=flat-square">
  <img alt="Local-first" src="https://img.shields.io/badge/Data-Local%20first-1f8f6a?style=flat-square">
</p>

## What this app is

ASO Localization Manager is a small, practical tool for app teams working on App Store Optimization across multiple locales.

Instead of juggling spreadsheets, notes, and copy docs, it gives you one place to:

- write your `title`, `subtitle`, `keywords`, and `description`
- move through Apple App Store localizations one by one
- keep an eye on character limits
- brainstorm keywords beside the copy you are writing
- spot when the same keyword shows up too often across localized metadata

It is designed to feel more like a writing workspace than an admin panel.

## Why it exists

Writing ASO copy across many markets gets messy fast. You need to stay within strict App Store limits, keep terminology consistent, and avoid repeating the same ideas everywhere.

This app helps make that process calmer and more visible.

## At a glance

```text
Brainstorm keywords
        |
        v
Pick a localization
        |
        v
Write title / subtitle / keywords / description
        |
        v
Check limits, completion, and duplicate usage
```

## Features

| Feature | What it does |
| --- | --- |
| Localization sidebar | Browse and search supported App Store localizations quickly |
| Character limit feedback | Shows remaining characters for each metadata field |
| Completion tracking | Marks localizations as complete when all fields are filled and valid |
| Brainstorm keyword panel | Capture keyword ideas with optional scores in a lightweight tag-style input |
| Duplicate keyword awareness | Highlights whether brainstormed keywords are unused, used once, or repeated |
| Local persistence | Saves your work in the browser so you can continue where you left off |

## Who it is for

- ASO specialists
- indie app founders
- growth teams
- marketers working with translators or localization partners
- anyone preparing App Store metadata in multiple languages

## How it works

Each localization has its own writing space. You can switch between locales from the sidebar, fill in the required App Store fields, and keep a brainstorm list next to the metadata you are drafting.

The app automatically validates field lengths and keeps progress visible as you go. It also compares brainstormed keywords against your title, subtitle, and keyword fields so repeated usage is easier to catch early.

## Tech stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- Zustand for local state and persistence
- Zod for validation

## Running locally

```bash
bun install
bun dev
```

Then open `http://localhost:3000`.

If you prefer npm:

```bash
npm install
npm run dev
```

## Current scope

This project is currently a local-first editing tool. It does not connect to App Store Connect, sync data to a backend, or manage team collaboration yet.

That makes it fast, simple, and easy to run privately.

## Screens you can expect

- a searchable localization sidebar with completion states
- an editor for App Store metadata fields
- a brainstorm area for keyword ideas and scores
- lightweight feedback for limits and repeated keyword usage

## License

Add your preferred license before publishing publicly.
