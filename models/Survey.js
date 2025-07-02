const mongoose = require('mongoose');

const surveySchema = new mongoose.Schema({
  title: String,
  description: String,
  questions: [
    {
      text: String,
      options: [String]
    }
  ]
});

module.exports = mongoose.model('Survey', surveySchema);
