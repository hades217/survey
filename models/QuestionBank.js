const mongoose = require('mongoose');
const { QUESTION_TYPE } = require('../shared/constants');

const questionBankSchema = new mongoose.Schema({
	name: {
		type: String,
		required: true,
		trim: true,
	},
	description: {
		type: String,
		trim: true,
	},
	questions: [
		{
			text: {
				type: String,
				required: true,
			},
			type: {
				type: String,
				enum: [QUESTION_TYPE.SINGLE_CHOICE, QUESTION_TYPE.MULTIPLE_CHOICE],
				default: QUESTION_TYPE.SINGLE_CHOICE,
			},
			options: {
				type: [String],
				required: true,
				validate: {
					validator: function (options) {
						return options && options.length >= 2;
					},
					message: 'At least 2 options are required',
				},
			},
			// Correct answer(s) for scoring
			correctAnswer: {
				type: mongoose.Schema.Types.Mixed, // Can be Number or [Number]
				required: true,
				validate: {
					validator: function (value) {
						if (this.type === QUESTION_TYPE.SINGLE_CHOICE) {
							return (
								typeof value === 'number' &&
								value >= 0 &&
								value < this.options.length
							);
						}

						if (this.type === QUESTION_TYPE.MULTIPLE_CHOICE) {
							return (
								Array.isArray(value) &&
								value.length > 0 &&
								value.every(
									idx =>
										typeof idx === 'number' &&
										idx >= 0 &&
										idx < this.options.length
								)
							);
						}

						return false;
					},
					message: 'Invalid correct answer for question type',
				},
			},
			// Optional: explanation for the correct answer
			explanation: {
				type: String,
				default: null,
			},
			// Points for scoring
			points: {
				type: Number,
				default: 1,
			},
			// Optional: tags for filtering
			tags: [
				{
					type: String,
					trim: true,
				},
			],
			// Optional: difficulty level
			difficulty: {
				type: String,
				enum: ['easy', 'medium', 'hard'],
				default: 'medium',
			},
		},
	],
	// Creator information
	createdBy: {
		type: String,
		required: true,
	},
	// Timestamps
	createdAt: {
		type: Date,
		default: Date.now,
	},
	updatedAt: {
		type: Date,
		default: Date.now,
	},
});

// Update the updatedAt field before saving
questionBankSchema.pre('save', function (next) {
	this.updatedAt = Date.now();
	next();
});

// Virtual to get question count
questionBankSchema.virtual('questionCount').get(function () {
	return this.questions.length;
});

module.exports = mongoose.model('QuestionBank', questionBankSchema);
