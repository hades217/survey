const express = require('express');
const session = require('express-session');
const path = require('path');
const mongoose = require('mongoose');

const questionsRouter = require('./routes/questions');
const responsesRouter = require('./routes/responses');
const adminRouter = require('./routes/admin');
const surveysRouter = require('./routes/surveys');
const usersRouter = require('./routes/users');
const invitationsRouter = require('./routes/invitations');
const questionBanksRouter = require('./routes/questionBanks');
const subscriptionRouter = require('./routes/subscription');
const companiesRouter = require('./routes/companies');
const errorHandler = require('./middlewares/errorHandler');

// Initialize service container
const serviceContainer = require('./services/ServiceContainer');

const app = express();
const PORT = process.env.PORT || 5050;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/survey';

mongoose
	.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
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
app.use('/api/admin/users', usersRouter);
app.use('/api/admin/question-banks', questionBanksRouter);
app.use('/api/invitations', invitationsRouter);
app.use('/api/subscription', subscriptionRouter);
app.use('/api/companies', companiesRouter);
app.use(errorHandler);

// Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const CLIENT_BUILD_PATH = path.join(__dirname, 'client', 'dist');
app.use(express.static(CLIENT_BUILD_PATH));
app.get('*', (req, res) => {
	res.sendFile(path.join(CLIENT_BUILD_PATH, 'index.html'));
});

app.listen(PORT, () => {
	console.log(`Server running on http://localhost:${PORT}`);
});
