const mongoose = require('mongoose');

const responseSchema = new mongoose.Schema({
	name: { type: String, required: true },
	email: { type: String, required: true },
	surveyId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Survey' },
	// Answers format:
	// For single choice: { questionIndex: selectedOptionIndex }
	// For multiple choice: { questionIndex: [selectedOptionIndex1, selectedOptionIndex2, ...] }
	answers: {
		type: Map,
		of: mongoose.Schema.Types.Mixed, // Can be Number or [Number]
		required: true
	},
	// Scoring information (for quiz/assessment/iq)
	score: {
		totalPoints: { type: Number, default: 0 },
		correctAnswers: { type: Number, default: 0 },
		wrongAnswers: { type: Number, default: 0 },
		percentage: { type: Number, default: 0 },
		passed: { type: Boolean, default: false }
	},
	// Response time tracking
	timeSpent: {
		type: Number, // in seconds
		default: 0
	},
	// Whether the response was auto-submitted due to time limit
	isAutoSubmit: {
		type: Boolean,
		default: false
	},
	// Device/browser information
	metadata: {
		userAgent: String,
		ipAddress: String,
		deviceType: String
	},
	createdAt: { type: Date, default: Date.now }
});

// Method to calculate score for quiz/assessment/iq
responseSchema.methods.calculateScore = function(survey) {
	if (!survey.requiresAnswers) {
		return; // No scoring for regular surveys
	}
	
	let totalPoints = 0;
	let correctAnswers = 0;
	let wrongAnswers = 0;
	
	survey.questions.forEach((question, index) => {
		const userAnswer = this.answers.get(index.toString());
		const correctAnswer = question.correctAnswer;
		const questionPoints = question.points || 1;
		
		if (userAnswer === undefined || userAnswer === null) {
			wrongAnswers++;
			return;
		}
		
		let isCorrect = false;
		
		if (question.type === 'single_choice') {
			isCorrect = userAnswer === correctAnswer;
		} else if (question.type === 'multiple_choice') {
			// For multiple choice, both arrays must have same elements
			if (Array.isArray(userAnswer) && Array.isArray(correctAnswer)) {
				const userSet = new Set(userAnswer.sort());
				const correctSet = new Set(correctAnswer.sort());
				isCorrect = userSet.size === correctSet.size && 
						   [...userSet].every(val => correctSet.has(val));
			}
		}
		
		if (isCorrect) {
			correctAnswers++;
			totalPoints += questionPoints;
		} else {
			wrongAnswers++;
		}
	});
	
	const totalPossiblePoints = survey.scoringSettings.totalPoints || 
								survey.questions.reduce((sum, q) => sum + (q.points || 1), 0);
	const percentage = totalPossiblePoints > 0 ? (totalPoints / totalPossiblePoints) * 100 : 0;
	const passed = percentage >= (survey.scoringSettings.passingScore || 0);
	
	this.score = {
		totalPoints,
		correctAnswers,
		wrongAnswers,
		percentage: Math.round(percentage * 100) / 100, // Round to 2 decimal places
		passed
	};
};

module.exports = mongoose.model('Response', responseSchema);
