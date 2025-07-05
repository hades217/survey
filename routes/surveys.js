const express = require('express');
const Survey = require('../models/Survey');
const asyncHandler = require('../middlewares/asyncHandler');
const AppError = require('../utils/AppError');

const router = express.Router();

// Public list of all surveys
router.get('/surveys', asyncHandler(async (req, res) => {
  const surveys = await Survey.find().lean();
  res.json(surveys);
}));

// Fetch a single survey by id
router.get('/surveys/:id', asyncHandler(async (req, res) => {
  const survey = await Survey.findById(req.params.id).lean();
  if (!survey) throw new AppError('Survey not found', 404);
  res.json(survey);
}));

module.exports = router;
