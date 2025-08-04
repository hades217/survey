const express = require('express');
const path = require('path');
const jwt = require('jsonwebtoken');
const { readJson } = require('../utils/file');
const Survey = require('../models/Survey');
const Response = require('../models/Response');
const Invitation = require('../models/Invitation');
const User = require('../models/User');
const Company = require('../models/Company');
const asyncHandler = require('../middlewares/asyncHandler');
const bcrypt = require('bcrypt');
const AppError = require('../utils/AppError');
const { ERROR_MESSAGES, DATA_TYPES, HTTP_STATUS } = require('../shared/constants');
const { JWT_SECRET, jwtAuth } = require('../middlewares/jwtAuth');
const QuestionBank = require('../models/QuestionBank');
const imageUpload = require('../middlewares/imageUpload');

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
			authenticated: false,
		});
	}

	const token = authHeader.split(' ')[1];

	try {
		const payload = jwt.verify(token, JWT_SECRET);
		res.json({
			success: true,
			authenticated: true,
			user: payload,
		});
	} catch (error) {
		res.status(HTTP_STATUS.UNAUTHORIZED).json({
			success: false,
			authenticated: false,
		});
	}
});

router.post(
	'/login',
	asyncHandler(async (req, res) => {
		const { username, password } = req.body;

		// First try legacy admin login
		if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
			const token = jwt.sign(
				{
					id: 'admin',
					username: username,
					role: 'admin',
				},
				JWT_SECRET,
				{ expiresIn: '7d' }
			);
			return res.json({
				success: true,
				token,
				user: {
					id: 'admin',
					username: username,
					role: 'admin',
				},
			});
		}

		// Try database user login (using email as username)
		try {
			const user = await User.findOne({
				email: username.toLowerCase(),
				role: 'admin',
			}).select('+password');

			if (!user) {
				return res.status(HTTP_STATUS.UNAUTHORIZED).json({
					success: false,
					error: 'Invalid credentials',
				});
			}

			const isPasswordValid = await bcrypt.compare(password, user.password);
			if (!isPasswordValid) {
				return res.status(HTTP_STATUS.UNAUTHORIZED).json({
					success: false,
					error: 'Invalid credentials',
				});
			}

			// Update last login time
			user.lastLoginAt = new Date();
			await user.save();

			const token = jwt.sign(
				{
					id: user._id,
					email: user.email,
					role: user.role,
				},
				JWT_SECRET,
				{ expiresIn: '7d' }
			);

			res.json({
				success: true,
				token,
				user: {
					id: user._id,
					name: user.name,
					email: user.email,
					role: user.role,
				},
			});
		} catch (error) {
			console.error('Login error:', error);
			res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
				success: false,
				error: 'Login failed. Please try again.',
			});
		}
	})
);

