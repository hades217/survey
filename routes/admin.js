const express = require('express');
const path = require('path');
const { readJson } = require('../utils/file');
const Survey = require('../models/Survey');
const Response = require('../models/Response');
const asyncHandler = require('../middlewares/asyncHandler');
const AppError = require('../utils/AppError');

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

// Create a new survey
router.post('/surveys', asyncHandler(async (req, res) => {
  if (!req.session.admin) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  const survey = await Survey.create(req.body);
  res.json(survey);
}));

// List all surveys
router.get('/surveys', asyncHandler(async (req, res) => {
  if (!req.session.admin) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  const surveys = await Survey.find().lean();
  res.json(surveys);
}));

// Add a question to an existing survey
router.put('/surveys/:id/questions', asyncHandler(async (req, res) => {
  if (!req.session.admin) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  const { id } = req.params;
  const { text, options } = req.body;
  if (typeof text !== 'string' || !Array.isArray(options) || !options.every(o => typeof o === 'string')) {
    return res.status(400).json({ error: 'invalid data' });
  }

  const survey = await Survey.findById(id);
  if (!survey) {
    throw new AppError('Survey not found', 404);
  }
  survey.questions.push({ text, options });
  await survey.save();
  res.json(survey);
}));

router.get('/responses', asyncHandler(async (req, res) => {
  if (!req.session.admin) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  const fileResponses = readJson(RESPONSES_FILE);
  const dbResponses = await Response.find().lean();
  res.json([...fileResponses, ...dbResponses]);
}));

// Get statistics for a specific survey
router.get('/surveys/:surveyId/statistics', asyncHandler(async (req, res) => {
  if (!req.session.admin) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  const { surveyId } = req.params;
  const survey = await Survey.findById(surveyId).lean();
  if (!survey) {
    throw new AppError('Survey not found', 404);
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
}));

router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

module.exports = router;
