const express = require('express');
const path = require('path');
const jwt = require('jsonwebtoken');
const { readJson } = require('../utils/file');
const Survey = require('../models/Survey');
const Response = require('../models/Response');
const Invitation = require('../models/Invitation');
const User = require('../models/User');
const asyncHandler = require('../middlewares/asyncHandler');
const AppError = require('../utils/AppError');
const { ERROR_MESSAGES, DATA_TYPES, HTTP_STATUS } = require('../shared/constants');
const { JWT_SECRET, jwtAuth } = require('../middlewares/jwtAuth');

const router = express.Router();
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'password';
const RESPONSES_FILE = path.join(__dirname, '..', 'responses.json');

router.get('/check-auth', (req, res) => {
	// This endpoint is now handled by JWT middleware
	// For backward compatibility, we'll keep it but it should be called with JWT
	const authHeader = req.headers.authorization;
	
	if (!authHeader || !authHeader.startsWith('Bearer ')) {
		return res.status(HTTP_STATUS.UNAUTHORIZED).json({ 
			success: false, 
			authenticated: false 
		});
	}
	
	const token = authHeader.split(' ')[1];
	
	try {
		const payload = jwt.verify(token, JWT_SECRET);
		res.json({ 
			success: true, 
			authenticated: true,
			user: payload
		});
	} catch (error) {
		res.status(HTTP_STATUS.UNAUTHORIZED).json({ 
			success: false, 
			authenticated: false 
		});
	}
});

router.post('/login', (req, res) => {
	const { username, password } = req.body;
	if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
		// Generate JWT token instead of using session
		const token = jwt.sign(
			{ 
				id: 'admin', // Admin user ID
				username: username,
				role: 'admin'
			}, 
			JWT_SECRET, 
			{ expiresIn: '7d' }
		);
		res.json({ 
			success: true, 
			token,
			user: {
				id: 'admin',
				username: username,
				role: 'admin'
			}
		});
	} else {
		res.status(HTTP_STATUS.UNAUTHORIZED).json({ success: false });
	}
});

// Create a new survey
router.post(
	'/surveys',
	jwtAuth,
	asyncHandler(async (req, res) => {

		// Generate slug after validating the request data
		const surveyData = { ...req.body };
		if (surveyData.title && !surveyData.slug) {
			surveyData.slug = await Survey.generateSlug(surveyData.title);
		}

		// Ensure isActive and status are in sync
		if (surveyData.status) {
			surveyData.isActive = surveyData.status === 'active';
		} else if (surveyData.isActive !== undefined) {
			surveyData.status = surveyData.isActive ? 'active' : 'draft';
		}

		const survey = new Survey(surveyData);
		await survey.save();
		res.json(survey);
	})
);

// List all surveys
router.get(
	'/surveys',
	jwtAuth,
	asyncHandler(async (req, res) => {
		const surveys = await Survey.find().lean();
		res.json(surveys);
	})
);

