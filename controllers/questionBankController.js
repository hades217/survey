const QuestionBank = require('../models/QuestionBank');
const { HTTP_STATUS } = require('../shared/constants');

// Get all question banks
exports.getAllQuestionBanks = async (req, res) => {
	try {
		const questionBanks = await QuestionBank.find()
			.populate('createdBy', 'username')
			.sort({ createdAt: -1 });

		res.status(HTTP_STATUS.OK).json(questionBanks);
	} catch (error) {
		console.error('Error fetching question banks:', error);
		res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
			error: 'Failed to fetch question banks',
		});
	}
};

// Get a specific question bank by ID
exports.getQuestionBank = async (req, res) => {
	try {
		const questionBank = await QuestionBank.findById(req.params.id).populate(
			'createdBy',
			'username'
		);

		if (!questionBank) {
			return res.status(HTTP_STATUS.NOT_FOUND).json({ error: 'Question bank not found' });
		}

		res.status(HTTP_STATUS.OK).json(questionBank);
	} catch (error) {
		console.error('Error fetching question bank:', error);
		res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
			error: 'Failed to fetch question bank',
		});
	}
};

// Create a new question bank
exports.createQuestionBank = async (req, res) => {
	try {
		const { name, description } = req.body;

		if (!name || !name.trim()) {
			return res
				.status(HTTP_STATUS.BAD_REQUEST)
				.json({ error: 'Question bank name is required' });
		}

		const questionBank = new QuestionBank({
			name: name.trim(),
			description: description?.trim(),
			createdBy: req.user.id, // Get user ID from JWT payload
			questions: [],
		});

		await questionBank.save();

		res.status(HTTP_STATUS.CREATED).json(questionBank);
	} catch (error) {
		console.error('Error creating question bank:', error);
		res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
			error: 'Failed to create question bank',
		});
	}
};

// Update a question bank
exports.updateQuestionBank = async (req, res) => {
	try {
		const { name, description } = req.body;

		if (!name || !name.trim()) {
			return res
				.status(HTTP_STATUS.BAD_REQUEST)
				.json({ error: 'Question bank name is required' });
		}

		const questionBank = await QuestionBank.findByIdAndUpdate(
			req.params.id,
			{
				name: name.trim(),
				description: description?.trim(),
				updatedAt: Date.now(),
			},
			{ new: true }
		);

		if (!questionBank) {
			return res.status(HTTP_STATUS.NOT_FOUND).json({ error: 'Question bank not found' });
		}

		res.status(HTTP_STATUS.OK).json(questionBank);
	} catch (error) {
		console.error('Error updating question bank:', error);
		res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
			error: 'Failed to update question bank',
		});
	}
};

// Delete a question bank
exports.deleteQuestionBank = async (req, res) => {
	try {
		const questionBank = await QuestionBank.findByIdAndDelete(req.params.id);

		if (!questionBank) {
			return res.status(HTTP_STATUS.NOT_FOUND).json({ error: 'Question bank not found' });
		}

		res.status(HTTP_STATUS.OK).json({ message: 'Question bank deleted successfully' });
	} catch (error) {
		console.error('Error deleting question bank:', error);
		res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
			error: 'Failed to delete question bank',
		});
	}
};

// Add a question to a question bank
exports.addQuestion = async (req, res) => {
	try {
		const { text, type, options, correctAnswer, explanation, points, tags, difficulty } =
			req.body;

		if (!text || !text.trim()) {
			return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: 'Question text is required' });
		}

		// For choice-based questions, options are required
		const questionType = type || 'single_choice';
		if (questionType !== 'short_text') {
			if (!options || !Array.isArray(options) || options.length < 2) {
				return res
					.status(HTTP_STATUS.BAD_REQUEST)
					.json({ error: 'At least 2 options are required for choice questions' });
			}

			if (correctAnswer === undefined || correctAnswer === null) {
				return res
					.status(HTTP_STATUS.BAD_REQUEST)
					.json({ error: 'Correct answer is required for choice questions' });
			}
		}

		const questionBank = await QuestionBank.findById(req.params.id);

		if (!questionBank) {
			return res.status(HTTP_STATUS.NOT_FOUND).json({ error: 'Question bank not found' });
		}

		const newQuestion = {
			text: text.trim(),
			type: questionType,
			explanation: explanation?.trim(),
			points: points || 1,
			tags: tags || [],
			difficulty: difficulty || 'medium',
		};

		// Add options and correctAnswer only for choice-based questions
		if (questionType !== 'short_text') {
			newQuestion.options = options.map(opt => opt.trim()).filter(opt => opt.length > 0);
			newQuestion.correctAnswer = correctAnswer;
		} else if (correctAnswer && typeof correctAnswer === 'string') {
			// For short_text, correctAnswer is optional but if provided should be a string
			newQuestion.correctAnswer = correctAnswer.trim();
		}

		questionBank.questions.push(newQuestion);
		await questionBank.save();

		res.status(HTTP_STATUS.CREATED).json(questionBank);
	} catch (error) {
		console.error('Error adding question:', error);
		res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ error: 'Failed to add question' });
	}
};

