const express = require('express');
const mongoose = require('mongoose');
const Survey = require('../models/Survey');
const asyncHandler = require('../middlewares/asyncHandler');
const AppError = require('../utils/AppError');

const router = express.Router();

// Public list of all active surveys
router.get('/surveys', asyncHandler(async (req, res) => {
	const surveys = await Survey.find({ status: 'active' }).select('title description slug createdAt status').lean();
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
	const { slug } = req.params;
	
	// Try to find by slug first
	let survey = await Survey.findOne({ slug, status: 'active' }).lean();
	
	// If not found by slug, try to find by ID (fallback for old links)
	if (!survey && mongoose.Types.ObjectId.isValid(slug)) {
		survey = await Survey.findOne({ _id: slug, status: 'active' }).lean();
	}
	
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

// Update survey status
router.patch('/surveys/:id/status', asyncHandler(async (req, res) => {
	const { status } = req.body;
	
	// Validate status value
	const validStatuses = ['draft', 'active', 'closed'];
	if (!status || !validStatuses.includes(status)) {
		throw new AppError('Invalid status. Must be one of: draft, active, closed', 400);
	}
	
	const survey = await Survey.findByIdAndUpdate(
		req.params.id, 
		{ status }, 
		{ new: true }
	);
	
	if (!survey) throw new AppError('Survey not found', 404);
	res.json(survey);
}));

module.exports = router;
