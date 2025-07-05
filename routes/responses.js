const express = require('express');
const path = require('path');
const { readJson, writeJson } = require('../utils/file');
const { submitSurveyResponse } = require('../controllers/surveyController');

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

router.post('/surveys/:surveyId/responses', submitSurveyResponse);

module.exports = router;
