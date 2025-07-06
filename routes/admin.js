const express = require('express');
const path = require('path');
const { readJson } = require('../utils/file');
const Survey = require('../models/Survey');
const Response = require('../models/Response');
const Invitation = require('../models/Invitation');
const User = require('../models/User');
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
	const { text, options, correctAnswer, points } = req.body;
	if (typeof text !== DATA_TYPES.STRING || !Array.isArray(options) || !options.every(o => typeof o === DATA_TYPES.STRING)) {
		return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: ERROR_MESSAGES.INVALID_DATA });
	}

	// Validate correctAnswer if provided
	if (correctAnswer !== undefined && (typeof correctAnswer !== DATA_TYPES.NUMBER || correctAnswer < 0 || correctAnswer >= options.length)) {
		return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: ERROR_MESSAGES.INVALID_CORRECT_ANSWER });
	}

	// Validate points if provided
	if (points !== undefined && (typeof points !== DATA_TYPES.NUMBER || points < 1)) {
		return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: 'Points must be a positive number' });
	}

	const survey = await Survey.findById(id);
	if (!survey) {
		throw new AppError(ERROR_MESSAGES.SURVEY_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
	}
	
	const question = { text, options };
	if (correctAnswer !== undefined) {
		question.correctAnswer = correctAnswer;
	}
	if (points !== undefined) {
		question.points = points;
	}
	
	survey.questions.push(question);
	await survey.save();
	res.json(survey);
}));