// Update a question in a question bank
exports.updateQuestion = async (req, res) => {
	try {
		const { questionId } = req.params;
		const { text, type, options, correctAnswer, explanation, points, tags, difficulty } =
			req.body;

		const questionBank = await QuestionBank.findById(req.params.id);

		if (!questionBank) {
			return res.status(HTTP_STATUS.NOT_FOUND).json({ error: 'Question bank not found' });
		}

		// Find question by ID
		const questionIndex = questionBank.questions.findIndex(q => q._id.toString() === questionId);
		
		if (questionIndex === -1) {
			return res.status(HTTP_STATUS.NOT_FOUND).json({ error: 'Question not found' });
		}

		// Update the question
		const question = questionBank.questions[questionIndex];
		if (text !== undefined) question.text = text.trim();
		if (type !== undefined) question.type = type;
		if (options !== undefined)
			question.options = options.map(opt => opt.trim()).filter(opt => opt.length > 0);
		if (correctAnswer !== undefined) question.correctAnswer = correctAnswer;
		if (explanation !== undefined) question.explanation = explanation?.trim();
		if (points !== undefined) question.points = points;
		if (tags !== undefined) question.tags = tags;
		if (difficulty !== undefined) question.difficulty = difficulty;

		await questionBank.save();

		res.status(HTTP_STATUS.OK).json(questionBank);
	} catch (error) {
		console.error('Error updating question:', error);
		res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ error: 'Failed to update question' });
	}
};

// Delete a question from a question bank
exports.deleteQuestion = async (req, res) => {
	try {
		const { questionId } = req.params;

		const questionBank = await QuestionBank.findById(req.params.id);

		if (!questionBank) {
			return res.status(HTTP_STATUS.NOT_FOUND).json({ error: 'Question bank not found' });
		}

		// Find question by ID
		const questionIndex = questionBank.questions.findIndex(q => q._id.toString() === questionId);
		
		if (questionIndex === -1) {
			return res.status(HTTP_STATUS.NOT_FOUND).json({ error: 'Question not found' });
		}

		questionBank.questions.splice(questionIndex, 1);
		await questionBank.save();

		res.status(HTTP_STATUS.OK).json(questionBank);
	} catch (error) {
		console.error('Error deleting question:', error);
		res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ error: 'Failed to delete question' });
	}
};

// Get random questions from a question bank (for testing/preview)
exports.getRandomQuestions = async (req, res) => {
	try {
		const { count, tags, difficulty } = req.query;

		const questionBank = await QuestionBank.findById(req.params.id);

		if (!questionBank) {
			return res.status(HTTP_STATUS.NOT_FOUND).json({ error: 'Question bank not found' });
		}

		let questions = questionBank.questions;

		// Apply filters if provided
		if (tags && tags.length > 0) {
			const tagArray = Array.isArray(tags) ? tags : [tags];
			questions = questions.filter(q => q.tags.some(tag => tagArray.includes(tag)));
		}

		if (difficulty) {
			questions = questions.filter(q => q.difficulty === difficulty);
		}

		// Randomly select questions
		const questionCount = Math.min(parseInt(count) || questions.length, questions.length);
		const shuffled = questions.sort(() => 0.5 - Math.random());
		const selectedQuestions = shuffled.slice(0, questionCount);

		res.status(HTTP_STATUS.OK).json({
			questions: selectedQuestions,
			totalAvailable: questions.length,
			selected: selectedQuestions.length,
		});
	} catch (error) {
		console.error('Error getting random questions:', error);
		res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
			error: 'Failed to get random questions',
		});
	}
};

// Import questions from JSON
exports.importQuestions = async (req, res) => {
	try {
		const { questions } = req.body;

		if (!Array.isArray(questions) || questions.length === 0) {
			return res
				.status(HTTP_STATUS.BAD_REQUEST)
				.json({ error: 'Questions array is required' });
		}

		const questionBank = await QuestionBank.findById(req.params.id);

		if (!questionBank) {
			return res.status(HTTP_STATUS.NOT_FOUND).json({ error: 'Question bank not found' });
		}

		// Validate and process questions
		const validQuestions = [];
		const errors = [];

		questions.forEach((q, index) => {
			try {
				if (!q.text || !q.options || !Array.isArray(q.options) || q.options.length < 2) {
					errors.push(`Question ${index + 1}: Invalid format`);
					return;
				}

				if (q.correctAnswer === undefined || q.correctAnswer === null) {
					errors.push(`Question ${index + 1}: Missing correct answer`);
					return;
				}

				validQuestions.push({
					text: q.text.trim(),
					type: q.type || 'single_choice',
					options: q.options.map(opt => opt.trim()).filter(opt => opt.length > 0),
					correctAnswer: q.correctAnswer,
					explanation: q.explanation?.trim(),
					points: q.points || 1,
					tags: q.tags || [],
					difficulty: q.difficulty || 'medium',
				});
			} catch (error) {
				errors.push(`Question ${index + 1}: ${error.message}`);
			}
		});

		if (errors.length > 0) {
			return res.status(HTTP_STATUS.BAD_REQUEST).json({
				error: 'Some questions have validation errors',
				errors,
				imported: validQuestions.length,
			});
		}

		// Add valid questions to the bank
		questionBank.questions.push(...validQuestions);
		await questionBank.save();

		res.status(HTTP_STATUS.OK).json({
			message: `Successfully imported ${validQuestions.length} questions`,
			questionBank,
		});
	} catch (error) {
		console.error('Error importing questions:', error);
		res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ error: 'Failed to import questions' });
	}
};
