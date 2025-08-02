// ===================================================================
// FRONTEND INTEGRATION EXAMPLES
// ===================================================================

import React, { useState, useEffect } from 'react';
import { useSubscription } from '../hooks/useSubscription';
import UpgradePrompt from '../components/UpgradePrompt';
import axios from 'axios';

// ===================================================================
// Example 1: Survey Creation Component with Limits
// ===================================================================

const SurveyCreationPage: React.FC = () => {
	const {
		hasActiveSubscription,
		hasReachedLimit,
		getUpgradeMessage,
		subscriptionInfo,
		getFeatureLimit,
		getRemainingUsage,
	} = useSubscription();

	const [surveys, setSurveys] = useState([]);
	const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		fetchSurveys();
	}, []);

	const fetchSurveys = async () => {
		try {
			const token = localStorage.getItem('token');
			const response = await axios.get('/api/surveys', {
				headers: { Authorization: `Bearer ${token}` },
			});
			setSurveys(response.data);
		} catch (error) {
			console.error('Error fetching surveys:', error);
		}
	};

	const handleCreateSurvey = async () => {
		// Check limits before API call
		if (hasReachedLimit('maxSurveys', surveys.length)) {
			setShowUpgradePrompt(true);
			return;
		}

		setLoading(true);
		try {
			const token = localStorage.getItem('token');
			const response = await axios.post(
				'/api/surveys',
				{
					title: 'New Survey',
					description: 'Survey description',
				},
				{
					headers: { Authorization: `Bearer ${token}` },
				}
			);

			setSurveys([...surveys, response.data]);
		} catch (error) {
			if (error.response?.data?.code === 'USAGE_LIMIT_REACHED') {
				setShowUpgradePrompt(true);
			} else {
				console.error('Error creating survey:', error);
			}
		} finally {
			setLoading(false);
		}
	};

	const surveyLimit = getFeatureLimit('maxSurveys');
	const remainingSurveys = getRemainingUsage('maxSurveys', surveys.length);

	return (
		<div className="p-6">
			<div className="flex justify-between items-center mb-6">
				<h1 className="text-2xl font-bold">My Surveys</h1>
				<button
					onClick={handleCreateSurvey}
					disabled={loading || !hasActiveSubscription}
					className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
				>
					{loading ? 'Creating...' : 'Create Survey'}
				</button>
			</div>

			{/* Usage Indicator */}
			{hasActiveSubscription && surveyLimit !== -1 && (
				<div className="mb-6 p-4 bg-gray-50 rounded-lg">
					<div className="flex justify-between items-center">
						<span className="text-sm text-gray-600">
							Surveys used: {surveys.length} of {surveyLimit}
						</span>
						<span className="text-sm font-medium text-blue-600">
							{remainingSurveys} remaining
						</span>
					</div>
					<div className="mt-2 w-full bg-gray-200 rounded-full h-2">
						<div
							className="bg-blue-500 h-2 rounded-full"
							style={{ width: `${(surveys.length / surveyLimit) * 100}%` }}
						></div>
					</div>
				</div>
			)}

			{/* No subscription warning */}
			{!hasActiveSubscription && (
				<UpgradePrompt
					inline={true}
					message="You need an active subscription to create surveys."
					currentPlan={subscriptionInfo?.subscriptionTier}
				/>
			)}

			{/* Survey List */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{surveys.map(survey => (
					<div key={survey._id} className="border rounded-lg p-4">
						<h3 className="font-semibold">{survey.title}</h3>
						<p className="text-gray-600 text-sm">{survey.description}</p>
					</div>
				))}
			</div>

			{/* Upgrade Prompt Modal */}
			{showUpgradePrompt && (
				<UpgradePrompt
					message={getUpgradeMessage('maxSurveys')}
					currentPlan={subscriptionInfo?.subscriptionTier}
					onClose={() => setShowUpgradePrompt(false)}
					showFeatureComparison={true}
				/>
			)}
		</div>
	);
};

// ===================================================================
// Example 2: Survey Editor with Feature Gates
// ===================================================================