// Update scoring settings for a survey
router.put('/surveys/:id/scoring', asyncHandler(async (req, res) => {
	if (!req.session.admin) {
		return res.status(HTTP_STATUS.UNAUTHORIZED).json({ error: ERROR_MESSAGES.UNAUTHORIZED });
	}
	
	const { id } = req.params;
	const { 
		scoringMode, 
		passingThreshold, 
		showScore, 
		showCorrectAnswers, 
		showScoreBreakdown, 
		customScoringRules 
	} = req.body;
	
	// Validate scoring mode
	if (scoringMode && !['percentage', 'accumulated'].includes(scoringMode)) {
		return res.status(HTTP_STATUS.BAD_REQUEST).json({ 
			error: 'Invalid scoring mode. Must be "percentage" or "accumulated"' 
		});
	}
	
	// Validate passing threshold
	if (passingThreshold !== undefined && (typeof passingThreshold !== DATA_TYPES.NUMBER || passingThreshold < 0)) {
		return res.status(HTTP_STATUS.BAD_REQUEST).json({ 
			error: 'Passing threshold must be a non-negative number' 
		});
	}
	
	const survey = await Survey.findById(id);
	if (!survey) {
		throw new AppError(ERROR_MESSAGES.SURVEY_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
	}
	
	// Only allow scoring settings for quiz/assessment/iq types
	if (!['quiz', 'assessment', 'iq'].includes(survey.type)) {
		return res.status(HTTP_STATUS.BAD_REQUEST).json({ 
			error: 'Scoring settings are only available for quiz, assessment, and IQ test types' 
		});
	}
	
	// Update scoring settings
	const updatedScoringSettings = {
		...survey.scoringSettings,
		...(scoringMode && { scoringMode }),
		...(passingThreshold !== undefined && { passingThreshold }),
		...(showScore !== undefined && { showScore }),
		...(showCorrectAnswers !== undefined && { showCorrectAnswers }),
		...(showScoreBreakdown !== undefined && { showScoreBreakdown }),
		...(customScoringRules && { customScoringRules: { ...survey.scoringSettings.customScoringRules, ...customScoringRules } })
	};
	
	survey.scoringSettings = updatedScoringSettings;
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
	
	// Calculate aggregated statistics
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

	// Prepare individual user responses
	const userResponses = responses.map((response) => {
		const userAnswers = {};
		survey.questions.forEach((q) => {
			const ans = response.answers?.[q._id] || response.answers?.[String(q._id)] || response.answers?.[q.text];
			userAnswers[q.text] = ans || 'No answer';
		});
		
		return {
			_id: response._id,
			name: response.name,
			email: response.email,
			answers: userAnswers,
			createdAt: response.createdAt
		};
	});

	// Calculate total responses and completion rate
	const totalResponses = responses.length;
	const completionRate = survey.questions.length > 0 ? 
		(userResponses.filter(r => Object.values(r.answers).some(ans => ans !== 'No answer')).length / totalResponses * 100) : 0;

	res.json({
		aggregatedStats: stats,
		userResponses: userResponses,
		summary: {
			totalResponses,
			completionRate: parseFloat(completionRate.toFixed(2)),
			totalQuestions: survey.questions.length
		}
	});
}));

// Publish survey with distribution settings (admin only)
router.post('/surveys/:id/publish', asyncHandler(async (req, res) => {
	if (!req.session.admin) {
		return res.status(HTTP_STATUS.UNAUTHORIZED).json({ error: ERROR_MESSAGES.UNAUTHORIZED });
	}
	
	const { 
		distributionMode, 
		targetUsers, 
		targetEmails, 
		maxResponses, 
		expiresAt,
		distributionSettings 
	} = req.body;
	
	const survey = await Survey.findById(req.params.id);
	if (!survey) {
		throw new AppError(ERROR_MESSAGES.SURVEY_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
	}
	
	// Update survey status to active
	survey.status = 'active';
	survey.publishingSettings = {
		publishedAt: new Date(),
		publishedBy: req.session.adminId || null
	};
	
	// Update distribution settings if provided
	if (distributionSettings) {
		survey.distributionSettings = {
			...survey.distributionSettings,
			...distributionSettings
		};
	}
	
	await survey.save();
	
	// Create invitation if distribution mode is specified
	if (distributionMode) {
		const invitation = await Invitation.create({
			surveyId: survey._id,
			distributionMode,
			targetUsers: targetUsers || [],
			targetEmails: targetEmails || [],
			maxResponses,
			expiresAt: expiresAt ? new Date(expiresAt) : null,
			createdBy: req.session.adminId || null
		});
		
		await invitation.populate('surveyId', 'title description');
		await invitation.populate('targetUsers', 'name email studentId');
		
		res.json({
			survey,
			invitation
		});
	} else {
		res.json({ survey });
	}
}));

// Get survey invitations (admin only)
router.get('/surveys/:id/invitations', asyncHandler(async (req, res) => {
	if (!req.session.admin) {
		return res.status(HTTP_STATUS.UNAUTHORIZED).json({ error: ERROR_MESSAGES.UNAUTHORIZED });
	}
	
	const invitations = await Invitation.find({ surveyId: req.params.id })
		.populate('targetUsers', 'name email studentId')
		.sort({ createdAt: -1 });
	
	res.json(invitations);
}));

// Create invitation for survey (admin only)
router.post('/surveys/:id/invitations', asyncHandler(async (req, res) => {
	if (!req.session.admin) {
		return res.status(HTTP_STATUS.UNAUTHORIZED).json({ error: ERROR_MESSAGES.UNAUTHORIZED });
	}
	
	const { 
		distributionMode, 
		targetUsers, 
		targetEmails, 
		maxResponses, 
		expiresAt 
	} = req.body;
	
	const survey = await Survey.findById(req.params.id);
	if (!survey) {
		throw new AppError(ERROR_MESSAGES.SURVEY_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
	}
	
	// Validate distribution mode
	if (!['open', 'targeted', 'link'].includes(distributionMode)) {
		return res.status(HTTP_STATUS.BAD_REQUEST).json({ 
			error: 'Invalid distribution mode' 
		});
	}
	
	// For targeted mode, validate target users/emails
	if (distributionMode === 'targeted' && !targetUsers && !targetEmails) {
		return res.status(HTTP_STATUS.BAD_REQUEST).json({ 
			error: 'Target users or emails are required for targeted distribution' 
		});
	}
	
	const invitation = await Invitation.create({
		surveyId: req.params.id,
		distributionMode,
		targetUsers: targetUsers || [],
		targetEmails: targetEmails || [],
		maxResponses,
		expiresAt: expiresAt ? new Date(expiresAt) : null,
		createdBy: req.session.adminId || null
	});
	
	await invitation.populate('surveyId', 'title description');
	await invitation.populate('targetUsers', 'name email studentId');
	
	res.json(invitation);
}));

// Get dashboard statistics (admin only)
router.get('/dashboard/statistics', asyncHandler(async (req, res) => {
	if (!req.session.admin) {
		return res.status(HTTP_STATUS.UNAUTHORIZED).json({ error: ERROR_MESSAGES.UNAUTHORIZED });
	}
	
	const [
		totalSurveys,
		activeSurveys,
		totalInvitations,
		activeInvitations,
		totalUsers,
		totalResponses
	] = await Promise.all([
		Survey.countDocuments(),
		Survey.countDocuments({ status: 'active' }),
		Invitation.countDocuments(),
		Invitation.countDocuments({ isActive: true }),
		User.countDocuments({ isActive: true }),
		Response.countDocuments()
	]);
	
	// Get survey statistics by type
	const surveysByType = await Survey.aggregate([
		{
			$group: {
				_id: '$type',
				count: { $sum: 1 }
			}
		}
	]);
	
	// Get invitation statistics by distribution mode
	const invitationsByMode = await Invitation.aggregate([
		{
			$group: {
				_id: '$distributionMode',
				count: { $sum: 1 }
			}
		}
	]);
	
	// Get user statistics by role
	const usersByRole = await User.aggregate([
		{ $match: { isActive: true } },
		{
			$group: {
				_id: '$role',
				count: { $sum: 1 }
			}
		}
	]);
	
	// Get recent activity
	const recentSurveys = await Survey.find()
		.sort({ createdAt: -1 })
		.limit(5)
		.select('title status createdAt');
	
	const recentInvitations = await Invitation.find()
		.populate('surveyId', 'title')
		.sort({ createdAt: -1 })
		.limit(5)
		.select('distributionMode currentResponses createdAt');
	
	res.json({
		overview: {
			totalSurveys,
			activeSurveys,
			totalInvitations,
			activeInvitations,
			totalUsers,
			totalResponses
		},
		charts: {
			surveysByType,
			invitationsByMode,
			usersByRole
		},
		recent: {
			surveys: recentSurveys,
			invitations: recentInvitations
		}
	});
}));

router.get('/logout', (req, res) => {
	req.session.destroy(() => {
		res.json({ success: true });
	});
});

module.exports = router;
