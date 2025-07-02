# Survey Web App

This project collects event feedback using a simple REST API and a React front-end. The back-end is built with **Node.js 20**, **Express**, and **MongoDB**. The front-end is implemented in **React** with **TypeScript** and bundled using Vite.

## Features

- **Survey Form** – questions are defined in `questions.json` and submissions are stored in `responses.json`.
- **Admin Login** – environment variables `ADMIN_USERNAME` and `ADMIN_PASSWORD` control access.
- **Results View** – logged-in admins can see all responses.
- **Survey Management** – admins can create new surveys via the API backed by MongoDB.

## Requirements

- Node.js 20+
- npm

## Setup

1. Install dependencies for the server:
   ```bash
   npm install
   ```
   The server requires a running MongoDB instance. Configure the connection with
   the `MONGODB_URI` environment variable (defaults to `mongodb://localhost:27017/survey`).
2. Install front‑end dependencies and build the client:
   ```bash
   cd client
   npm install
   npm run build
   cd ..
   ```
3. Start the server:
   ```bash
   # ensure MONGODB_URI is set if your MongoDB isn't local
   node server.js
   ```
4. Open `http://localhost:5000` in your browser.

The default admin username and password are both `admin`/`password`. Change them before deploying.
