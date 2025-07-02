# Survey Web App

A simple Node.js and React-based application for collecting event feedback. Tailwind CSS is used for styling. Questions are configurable via `questions.json`. Admins can log in to view all submissions.

## Features

- **Survey Form**: Participants answer questions defined in `questions.json`.
- **Admin Login**: Admin credentials set via environment variables `ADMIN_USERNAME` and `ADMIN_PASSWORD`.
- **Results View**: After logging in, admins can see all responses in a table.

## Requirements

- Node.js 14+

## Setup

1. Install dependencies:
   ```bash
   npm install express express-session
   ```
2. Start the server:
   ```bash
   node server.js
   ```
3. Open `http://localhost:5000` in your browser for the survey form. Visit `http://localhost:5000/admin.html` for the admin page.

The default admin username and password are both `admin`/`password`. Change them before deploying.