// Update a survey
router.put(
	'/surveys/:id',
	jwtAuth,
	asyncHandler(async (req, res) => {
		// Ensure isActive and status are in sync
		const updateData = { ...req.body };
		if (updateData.status) {
			updateData.isActive = updateData.status === 'active';
		} else if (updateData.isActive !== undefined) {
			updateData.status = updateData.isActive ? 'active' : 'draft';
		}

		const survey = await Survey.findByIdAndUpdate(req.params.id, updateData, { new: true });
		if (!survey) {
			throw new AppError(ERROR_MESSAGES.SURVEY_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
		}
		res.json(survey);
	})
);

// Delete a survey
router.delete(
	'/surveys/:id',
	jwtAuth,
	asyncHandler(async (req, res) => {
		const survey = await Survey.findByIdAndDelete(req.params.id);
		if (!survey) {
			throw new AppError(ERROR_MESSAGES.SURVEY_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
		}
		// Also delete all responses for this survey
		await Response.deleteMany({ surveyId: req.params.id });
		res.json({ message: 'Survey deleted successfully' });
	})
);

// Add a question to an existing survey
router.put(
	'/surveys/:id/questions',
	jwtAuth,
	asyncHandler(async (req, res) => {
		const { id } = req.params;
		const { text, options, correctAnswer, points } = req.body;
		if (
			typeof text !== DATA_TYPES.STRING ||
			!Array.isArray(options) ||
			!options.every(o => typeof o === DATA_TYPES.STRING)
		) {
			return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: ERROR_MESSAGES.INVALID_DATA });
		}

		// Validate correctAnswer if provided
		if (correctAnswer !== undefined && correctAnswer !== null) {
			// Support both single answer (number) and multiple answers (array)
			if (Array.isArray(correctAnswer)) {
				// Multiple choice: validate array of indices
				if (!correctAnswer.every(idx => 
					typeof idx === DATA_TYPES.NUMBER && 
					idx >= 0 && 
					idx < options.length
				)) {
					return res
						.status(HTTP_STATUS.BAD_REQUEST)
						.json({ error: ERROR_MESSAGES.INVALID_CORRECT_ANSWER });
				}
			} else {
				// Single choice: validate single index
				if (typeof correctAnswer !== DATA_TYPES.NUMBER ||
					correctAnswer < 0 ||
					correctAnswer >= options.length) {
					return res
						.status(HTTP_STATUS.BAD_REQUEST)
						.json({ error: ERROR_MESSAGES.INVALID_CORRECT_ANSWER });
				}
			}
		}

		// Validate points if provided
		if (points !== undefined && (typeof points !== DATA_TYPES.NUMBER || points < 1)) {
			return res
				.status(HTTP_STATUS.BAD_REQUEST)
				.json({ error: 'Points must be a positive number' });
		}

		const survey = await Survey.findById(id);
		if (!survey) {
			throw new AppError(ERROR_MESSAGES.SURVEY_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
		}

		// Determine question type and normalize correctAnswer format
		let questionType, normalizedCorrectAnswer;
		
		if (Array.isArray(correctAnswer) && correctAnswer.length > 1) {
			// Multiple correct answers = multiple choice
			questionType = 'multiple_choice';
			normalizedCorrectAnswer = correctAnswer;
		} else if (Array.isArray(correctAnswer) && correctAnswer.length === 1) {
			// Single answer in array format = single choice
			questionType = 'single_choice';
			normalizedCorrectAnswer = correctAnswer[0];
		} else {
			// Single answer in number format = single choice
			questionType = 'single_choice';
			normalizedCorrectAnswer = correctAnswer;
		}

		const question = { 
			text, 
			options,
			type: questionType
		};
		
		if (correctAnswer !== undefined) {
			question.correctAnswer = normalizedCorrectAnswer;
		}
		if (points !== undefined) {
			question.points = points;
		}

		survey.questions.push(question);
		await survey.save();
		res.json(survey);
	})
);

// Update a question in an existing survey
router.put(
	'/surveys/:id/questions/:questionIndex',
	jwtAuth,
	asyncHandler(async (req, res) => {
		const { id, questionIndex } = req.params;
		const { text, options, correctAnswer, points } = req.body;
		
		// Validate input
		if (
			typeof text !== DATA_TYPES.STRING ||
			!Array.isArray(options) ||
			!options.every(o => typeof o === DATA_TYPES.STRING)
		) {
			return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: ERROR_MESSAGES.INVALID_DATA });
		}

		// Validate correctAnswer if provided (same logic as add question)
		if (correctAnswer !== undefined && correctAnswer !== null) {
			if (Array.isArray(correctAnswer)) {
				if (!correctAnswer.every(idx => 
					typeof idx === DATA_TYPES.NUMBER && 
					idx >= 0 && 
					idx < options.length
				)) {
					return res
						.status(HTTP_STATUS.BAD_REQUEST)
						.json({ error: ERROR_MESSAGES.INVALID_CORRECT_ANSWER });
				}
			} else {
				if (typeof correctAnswer !== DATA_TYPES.NUMBER ||
					correctAnswer < 0 ||
					correctAnswer >= options.length) {
					return res
						.status(HTTP_STATUS.BAD_REQUEST)
						.json({ error: ERROR_MESSAGES.INVALID_CORRECT_ANSWER });
				}
			}
		}

		// Validate points if provided
		if (points !== undefined && (typeof points !== DATA_TYPES.NUMBER || points < 1)) {
			return res
				.status(HTTP_STATUS.BAD_REQUEST)
				.json({ error: 'Points must be a positive number' });
		}

		const survey = await Survey.findById(id);
		if (!survey) {
			throw new AppError(ERROR_MESSAGES.SURVEY_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
		}

		const qIndex = parseInt(questionIndex, 10);
		if (qIndex < 0 || qIndex >= survey.questions.length) {
			return res
				.status(HTTP_STATUS.BAD_REQUEST)
				.json({ error: 'Invalid question index' });
		}

		const requiresAnswer = ['quiz', 'assessment', 'iq'].includes(survey.type);

		if (requiresAnswer) {
			if (correctAnswer === undefined || correctAnswer === null) {
				return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: ERROR_MESSAGES.INVALID_CORRECT_ANSWER });
			}
			if (Array.isArray(correctAnswer)) {
				if (!correctAnswer.every(idx =>
					typeof idx === DATA_TYPES.NUMBER &&
					idx >= 0 &&
					idx < options.length
				)) {
					return res
						.status(HTTP_STATUS.BAD_REQUEST)
						.json({ error: ERROR_MESSAGES.INVALID_CORRECT_ANSWER });
				}
			} else {
				if (typeof correctAnswer !== DATA_TYPES.NUMBER ||
					correctAnswer < 0 ||
					correctAnswer >= options.length) {
					return res
						.status(HTTP_STATUS.BAD_REQUEST)
						.json({ error: ERROR_MESSAGES.INVALID_CORRECT_ANSWER });
				}
			}
		}

		// Determine question type and normalize correctAnswer format (same logic as add question)
		let questionType, normalizedCorrectAnswer;
		
		if (Array.isArray(correctAnswer) && correctAnswer.length > 1) {
			questionType = 'multiple_choice';
			normalizedCorrectAnswer = correctAnswer;
		} else if (Array.isArray(correctAnswer) && correctAnswer.length === 1) {
			questionType = 'single_choice';
			normalizedCorrectAnswer = correctAnswer[0];
		} else {
			questionType = 'single_choice';
			normalizedCorrectAnswer = correctAnswer;
		}

		// Update the question
		survey.questions[qIndex].text = text;
		survey.questions[qIndex].options = options;
		survey.questions[qIndex].type = questionType;
		survey.questions[qIndex].correctAnswer = normalizedCorrectAnswer;
		if (points !== undefined) {
			survey.questions[qIndex].points = points;
		}

		await survey.save();
		res.json(survey);
	})
);

