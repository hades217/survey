# Survey Web App

A simple Node.js and React-based application for collecting event feedback. Tailwind CSS is used for styling. Questions are configurable via `questions.json`. Admins can log in to view all submissions.

## Features

- **Survey Form**: Participants answer questions defined in `questions.json`.
- **Admin Login**: Admin credentials set via environment variables `ADMIN_USERNAME` and `ADMIN_PASSWORD`.
- **Results View**: After logging in, admins can see all responses in a table.

## Requirements

- Node.js 14+
=======
This is a simple Flask-based web application for collecting event feedback via a survey form. Participants submit their answers after an event, and an administrator can log in to view all collected responses.

## Features

- **Survey Form**: Accessible at `/survey` (or `/`). Stores answers in a local SQLite database.
- **Admin Login**: Admin can log in at `/admin/login` to view results at `/admin`.
- **Results Table**: Admin page lists all responses and timestamps.

## Requirements

- Python 3.8+
- Dependencies listed in `requirements.txt`

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
=======
   pip install -r requirements.txt
   ```
2. Run the application:
   ```bash
   python app.py
   ```
3. Open your browser at `http://localhost:5000` to access the survey.

The admin credentials are defined in `app.py` as `ADMIN_USERNAME` and `ADMIN_PASSWORD`. Change these defaults before deploying.