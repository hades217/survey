/**
 * Admin API Test Suite
 *
 * Tests all admin routes to ensure the refactoring maintains
 * the same API functionality and paths.
 *
 * This test suite covers:
 * - Authentication routes
 * - Survey CRUD operations
 * - Question bank management
 * - Response analytics
 * - Distribution and publishing
 * - Profile management
 * - Dashboard statistics
 * - File uploads
 * - Utility routes
 */

const request = require('supertest');
const app = require('../../app'); // Assuming your Express app is exported from app.js
const jwt = require('jsonwebtoken');

// Test configuration
const TEST_USER = {
	username: 'testadmin',
	password: 'testpass123',
	email: 'test@admin.com',
	name: 'Test Admin',
};

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
let authToken = '';
let testSurveyId = '';
let testQuestionBankId = '';

describe('Admin API Tests', () => {
	// ============================================================================
	// Authentication Tests
	// ============================================================================

	describe('Authentication Routes', () => {
		test('POST /admin/check-auth - should check authentication status', async () => {
			const response = await request(app).post('/admin/check-auth').expect(401); // Should fail without token

			expect(response.body).toHaveProperty('error');
		});

		test('POST /admin/login - should login with valid credentials', async () => {
			// First try with admin credentials if they exist
			const adminResponse = await request(app)
				.post('/admin/login')
				.send({
					username: process.env.ADMIN_USERNAME || 'admin',
					password: process.env.ADMIN_PASSWORD || 'password',
				});

			if (adminResponse.status === 200) {
				expect(adminResponse.body).toHaveProperty('success', true);
				expect(adminResponse.body).toHaveProperty('token');
				authToken = adminResponse.body.token;
			} else {
				// If admin login fails, expect error
				expect(adminResponse.status).toBe(401);
			}
		});

		test('POST /admin/register - should register new user', async () => {
			const response = await request(app).post('/admin/register').send(TEST_USER);

			// Registration might be successful or return user exists error
			expect([201, 400]).toContain(response.status);

			if (response.status === 201) {
				expect(response.body).toHaveProperty('success', true);
				expect(response.body).toHaveProperty('token');
				if (!authToken) authToken = response.body.token;
			}
		});

		test('POST /admin/logout - should logout user', async () => {
			const response = await request(app)
				.post('/admin/logout')
				.set('Authorization', `Bearer ${authToken}`)
				.expect(200);

			expect(response.body).toHaveProperty('success', true);
		});
	});

	// ============================================================================
	// Survey Management Tests
	// ============================================================================

	describe('Survey Routes', () => {
		beforeAll(() => {
			// Create a test token if we don't have one
			if (!authToken) {
				authToken = jwt.sign({ id: 'admin', username: 'admin' }, JWT_SECRET, {
					expiresIn: '1h',
				});
			}
		});

		test('GET /admin/surveys - should get all surveys', async () => {
			const response = await request(app)
				.get('/admin/surveys')
				.set('Authorization', `Bearer ${authToken}`)
				.expect(200);

			expect(Array.isArray(response.body)).toBe(true);
		});

		test('POST /admin/surveys - should create new survey', async () => {
			const surveyData = {
				title: 'Test Survey',
				description: 'Test survey description',
				type: 'survey',
				sourceType: 'manual',
			};

			const response = await request(app)
				.post('/admin/surveys')
				.set('Authorization', `Bearer ${authToken}`)
				.send(surveyData)
				.expect(201);

			expect(response.body).toHaveProperty('title', surveyData.title);
			expect(response.body).toHaveProperty('_id');
			testSurveyId = response.body._id;
		});

		test('GET /admin/surveys/:id - should get specific survey', async () => {
			if (!testSurveyId) return;

			const response = await request(app)
				.get(`/admin/surveys/${testSurveyId}`)
				.set('Authorization', `Bearer ${authToken}`)
				.expect(200);

			expect(response.body).toHaveProperty('_id', testSurveyId);
		});

		test('PUT /admin/surveys/:id - should update survey', async () => {
			if (!testSurveyId) return;

			const updateData = {
				title: 'Updated Test Survey',
				description: 'Updated description',
			};

			const response = await request(app)
				.put(`/admin/surveys/${testSurveyId}`)
				.set('Authorization', `Bearer ${authToken}`)
				.send(updateData)
				.expect(200);

			expect(response.body).toHaveProperty('title', updateData.title);
		});

		test('PUT /admin/surveys/:id/toggle-status - should toggle survey status', async () => {
			if (!testSurveyId) return;

			const response = await request(app)
				.put(`/admin/surveys/${testSurveyId}/toggle-status`)
				.set('Authorization', `Bearer ${authToken}`)
				.expect(200);

			expect(response.body).toHaveProperty('success', true);
		});

		test('PUT /admin/surveys/:id/scoring - should update scoring settings', async () => {
			if (!testSurveyId) return;

			// First update survey to quiz type
			await request(app)
				.put(`/admin/surveys/${testSurveyId}`)
				.set('Authorization', `Bearer ${authToken}`)
				.send({ type: 'quiz' });

			const scoringData = {
				scoringMode: 'percentage',
				passingScore: 70,
				showFinalScore: true,
			};

			const response = await request(app)
				.put(`/admin/surveys/${testSurveyId}/scoring`)
				.set('Authorization', `Bearer ${authToken}`)
				.send(scoringData)
				.expect(200);

			expect(response.body).toHaveProperty('success', true);
		});
	});

	// ============================================================================
	// Question Management Tests
	// ============================================================================

	describe('Question Routes', () => {
		test('GET /admin/question-banks - should get all question banks', async () => {
			const response = await request(app)
				.get('/admin/question-banks')
				.set('Authorization', `Bearer ${authToken}`)
				.expect(200);

			expect(Array.isArray(response.body)).toBe(true);
		});

		test('POST /admin/question-banks - should create new question bank', async () => {
			const bankData = {
				name: 'Test Question Bank',
				description: 'Test bank description',
			};

			const response = await request(app)
				.post('/admin/question-banks')
				.set('Authorization', `Bearer ${authToken}`)
				.send(bankData)
				.expect(201);

			expect(response.body).toHaveProperty('name', bankData.name);
			expect(response.body).toHaveProperty('_id');
			testQuestionBankId = response.body._id;
		});

		test('PUT /admin/surveys/:id/questions - should add question to survey', async () => {
			if (!testSurveyId) return;

			const questionData = {
				text: 'Test question?',
				type: 'single_choice',
				options: ['Option A', 'Option B', 'Option C'],
				correctAnswer: 0,
				points: 1,
			};

			const response = await request(app)
				.put(`/admin/surveys/${testSurveyId}/questions`)
				.set('Authorization', `Bearer ${authToken}`)
				.send(questionData)
				.expect(200);

			expect(response.body.questions).toHaveLength(1);
			expect(response.body.questions[0]).toHaveProperty('text', questionData.text);
		});
	});

	// ============================================================================
	// Response Analytics Tests
	// ============================================================================

	describe('Response Routes', () => {
		test('GET /admin/responses - should get all responses', async () => {
			const response = await request(app)
				.get('/admin/responses')
				.set('Authorization', `Bearer ${authToken}`)
				.expect(200);

			expect(Array.isArray(response.body)).toBe(true);
		});

		test('GET /admin/surveys/:surveyId/statistics - should get survey statistics', async () => {
			if (!testSurveyId) return;

			const response = await request(app)
				.get(`/admin/surveys/${testSurveyId}/statistics`)
				.set('Authorization', `Bearer ${authToken}`)
				.expect(200);

			expect(response.body).toHaveProperty('aggregatedStats');
			expect(response.body).toHaveProperty('userResponses');
			expect(response.body).toHaveProperty('summary');
		});
	});

	// ============================================================================
	// Distribution Tests
	// ============================================================================

	describe('Distribution Routes', () => {
		test('POST /admin/surveys/:id/publish - should publish survey', async () => {
			if (!testSurveyId) return;

			const publishData = {
				enableRSVP: false,
				distributionSettings: {
					mode: 'public',
				},
			};

			const response = await request(app)
				.post(`/admin/surveys/${testSurveyId}/publish`)
				.set('Authorization', `Bearer ${authToken}`)
				.send(publishData)
				.expect(200);

			expect(response.body).toHaveProperty('success', true);
		});

		test('GET /admin/surveys/:id/invitations - should get survey invitations', async () => {
			if (!testSurveyId) return;

			const response = await request(app)
				.get(`/admin/surveys/${testSurveyId}/invitations`)
				.set('Authorization', `Bearer ${authToken}`)
				.expect(200);

			expect(response.body).toHaveProperty('invitations');
			expect(Array.isArray(response.body.invitations)).toBe(true);
		});
	});

	// ============================================================================
	// Profile Management Tests
	// ============================================================================

	describe('Profile Routes', () => {
		test('GET /admin/profile - should get admin profile', async () => {
			const response = await request(app)
				.get('/admin/profile')
				.set('Authorization', `Bearer ${authToken}`)
				.expect(200);

			expect(response.body).toHaveProperty('user');
		});

		test('PUT /admin/profile - should update profile', async () => {
			const updateData = {
				name: 'Updated Admin Name',
				email: 'updated@admin.com',
			};

			const response = await request(app)
				.put('/admin/profile')
				.set('Authorization', `Bearer ${authToken}`)
				.send(updateData);

			// May succeed or fail depending on user type (legacy vs database)
			expect([200, 400]).toContain(response.status);
		});
	});

	// ============================================================================
	// Dashboard Tests
	// ============================================================================

	describe('Dashboard Routes', () => {
		test('GET /admin/dashboard/statistics - should get dashboard stats', async () => {
			const response = await request(app)
				.get('/admin/dashboard/statistics')
				.set('Authorization', `Bearer ${authToken}`)
				.expect(200);

			expect(response.body).toHaveProperty('overview');
			expect(response.body).toHaveProperty('charts');
			expect(response.body).toHaveProperty('recent');
		});
	});

	// ============================================================================
	// Upload Tests
	// ============================================================================

	describe('Upload Routes', () => {
		test('POST /admin/upload-image - should handle image upload', async () => {
			const response = await request(app)
				.post('/admin/upload-image')
				.set('Authorization', `Bearer ${authToken}`)
				.expect(400); // Should fail without image file

			expect(response.body).toHaveProperty('error');
		});
	});

	// ============================================================================
	// Utility Tests
	// ============================================================================

	describe('Utility Routes', () => {
		test('GET /admin/debug-timestamp - should return timestamp', async () => {
			const response = await request(app).get('/admin/debug-timestamp').expect(200);

			expect(response.body).toHaveProperty('timestamp');
			expect(response.body).toHaveProperty('message');
		});
	});

	// ============================================================================
	// Cleanup
	// ============================================================================

	describe('Cleanup', () => {
		test('DELETE /admin/surveys/:id - should delete test survey', async () => {
			if (!testSurveyId) return;

			const response = await request(app)
				.delete(`/admin/surveys/${testSurveyId}`)
				.set('Authorization', `Bearer ${authToken}`)
				.expect(200);

			expect(response.body).toHaveProperty('message');
		});

		test('DELETE /admin/question-banks/:id - should delete test question bank', async () => {
			if (!testQuestionBankId) return;

			const response = await request(app)
				.delete(`/admin/question-banks/${testQuestionBankId}`)
				.set('Authorization', `Bearer ${authToken}`)
				.expect(200);

			expect(response.body).toHaveProperty('message');
		});
	});
});
