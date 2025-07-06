const {
	surveyResponseSchema,
	surveyCreateSchema,
	surveyUpdateSchema,
} = require('../schemas/surveySchemas');
const {
	saveSurveyResponse,
	getSurveyResponses,
	getSurveyStatistics,
} = require('../services/surveyService');
const SurveyModel = require('../models/Survey');
const { HTTP_STATUS, ERROR_MESSAGES } = require('../shared/constants');

async function submitSurveyResponse(req, res) {
	try {
		// Add metadata to the request body
		const requestData = {
			...req.body,
			surveyId: req.params.surveyId,
			metadata: {
				userAgent: req.get('User-Agent'),
				ipAddress: req.ip || req.connection.remoteAddress,
				deviceType: req.get('User-Agent')?.includes('Mobile') ? 'mobile' : 'desktop',
			},
		};

		const data = surveyResponseSchema.parse(requestData);
		const saved = await saveSurveyResponse(data);

		res.status(HTTP_STATUS.CREATED).json({
			success: true,
			data: saved,
			message: 'Response submitted successfully',
		});
	} catch (error) {
		res.status(HTTP_STATUS.BAD_REQUEST).json({
			success: false,
			error: error.message,
		});
	}
}

async function createSurvey(req, res) {
	try {
		const data = surveyCreateSchema.parse(req.body);

		// Generate slug after schema validation
		if (data.title && !data.slug) {
			data.slug = await SurveyModel.generateSlug(data.title);
		}

		const survey = new SurveyModel(data);
		await survey.save();

		res.status(HTTP_STATUS.CREATED).json({
			success: true,
			data: survey.toObject(),
			message: 'Survey created successfully',
		});
	} catch (error) {
		res.status(HTTP_STATUS.BAD_REQUEST).json({
			success: false,
			error: error.message,
		});
	}
}

async function updateSurvey(req, res) {
	try {
		const surveyId = req.params.surveyId;
		const data = surveyUpdateSchema.parse(req.body);

		const survey = await SurveyModel.findByIdAndUpdate(surveyId, data, {
			new: true,
			runValidators: true,
		});

		if (!survey) {
			return res.status(HTTP_STATUS.NOT_FOUND).json({
				success: false,
				error: ERROR_MESSAGES.SURVEY_NOT_FOUND,
			});
		}

		res.json({
			success: true,
			data: survey.toObject(),
			message: 'Survey updated successfully',
		});
	} catch (error) {
		res.status(HTTP_STATUS.BAD_REQUEST).json({
			success: false,
			error: error.message,
		});
	}
}

async function getSurvey(req, res) {
	try {
		const surveyId = req.params.surveyId;
		const survey = await SurveyModel.findById(surveyId);

		if (!survey) {
			return res.status(HTTP_STATUS.NOT_FOUND).json({
				success: false,
				error: ERROR_MESSAGES.SURVEY_NOT_FOUND,
			});
		}

		// Don't expose correct answers to survey takers
		const surveyData = survey.toObject();
		if (!req.query.includeAnswers) {
			surveyData.questions.forEach(question => {
				delete question.correctAnswer;
				delete question.explanation;
			});
		}

		res.json({
			success: true,
			data: surveyData,
		});
	} catch (error) {
		res.status(HTTP_STATUS.BAD_REQUEST).json({
			success: false,
			error: error.message,
		});
	}
}

async function getSurveyResponsesController(req, res) {
	try {
		const surveyId = req.params.surveyId;
		const includeScores = req.query.includeScores === 'true';

		const responses = await getSurveyResponses(surveyId, includeScores);

		res.json({
			success: true,
			data: responses,
		});
	} catch (error) {
		res.status(HTTP_STATUS.BAD_REQUEST).json({
			success: false,
			error: error.message,
		});
	}
}

async function getSurveyStatisticsController(req, res) {
	try {
		const surveyId = req.params.surveyId;
		const statistics = await getSurveyStatistics(surveyId);

		res.json({
			success: true,
			data: statistics,
		});
	} catch (error) {
		res.status(HTTP_STATUS.BAD_REQUEST).json({
			success: false,
			error: error.message,
		});
	}
}

module.exports = {
	submitSurveyResponse,
	createSurvey,
	updateSurvey,
	getSurvey,
	getSurveyResponsesController,
	getSurveyStatisticsController,
};
