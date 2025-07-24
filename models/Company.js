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
	description: {
		type: String,
		trim: true,
	},
	website: {
		type: String,
		trim: true,
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
