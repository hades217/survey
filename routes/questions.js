const express = require('express');
const path = require('path');
const { readJson, writeJson } = require('../utils/file');

const router = express.Router();
const QUESTIONS_FILE = path.join(__dirname, '..', 'questions.json');

router.get('/questions', (req, res) => {
	const questions = readJson(QUESTIONS_FILE);
	res.json(questions);
});

router.put('/questions', (req, res) => {
	if (!req.session.admin) {
		return res.status(401).json({ error: 'unauthorized' });
	}
	const { text, options } = req.body;
	if (typeof text !== 'string' || !Array.isArray(options) || !options.every(o => typeof o === 'string')) {
		return res.status(400).json({ error: 'invalid data' });
	}
	const questions = readJson(QUESTIONS_FILE);
	const id = 'q' + (questions.length + 1);
	const newQuestion = { id, text, options };
	questions.push(newQuestion);
	writeJson(QUESTIONS_FILE, questions);
	res.json(newQuestion);
});

module.exports = router;
