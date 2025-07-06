const express = require('express');
const mongoose = require('mongoose');
const Survey = require('../models/Survey');
const QuestionBank = require('../models/QuestionBank');
const Response = require('../models/Response');
const asyncHandler = require('../middlewares/asyncHandler');
const AppError = require('../utils/AppError');
const {
	ERROR_MESSAGES,
	SURVEY_STATUS,
	HTTP_STATUS,
	VALID_STATUSES,
} = require('../shared/constants');

const router = express.Router();

// Public list of all active surveys
router.get(
	'/surveys',
	asyncHandler(async (req, res) => {
		const surveys = await Survey.find({ status: SURVEY_STATUS.ACTIVE })
			.select('title description slug createdAt status')
			.lean();
		res.json(surveys);
	})
);

// Fetch a single survey by id
router.get(
	'/surveys/:id',
	asyncHandler(async (req, res) => {
		const survey = await Survey.findById(req.params.id).lean();
		if (!survey) throw new AppError(ERROR_MESSAGES.SURVEY_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
		res.json(survey);
	})
);

// Fetch a single survey by slug (for public access)
router.get(
	'/survey/:slug',
	asyncHandler(async (req, res) => {
		const { slug } = req.params;

		// Try to find by slug first
		let survey = await Survey.findOne({ slug, status: SURVEY_STATUS.ACTIVE }).lean();

		// If not found by slug, try to find by ID (fallback for old links)
		if (!survey && mongoose.Types.ObjectId.isValid(slug)) {
			survey = await Survey.findOne({ _id: slug, status: SURVEY_STATUS.ACTIVE }).lean();
		}

		if (!survey) throw new AppError(ERROR_MESSAGES.SURVEY_NOT_FOUND, HTTP_STATUS.NOT_FOUND);

		// For question bank surveys, don't include actual questions in the initial response
		// Questions will be fetched separately when the user starts the survey
		if (survey.sourceType === 'question_bank') {
			survey.questions = []; // Clear questions for security
		}

		res.json(survey);
	})
);

// Get questions for a survey (handles both manual and question bank modes)
router.get(
	'/survey/:slug/questions',
	asyncHandler(async (req, res) => {
		const { slug } = req.params;
		const { email, attempt } = req.query;

		// Find the survey
		let survey = await Survey.findOne({ slug, status: SURVEY_STATUS.ACTIVE });

		if (!survey && mongoose.Types.ObjectId.isValid(slug)) {
			survey = await Survey.findOne({ _id: slug, status: SURVEY_STATUS.ACTIVE });
		}

		if (!survey) throw new AppError(ERROR_MESSAGES.SURVEY_NOT_FOUND, HTTP_STATUS.NOT_FOUND);

		let questions = [];

		if (survey.sourceType === 'manual') {
			// For manual surveys, return the questions directly
			questions = survey.questions;
		} else if (survey.sourceType === 'question_bank') {
			// For question bank surveys, we need to handle random selection

			// Check if user has already started this survey
			const existingResponse = await Response.findOne({
				surveyId: survey._id,
				email: email,
				// If multiple attempts are allowed, find the specific attempt
				...(attempt && { attempt: parseInt(attempt) }),
			});

			if (existingResponse && existingResponse.selectedQuestions.length > 0) {
				// User has already started, use their selected questions
				questions = existingResponse.selectedQuestions.map(sq => sq.questionData);
			} else {
				// New attempt - randomly select questions from the question bank
				const questionBank = await QuestionBank.findById(survey.questionBankId);

				if (!questionBank) {
					throw new AppError('Question bank not found', HTTP_STATUS.NOT_FOUND);
				}

				// Randomly select questions
				const questionCount = Math.min(
					survey.questionCount || questionBank.questions.length,
					questionBank.questions.length
				);
				const shuffled = [...questionBank.questions].sort(() => 0.5 - Math.random());
				const selectedQuestions = shuffled.slice(0, questionCount);

				questions = selectedQuestions;

				// If email is provided, create a response record to lock in the selected questions
				if (email) {
					const response = new Response({
						name: 'User', // Will be updated when they submit
						email: email,
						surveyId: survey._id,
						answers: new Map(),
						selectedQuestions: selectedQuestions.map((q, index) => ({
							originalQuestionId: q._id,
							questionIndex: index,
							questionData: {
								text: q.text,
								type: q.type,
								options: q.options,
								correctAnswer: q.correctAnswer,
								explanation: q.explanation,
								points: q.points,
								tags: q.tags,
								difficulty: q.difficulty,
							},
						})),
					});

					await response.save();
				}
			}
		}

		res.json({
			questions,
			totalQuestions: questions.length,
			sourceType: survey.sourceType,
		});
	})
);

// Create a new survey
router.post(
	'/surveys',
	asyncHandler(async (req, res) => {
		const survey = new Survey(req.body);
		await survey.save();
		res.status(HTTP_STATUS.CREATED).json(survey);
	})
);

// Update a survey
router.put(
	'/surveys/:id',
	asyncHandler(async (req, res) => {
		const survey = await Survey.findByIdAndUpdate(req.params.id, req.body, { new: true });
		if (!survey) throw new AppError(ERROR_MESSAGES.SURVEY_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
		res.json(survey);
	})
);

// Delete a survey
router.delete(
	'/surveys/:id',
	asyncHandler(async (req, res) => {
		const survey = await Survey.findByIdAndDelete(req.params.id);
		if (!survey) throw new AppError(ERROR_MESSAGES.SURVEY_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
		res.json({ message: 'Survey deleted successfully' });
	})
);

// Update survey status
router.patch(
	'/surveys/:id/status',
	asyncHandler(async (req, res) => {
		const { status } = req.body;

		// Validate status value
		if (!status || !VALID_STATUSES.includes(status)) {
			throw new AppError(ERROR_MESSAGES.INVALID_STATUS, HTTP_STATUS.BAD_REQUEST);
		}

		const survey = await Survey.findByIdAndUpdate(req.params.id, { status }, { new: true });

		if (!survey) throw new AppError(ERROR_MESSAGES.SURVEY_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
		res.json(survey);
	})
);

module.exports = router;
