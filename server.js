const express = require('express');
const session = require('express-session');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'password';

const QUESTIONS_FILE = path.join(__dirname, 'questions.json');
const RESPONSES_FILE = path.join(__dirname, 'responses.json');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: 'change-me',
  resave: false,
  saveUninitialized: false
}));

app.use(express.static('public'));

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (err) {
    return [];
  }
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

app.get('/api/questions', (req, res) => {
  const questions = readJson(QUESTIONS_FILE);
  res.json(questions);
});

app.post('/api/response', (req, res) => {
  const responses = readJson(RESPONSES_FILE);
  responses.push({
    ...req.body,
    timestamp: new Date().toISOString()
  });
  writeJson(RESPONSES_FILE, responses);
  res.json({ success: true });
});

app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    req.session.admin = true;
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false });
  }
});

app.get('/api/admin/responses', (req, res) => {
  if (!req.session.admin) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  const responses = readJson(RESPONSES_FILE);
  res.json(responses);
});

app.get('/api/admin/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
