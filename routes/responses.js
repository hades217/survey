const express = require('express');
const path = require('path');
const { readJson, writeJson } = require('../utils/file');
const Response = require('../models/Response');

const router = express.Router();
const RESPONSES_FILE = path.join(__dirname, '..', 'responses.json');

router.post('/response', (req, res) => {
  const responses = readJson(RESPONSES_FILE);
  responses.push({
    ...req.body,
    timestamp: new Date().toISOString()
  });
  writeJson(RESPONSES_FILE, responses);
  res.json({ success: true });
});

router.post('/surveys/:surveyId/responses', async (req, res) => {
  const { surveyId } = req.params;
  const { name, email, answers } = req.body;
  if (!name || !email || !answers) {
    return res.status(400).json({ error: 'invalid data' });
  }
  try {
    const response = await Response.create({ name, email, surveyId, answers });
    res.json(response);
  } catch (err) {
    res.status(400).json({ error: 'invalid data' });
  }
});

module.exports = router;
