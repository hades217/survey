const express = require('express');
const session = require('express-session');
const path = require('path');
const mongoose = require('mongoose');

const questionsRouter = require('./routes/questions');
const responsesRouter = require('./routes/responses');
const adminRouter = require('./routes/admin');
const surveysRouter = require('./routes/surveys');
const errorHandler = require('./middlewares/errorHandler');

const app = express();
const PORT = process.env.PORT || 5050;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/survey';

mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
	.then(() => {
		console.log('✓ Connected to MongoDB');
	})
	.catch(err => {
		console.error('✗ MongoDB connection failed:', err.message);
		process.exit(1);
	});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
	session({
		secret: 'change-me',
		resave: false,
		saveUninitialized: false,
	})
);

app.use('/api', questionsRouter);
app.use('/api', responsesRouter);
app.use('/api', surveysRouter);
app.use('/api/admin', adminRouter);
app.use(errorHandler);

const CLIENT_BUILD_PATH = path.join(__dirname, 'client', 'dist');
app.use(express.static(CLIENT_BUILD_PATH));
app.get('*', (req, res) => {
	res.sendFile(path.join(CLIENT_BUILD_PATH, 'index.html'));
});

app.listen(PORT, () => {
	console.log(`Server running on http://localhost:${PORT}`);
});
