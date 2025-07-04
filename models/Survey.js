const mongoose = require('mongoose');

const surveySchema = new mongoose.Schema({
	title: String,
	description: String,
	slug: {
		type: String,
		unique: true,
		required: true,
		index: true
	},
	questions: [
		{
			text: String,
			options: [String]
		}
	],
	status: {
		type: String,
		enum: ['draft', 'active', 'closed'],
		default: 'draft'
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
