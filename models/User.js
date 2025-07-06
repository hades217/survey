const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
	name: {
		type: String,
		required: true,
		trim: true,
	},
	email: {
		type: String,
		required: true,
		unique: true,
		lowercase: true,
		trim: true,
	},
	role: {
		type: String,
		enum: ['student', 'teacher', 'admin', 'user'],
		default: 'user',
	},
	studentId: {
		type: String,
		sparse: true, // Allows null values but ensures uniqueness when present
		trim: true,
	},
	department: {
		type: String,
		trim: true,
	},
	class: {
		type: String,
		trim: true,
	},
	isActive: {
		type: Boolean,
		default: true,
	},
	createdAt: {
		type: Date,
		default: Date.now,
	},
	lastLoginAt: {
		type: Date,
	},
});

// Index for efficient queries
userSchema.index({ email: 1 });
userSchema.index({ studentId: 1 });
userSchema.index({ role: 1 });

module.exports = mongoose.model('User', userSchema);