const SurveyEditor: React.FC = () => {
	const { canAccessFeature, needsUpgradeFor, subscriptionInfo, hasReachedLimit } =
		useSubscription();

	const [survey, setSurvey] = useState(null);
	const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
	const [upgradeFeature, setUpgradeFeature] = useState('');

	const handleCSVImport = () => {
		if (!canAccessFeature('csvImport')) {
			setUpgradeFeature('csvImport');
			setShowUpgradePrompt(true);
			return;
		}
		// Proceed with CSV import
	};

	const handleAddImageQuestion = () => {
		if (!canAccessFeature('imageQuestions')) {
			setUpgradeFeature('imageQuestions');
			setShowUpgradePrompt(true);
			return;
		}
		// Proceed with adding image question
	};

	const handleAddQuestion = () => {
		const currentQuestionCount = survey?.questions?.length || 0;
		if (hasReachedLimit('maxQuestionsPerSurvey', currentQuestionCount)) {
			setUpgradeFeature('maxQuestionsPerSurvey');
			setShowUpgradePrompt(true);
			return;
		}
		// Proceed with adding question
	};

	const handleRandomizeQuestions = () => {
		if (!canAccessFeature('randomQuestions')) {
			setUpgradeFeature('randomQuestions');
			setShowUpgradePrompt(true);
			return;
		}
		// Proceed with randomization
	};

	return (
		<div className="p-6">
			<h1 className="text-2xl font-bold mb-6">Survey Editor</h1>

			{/* Toolbar */}
			<div className="flex flex-wrap gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
				{/* CSV Import */}
				<button
					onClick={handleCSVImport}
					className={`px-4 py-2 rounded-lg font-medium ${
						canAccessFeature('csvImport')
							? 'bg-blue-500 hover:bg-blue-600 text-white'
							: 'bg-gray-300 text-gray-500 cursor-not-allowed'
					}`}
				>
					📄 Import CSV
					{!canAccessFeature('csvImport') && (
						<span className="ml-1 text-xs bg-orange-500 text-white px-1 rounded">
							Pro
						</span>
					)}
				</button>

				{/* Image Questions */}
				<button
					onClick={handleAddImageQuestion}
					className={`px-4 py-2 rounded-lg font-medium ${
						canAccessFeature('imageQuestions')
							? 'bg-green-500 hover:bg-green-600 text-white'
							: 'bg-gray-300 text-gray-500 cursor-not-allowed'
					}`}
				>
					🖼️ Add Image Question
					{!canAccessFeature('imageQuestions') && (
						<span className="ml-1 text-xs bg-orange-500 text-white px-1 rounded">
							Pro
						</span>
					)}
				</button>

				{/* Random Questions */}
				<button
					onClick={handleRandomizeQuestions}
					className={`px-4 py-2 rounded-lg font-medium ${
						canAccessFeature('randomQuestions')
							? 'bg-purple-500 hover:bg-purple-600 text-white'
							: 'bg-gray-300 text-gray-500 cursor-not-allowed'
					}`}
				>
					🔀 Randomize Questions
					{!canAccessFeature('randomQuestions') && (
						<span className="ml-1 text-xs bg-orange-500 text-white px-1 rounded">
							Pro
						</span>
					)}
				</button>

				{/* Add Question */}
				<button
					onClick={handleAddQuestion}
					className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium"
				>
					➕ Add Question
				</button>
			</div>

			{/* Feature Limitations Info */}
			{subscriptionInfo?.subscriptionTier === 'basic' && (
				<div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
					<h3 className="font-medium text-yellow-800 mb-2">Basic Plan Limitations</h3>
					<ul className="text-sm text-yellow-700 space-y-1">
						<li>• Maximum 20 questions per survey</li>
						<li>• No CSV import functionality</li>
						<li>• No image questions</li>
						<li>• No random question selection</li>
					</ul>
					<button
						onClick={() => setShowUpgradePrompt(true)}
						className="mt-3 text-sm bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded"
					>
						Upgrade to Pro
					</button>
				</div>
			)}

			{/* Survey Content */}
			<div className="space-y-4">{/* Survey questions would be rendered here */}</div>

			{/* Upgrade Prompt */}
			{showUpgradePrompt && (
				<UpgradePrompt
					feature={upgradeFeature}
					message={`Upgrade to Pro to access ${upgradeFeature.replace(/([A-Z])/g, ' $1').toLowerCase()}`}
					currentPlan={subscriptionInfo?.subscriptionTier}
					onClose={() => setShowUpgradePrompt(false)}
					showFeatureComparison={true}
				/>
			)}
		</div>
	);
};

// ===================================================================
// Example 3: Navigation with Subscription Status
// ===================================================================

