const express = require('express');
const path = require('path');
const { readJson } = require('../utils/file');
const Survey = require('../models/Survey');
const Response = require('../models/Response');
const asyncHandler = require('../middlewares/asyncHandler');
const AppError = require('../utils/AppError');
const { ERROR_MESSAGES, DATA_TYPES, HTTP_STATUS } = require('../shared/constants');

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
		res.status(HTTP_STATUS.UNAUTHORIZED).json({ success: false });
	}
});

// Create a new survey
router.post('/surveys', asyncHandler(async (req, res) => {
	if (!req.session.admin) {
		return res.status(HTTP_STATUS.UNAUTHORIZED).json({ error: ERROR_MESSAGES.UNAUTHORIZED });
	}
	const survey = await Survey.create(req.body);
	res.json(survey);
}));

// List all surveys
router.get('/surveys', asyncHandler(async (req, res) => {
	if (!req.session.admin) {
		return res.status(HTTP_STATUS.UNAUTHORIZED).json({ error: ERROR_MESSAGES.UNAUTHORIZED });
	}
	const surveys = await Survey.find().lean();
	res.json(surveys);
}));

// Update a survey
router.put('/surveys/:id', asyncHandler(async (req, res) => {
	if (!req.session.admin) {
		return res.status(HTTP_STATUS.UNAUTHORIZED).json({ error: ERROR_MESSAGES.UNAUTHORIZED });
	}
	const survey = await Survey.findByIdAndUpdate(req.params.id, req.body, { new: true });
	if (!survey) {
		throw new AppError(ERROR_MESSAGES.SURVEY_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
	}
	res.json(survey);
}));

// Delete a survey
router.delete('/surveys/:id', asyncHandler(async (req, res) => {
	if (!req.session.admin) {
		return res.status(HTTP_STATUS.UNAUTHORIZED).json({ error: ERROR_MESSAGES.UNAUTHORIZED });
	}
	const survey = await Survey.findByIdAndDelete(req.params.id);
	if (!survey) {
		throw new AppError(ERROR_MESSAGES.SURVEY_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
	}
	// Also delete all responses for this survey
	await Response.deleteMany({ surveyId: req.params.id });
	res.json({ message: 'Survey deleted successfully' });
}));

// Add a question to an existing survey
router.put('/surveys/:id/questions', asyncHandler(async (req, res) => {
	if (!req.session.admin) {
		return res.status(HTTP_STATUS.UNAUTHORIZED).json({ error: ERROR_MESSAGES.UNAUTHORIZED });
	}
	const { id } = req.params;
	const { text, options, correctAnswer } = req.body;
	if (typeof text !== DATA_TYPES.STRING || !Array.isArray(options) || !options.every(o => typeof o === DATA_TYPES.STRING)) {
		return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: ERROR_MESSAGES.INVALID_DATA });
	}

	// Validate correctAnswer if provided
	if (correctAnswer !== undefined && (typeof correctAnswer !== DATA_TYPES.NUMBER || correctAnswer < 0 || correctAnswer >= options.length)) {
		return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: ERROR_MESSAGES.INVALID_CORRECT_ANSWER });
	}

	const survey = await Survey.findById(id);
	if (!survey) {
		throw new AppError(ERROR_MESSAGES.SURVEY_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
	}
	
	const question = { text, options };
	if (correctAnswer !== undefined) {
		question.correctAnswer = correctAnswer;
	}
	
	survey.questions.push(question);
	await survey.save();
	res.json(survey);
}));

router.get('/responses', asyncHandler(async (req, res) => {
	if (!req.session.admin) {
		return res.status(HTTP_STATUS.UNAUTHORIZED).json({ error: ERROR_MESSAGES.UNAUTHORIZED });
	}
	const fileResponses = readJson(RESPONSES_FILE);
	const dbResponses = await Response.find().lean();
	res.json([...fileResponses, ...dbResponses]);
}));

// Get statistics for a specific survey
router.get('/surveys/:surveyId/statistics', asyncHandler(async (req, res) => {
	if (!req.session.admin) {
		return res.status(HTTP_STATUS.UNAUTHORIZED).json({ error: ERROR_MESSAGES.UNAUTHORIZED });
	}
	const { surveyId } = req.params;
	const survey = await Survey.findById(surveyId).lean();
	if (!survey) {
		throw new AppError(ERROR_MESSAGES.SURVEY_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
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
