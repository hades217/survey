const ResponseModel = require('../models/Response');
const SurveyModel = require('../models/Survey');
const { TYPES_REQUIRING_ANSWERS } = require('../shared/constants');

async function saveSurveyResponse(data) {
	// Get the survey to check if it requires scoring
	const survey = await SurveyModel.findById(data.surveyId);
	if (!survey) {
		throw new Error('Survey not found');
	}
	
	// Create the response
	const response = new ResponseModel(data);
	
	// Calculate score if it's a quiz/assessment/iq
	if (survey.requiresAnswers) {
		response.calculateScore(survey);
	}
	
	// Save the response
	await response.save();
	
	return response.toObject();
}

async function getSurveyResponses(surveyId, includeScores = false) {
	const query = ResponseModel.find({ surveyId });
	
	if (includeScores) {
		// Include all response data including scores
		return await query.exec();
	} else {
		// Exclude sensitive scoring information for regular surveys
		return await query.select('-score').exec();
	}
}

async function getSurveyStatistics(surveyId) {
	const survey = await SurveyModel.findById(surveyId);
	if (!survey) {
		throw new Error('Survey not found');
	}
	
	const responses = await ResponseModel.find({ surveyId });
	const totalResponses = responses.length;
	
	if (totalResponses === 0) {
		return {
			totalResponses: 0,
			averageScore: 0,
			passRate: 0,
			questionStatistics: []
		};
	}
	
	// Calculate statistics
	const statistics = {
		totalResponses,
		averageScore: 0,
		passRate: 0,
		questionStatistics: []
	};
	
	// Calculate scoring statistics for quiz/assessment/iq
	if (survey.requiresAnswers) {
		const totalScore = responses.reduce((sum, response) => sum + (response.score?.percentage || 0), 0);
		statistics.averageScore = Math.round((totalScore / totalResponses) * 100) / 100;
		
		const passedCount = responses.filter(response => response.score?.passed || false).length;
		statistics.passRate = Math.round((passedCount / totalResponses) * 100 * 100) / 100;
	}
	
	// Calculate question-level statistics
	survey.questions.forEach((question, questionIndex) => {
		const questionStats = {
			questionIndex,
			questionText: question.text,
			questionType: question.type,
			totalAnswers: 0,
			optionStatistics: [],
			correctAnswerRate: 0
		};
		
		// Initialize option statistics
		question.options.forEach((option, optionIndex) => {
			questionStats.optionStatistics.push({
				optionIndex,
				optionText: option,
				count: 0,
				percentage: 0
			});
		});
		
		// Count answers for each option
		responses.forEach(response => {
			const answer = response.answers.get(questionIndex.toString());
			if (answer !== undefined && answer !== null) {
				questionStats.totalAnswers++;
				
				if (question.type === 'single_choice') {
					if (typeof answer === 'number' && answer < questionStats.optionStatistics.length) {
						questionStats.optionStatistics[answer].count++;
					}
				} else if (question.type === 'multiple_choice') {
					if (Array.isArray(answer)) {
						answer.forEach(optionIndex => {
							if (optionIndex < questionStats.optionStatistics.length) {
								questionStats.optionStatistics[optionIndex].count++;
							}
						});
					}
				}
			}
		});
		
		// Calculate percentages
		if (questionStats.totalAnswers > 0) {
			questionStats.optionStatistics.forEach(optionStat => {
				optionStat.percentage = Math.round((optionStat.count / questionStats.totalAnswers) * 100 * 100) / 100;
			});
		}
		
		// Calculate correct answer rate for quiz/assessment/iq
		if (survey.requiresAnswers && question.correctAnswer !== null) {
			let correctCount = 0;
			
			responses.forEach(response => {
				const answer = response.answers.get(questionIndex.toString());
				if (answer !== undefined && answer !== null) {
					let isCorrect = false;
					
					if (question.type === 'single_choice') {
						isCorrect = answer === question.correctAnswer;
					} else if (question.type === 'multiple_choice') {
						if (Array.isArray(answer) && Array.isArray(question.correctAnswer)) {
							const userSet = new Set(answer.sort());
							const correctSet = new Set(question.correctAnswer.sort());
							isCorrect = userSet.size === correctSet.size && 
									   [...userSet].every(val => correctSet.has(val));
						}
					}
					
					if (isCorrect) {
						correctCount++;
					}
				}
			});
			
			questionStats.correctAnswerRate = questionStats.totalAnswers > 0 ? 
				Math.round((correctCount / questionStats.totalAnswers) * 100 * 100) / 100 : 0;
		}
		
		statistics.questionStatistics.push(questionStats);
	});
	
	return statistics;
}

module.exports = { 
	saveSurveyResponse,
	getSurveyResponses,
	getSurveyStatistics
};
