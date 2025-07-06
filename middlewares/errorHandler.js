const { ZodError } = require('zod');
const { HTTP_STATUS } = require('../shared/constants');

function errorHandler(err, req, res, next) {
	// Default values
	let status = HTTP_STATUS.INTERNAL_SERVER_ERROR;
	let message = 'Internal server error';

	if (err instanceof ZodError) {
		status = HTTP_STATUS.BAD_REQUEST;
		message = err.errors.map(e => e.message).join(', ');
	} else if (err.statusCode) {
		status = err.statusCode;
		message = err.message || message;
	} else if (err.message) {
		status = HTTP_STATUS.BAD_REQUEST;
		message = err.message;
	}

	res.status(status).json({ success: false, message, statusCode: status });
}

module.exports = errorHandler;
