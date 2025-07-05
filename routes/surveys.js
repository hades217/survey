const express = require('express');
const mongoose = require('mongoose');
const Survey = require('../models/Survey');
const asyncHandler = require('../middlewares/asyncHandler');
const AppError = require('../utils/AppError');
const { ERROR_MESSAGES, SURVEY_STATUS, HTTP_STATUS, VALID_STATUSES } = require('../shared/constants');

const router = express.Router();

// Public list of all active surveys
router.get('/surveys', asyncHandler(async (req, res) => {
	const surveys = await Survey.find({ status: SURVEY_STATUS.ACTIVE }).select('title description slug createdAt status').lean();
	res.json(surveys);
}));

// Fetch a single survey by id
router.get('/surveys/:id', asyncHandler(async (req, res) => {
	const survey = await Survey.findById(req.params.id).lean();
	if (!survey) throw new AppError(ERROR_MESSAGES.SURVEY_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
	res.json(survey);
}));

// Fetch a single survey by slug (for public access)
router.get('/survey/:slug', asyncHandler(async (req, res) => {
	const { slug } = req.params;
	
	// Try to find by slug first
	let survey = await Survey.findOne({ slug, status: SURVEY_STATUS.ACTIVE }).lean();
	
	// If not found by slug, try to find by ID (fallback for old links)
	if (!survey && mongoose.Types.ObjectId.isValid(slug)) {
		survey = await Survey.findOne({ _id: slug, status: SURVEY_STATUS.ACTIVE }).lean();
	}
	
	if (!survey) throw new AppError(ERROR_MESSAGES.SURVEY_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
	res.json(survey);
}));

// Create a new survey
router.post('/surveys', asyncHandler(async (req, res) => {
	const survey = new Survey(req.body);
	await survey.save();
	res.status(HTTP_STATUS.CREATED).json(survey);
}));

// Update a survey
router.put('/surveys/:id', asyncHandler(async (req, res) => {
	const survey = await Survey.findByIdAndUpdate(req.params.id, req.body, { new: true });
	if (!survey) throw new AppError(ERROR_MESSAGES.SURVEY_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
	res.json(survey);
}));

// Delete a survey
router.delete('/surveys/:id', asyncHandler(async (req, res) => {
	const survey = await Survey.findByIdAndDelete(req.params.id);
	if (!survey) throw new AppError(ERROR_MESSAGES.SURVEY_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
	res.json({ message: 'Survey deleted successfully' });
}));

// Update survey status
router.patch('/surveys/:id/status', asyncHandler(async (req, res) => {
	const { status } = req.body;
	
	// Validate status value
	if (!status || !VALID_STATUSES.includes(status)) {
		throw new AppError(ERROR_MESSAGES.INVALID_STATUS, HTTP_STATUS.BAD_REQUEST);
	}
	
	const survey = await Survey.findByIdAndUpdate(
		req.params.id, 
		{ status }, 
		{ new: true }
	);
	
	if (!survey) throw new AppError(ERROR_MESSAGES.SURVEY_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
	res.json(survey);
}));

module.exports = router;
