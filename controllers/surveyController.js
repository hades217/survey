const { surveyResponseSchema } = require('../schemas/surveySchemas');
const { saveSurveyResponse } = require('../services/surveyService');

async function submitSurveyResponse(req, res) {
	const data = surveyResponseSchema.parse({ ...req.body, surveyId: req.params.surveyId });
	const saved = await saveSurveyResponse(data);
	res.json({ success: true, data: saved });
}

module.exports = { submitSurveyResponse };
