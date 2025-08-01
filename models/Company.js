const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
	name: {
		type: String,
		required: true,
		trim: true,
	},
	industry: {
		type: String,
		trim: true,
	},
	logoUrl: {
		type: String,
		trim: true,
	},
	// Company size field for onboarding
	size: {
		type: String,
		enum: ['1-10', '11-50', '51-200', '201-500', '500+'],
		trim: true,
	},
	description: {
		type: String,
		trim: true,
	},
	website: {
		type: String,
		trim: true,
	},
	// Contact information fields for onboarding
	contactName: {
		type: String,
		trim: true,
	},
	contactEmail: {
		type: String,
		trim: true,
		lowercase: true,
	},
	role: {
		type: String,
		trim: true,
	},
	// Brand settings for onboarding
	themeColor: {
		type: String,
		trim: true,
		default: '#3B82F6', // Default blue color
	},
	customLogoEnabled: {
		type: Boolean,
		default: false,
	},
	// System preferences for onboarding
	defaultLanguage: {
		type: String,
		enum: ['en', 'zh', 'es', 'fr', 'de', 'ja'],
		default: 'en',
	},
	autoNotifyCandidate: {
		type: Boolean,
		default: true,
	},
	// Onboarding completion status
	isOnboardingCompleted: {
		type: Boolean,
		default: false,
	},
	createdAt: {
		type: Date,
		default: Date.now,
	},
	updatedAt: {
		type: Date,
		default: Date.now,
	},
});

// 更新时自动设置 updatedAt
companySchema.pre('save', function (next) {
	this.updatedAt = new Date();
	next();
});

// Index for efficient queries
companySchema.index({ name: 1 });

module.exports = mongoose.model('Company', companySchema);
