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

// Get statistics for a specific survey
router.get('/surveys/:surveyId/statistics', async (req, res) => {
  if (!req.session.admin) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  const { surveyId } = req.params;
  const survey = await Survey.findById(surveyId).lean();
  if (!survey) {
    return res.status(404).json({ error: 'not found' });
  }

  const responses = await Response.find({ surveyId }).lean();
  const stats = survey.questions.map((q) => {
    const counts = {};
    q.options.forEach((opt) => {
      counts[opt] = 0;
    });
    responses.forEach((r) => {
      const ans = r.answers?.[q._id] || r.answers?.[String(q._id)] || r.answers?.[q.text];
      if (ans && counts.hasOwnProperty(ans)) {
        counts[ans] += 1;
      }
    });
    return { question: q.text, options: counts };
  });

  res.json(stats);
});

router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

module.exports = router;