const Navigation: React.FC = () => {
	const { hasActiveSubscription, subscriptionInfo } = useSubscription();

	return (
		<nav className="bg-white shadow-sm border-b">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex justify-between h-16">
					<div className="flex items-center space-x-8">
						<div className="flex-shrink-0">
							<h1 className="text-xl font-bold">Survey App</h1>
						</div>

						<div className="flex space-x-4">
							<a
								href="/surveys"
								className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md"
							>
								Surveys
							</a>
							<a
								href="/analytics"
								className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md"
							>
								Analytics
							</a>
							<a
								href="/billing"
								className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md"
							>
								Billing
							</a>
						</div>
					</div>

					<div className="flex items-center space-x-4">
						{/* Subscription Status Badge */}
						{hasActiveSubscription ? (
							<div className="flex items-center space-x-2">
								<span
									className={`px-2 py-1 text-xs font-medium rounded-full ${
										subscriptionInfo?.subscriptionTier === 'pro'
											? 'bg-purple-100 text-purple-800'
											: 'bg-blue-100 text-blue-800'
									}`}
								>
									{subscriptionInfo?.subscriptionTier?.toUpperCase()} Plan
								</span>
								<span className="w-2 h-2 bg-green-500 rounded-full"></span>
							</div>
						) : (
							<div className="flex items-center space-x-2">
								<span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
									No Subscription
								</span>
								<span className="w-2 h-2 bg-red-500 rounded-full"></span>
							</div>
						)}

						{/* Upgrade Button */}
						{!hasActiveSubscription && (
							<a
								href="/billing"
								className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
							>
								Subscribe
							</a>
						)}
					</div>
				</div>
			</div>
		</nav>
	);
};

// ===================================================================
// Example 4: Analytics Page with Feature Gates
// ===================================================================

const AnalyticsPage: React.FC = () => {
	const { canAccessFeature, subscriptionInfo } = useSubscription();
	const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);

	const handleAdvancedAnalytics = () => {
		if (!canAccessFeature('advancedAnalytics')) {
			setShowUpgradePrompt(true);
			return;
		}
		// Show advanced analytics
	};

	const handleExportPDF = () => {
		if (!canAccessFeature('advancedAnalytics')) {
			setShowUpgradePrompt(true);
			return;
		}
		// Export PDF
	};

	return (
		<div className="p-6">
			<h1 className="text-2xl font-bold mb-6">Survey Analytics</h1>

			{/* Basic Analytics - Available to all plans */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
				<div className="bg-white p-6 rounded-lg shadow">
					<h3 className="text-lg font-semibold mb-2">Total Responses</h3>
					<p className="text-3xl font-bold text-blue-600">1,234</p>
				</div>
				<div className="bg-white p-6 rounded-lg shadow">
					<h3 className="text-lg font-semibold mb-2">Completion Rate</h3>
					<p className="text-3xl font-bold text-green-600">87%</p>
				</div>
				<div className="bg-white p-6 rounded-lg shadow">
					<h3 className="text-lg font-semibold mb-2">Average Time</h3>
					<p className="text-3xl font-bold text-purple-600">5m 32s</p>
				</div>
			</div>

			{/* Advanced Analytics Section */}
			<div className="bg-white rounded-lg shadow">
				<div className="p-6 border-b">
					<div className="flex justify-between items-center">
						<h2 className="text-xl font-semibold">Advanced Analytics</h2>
						{canAccessFeature('advancedAnalytics') && (
							<button
								onClick={handleExportPDF}
								className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg"
							>
								📄 Export PDF
							</button>
						)}
					</div>
				</div>

				<div className="p-6">
					{canAccessFeature('advancedAnalytics') ? (
						<div>
							{/* Advanced charts and analytics would go here */}
							<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
								<div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
									<span className="text-gray-500">Advanced Chart 1</span>
								</div>
								<div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
									<span className="text-gray-500">Advanced Chart 2</span>
								</div>
							</div>
						</div>
					) : (
						<div className="text-center py-12">
							<div className="mb-4">
								<svg
									className="mx-auto h-12 w-12 text-gray-400"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
									/>
								</svg>
							</div>
							<h3 className="text-lg font-medium text-gray-900 mb-2">
								Advanced Analytics
							</h3>
							<p className="text-gray-600 mb-4">
								Get detailed insights with advanced charts, trend analysis, and PDF
								exports.
							</p>
							<button
								onClick={() => setShowUpgradePrompt(true)}
								className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-2 rounded-lg font-medium"
							>
								Upgrade to Pro
							</button>
						</div>
					)}
				</div>
			</div>

			{/* Upgrade Prompt */}
			{showUpgradePrompt && (
				<UpgradePrompt
					feature="advancedAnalytics"
					message="Upgrade to Pro to access advanced analytics and PDF exports"
					currentPlan={subscriptionInfo?.subscriptionTier}
					onClose={() => setShowUpgradePrompt(false)}
					showFeatureComparison={true}
				/>
			)}
		</div>
	);
};

export { SurveyCreationPage, SurveyEditor, Navigation, AnalyticsPage };
