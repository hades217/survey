const mongoose = require('mongoose');
const { SURVEY_STATUS, SURVEY_TYPE, QUESTION_TYPE, TYPES_REQUIRING_ANSWERS } = require('../shared/constants');

const surveySchema = new mongoose.Schema({
	title: String,
	description: String,
	slug: {
		type: String,
		unique: true,
		required: true,
		index: true
	},
	type: {
		type: String,
		enum: [SURVEY_TYPE.SURVEY, SURVEY_TYPE.ASSESSMENT, SURVEY_TYPE.QUIZ, SURVEY_TYPE.IQ],
		default: SURVEY_TYPE.SURVEY
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
		totalPoints: {
			type: Number,
			default: 0
		},
		passingScore: {
			type: Number,
			default: 0
		},
		showScore: {
			type: Boolean,
			default: true
		},
		showCorrectAnswers: {
			type: Boolean,
			default: false
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

// Generate slug from title before saving
surveySchema.pre('save', function(next) {
	if (this.isModified('title') && !this.slug) {
		this.slug = this.title
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/(^-|-$)/g, '');
	}
	
	// Calculate total points for scoring
	if (this.questions && this.questions.length > 0) {
		this.scoringSettings.totalPoints = this.questions.reduce((total, question) => {
			return total + (question.points || 1);
		}, 0);
	}
	
	next();
});

// Virtual method to check if survey requires answers
surveySchema.virtual('requiresAnswers').get(function() {
	return TYPES_REQUIRING_ANSWERS.includes(this.type);
});

module.exports = mongoose.model('Survey', surveySchema);
