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
	// For question bank submissions: store the selected question IDs
	selectedQuestions: [{
		originalQuestionId: {
			type: mongoose.Schema.Types.ObjectId,
			required: false
		},
		questionIndex: {
			type: Number,
			required: false
		},
		// Store the actual question data to ensure consistency
		questionData: {
			text: String,
			type: String,
			options: [String],
			correctAnswer: mongoose.Schema.Types.Mixed,
			explanation: String,
			points: Number,
			tags: [String],
			difficulty: String
		}
	}],
	// Scoring information (for quiz/assessment/iq)
	score: {
		totalPoints: { type: Number, default: 0 },
		correctAnswers: { type: Number, default: 0 },
		wrongAnswers: { type: Number, default: 0 },
		percentage: { type: Number, default: 0 },
		passed: { type: Boolean, default: false },
		// Enhanced scoring details
		scoringMode: { type: String, enum: ['percentage', 'accumulated'], default: 'percentage' },
		maxPossiblePoints: { type: Number, default: 0 },
		displayScore: { type: Number, default: 0 }, // The score to display to user
		scoringDetails: {
			questionScores: [{
				questionIndex: Number,
				pointsAwarded: Number,
				maxPoints: Number,
				isCorrect: Boolean
			}]
		}
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
	const questionScores = [];
	
	// Determine the source of questions
	const isQuestionBank = survey.sourceType === 'question_bank';
	const questions = isQuestionBank ? 
		this.selectedQuestions.map(sq => sq.questionData) : 
		survey.questions;
	
	// Calculate total possible points
	const maxPossiblePoints = questions.reduce((sum, q) => sum + (q.points || 1), 0);
	
	// Calculate score for each question
	questions.forEach((question, index) => {
		const userAnswer = this.answers.get(index.toString());
		const correctAnswer = question.correctAnswer;
		const questionPoints = question.points || 1;
		
		let isCorrect = false;
		let pointsAwarded = 0;
		
		if (userAnswer === undefined || userAnswer === null) {
			wrongAnswers++;
		} else {
			// Check if answer is correct
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
				pointsAwarded = questionPoints;
				totalPoints += questionPoints;
			} else {
				wrongAnswers++;
			}
		}
		
		// Record detailed scoring for this question
		questionScores.push({
			questionIndex: index,
			pointsAwarded,
			maxPoints: questionPoints,
			isCorrect
		});
	});
	
	// Calculate percentage
	const percentage = maxPossiblePoints > 0 ? (totalPoints / maxPossiblePoints) * 100 : 0;
	
	// Determine scoring mode and display score
	const scoringMode = survey.scoringSettings.scoringMode || 'percentage';
	let displayScore = 0;
	let passed = false;
	
	if (scoringMode === 'percentage') {
		// Percentage mode: score is 0-100
		displayScore = Math.round(percentage * 100) / 100;
		passed = percentage >= (survey.scoringSettings.passingThreshold || 60);
	} else {
		// Accumulated mode: score is the actual points earned
		displayScore = totalPoints;
		passed = totalPoints >= (survey.scoringSettings.passingThreshold || 0);
	}
	
	// Save all scoring information
	this.score = {
		totalPoints,
		correctAnswers,
		wrongAnswers,
		percentage: Math.round(percentage * 100) / 100,
		passed,
		scoringMode,
		maxPossiblePoints,
		displayScore,
		scoringDetails: {
			questionScores
		}
	};
};

// Virtual method to get formatted score display
responseSchema.virtual('formattedScore').get(function() {
	if (!this.score) return null;
	
	const mode = this.score.scoringMode;
	const display = this.score.displayScore;
	const max = mode === 'percentage' ? 100 : this.score.maxPossiblePoints;
	
	if (mode === 'percentage') {
		return `${display}分 (${display}%)`;
	} else {
		return `${display}分 (满分${max}分)`;
	}
});

module.exports = mongoose.model('Response', responseSchema);