// Delete a question from an existing survey
router.delete(
	'/surveys/:id/questions/:questionIndex',
	jwtAuth,
	asyncHandler(async (req, res) => {
		const { id, questionIndex } = req.params;

		const survey = await Survey.findById(id);
		if (!survey) {
			throw new AppError(ERROR_MESSAGES.SURVEY_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
		}

		const qIndex = parseInt(questionIndex, 10);
		if (qIndex < 0 || qIndex >= survey.questions.length) {
			return res
				.status(HTTP_STATUS.BAD_REQUEST)
				.json({ error: 'Invalid question index' });
		}

		survey.questions.splice(qIndex, 1);
		await survey.save();
		res.json(survey);
	})
);

// Update scoring settings for a survey
router.put(
	'/surveys/:id/scoring',
	jwtAuth,
	asyncHandler(async (req, res) => {

		const { id } = req.params;
		const {
			scoringMode,
			passingThreshold,
			showScore,
			showCorrectAnswers,
			showScoreBreakdown,
			customScoringRules,
		} = req.body;

		// Validate scoring mode
		if (scoringMode && !['percentage', 'accumulated'].includes(scoringMode)) {
			return res.status(HTTP_STATUS.BAD_REQUEST).json({
				error: 'Invalid scoring mode. Must be "percentage" or "accumulated"',
			});
		}

		// Validate passing threshold
		if (
			passingThreshold !== undefined &&
			(typeof passingThreshold !== DATA_TYPES.NUMBER || passingThreshold < 0)
		) {
			return res.status(HTTP_STATUS.BAD_REQUEST).json({
				error: 'Passing threshold must be a non-negative number',
			});
		}

		const survey = await Survey.findById(id);
		if (!survey) {
			throw new AppError(ERROR_MESSAGES.SURVEY_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
		}

		// Only allow scoring settings for quiz/assessment/iq types
		if (!['quiz', 'assessment', 'iq'].includes(survey.type)) {
			return res.status(HTTP_STATUS.BAD_REQUEST).json({
				error: 'Scoring settings are only available for quiz, assessment, and IQ test types',
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
			...(customScoringRules && {
				customScoringRules: {
					...survey.scoringSettings.customScoringRules,
					...customScoringRules,
				},
			}),
		};

		survey.scoringSettings = updatedScoringSettings;
		await survey.save();

		res.json(survey);
	})
);

router.get(
	'/responses',
	jwtAuth,
	asyncHandler(async (req, res) => {
		const fileResponses = readJson(RESPONSES_FILE);
		const dbResponses = await Response.find().lean();
		res.json([...fileResponses, ...dbResponses]);
	})
);

// Get statistics for a specific survey
router.get(
	'/surveys/:surveyId/statistics',
	jwtAuth,
	asyncHandler(async (req, res) => {
		const { surveyId } = req.params;
		const survey = await Survey.findById(surveyId).lean();
		if (!survey) {
			throw new AppError(ERROR_MESSAGES.SURVEY_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
		}

		const responses = await Response.find({ surveyId }).lean();

		// Debug: Print survey questions
		console.log(
			'Survey questions:',
			survey.questions.map((q, i) => `${i}: ${q.text} - [${q.options.join(', ')}]`)
		);

		// Calculate aggregated statistics
		const stats = survey.questions.map((q, questionIndex) => {
			const counts = {};
			q.options.forEach(opt => {
				counts[opt] = 0;
			});
			responses.forEach(r => {
				// Handle different answer formats
				let ans = null;

				if (Array.isArray(r.answers)) {
					// Array format: answers is an array of strings
					ans = r.answers[questionIndex];
				} else if (r.answers && typeof r.answers.get === 'function') {
					// Map format: answers is a Map object
					ans = r.answers.get(questionIndex.toString());
					if (ans === undefined || ans === null) {
						ans = r.answers.get(q._id.toString());
					}
					if (ans === undefined || ans === null) {
						ans = r.answers.get(q.text);
					}
				} else if (typeof r.answers === 'object' && r.answers !== null) {
					// Object format: answers is a plain object
					ans = r.answers[questionIndex.toString()];
					if (ans === undefined || ans === null) {
						ans = r.answers[q._id];
					}
					if (ans === undefined || ans === null) {
						ans = r.answers[q.text];
					}
				}

				// Debug: Print answer processing
				console.log(
					`Response ${r._id}, Question ${questionIndex}: raw answer = ${ans}, type = ${typeof ans}`
				);

				if (ans !== undefined && ans !== null) {
					// Handle different answer value formats
					if (typeof ans === 'number' || (typeof ans === 'string' && /^\d+$/.test(ans))) {
						const idx = typeof ans === 'number' ? ans : parseInt(ans, 10);
						if (idx >= 0 && idx < q.options.length) {
							counts[q.options[idx]] += 1;
							console.log(`  -> Counted: ${q.options[idx]} (index ${idx})`);
						} else {
							console.log(
								`  -> Invalid index: ${idx}, options length: ${q.options.length}`
							);
						}
					} else if (Array.isArray(ans)) {
						// Multiple choice: ans is array of option indices
						ans.forEach(optionIndex => {
							const idx =
								typeof optionIndex === 'number'
									? optionIndex
									: parseInt(optionIndex, 10);
							if (idx >= 0 && idx < q.options.length) {
								counts[q.options[idx]] += 1;
							}
						});
					} else if (typeof ans === 'string') {
						// Direct string answer
						if (counts.hasOwnProperty(ans)) {
							counts[ans] += 1;
						}
					}
				} else {
					console.log(`  -> No answer found`);
				}
			});
			return { question: q.text, options: counts };
		});

		// Prepare individual user responses
		const userResponses = responses.map(response => {
			const userAnswers = {};
			survey.questions.forEach((q, questionIndex) => {
				let ans = null;

				// Handle different answer formats
				if (Array.isArray(response.answers)) {
					ans = response.answers[questionIndex];
				} else if (response.answers && typeof response.answers.get === 'function') {
					ans = response.answers.get(questionIndex.toString());
					if (ans === undefined || ans === null) {
						ans = response.answers.get(q._id.toString());
					}
					if (ans === undefined || ans === null) {
						ans = response.answers.get(q.text);
					}
				} else if (typeof response.answers === 'object' && response.answers !== null) {
					ans = response.answers[questionIndex.toString()];
					if (ans === undefined || ans === null) {
						ans = response.answers[q._id];
					}
					if (ans === undefined || ans === null) {
						ans = response.answers[q.text];
					}
				}

				// Format the answer for display
				let formattedAnswer = 'No answer';
				if (ans !== undefined && ans !== null) {
					if (typeof ans === 'number' || (typeof ans === 'string' && /^\d+$/.test(ans))) {
						const idx = typeof ans === 'number' ? ans : parseInt(ans, 10);
						if (idx >= 0 && idx < q.options.length) {
							formattedAnswer = q.options[idx];
						}
					} else if (Array.isArray(ans)) {
						const selectedOptions = ans
							.map(optionIndex =>
								typeof optionIndex === 'number'
									? optionIndex
									: parseInt(optionIndex, 10)
							)
							.filter(
								optionIndex => optionIndex >= 0 && optionIndex < q.options.length
							)
							.map(optionIndex => q.options[optionIndex]);
						formattedAnswer =
							selectedOptions.length > 0 ? selectedOptions.join(', ') : 'No answer';
					} else if (typeof ans === 'string') {
						formattedAnswer = ans;
					}
				}

				userAnswers[q.text] = formattedAnswer;
			});

			return {
				_id: response._id,
				name: response.name,
				email: response.email,
				answers: userAnswers,
				createdAt: response.createdAt,
			};
		});

		// Calculate total responses and completion rate
		const totalResponses = responses.length;
		const completionRate =
			survey.questions.length > 0
				? (userResponses.filter(r =>
					Object.values(r.answers).some(ans => ans !== 'No answer')
				).length /
						totalResponses) *
					100
				: 0;

		res.json({
			aggregatedStats: stats,
			userResponses: userResponses,
			summary: {
				totalResponses,
				completionRate: parseFloat(completionRate.toFixed(2)),
				totalQuestions: survey.questions.length,
			},
		});
	})
);

// Publish survey with distribution settings (admin only)
router.post(
	'/surveys/:id/publish',
	jwtAuth,
	asyncHandler(async (req, res) => {

		const {
			distributionMode,
			targetUsers,
			targetEmails,
			maxResponses,
			expiresAt,
			distributionSettings,
		} = req.body;

		const survey = await Survey.findById(req.params.id);
		if (!survey) {
			throw new AppError(ERROR_MESSAGES.SURVEY_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
		}

		// Update survey status to active
		survey.status = 'active';
		survey.publishingSettings = {
			publishedAt: new Date(),
			publishedBy: req.user.id || null,
		};

		// Update distribution settings if provided
		if (distributionSettings) {
			survey.distributionSettings = {
				...survey.distributionSettings,
				...distributionSettings,
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
				createdBy: req.user.id || null,
			});

			await invitation.populate('surveyId', 'title description');
			await invitation.populate('targetUsers', 'name email studentId');

			res.json({
				survey,
				invitation,
			});
		} else {
			res.json({ survey });
		}
	})
);

// Get survey invitations (admin only)
router.get(
	'/surveys/:id/invitations',
	jwtAuth,
	asyncHandler(async (req, res) => {

		const invitations = await Invitation.find({ surveyId: req.params.id })
			.populate('targetUsers', 'name email studentId')
			.sort({ createdAt: -1 });

		res.json(invitations);
	})
);

// Create invitation for survey (admin only)
router.post(
	'/surveys/:id/invitations',
	jwtAuth,
	asyncHandler(async (req, res) => {

		const { distributionMode, targetUsers, targetEmails, maxResponses, expiresAt } = req.body;

		const survey = await Survey.findById(req.params.id);
		if (!survey) {
			throw new AppError(ERROR_MESSAGES.SURVEY_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
		}

		// Validate distribution mode
		if (!['open', 'targeted', 'link'].includes(distributionMode)) {
			return res.status(HTTP_STATUS.BAD_REQUEST).json({
				error: 'Invalid distribution mode',
			});
		}

		// For targeted mode, validate target users/emails
		if (distributionMode === 'targeted' && !targetUsers && !targetEmails) {
			return res.status(HTTP_STATUS.BAD_REQUEST).json({
				error: 'Target users or emails are required for targeted distribution',
			});
		}

		const invitation = await Invitation.create({
			surveyId: req.params.id,
			distributionMode,
			targetUsers: targetUsers || [],
			targetEmails: targetEmails || [],
			maxResponses,
			expiresAt: expiresAt ? new Date(expiresAt) : null,
			createdBy: req.user.id || null,
		});

		await invitation.populate('surveyId', 'title description');
		await invitation.populate('targetUsers', 'name email studentId');

		res.json(invitation);
	})
);

// Get dashboard statistics (admin only)
router.get(
	'/dashboard/statistics',
	jwtAuth,
	asyncHandler(async (req, res) => {

		const [
			totalSurveys,
			activeSurveys,
			totalInvitations,
			activeInvitations,
			totalUsers,
			totalResponses,
		] = await Promise.all([
			Survey.countDocuments(),
			Survey.countDocuments({ status: 'active' }),
			Invitation.countDocuments(),
			Invitation.countDocuments({ isActive: true }),
			User.countDocuments({ isActive: true }),
			Response.countDocuments(),
		]);

		// Get survey statistics by type
		const surveysByType = await Survey.aggregate([
			{
				$group: {
					_id: '$type',
					count: { $sum: 1 },
				},
			},
		]);

		// Get invitation statistics by distribution mode
		const invitationsByMode = await Invitation.aggregate([
			{
				$group: {
					_id: '$distributionMode',
					count: { $sum: 1 },
				},
			},
		]);

		// Get user statistics by role
		const usersByRole = await User.aggregate([
			{ $match: { isActive: true } },
			{
				$group: {
					_id: '$role',
					count: { $sum: 1 },
				},
			},
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
				totalResponses,
			},
			charts: {
				surveysByType,
				invitationsByMode,
				usersByRole,
			},
			recent: {
				surveys: recentSurveys,
				invitations: recentInvitations,
			},
		});
	})
);

// Toggle survey active status
router.put(
	'/surveys/:id/toggle-status',
	jwtAuth,
	asyncHandler(async (req, res) => {
		
		const survey = await Survey.findById(req.params.id);
		if (!survey) {
			throw new AppError(ERROR_MESSAGES.SURVEY_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
		}
		
		// Toggle both isActive and status fields to keep them in sync
		survey.isActive = !survey.isActive;
		survey.status = survey.isActive ? 'active' : 'draft';
		await survey.save();
		
		res.json(survey);
	})
);

router.get('/logout', (req, res) => {
	req.session.destroy(() => {
		res.json({ success: true });
	});
});

module.exports = router;
