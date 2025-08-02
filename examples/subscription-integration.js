// ===================================================================
// BACKEND INTEGRATION EXAMPLES
// ===================================================================

// Example 1: Protecting Survey Creation Route
// File: routes/surveys.js

const express = require('express');
const router = express.Router();
const Survey = require('../models/Survey');
const { requireActiveSubscription, checkUsageLimit } = require('../middlewares/subscription');
const authenticateToken = require('../middlewares/auth');

// CREATE SURVEY - with subscription and usage limit checks
router.post(
	'/surveys',
	authenticateToken,
	requireActiveSubscription,
	checkUsageLimit('maxSurveys'),
	async (req, res) => {
		try {
			const survey = new Survey({
				...req.body,
				creator: req.user._id,
			});

			await survey.save();
			res.status(201).json(survey);
		} catch (error) {
			res.status(500).json({ error: 'Failed to create survey' });
		}
	}
);

// ===================================================================

// Example 2: Protecting Question Addition with Limits
// File: routes/surveys.js

const { checkQuestionLimit } = require('../middlewares/subscription');

// ADD QUESTIONS TO SURVEY - with question limit check
router.post(
	'/surveys/:id/questions',
	authenticateToken,
	requireActiveSubscription,
	checkQuestionLimit,
	async (req, res) => {
		try {
			const survey = await Survey.findById(req.params.id);
			if (!survey) {
				return res.status(404).json({ error: 'Survey not found' });
			}

			// Add questions logic
			survey.questions.push(...req.body.questions);
			await survey.save();

			res.json(survey);
		} catch (error) {
			res.status(500).json({ error: 'Failed to add questions' });
		}
	}
);

// ===================================================================

// Example 3: Feature-Specific Route Protection
// File: routes/surveys.js

const { requireFeature } = require('../middlewares/subscription');

// CSV IMPORT - Pro feature only
router.post(
	'/surveys/:id/import-csv',
	authenticateToken,
	requireActiveSubscription,
	requireFeature('csvImport'),
	async (req, res) => {
		try {
			// CSV import logic here
			const survey = await Survey.findById(req.params.id);
			// Process CSV data...

			res.json({ message: 'CSV imported successfully' });
		} catch (error) {
			res.status(500).json({ error: 'Failed to import CSV' });
		}
	}
);

// IMAGE QUESTIONS - Pro feature only
router.post(
	'/surveys/:id/questions/image',
	authenticateToken,
	requireActiveSubscription,
	requireFeature('imageQuestions'),
	async (req, res) => {
		try {
			// Image question logic here
			const survey = await Survey.findById(req.params.id);
			// Add image question...

			res.json({ message: 'Image question added successfully' });
		} catch (error) {
			res.status(500).json({ error: 'Failed to add image question' });
		}
	}
);

// ADVANCED ANALYTICS - Pro feature only
router.get(
	'/surveys/:id/analytics/advanced',
	authenticateToken,
	requireActiveSubscription,
	requireFeature('advancedAnalytics'),
	async (req, res) => {
		try {
			// Advanced analytics logic here
			const analytics = {
				// Advanced analytics data...
			};

			res.json(analytics);
		} catch (error) {
			res.status(500).json({ error: 'Failed to get advanced analytics' });
		}
	}
);

// ===================================================================

// Example 4: Invitation Limits
// File: routes/invitations.js

router.post(
	'/invitations',
	authenticateToken,
	requireActiveSubscription,
	checkUsageLimit('maxInvitees'),
	async (req, res) => {
		try {
			const invitation = new Invitation({
				...req.body,
				inviter: req.user._id,
			});

			await invitation.save();
			res.status(201).json(invitation);
		} catch (error) {
			res.status(500).json({ error: 'Failed to create invitation' });
		}
	}
);

// ===================================================================

// Example 5: Manual Subscription Check in Route
// File: routes/surveys.js

const { canPerformAction } = require('../middlewares/subscription');

router.get('/surveys/:id/templates', authenticateToken, async (req, res) => {
	try {
		const user = req.user;

		// Manual subscription check
		const templateCheck = await canPerformAction(user._id, 'templates', 0);

		if (!templateCheck.allowed) {
			return res.status(403).json({
				error: templateCheck.reason,
				code: templateCheck.code,
				message: 'Upgrade to access more templates',
			});
		}

		// Get templates based on plan
		const templateLimit = user.subscriptionTier === 'basic' ? 3 : -1;
		const templates = await getTemplates({ limit: templateLimit });

		res.json(templates);
	} catch (error) {
		res.status(500).json({ error: 'Failed to get templates' });
	}
});

module.exports = router;
