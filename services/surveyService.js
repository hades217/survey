const ResponseModel = require('../models/Response');

async function saveSurveyResponse(data) {
	const response = await ResponseModel.create(data);
	return response.toObject();
}

module.exports = { saveSurveyResponse };
