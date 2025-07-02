# Survey Web App

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
   pip install -r requirements.txt
   ```
2. Run the application:
   ```bash
   python app.py
   ```
3. Open your browser at `http://localhost:5000` to access the survey.

The admin credentials are defined in `app.py` as `ADMIN_USERNAME` and `ADMIN_PASSWORD`. Change these defaults before deploying.