// Register a new admin user
router.post(
	'/register',
	asyncHandler(async (req, res) => {
		const { name, email, password, companyName } = req.body;

		// Validation
		if (!name || !email || !password) {
			return res.status(HTTP_STATUS.BAD_REQUEST).json({
				success: false,
				error: 'Name, email, and password are required',
			});
		}

		if (password.length < 8) {
			return res.status(HTTP_STATUS.BAD_REQUEST).json({
				success: false,
				error: 'Password must be at least 8 characters long',
			});
		}

		// Check if user already exists
		const existingUser = await User.findOne({ email: email.toLowerCase() });
		if (existingUser) {
			return res.status(HTTP_STATUS.BAD_REQUEST).json({
				success: false,
				error: 'An account with this email already exists',
			});
		}

		try {
			// Hash password
			const hashedPassword = await bcrypt.hash(password, 12);

			// Create company if provided
			let company = null;
			if (companyName) {
				company = new Company({
					name: companyName,
				});
				await company.save();
			}

			// Create user
			const user = new User({
				name,
				email: email.toLowerCase(),
				password: hashedPassword,
				role: 'admin',
				companyId: company ? company._id : undefined,
			});

			await user.save();

			// Generate JWT token
			const token = jwt.sign(
				{
					id: user._id,
					email: user.email,
					role: user.role,
				},
				JWT_SECRET,
				{ expiresIn: '7d' }
			);

			res.status(HTTP_STATUS.CREATED).json({
				success: true,
				token,
				user: {
					id: user._id,
					name: user.name,
					email: user.email,
					role: user.role,
				},
			});
		} catch (error) {
			console.error('Registration error:', error);
			res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
				success: false,
				error: 'Registration failed. Please try again.',
			});
		}
	})
);

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
		const surveys = await Survey.find().populate('questionBankId', 'name description');

		// Add lastActivity and responseCount for each survey
		const surveysWithStats = await Promise.all(
			surveys.map(async survey => {
				const surveyObj = survey.toObject();

				// Get response count - use ObjectId directly
				const responseCount = await Response.countDocuments({
					surveyId: survey._id,
				});

				// Get last activity (most recent response)
				const lastResponse = await Response.findOne({
					surveyId: survey._id,
				})
					.sort({ createdAt: -1 })
					.select('createdAt')
					.lean();

				return {
					...surveyObj,
					responseCount,
					lastActivity: lastResponse ? lastResponse.createdAt : null,
				};
			})
		);

		res.json(surveysWithStats);
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
		const { text, imageUrl, descriptionImage, options, correctAnswer, points, type } = req.body;

		// Debug: Log the received data
		console.log('Add question request body:', req.body);
		console.log('Question type:', type);
		console.log('Options:', options);
		console.log('Text:', text);

		// Basic validation
		if (typeof text !== DATA_TYPES.STRING) {
			console.log('Validation failed: text is not string, type:', typeof text);
			return res
				.status(HTTP_STATUS.BAD_REQUEST)
				.json({ error: 'Question text must be a string' });
		}

		// Validate question type
		if (type && !['single_choice', 'multiple_choice', 'short_text'].includes(type)) {
			console.log('Validation failed: invalid type:', type);
			return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: 'Invalid question type' });
		}

		// For choice questions, validate options
		if (type !== 'short_text') {
			if (!options || !Array.isArray(options) || options.length < 2) {
				console.log('Validation failed: insufficient options for choice question');
				console.log('Options:', options);
				return res
					.status(HTTP_STATUS.BAD_REQUEST)
					.json({ error: 'At least 2 options are required for choice questions' });
			}

			// Validate option format: each option should have either text or imageUrl
			const validOptions = options.every(option => {
				if (typeof option === 'string') {
					// Legacy format: plain string
					return option.trim().length > 0;
				} else if (typeof option === 'object' && option !== null) {
					// New format: object with text/imageUrl
					return (option.text && option.text.trim()) || option.imageUrl;
				}
				return false;
			});

			if (!validOptions) {
				console.log('Validation failed: invalid option format');
				console.log('Options:', options);
				return res
					.status(HTTP_STATUS.BAD_REQUEST)
					.json({ error: 'Each option must have either text or image' });
			}
		}

		// Validate correctAnswer if provided
		if (correctAnswer !== undefined && correctAnswer !== null) {
			if (type === 'short_text') {
				// For short text, correctAnswer should be a string
				if (typeof correctAnswer !== DATA_TYPES.STRING) {
					return res
						.status(HTTP_STATUS.BAD_REQUEST)
						.json({ error: ERROR_MESSAGES.INVALID_CORRECT_ANSWER });
				}
			} else {
				// For choice questions: Support both single answer (number) and multiple answers (array)
				if (Array.isArray(correctAnswer)) {
					// Multiple choice: validate array of indices
					if (
						!correctAnswer.every(
							idx =>
								typeof idx === DATA_TYPES.NUMBER && idx >= 0 && idx < options.length
						)
					) {
						return res
							.status(HTTP_STATUS.BAD_REQUEST)
							.json({ error: ERROR_MESSAGES.INVALID_CORRECT_ANSWER });
					}
				} else {
					// Single choice: validate single index
					if (
						typeof correctAnswer !== DATA_TYPES.NUMBER ||
						correctAnswer < 0 ||
						correctAnswer >= options.length
					) {
						return res
							.status(HTTP_STATUS.BAD_REQUEST)
							.json({ error: ERROR_MESSAGES.INVALID_CORRECT_ANSWER });
					}
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

		// Use provided type or determine from correctAnswer format
		let questionType = type || 'single_choice';
		let normalizedCorrectAnswer = correctAnswer;

		// If type is not provided, determine from correctAnswer format (backward compatibility)
		if (!type && correctAnswer !== undefined) {
			if (Array.isArray(correctAnswer) && correctAnswer.length > 1) {
				// Multiple correct answers = multiple choice
				questionType = 'multiple_choice';
				normalizedCorrectAnswer = correctAnswer;
			} else if (Array.isArray(correctAnswer) && correctAnswer.length === 1) {
				// Single answer in array format = single choice
				questionType = 'single_choice';
				normalizedCorrectAnswer = correctAnswer[0];
			} else if (typeof correctAnswer === 'number') {
				// Single answer in number format = single choice
				questionType = 'single_choice';
				normalizedCorrectAnswer = correctAnswer;
			} else if (typeof correctAnswer === 'string') {
				// String answer = short text
				questionType = 'short_text';
				normalizedCorrectAnswer = correctAnswer;
			}
		}

		const question = {
			text,
			type: questionType,
		};

		// Add question image if provided
		if (imageUrl) {
			question.imageUrl = imageUrl;
		}

		// Add description image if provided
		if (descriptionImage) {
			question.descriptionImage = descriptionImage;
		}

		// Only add options for non-short_text questions
		if (questionType !== 'short_text') {
			// Normalize options to the new format
			question.options = options.map(option => {
				if (typeof option === 'string') {
					// Legacy format: convert string to object
					return { text: option, imageUrl: null };
				} else {
					// New format: ensure structure
					return {
						text: option.text || '',
						imageUrl: option.imageUrl || null,
					};
				}
			});
		}

		if (correctAnswer !== undefined) {
			question.correctAnswer = normalizedCorrectAnswer;
		}
		if (points !== undefined) {
			question.points = points;
		}

		survey.questions.push(question);

		// Fix: Normalize ALL questions' options to the new object format before saving
		// This prevents validation errors when some questions have legacy string array format
		survey.questions.forEach(q => {
			if (q.type !== 'short_text' && q.options && Array.isArray(q.options)) {
				q.options = q.options.map(option => {
					if (typeof option === 'string') {
						const text = option.trim();
						return { text: text || 'Option', imageUrl: null };
					} else if (typeof option === 'object' && option !== null) {
						const text = (option.text || '').trim();
						const imageUrl = option.imageUrl || null;
						return {
							text: text || (imageUrl ? '' : 'Option'),
							imageUrl: imageUrl,
						};
					} else {
						return { text: 'Option', imageUrl: null };
					}
				});
			}
		});

		await survey.save();
		res.json(survey);
	})
);

