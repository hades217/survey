const express = require('express');
const router = express.Router();
const Company = require('../models/Company');
const User = require('../models/User');
const { jwtAuth } = require('../middlewares/jwtAuth');

// Get current user's company information
router.get('/current', jwtAuth, async (req, res) => {
	try {
		// Handle legacy admin login where id is 'admin' string
		let user;
		if (req.user.id === 'admin') {
			// For legacy admin, find or create a default admin user
			user = await User.findOne({ role: 'admin' }).populate('companyId');
			if (!user) {
				// Create default admin user if none exists
				user = new User({
					name: 'Administrator',
					email: 'admin@example.com',
					role: 'admin',
				});
				await user.save();
			}
		} else {
			// For database users, use the ObjectId
			user = await User.findById(req.user.id).populate('companyId');
		}

		if (!user.companyId) {
			return res.status(404).json({
				success: false,
				error: 'No company associated with this user',
			});
		}

		res.json({
			success: true,
			company: user.companyId,
		});
	} catch (error) {
		console.error('Error fetching company:', error);
		res.status(500).json({
			success: false,
			error: 'Failed to fetch company information',
		});
	}
});

// Update company information (for onboarding steps)
router.patch('/current', jwtAuth, async (req, res) => {
	try {
		// Handle legacy admin login where id is 'admin' string
		let user;
		if (req.user.id === 'admin') {
			// For legacy admin, find or create a default admin user
			user = await User.findOne({ role: 'admin' });
			if (!user) {
				// Create default admin user if none exists
				user = new User({
					name: 'Administrator',
					email: 'admin@example.com',
					role: 'admin',
				});
				await user.save();
			}
		} else {
			// For database users, use the ObjectId
			user = await User.findById(req.user.id);
		}

		if (!user) {
			return res.status(404).json({
				success: false,
				error: 'User not found',
			});
		}

		let company;

		// If user doesn't have a company, create one
		if (!user.companyId) {
			company = new Company({
				name: req.body.name || 'My Company',
				...req.body,
			});
			await company.save();

			// Link company to user
			user.companyId = company._id;
			await user.save();
		} else {
			// Update existing company
			company = await Company.findById(user.companyId);
			if (!company) {
				return res.status(404).json({
					success: false,
					error: 'Company not found',
				});
			}

			// Update company fields
			Object.keys(req.body).forEach(key => {
				if (req.body[key] !== undefined) {
					company[key] = req.body[key];
				}
			});

			await company.save();
		}

		res.json({
			success: true,
			message: 'Company information updated successfully',
			company: company,
		});
	} catch (error) {
		console.error('Error updating company:', error);
		res.status(500).json({
			success: false,
			error: 'Failed to update company information',
		});
	}
});

// Complete onboarding
router.post('/complete-onboarding', jwtAuth, async (req, res) => {
	try {
		// Handle legacy admin login where id is 'admin' string
		let user;
		if (req.user.id === 'admin') {
			// For legacy admin, find or create a default admin user
			user = await User.findOne({ role: 'admin' });
			if (!user) {
				// Create default admin user if none exists
				user = new User({
					name: 'Administrator',
					email: 'admin@example.com',
					role: 'admin',
				});
				await user.save();
			}
		} else {
			// For database users, use the ObjectId
			user = await User.findById(req.user.id);
		}

		if (!user || !user.companyId) {
			return res.status(404).json({
				success: false,
				error: 'User or company not found',
			});
		}

		const company = await Company.findById(user.companyId);
		if (!company) {
			return res.status(404).json({
				success: false,
				error: 'Company not found',
			});
		}

		company.isOnboardingCompleted = true;
		await company.save();

		res.json({
			success: true,
			message: 'Onboarding completed successfully',
			company: company,
		});
	} catch (error) {
		console.error('Error completing onboarding:', error);
		res.status(500).json({
			success: false,
			error: 'Failed to complete onboarding',
		});
	}
});

module.exports = router;
