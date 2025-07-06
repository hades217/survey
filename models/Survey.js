const mongoose = require('mongoose');
const { SURVEY_STATUS, SURVEY_TYPE } = require('../shared/constants');

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
		enum: [SURVEY_TYPE.SURVEY, SURVEY_TYPE.ASSESSMENT],
		default: SURVEY_TYPE.SURVEY
	},
	questions: [
		{
			text: String,
			options: [String],
			correctAnswer: {
				type: Number,
				default: null // Only used for assessment type, stores the index of correct option
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
	next();
});

module.exports = mongoose.model('Survey', surveySchema);
