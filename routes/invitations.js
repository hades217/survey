const express = require('express');
const Invitation = require('../models/Invitation');
const Survey = require('../models/Survey');
const User = require('../models/User');
const asyncHandler = require('../middlewares/asyncHandler');
const AppError = require('../utils/AppError');
const { ERROR_MESSAGES, HTTP_STATUS } = require('../shared/constants');

const router = express.Router();

// Admin authentication middleware
const requireAdmin = (req, res, next) => {
	if (!req.session.admin) {
		return res.status(HTTP_STATUS.UNAUTHORIZED).json({ error: ERROR_MESSAGES.UNAUTHORIZED });
	}
	next();
};

// Create a new invitation (admin only)
router.post('/', requireAdmin, asyncHandler(async (req, res) => {
	const { 
		surveyId, 
		distributionMode, 
		targetUsers, 
		targetEmails, 
		maxResponses, 
		expiresAt 
	} = req.body;
	
	// Validate required fields
	if (!surveyId || !distributionMode) {
		return res.status(HTTP_STATUS.BAD_REQUEST).json({ 
			error: 'Survey ID and distribution mode are required' 
		});
	}
	
	// Check if survey exists
	const survey = await Survey.findById(surveyId);
	if (!survey) {
		return res.status(HTTP_STATUS.NOT_FOUND).json({ 
			error: 'Survey not found' 
		});
	}
	
	// Validate distribution mode
	if (!['open', 'targeted', 'link'].includes(distributionMode)) {
		return res.status(HTTP_STATUS.BAD_REQUEST).json({ 
			error: 'Invalid distribution mode' 
		});
	}
	
	// For targeted mode, validate target users/emails
	if (distributionMode === 'targeted' && !targetUsers && !targetEmails) {
		return res.status(HTTP_STATUS.BAD_REQUEST).json({ 
			error: 'Target users or emails are required for targeted distribution' 
		});
	}
	
	// Create invitation
	const invitation = await Invitation.create({
		surveyId,
		distributionMode,
		targetUsers: targetUsers || [],
		targetEmails: targetEmails || [],
		maxResponses,
		expiresAt: expiresAt ? new Date(expiresAt) : null,
		createdBy: req.session.adminId || null // Assuming admin ID is stored in session
	});
	
	// Populate the invitation with survey and target user details
	await invitation.populate('surveyId', 'title description');
	await invitation.populate('targetUsers', 'name email studentId');
	
	res.status(HTTP_STATUS.CREATED).json(invitation);
}));

// Get all invitations for a survey (admin only)
router.get('/survey/:surveyId', requireAdmin, asyncHandler(async (req, res) => {
	const { surveyId } = req.params;
	
	const invitations = await Invitation.find({ surveyId })
		.populate('surveyId', 'title description')
		.populate('targetUsers', 'name email studentId')
		.sort({ createdAt: -1 });
	
	res.json(invitations);
}));

// Get all invitations (admin only)
router.get('/', requireAdmin, asyncHandler(async (req, res) => {
	const { distributionMode, isActive, surveyId } = req.query;
	
	let query = {};
	
	// Apply filters
	if (distributionMode) query.distributionMode = distributionMode;
	if (isActive !== undefined) query.isActive = isActive === 'true';
	if (surveyId) query.surveyId = surveyId;
	
	const invitations = await Invitation.find(query)
		.populate('surveyId', 'title description')
		.populate('targetUsers', 'name email studentId')
		.sort({ createdAt: -1 });
	
	res.json(invitations);
}));

// Update an invitation (admin only)
router.put('/:id', requireAdmin, asyncHandler(async (req, res) => {
	const { 
		targetUsers, 
		targetEmails, 
		maxResponses, 
		expiresAt, 
		isActive 
	} = req.body;
	
	const invitation = await Invitation.findById(req.params.id);
	if (!invitation) {
		return res.status(HTTP_STATUS.NOT_FOUND).json({ 
			error: 'Invitation not found' 
		});
	}
	
	// Update fields
	if (targetUsers !== undefined) invitation.targetUsers = targetUsers;
	if (targetEmails !== undefined) invitation.targetEmails = targetEmails;
	if (maxResponses !== undefined) invitation.maxResponses = maxResponses;
	if (expiresAt !== undefined) invitation.expiresAt = expiresAt ? new Date(expiresAt) : null;
	if (isActive !== undefined) invitation.isActive = isActive;
	
	await invitation.save();
	
	// Populate the invitation with survey and target user details
	await invitation.populate('surveyId', 'title description');
	await invitation.populate('targetUsers', 'name email studentId');
	
	res.json(invitation);
}));

// Delete an invitation (admin only)
router.delete('/:id', requireAdmin, asyncHandler(async (req, res) => {
	const invitation = await Invitation.findById(req.params.id);
	if (!invitation) {
		return res.status(HTTP_STATUS.NOT_FOUND).json({ 
			error: 'Invitation not found' 
		});
	}
	
	// Soft delete by setting isActive to false
	invitation.isActive = false;
	await invitation.save();
	
	res.json({ message: 'Invitation deleted successfully' });
}));

