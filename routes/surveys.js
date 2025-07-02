const express = require('express');
const Survey = require('../models/Survey');

const router = express.Router();

// Public list of all surveys
router.get('/surveys', async (req, res) => {
  const surveys = await Survey.find().lean();
  res.json(surveys);
});

// Fetch a single survey by id
router.get('/surveys/:id', async (req, res) => {
  try {
    const survey = await Survey.findById(req.params.id).lean();
    if (!survey) return res.status(404).json({ error: 'not found' });
    res.json(survey);
  } catch (err) {
    res.status(400).json({ error: 'invalid id' });
  }
});

module.exports = router;
