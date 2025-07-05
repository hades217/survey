const { ZodError } = require('zod');

function errorHandler(err, req, res, next) {
  // Default values
  let status = 500;
  let message = 'Internal server error';

  if (err instanceof ZodError) {
    status = 400;
    message = err.errors.map(e => e.message).join(', ');
  } else if (err.statusCode) {
    status = err.statusCode;
    message = err.message || message;
  } else if (err.message) {
    status = 400;
    message = err.message;
  }

  res.status(status).json({ success: false, message, statusCode: status });
}

module.exports = errorHandler;
