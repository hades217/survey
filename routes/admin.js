const express = require('express');
const path = require('path');
const { readJson } = require('../utils/file');
const Survey = require('../models/Survey');
const Response = require('../models/Response');

const router = express.Router();
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'password';
const RESPONSES_FILE = path.join(__dirname, '..', 'responses.json');

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    req.session.admin = true;
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false });
  }
});

router.post('/surveys', async (req, res) => {
  if (!req.session.admin) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  try {
    const survey = await Survey.create(req.body);
    res.json(survey);
  } catch (err) {
    res.status(400).json({ error: 'invalid data' });
  }
});

router.get('/responses', async (req, res) => {
  if (!req.session.admin) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  const fileResponses = readJson(RESPONSES_FILE);
  const dbResponses = await Response.find().lean();
  res.json([...fileResponses, ...dbResponses]);
});

router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

module.exports = router;
