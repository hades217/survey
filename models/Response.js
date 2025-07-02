const mongoose = require('mongoose');

const responseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  surveyId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Survey' },
  answers: {},
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Response', responseSchema);
