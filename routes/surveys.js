const express = require('express');
const Survey = require('../models/Survey');
const asyncHandler = require('../middlewares/asyncHandler');
const AppError = require('../utils/AppError');

const router = express.Router();

// Public list of all active surveys
router.get('/surveys', asyncHandler(async (req, res) => {
	const surveys = await Survey.find({ isActive: true }).select('title description slug createdAt').lean();
	res.json(surveys);
}));

// Fetch a single survey by id
router.get('/surveys/:id', asyncHandler(async (req, res) => {
	const survey = await Survey.findById(req.params.id).lean();
	if (!survey) throw new AppError('Survey not found', 404);
	res.json(survey);
}));

// Fetch a single survey by slug (for public access)
router.get('/survey/:slug', asyncHandler(async (req, res) => {
	const survey = await Survey.findOne({ slug: req.params.slug, isActive: true }).lean();
	if (!survey) throw new AppError('Survey not found', 404);
	res.json(survey);
}));

// Create a new survey
router.post('/surveys', asyncHandler(async (req, res) => {
	const survey = new Survey(req.body);
	await survey.save();
	res.status(201).json(survey);
}));

// Update a survey
router.put('/surveys/:id', asyncHandler(async (req, res) => {
	const survey = await Survey.findByIdAndUpdate(req.params.id, req.body, { new: true });
	if (!survey) throw new AppError('Survey not found', 404);
	res.json(survey);
}));

// Delete a survey
router.delete('/surveys/:id', asyncHandler(async (req, res) => {
	const survey = await Survey.findByIdAndDelete(req.params.id);
	if (!survey) throw new AppError('Survey not found', 404);
	res.json({ message: 'Survey deleted successfully' });
}));

module.exports = router;
