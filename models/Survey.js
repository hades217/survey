const mongoose = require('mongoose');
const { SURVEY_STATUS, SURVEY_TYPE, QUESTION_TYPE, TYPES_REQUIRING_ANSWERS } = require('../shared/constants');

const surveySchema = new mongoose.Schema({
	title: String,
	description: String,
	slug: {
		type: String,
		unique: true,
		required: false,
		index: true
	},
	type: {
		type: String,
		enum: [SURVEY_TYPE.SURVEY, SURVEY_TYPE.ASSESSMENT, SURVEY_TYPE.QUIZ, SURVEY_TYPE.IQ],
		default: SURVEY_TYPE.SURVEY
	},
	// Time limit in minutes
	timeLimit: {
		type: Number,
		default: null
	},
	// Maximum attempts allowed per user
	maxAttempts: {
		type: Number,
		default: 1
	},
	// Instructions for students
	instructions: {
		type: String,
		default: null
	},
	// Navigation mode for questions
	navigationMode: {
		type: String,
		enum: ['step-by-step', 'paginated', 'all-in-one'],
		default: 'step-by-step'
	},
	// Question source configuration
	sourceType: {
		type: String,
		enum: ['manual', 'question_bank'],
		default: 'manual'
	},
	// Reference to question bank (when sourceType is 'question_bank')
	questionBankId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'QuestionBank',
		default: null
	},
	// Number of questions to randomly select from question bank
	questionCount: {
		type: Number,
		default: null
	},
	questions: [
		{
			text: {
				type: String,
				required: true
			},
			type: {
				type: String,
				enum: [QUESTION_TYPE.SINGLE_CHOICE, QUESTION_TYPE.MULTIPLE_CHOICE],
				default: QUESTION_TYPE.SINGLE_CHOICE
			},
			options: {
				type: [String],
				required: true,
				validate: {
					validator: function(options) {
						return options && options.length >= 2;
					},
					message: 'At least 2 options are required'
				}
			},
			// For quiz/assessment/iq questions: correct answer(s)
			// For single choice: number (index of correct option)
			// For multiple choice: array of numbers (indices of correct options)
			correctAnswer: {
				type: mongoose.Schema.Types.Mixed, // Can be Number or [Number]
				default: null,
				validate: {
					validator: function(value) {
						const survey = this.parent();
						const requiresAnswer = TYPES_REQUIRING_ANSWERS.includes(survey.type);
						
						if (!requiresAnswer) {
							return true; // Survey questions don't need correct answers
						}
						
						if (value === null || value === undefined) {
							return false; // Quiz/assessment questions must have correct answers
						}
						
						if (this.type === QUESTION_TYPE.SINGLE_CHOICE) {
							return typeof value === 'number' && value >= 0 && value < this.options.length;
						}
						
						if (this.type === QUESTION_TYPE.MULTIPLE_CHOICE) {
							return Array.isArray(value) && 
								   value.length > 0 && 
								   value.every(idx => typeof idx === 'number' && idx >= 0 && idx < this.options.length);
						}
						
						return false;
					},
					message: 'Invalid correct answer for question type'
				}
			},
			// Optional: explanation for the correct answer
			explanation: {
				type: String,
				default: null
			},
			// Optional: points for scoring
			points: {
				type: Number,
				default: 1
			}
		}
	],
	status: {
		type: String,
		enum: [SURVEY_STATUS.DRAFT, SURVEY_STATUS.ACTIVE, SURVEY_STATUS.CLOSED],
		default: SURVEY_STATUS.DRAFT
	},
	// Distribution settings
	distributionSettings: {
		allowAnonymous: {
			type: Boolean,
			default: true
		},
		requireLogin: {
			type: Boolean,
			default: false
		},
		allowedRoles: [{
			type: String,
			enum: ['student', 'teacher', 'admin', 'user']
		}],
		maxResponsesPerUser: {
			type: Number,
			default: 1
		}
	},
	// Publishing settings
	publishingSettings: {
		publishedAt: Date,
		publishedBy: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User'
		},
		scheduledPublishAt: Date,
		scheduledCloseAt: Date,
		autoClose: {
			type: Boolean,
			default: false
		}
	},
	// Scoring settings (for quiz/assessment/iq)
	scoringSettings: {
		// Scoring mode: 'percentage' or 'accumulated'
		scoringMode: {
			type: String,
			enum: ['percentage', 'accumulated'],
			default: 'percentage'
		},
		totalPoints: {
			type: Number,
			default: 0
		},
		passingScore: {
			type: Number,
			default: 0
		},
		// For percentage mode: passing percentage (0-100)
		// For accumulated mode: minimum points needed to pass
		passingThreshold: {
			type: Number,
			default: 60 // 60% for percentage mode, or 60 points for accumulated mode
		},
		showScore: {
			type: Boolean,
			default: true
		},
		showCorrectAnswers: {
			type: Boolean,
			default: false
		},
		// Show detailed breakdown of scoring
		showScoreBreakdown: {
			type: Boolean,
			default: true
		},
		// Custom scoring rules
		customScoringRules: {
			// Whether to use custom point values per question
			useCustomPoints: {
				type: Boolean,
				default: false
			},
			// Default points for new questions when using custom scoring
			defaultQuestionPoints: {
				type: Number,
				default: 1
			}
		}
	},
	createdAt: {
		type: Date,
		default: Date.now
	},
	isActive: {
		type: Boolean,
		default: true
	}
});

// Helper function to generate unique slug
surveySchema.statics.generateSlug = async function(title, excludeId = null) {
	let baseSlug = title
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/(^-|-$)/g, '');
	
	// Ensure slug is unique
	let slug = baseSlug;
	let counter = 1;
	
	// Check if slug already exists (excluding current document)
	const query = { slug };
	if (excludeId) {
		query._id = { $ne: excludeId };
	}
	
	while (await this.findOne(query)) {
		slug = `${baseSlug}-${counter}`;
		counter++;
		query.slug = slug;
	}
	
	return slug;
};

// Virtual method to check if survey requires answers
surveySchema.virtual('requiresAnswers').get(function() {
	return TYPES_REQUIRING_ANSWERS.includes(this.type);
});

// Virtual method to get scoring mode description
surveySchema.virtual('scoringDescription').get(function() {
	if (!this.requiresAnswers) return null;
	
	const mode = this.scoringSettings.scoringMode;
	const threshold = this.scoringSettings.passingThreshold;
	const totalPoints = this.scoringSettings.totalPoints;
	
	if (mode === 'percentage') {
		return `Percentage scoring, max score 100, passing threshold ${threshold}`;
	} else {
		return `Accumulated scoring, max score ${totalPoints}, passing threshold ${threshold}`;
	}
});

module.exports = mongoose.model('Survey', surveySchema);