// Update a question in an existing survey (PATCH for partial updates)
router.patch(
	'/surveys/:id/questions/:questionIndex',
	jwtAuth,
	asyncHandler(async (req, res) => {
		const { id, questionIndex } = req.params;
		const { text, imageUrl, descriptionImage, type, options, correctAnswer, points } = req.body;

		// Validate input - only validate fields that are provided (PATCH method)
		if (text !== undefined && typeof text !== DATA_TYPES.STRING) {
			return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: ERROR_MESSAGES.INVALID_DATA });
		}

		// Validate type if provided
		if (type && !['single_choice', 'multiple_choice', 'short_text'].includes(type)) {
			return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: 'Invalid question type' });
		}

		// Validate options only if provided
		if (options !== undefined) {
			if (!Array.isArray(options)) {
				return res
					.status(HTTP_STATUS.BAD_REQUEST)
					.json({ error: ERROR_MESSAGES.INVALID_DATA });
			}

			// Validate option format: each option should have either text or imageUrl
			const validOptions = options.every(option => {
				if (typeof option === 'string') {
					// Legacy format: plain string
					return option.trim().length > 0;
				} else if (typeof option === 'object' && option !== null) {
					// New format: object with text/imageUrl
					return (option.text && option.text.trim()) || option.imageUrl;
				}
				return false;
			});

			if (!validOptions) {
				return res
					.status(HTTP_STATUS.BAD_REQUEST)
					.json({ error: 'Each option must have either text or image' });
			}
		}

		// Validate correctAnswer if provided (same logic as add question)
		if (correctAnswer !== undefined && correctAnswer !== null) {
			if (Array.isArray(correctAnswer)) {
				if (
					!correctAnswer.every(
						idx => typeof idx === DATA_TYPES.NUMBER && idx >= 0 && idx < options.length
					)
				) {
					return res
						.status(HTTP_STATUS.BAD_REQUEST)
						.json({ error: ERROR_MESSAGES.INVALID_CORRECT_ANSWER });
				}
			} else {
				if (
					typeof correctAnswer !== DATA_TYPES.NUMBER ||
					correctAnswer < 0 ||
					correctAnswer >= options.length
				) {
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
			return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: 'Invalid question index' });
		}

		const requiresAnswer = ['quiz', 'assessment', 'iq'].includes(survey.type);

		if (requiresAnswer) {
			if (correctAnswer === undefined || correctAnswer === null) {
				return res
					.status(HTTP_STATUS.BAD_REQUEST)
					.json({ error: ERROR_MESSAGES.INVALID_CORRECT_ANSWER });
			}
			if (Array.isArray(correctAnswer)) {
				if (
					!correctAnswer.every(
						idx => typeof idx === DATA_TYPES.NUMBER && idx >= 0 && idx < options.length
					)
				) {
					return res
						.status(HTTP_STATUS.BAD_REQUEST)
						.json({ error: ERROR_MESSAGES.INVALID_CORRECT_ANSWER });
				}
			} else {
				if (
					typeof correctAnswer !== DATA_TYPES.NUMBER ||
					correctAnswer < 0 ||
					correctAnswer >= options.length
				) {
					return res
						.status(HTTP_STATUS.BAD_REQUEST)
						.json({ error: ERROR_MESSAGES.INVALID_CORRECT_ANSWER });
				}
			}
		}

		// Get current question and determine effective type
		const currentQuestion = survey.questions[qIndex];
		const effectiveType = type || currentQuestion.type || 'single_choice';

		// PATCH method: only update provided fields
		if (text !== undefined) {
			survey.questions[qIndex].text = text;
		}

		// Update question image if provided
		if (imageUrl !== undefined) {
			if (imageUrl) {
				survey.questions[qIndex].imageUrl = imageUrl;
			} else {
				// Remove image if explicitly set to null/empty
				delete survey.questions[qIndex].imageUrl;
			}
		}

		// Update description image if provided
		if (descriptionImage !== undefined) {
			if (descriptionImage) {
				survey.questions[qIndex].descriptionImage = descriptionImage;
			} else {
				// Remove description image if explicitly set to null/empty
				delete survey.questions[qIndex].descriptionImage;
			}
		}

		if (type !== undefined) {
			survey.questions[qIndex].type = type;

			// Handle type changes - clean up incompatible fields
			if (type === 'short_text') {
				// When changing to short_text, remove options
				delete survey.questions[qIndex].options;
			} else if (currentQuestion.type === 'short_text' && type !== 'short_text') {
				// When changing from short_text to choice type, initialize options if not provided
				if (options === undefined) {
					survey.questions[qIndex].options = ['', ''];
				}
			}
		}

		// Update options only if provided and question type allows it
		if (options !== undefined) {
			if (effectiveType !== 'short_text') {
				// Normalize options to the new format
				survey.questions[qIndex].options = options.map(option => {
					if (typeof option === 'string') {
						// Legacy format: convert string to object
						return { text: option, imageUrl: null };
					} else {
						// New format: ensure structure
						return {
							text: option.text || '',
							imageUrl: option.imageUrl || null,
						};
					}
				});
			}
		}

		// Update correctAnswer only if provided
		if (correctAnswer !== undefined) {
			if (correctAnswer === null && effectiveType === 'short_text') {
				// For short_text questions, null correctAnswer means remove it
				delete survey.questions[qIndex].correctAnswer;
			} else {
				survey.questions[qIndex].correctAnswer = correctAnswer;
			}
		}

		// Update points only if provided
		if (points !== undefined) {
			survey.questions[qIndex].points = points;
		}

		// Fix: Normalize ALL questions' options to the new object format before saving
		// This is needed because Mongoose validates the entire document, not just the updated question
		console.log(
			'Before normalization - questions with options:',
			survey.questions.map((q, idx) => ({
				index: idx,
				type: q.type,
				optionsCount: q.options?.length || 0,
				firstOptionType: typeof q.options?.[0],
				firstOption: q.options?.[0],
			}))
		);

		survey.questions.forEach((question, idx) => {
			if (
				question.type !== 'short_text' &&
				question.options &&
				Array.isArray(question.options)
			) {
				console.log(`Normalizing question ${idx} options:`, question.options);
				question.options = question.options.map(option => {
					if (typeof option === 'string') {
						// Legacy format: convert string to object
						console.log(`Converting string option "${option}" to object`);
						// Ensure we have non-empty text for validation
						const text = option.trim();
						return { text: text || 'Option', imageUrl: null };
					} else if (typeof option === 'object' && option !== null) {
						// Already in new format: ensure structure
						console.log(`Option already object:`, option);
						// Ensure we have either non-empty text or imageUrl for validation
						const text = (option.text || '').trim();
						const imageUrl = option.imageUrl || null;
						return {
							text: text || (imageUrl ? '' : 'Option'),
							imageUrl: imageUrl,
						};
					} else {
						// Invalid option: convert to placeholder
						console.log(`Invalid option, converting to placeholder:`, option);
						return { text: 'Option', imageUrl: null };
					}
				});
				console.log(`Question ${idx} options after normalization:`, question.options);
			}
		});

		console.log(
			'After normalization - questions with options:',
			survey.questions.map((q, idx) => ({
				index: idx,
				type: q.type,
				optionsCount: q.options?.length || 0,
				firstOptionType: typeof q.options?.[0],
				firstOption: q.options?.[0],
			}))
		);

		try {
			await survey.save();
			console.log('Survey saved successfully');
		} catch (saveError) {
			console.error('Survey save error:', saveError.message);
			console.error('Full error:', saveError);
			throw saveError;
		}
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
			return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: 'Invalid question index' });
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
		const { name, email, fromDate, toDate, status } = req.query;

		const survey = await Survey.findById(surveyId).lean();
		if (!survey) {
			throw new AppError(ERROR_MESSAGES.SURVEY_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
		}

		// Build filter query for responses
		let responseFilter = { surveyId };

		// Filter by name (fuzzy match)
		if (name) {
			responseFilter.name = { $regex: name, $options: 'i' };
		}

		// Filter by email (fuzzy match)
		if (email) {
			responseFilter.email = { $regex: email, $options: 'i' };
		}

		// Filter by date range
		if (fromDate || toDate) {
			responseFilter.createdAt = {};
			if (fromDate) {
				responseFilter.createdAt.$gte = new Date(fromDate);
			}
			if (toDate) {
				responseFilter.createdAt.$lte = new Date(toDate);
			}
		}

		// Filter by completion status
		if (status) {
			if (status === 'completed') {
				// Responses with at least one non-empty answer
				responseFilter.answers = { $exists: true, $ne: {} };
			} else if (status === 'incomplete') {
				// This is tricky to filter at DB level, we'll handle it after fetching
			}
		}

		let responses = await Response.find(responseFilter).lean();

		// Filter incomplete responses if needed (post-processing)
		if (status === 'incomplete') {
			responses = responses.filter(response => {
				// Check if response has any meaningful answers
				if (!response.answers || typeof response.answers !== 'object') {
					return true; // No answers = incomplete
				}

				// Check if all answers are empty/null/undefined
				const hasAnswers = Object.values(response.answers).some(answer => {
					if (answer === null || answer === undefined || answer === '') {
						return false;
					}
					if (Array.isArray(answer) && answer.length === 0) {
						return false;
					}
					return true;
				});

				return !hasAnswers; // Return incomplete responses
			});
		}

		// Get questions based on survey type and available snapshots
		let questions = [];
		let useSnapshots = false;

		// Check if we have responses with question snapshots
		const responsesWithSnapshots = responses.filter(
			r => r.questionSnapshots && r.questionSnapshots.length > 0
		);

		if (responsesWithSnapshots.length > 0) {
			// Use snapshots from the first response to get question structure
			// This ensures we use the exact questions that were presented to users
			const firstResponseWithSnapshots = responsesWithSnapshots[0];
			questions = firstResponseWithSnapshots.questionSnapshots
				.sort((a, b) => a.questionIndex - b.questionIndex)
				.map(snapshot => snapshot.questionData);
			useSnapshots = true;

			console.log(`Using question snapshots from ${responsesWithSnapshots.length} responses`);
		} else {
			// Fallback to survey questions (legacy method)
			if (survey.sourceType === 'question_bank' && survey.questionBankId) {
				// Single question bank
				const questionBank = await QuestionBank.findById(survey.questionBankId).lean();
				if (questionBank) {
					questions = questionBank.questions || [];
				}
			} else if (
				survey.sourceType === 'multi_question_bank' &&
				survey.multiQuestionBankConfig
			) {
				// Multiple question banks
				const questionBankIds = survey.multiQuestionBankConfig.map(
					config => config.questionBankId
				);
				const questionBanks = await QuestionBank.find({
					_id: { $in: questionBankIds },
				}).lean();
				questions = questionBanks.reduce((allQuestions, qb) => {
					return allQuestions.concat(qb.questions || []);
				}, []);
			} else {
				// Manual questions
				questions = survey.questions || [];
			}

			console.log(`Using survey questions (legacy method)`);
		}

		// Debug: Print survey questions
		console.log(
			'Survey questions:',
			questions.map((q, i) => `${i}: ${q.text} - [${(q.options || []).join(', ')}]`)
		);

		// Calculate aggregated statistics
		const stats = questions.map((q, questionIndex) => {
			const counts = {};
			if (q.options && q.options.length > 0) {
				q.options.forEach(opt => {
					counts[opt] = 0;
				});
			}

			responses.forEach(r => {
				let ans = null;
				let userAnswer = null;

				if (useSnapshots && r.questionSnapshots && r.questionSnapshots.length > 0) {
					// Use snapshot data
					const snapshot = r.questionSnapshots.find(
						s => s.questionIndex === questionIndex
					);
					if (snapshot) {
						userAnswer = snapshot.userAnswer;
						// Convert user answer to option index for counting
						if (snapshot.userAnswer !== null && snapshot.userAnswer !== undefined) {
							if (Array.isArray(snapshot.userAnswer)) {
								// Multiple choice
								snapshot.userAnswer.forEach(answer => {
									if (counts.hasOwnProperty(answer)) {
										counts[answer] += 1;
									}
								});
							} else {
								// Single choice or text
								if (counts.hasOwnProperty(snapshot.userAnswer)) {
									counts[snapshot.userAnswer] += 1;
								}
							}
						}
					}
				} else {
					// Legacy method - handle different answer formats
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
						if (
							typeof ans === 'number' ||
							(typeof ans === 'string' && /^\d+$/.test(ans))
						) {
							const idx = typeof ans === 'number' ? ans : parseInt(ans, 10);
							if (idx >= 0 && idx < (q.options || []).length) {
								counts[q.options[idx]] += 1;
								console.log(`  -> Counted: ${q.options[idx]} (index ${idx})`);
							} else {
								console.log(
									`  -> Invalid index: ${idx}, options length: ${(q.options || []).length}`
								);
							}
						} else if (Array.isArray(ans)) {
							// Multiple choice: ans is array of option indices
							ans.forEach(optionIndex => {
								const idx =
									typeof optionIndex === 'number'
										? optionIndex
										: parseInt(optionIndex, 10);
								if (idx >= 0 && idx < (q.options || []).length) {
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
				}
			});
			return { question: q.text, options: counts };
		});

		// Prepare individual user responses
		const userResponses = responses.map(response => {
			const userAnswers = {};
			let responseQuestions = questions;
			let useResponseSnapshots = false;

			// Check if this response has snapshots
			if (response.questionSnapshots && response.questionSnapshots.length > 0) {
				responseQuestions = response.questionSnapshots
					.sort((a, b) => a.questionIndex - b.questionIndex)
					.map(snapshot => snapshot.questionData);
				useResponseSnapshots = true;
			} else if (
				['question_bank', 'multi_question_bank', 'manual_selection'].includes(
					survey.sourceType
				) &&
				response.selectedQuestions &&
				response.selectedQuestions.length > 0
			) {
				// Legacy method for question bank surveys
				responseQuestions = response.selectedQuestions
					.map(sq => sq.questionData)
					.filter(Boolean);
			}

			responseQuestions.forEach((q, questionIndex) => {
				let ans = null;

				if (useResponseSnapshots) {
					// Use snapshot data
					const snapshot = response.questionSnapshots.find(
						s => s.questionIndex === questionIndex
					);
					if (snapshot) {
						ans = snapshot.userAnswer;
					}
				} else {
					// Legacy method - handle different answer formats
					if (Array.isArray(response.answers)) {
						ans = response.answers[questionIndex];
					} else if (response.answers && typeof response.answers.get === 'function') {
						ans = response.answers.get(questionIndex.toString());
						if (ans === undefined || ans === null) {
							ans = response.answers.get(q._id ? q._id.toString() : '');
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
				}

				// Format the answer for display
				let formattedAnswer = 'No answer';
				if (ans !== undefined && ans !== null) {
					if (useResponseSnapshots) {
						// Use snapshot data directly
						if (Array.isArray(ans)) {
							formattedAnswer = ans.join(', ');
						} else {
							formattedAnswer = ans;
						}
					} else {
						// Legacy formatting
						if (
							typeof ans === 'number' ||
							(typeof ans === 'string' && /^\d+$/.test(ans))
						) {
							const idx = typeof ans === 'number' ? ans : parseInt(ans, 10);
							if (idx >= 0 && idx < (q.options || []).length) {
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
									optionIndex =>
										optionIndex >= 0 && optionIndex < (q.options || []).length
								)
								.map(optionIndex => q.options[optionIndex]);
							formattedAnswer =
								selectedOptions.length > 0
									? selectedOptions.join(', ')
									: 'No answer';
						} else if (typeof ans === 'string') {
							formattedAnswer = ans;
						}
					}
				}

				userAnswers[q.text] = formattedAnswer;
			});

			// Prepare response object with score information
			const responseData = {
				_id: response._id,
				name: response.name,
				email: response.email,
				answers: userAnswers,
				createdAt: response.createdAt,
				timeSpent: response.timeSpent || 0,
				isAutoSubmit: response.isAutoSubmit || false,
			};

			// Add score information for quiz/assessment/iq types
			if (response.score && ['quiz', 'assessment', 'iq'].includes(survey.type)) {
				responseData.score = {
					totalPoints: response.score.totalPoints || 0,
					correctAnswers: response.score.correctAnswers || 0,
					wrongAnswers: response.score.wrongAnswers || 0,
					percentage: response.score.percentage || 0,
					displayScore: response.score.displayScore || 0,
					scoringMode: response.score.scoringMode || 'percentage',
					maxPossiblePoints: response.score.maxPossiblePoints || 0,
					passed: response.score.passed || false,
					formattedScore: response.formattedScore,
				};
			}

			return responseData;
		});

		// Calculate total responses and completion rate
		const totalResponses = responses.length;
		const completionRate =
			questions.length > 0
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
				totalQuestions: questions.length,
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
			// Handle createdBy field - only set if it's a valid ObjectId
			let createdBy = null;
			if (req.user.id && req.user.id !== 'admin') {
				try {
					const mongoose = require('mongoose');
					createdBy = new mongoose.Types.ObjectId(req.user.id);
				} catch (error) {
					// Invalid ObjectId, leave as null
					console.log('Invalid ObjectId for createdBy:', req.user.id);
				}
			}

			const invitation = await Invitation.create({
				surveyId: survey._id,
				distributionMode,
				targetUsers: targetUsers || [],
				targetEmails: targetEmails || [],
				maxResponses,
				expiresAt: expiresAt ? new Date(expiresAt) : null,
				createdBy,
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

		// Handle createdBy field - only set if it's a valid ObjectId
		let createdBy = null;
		if (req.user.id && req.user.id !== 'admin') {
			try {
				const mongoose = require('mongoose');
				createdBy = new mongoose.Types.ObjectId(req.user.id);
			} catch (error) {
				// Invalid ObjectId, leave as null
				console.log('Invalid ObjectId for createdBy:', req.user.id);
			}
		}

		const invitation = await Invitation.create({
			surveyId: req.params.id,
			distributionMode,
			targetUsers: targetUsers || [],
			targetEmails: targetEmails || [],
			maxResponses,
			expiresAt: expiresAt ? new Date(expiresAt) : null,
			createdBy,
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

// Get current admin profile and company information
router.get(
	'/profile',
	jwtAuth,
	asyncHandler(async (req, res) => {
		// Get the current user from JWT token
		let adminUser = null;
		
		if (req.user.id && req.user.id !== 'admin') {
			// Find user by JWT token ID (for registered users)
			adminUser = await User.findById(req.user.id).populate('companyId');
		} else {
			// Fallback to legacy admin user lookup
			adminUser = await User.findOne({ role: 'admin' }).populate('companyId');
		}

		// If no admin user exists, create a default one
		if (!adminUser) {
			adminUser = new User({
				name: 'Administrator',
				email: 'admin@example.com',
				role: 'admin',
			});
			await adminUser.save();
		}

		// Get or create default company
		let company = adminUser.companyId;
		if (!company) {
			company = await Company.findOne();
			if (!company) {
				company = new Company({
					name: 'My Company',
					industry: '',
					description: '',
				});
				await company.save();

				// Link company to admin user
				adminUser.companyId = company._id;
				await adminUser.save();
			}
		}

		res.json({
			user: {
				_id: adminUser._id,
				name: adminUser.name,
				email: adminUser.email,
				avatarUrl: adminUser.avatarUrl,
			},
			company: company,
		});
	})
);

// Update admin profile (excluding password)
router.put(
	'/profile',
	jwtAuth,
	asyncHandler(async (req, res) => {
		const { name, email, avatarUrl } = req.body;

		// Validate input
		if (!name || !email) {
			return res.status(HTTP_STATUS.BAD_REQUEST).json({
				error: 'Name and email are required',
			});
		}

		// Get or create admin user
		let adminUser = await User.findOne({ role: 'admin' });
		if (!adminUser) {
			adminUser = new User({
				name,
				email,
				role: 'admin',
				avatarUrl,
			});
		} else {
			adminUser.name = name;
			adminUser.email = email;
			if (avatarUrl !== undefined) {
				adminUser.avatarUrl = avatarUrl;
			}
		}

		await adminUser.save();

		res.json({
			message: 'Profile updated successfully',
			user: {
				_id: adminUser._id,
				name: adminUser.name,
				email: adminUser.email,
				avatarUrl: adminUser.avatarUrl,
			},
		});
	})
);

// Update admin password
router.put(
	'/profile/password',
	jwtAuth,
	asyncHandler(async (req, res) => {
		const { currentPassword, newPassword } = req.body;

		// Validate input
		if (!currentPassword || !newPassword) {
			return res.status(HTTP_STATUS.BAD_REQUEST).json({
				error: 'Current password and new password are required',
			});
		}

		if (newPassword.length < 6) {
			return res.status(HTTP_STATUS.BAD_REQUEST).json({
				error: 'New password must be at least 6 characters long',
			});
		}

		// For simple admin auth, verify against environment variables
		const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'password';
		if (currentPassword !== ADMIN_PASSWORD) {
			return res.status(HTTP_STATUS.BAD_REQUEST).json({
				error: 'Current password is incorrect',
			});
		}

		// In a real application, you would hash the password and save it
		// For now, we'll just return success since we're using env-based auth
		res.json({
			message: 'Password updated successfully',
		});
	})
);

// Update company information
router.put(
	'/company',
	jwtAuth,
	asyncHandler(async (req, res) => {
		const { name, industry, logoUrl, description, website } = req.body;

		// Validate input
		if (!name) {
			return res.status(HTTP_STATUS.BAD_REQUEST).json({
				error: 'Company name is required',
			});
		}

		// Get or create admin user
		let adminUser = await User.findOne({ role: 'admin' });
		if (!adminUser) {
			adminUser = new User({
				name: 'Administrator',
				email: 'admin@example.com',
				role: 'admin',
			});
			await adminUser.save();
		}

		// Get or create company
		let company = await Company.findById(adminUser.companyId);
		if (!company) {
			company = new Company({
				name,
				industry,
				logoUrl,
				description,
				website,
			});
		} else {
			company.name = name;
			company.industry = industry || '';
			company.logoUrl = logoUrl || '';
			company.description = description || '';
			company.website = website || '';
		}

		await company.save();

		// Link company to admin user if not already linked
		if (!adminUser.companyId) {
			adminUser.companyId = company._id;
			await adminUser.save();
		}

		res.json({
			message: 'Company information updated successfully',
			company: company,
		});
	})
);

// Image upload endpoint for questions
router.post(
	'/upload-image',
	jwtAuth,
	imageUpload.single('image'),
	asyncHandler(async (req, res) => {
		if (!req.file) {
			return res.status(HTTP_STATUS.BAD_REQUEST).json({
				success: false,
				error: 'No image file provided',
			});
		}

		// Return the image URL
		const imageUrl = `/uploads/images/${req.file.filename}`;
		res.json({
			success: true,
			imageUrl: imageUrl,
			originalName: req.file.originalname,
			size: req.file.size,
		});
	})
);

module.exports = router;