// Get invitation statistics (admin only)
router.get('/:id/statistics', requireAdmin, asyncHandler(async (req, res) => {
	const invitation = await Invitation.findById(req.params.id)
		.populate('surveyId', 'title description');
	
	if (!invitation) {
		return res.status(HTTP_STATUS.NOT_FOUND).json({ 
			error: 'Invitation not found' 
		});
	}
	
	const stats = {
		invitation: {
			id: invitation._id,
			surveyTitle: invitation.surveyId.title,
			distributionMode: invitation.distributionMode,
			createdAt: invitation.createdAt,
			expiresAt: invitation.expiresAt,
			maxResponses: invitation.maxResponses,
			currentResponses: invitation.currentResponses,
			isActive: invitation.isActive,
			isValid: invitation.isValid()
		},
		access: {
			totalAccess: invitation.accessLog.length,
			uniqueUsers: [...new Set(invitation.accessLog.map(log => log.userId || log.email))].length,
			recentAccess: invitation.accessLog.slice(-10).reverse()
		},
		completion: {
			totalCompletions: invitation.completedBy.length,
			completionRate: invitation.accessLog.length > 0 ? 
				(invitation.completedBy.length / invitation.accessLog.length * 100).toFixed(2) : 0,
			recentCompletions: invitation.completedBy.slice(-10).reverse()
		}
	};
	
	if (invitation.distributionMode === 'targeted') {
		stats.targeting = {
			targetUsers: invitation.targetUsers.length,
			targetEmails: invitation.targetEmails.length,
			totalTargeted: invitation.targetUsers.length + invitation.targetEmails.length
		};
	}
	
	res.json(stats);
}));

// Access survey via invitation code (public)
router.get('/access/:invitationCode', asyncHandler(async (req, res) => {
	const { invitationCode } = req.params;
	const { userId, email } = req.query;
	
	const invitation = await Invitation.findOne({ invitationCode })
		.populate('surveyId');
	
	if (!invitation) {
		return res.status(HTTP_STATUS.NOT_FOUND).json({ 
			error: 'Invitation not found' 
		});
	}
	
	// Check if invitation is valid
	if (!invitation.isValid()) {
		return res.status(HTTP_STATUS.BAD_REQUEST).json({ 
			error: 'Invitation is no longer valid' 
		});
	}
	
	// Check if user has access
	if (!invitation.canAccess(userId, email)) {
		return res.status(HTTP_STATUS.FORBIDDEN).json({ 
			error: 'You do not have access to this survey' 
		});
	}
	
	// Log access
	invitation.accessLog.push({
		userId: userId || null,
		email: email || null,
		accessedAt: new Date(),
		ipAddress: req.ip || req.connection.remoteAddress
	});
	
	await invitation.save();
	
	res.json({
		survey: invitation.surveyId,
		invitation: {
			id: invitation._id,
			distributionMode: invitation.distributionMode,
			maxResponses: invitation.maxResponses,
			currentResponses: invitation.currentResponses,
			expiresAt: invitation.expiresAt
		}
	});
}));

// Generate invitation URLs (admin only)
router.get('/:id/urls', requireAdmin, asyncHandler(async (req, res) => {
	const invitation = await Invitation.findById(req.params.id)
		.populate('surveyId', 'title slug');
	
	if (!invitation) {
		return res.status(HTTP_STATUS.NOT_FOUND).json({ 
			error: 'Invitation not found' 
		});
	}
	
	const baseUrl = process.env.BASE_URL || 'http://localhost:5173';
	
	const urls = {
		invitationUrl: `${baseUrl}/invitation/${invitation.invitationCode}`,
		directSurveyUrl: `${baseUrl}/survey/${invitation.surveyId.slug}`,
		surveyWithInvitation: `${baseUrl}/survey/${invitation.surveyId.slug}?invitation=${invitation.invitationCode}`
	};
	
	res.json(urls);
}));

// Bulk create invitations (admin only)
router.post('/bulk', requireAdmin, asyncHandler(async (req, res) => {
	const { surveyId, invitations } = req.body;
	
	if (!surveyId || !Array.isArray(invitations) || invitations.length === 0) {
		return res.status(HTTP_STATUS.BAD_REQUEST).json({ 
			error: 'Survey ID and invitations array are required' 
		});
	}
	
	// Check if survey exists
	const survey = await Survey.findById(surveyId);
	if (!survey) {
		return res.status(HTTP_STATUS.NOT_FOUND).json({ 
			error: 'Survey not found' 
		});
	}
	
	const results = {
		created: [],
		errors: []
	};
	
	for (const invitationData of invitations) {
		try {
			const { 
				distributionMode, 
				targetUsers, 
				targetEmails, 
				maxResponses, 
				expiresAt 
			} = invitationData;
			
			// Validate distribution mode
			if (!['open', 'targeted', 'link'].includes(distributionMode)) {
				results.errors.push({ 
					invitationData, 
					error: 'Invalid distribution mode' 
				});
				continue;
			}
			
			// For targeted mode, validate target users/emails
			if (distributionMode === 'targeted' && !targetUsers && !targetEmails) {
				results.errors.push({ 
					invitationData, 
					error: 'Target users or emails are required for targeted distribution' 
				});
				continue;
			}
			
			const invitation = await Invitation.create({
				surveyId,
				distributionMode,
				targetUsers: targetUsers || [],
				targetEmails: targetEmails || [],
				maxResponses,
				expiresAt: expiresAt ? new Date(expiresAt) : null,
				createdBy: req.session.adminId || null
			});
			
			results.created.push(invitation);
		} catch (error) {
			results.errors.push({ invitationData, error: error.message });
		}
	}
	
	res.json(results);
}));

module.exports = router;