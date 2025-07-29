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
const errorHandler = require('./middlewares/errorHandler');

const app = express();
const PORT = process.env.PORT || 5050;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/survey';

// MongoDB connection with retry logic
const connectToMongoDB = async (retries = 5, delay = 10000) => {
	for (let i = 1; i <= retries; i++) {
		try {
			console.log(`🔄 MongoDB connection attempt ${i}...`);
			console.log(`📍 Connecting to: ${MONGODB_URI}`);

			await mongoose.connect(MONGODB_URI, {
				serverSelectionTimeoutMS: 30000, // Increased to 30 seconds
				connectTimeoutMS: 30000,
				socketTimeoutMS: 30000,
				maxPoolSize: 10,
				minPoolSize: 1,
				retryWrites: true,
				retryReads: true
			});

			console.log('✅ MongoDB connected successfully');
			return;
		} catch (error) {
			console.log(`✗ MongoDB connection attempt ${i} failed:`, error.message);

			if (i === retries) {
				console.log('✗ All MongoDB connection attempts failed.');
				console.log('🔧 Troubleshooting info:');
				console.log('   - MongoDB URI:', MONGODB_URI);
				console.log('   - Network connectivity test needed');

				// Don't exit, let the server start without MongoDB for now
				console.log('⚠️  Starting server without MongoDB connection...');
				return;
			}

			console.log(`Retrying in ${delay/1000} seconds... (${retries - i} attempts left)`);
			await new Promise(resolve => setTimeout(resolve, delay));
		}
	}
};

// Initialize MongoDB connection
connectToMongoDB();

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check endpoint (doesn't require database)
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'survey-app-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false, // Set to true in production with HTTPS
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

app.use('/api', questionsRouter);
app.use('/api', responsesRouter);
app.use('/api', surveysRouter);
app.use('/api/admin', adminRouter);
app.use('/api/admin/users', usersRouter);
app.use('/api/admin/question-banks', questionBanksRouter);
app.use('/api/invitations', invitationsRouter);
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
