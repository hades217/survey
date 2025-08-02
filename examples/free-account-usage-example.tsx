// ===================================================================
// FREE ACCOUNT SYSTEM USAGE EXAMPLES
// ===================================================================

import React from 'react';
import useSubscription from '../hooks/useSubscription';
import UpgradePrompt from '../components/UpgradePrompt';

// ===================================================================
// Example 1: Survey Creation with Free Account Limits
// ===================================================================

const SurveyCreationWithFreeAccount: React.FC = () => {
	const {
		hasReachedLimit,
		getFeatureLimit,
		needsUpgradeFor,
		canAccessFeature,
		subscriptionInfo,
	} = useSubscription();

	const [surveys, setSurveys] = React.useState([
		{ id: 1, title: 'Survey 1' },
		{ id: 2, title: 'Survey 2' },
		{ id: 3, title: 'Survey 3' },
	]); // Mock current surveys

	const currentTier = subscriptionInfo?.subscriptionTier || 'free';
	const maxSurveys = getFeatureLimit('maxSurveys');
	const hasReachedSurveyLimit = hasReachedLimit('maxSurveys', surveys.length);

	const handleCreateSurvey = () => {
		if (hasReachedSurveyLimit) {
			// Show upgrade prompt instead of creating survey
			return;
		}

		// Create new survey logic here
		console.log('Creating new survey...');
	};

	return (
		<div className="p-6">
			<div className="flex items-center justify-between mb-6">
				<h1 className="text-2xl font-bold text-gray-900">我的调查问卷</h1>

				{/* Plan Badge */}
				<div className="flex items-center space-x-2">
					<span
						className={`px-3 py-1 text-xs font-medium rounded-full ${
							currentTier === 'free'
								? 'bg-gray-100 text-gray-800'
								: currentTier === 'basic'
									? 'bg-blue-100 text-blue-800'
									: 'bg-purple-100 text-purple-800'
						}`}
					>
						{currentTier.toUpperCase()} 套餐
					</span>
					<span className="text-sm text-gray-600">
						{surveys.length}/{maxSurveys === -1 ? '∞' : maxSurveys}
					</span>
				</div>
			</div>

			{/* Survey List */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
				{surveys.map(survey => (
					<div key={survey.id} className="bg-white rounded-lg border border-gray-200 p-4">
						<h3 className="font-medium text-gray-900">{survey.title}</h3>
						<p className="text-sm text-gray-600 mt-1">已创建</p>
					</div>
				))}
			</div>

			{/* Create Survey Button */}
			<div className="flex flex-col items-center">
				{hasReachedSurveyLimit ? (
					<div className="text-center">
						<div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-8">
							<svg
								className="w-12 h-12 text-gray-400 mx-auto mb-4"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M12 6v6m0 0v6m0-6h6m-6 0H6"
								/>
							</svg>
							<h3 className="text-lg font-medium text-gray-900 mb-2">
								已达到套餐限制
							</h3>
							<p className="text-gray-600 mb-4">
								{currentTier === 'free'
									? `免费套餐最多可创建 ${maxSurveys} 个调查问卷`
									: `当前套餐最多可创建 ${maxSurveys} 个调查问卷`}
							</p>
							<UpgradePrompt
								message={needsUpgradeFor('maxSurveys')}
								currentPlan={currentTier}
								inline={true}
							/>
						</div>
					</div>
				) : (
					<button
						onClick={handleCreateSurvey}
						className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium"
					>
						创建新问卷
					</button>
				)}
			</div>
		</div>
	);
};

// ===================================================================
// Example 2: Feature Access Check for Free Users
// ===================================================================

const FeatureAccessExample: React.FC = () => {
	const { canAccessFeature, subscriptionInfo } = useSubscription();

	const currentTier = subscriptionInfo?.subscriptionTier || 'free';

	const features = [
		{ id: 'csvImport', name: 'CSV批量导入', requiredPlan: 'pro' },
		{ id: 'imageQuestions', name: '图片题目', requiredPlan: 'pro' },
		{ id: 'advancedAnalytics', name: '高级分析', requiredPlan: 'pro' },
		{ id: 'randomQuestions', name: '随机抽题', requiredPlan: 'pro' },
	];

	return (
		<div className="p-6">
			<h2 className="text-xl font-bold text-gray-900 mb-4">功能权限检查</h2>
			<p className="text-gray-600 mb-6">当前套餐：{currentTier.toUpperCase()}</p>

			<div className="space-y-4">
				{features.map(feature => {
					const hasAccess = canAccessFeature(feature.id as any);

					return (
						<div
							key={feature.id}
							className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200"
						>
							<div>
								<h3 className="font-medium text-gray-900">{feature.name}</h3>
								<p className="text-sm text-gray-600">
									需要 {feature.requiredPlan.toUpperCase()} 套餐
								</p>
							</div>

							<div className="flex items-center space-x-3">
								{hasAccess ? (
									<>
										<span className="text-green-600 text-sm font-medium">
											✓ 可用
										</span>
										<button className="bg-blue-500 text-white px-3 py-1 rounded text-sm">
											使用功能
										</button>
									</>
								) : (
									<>
										<span className="text-red-600 text-sm font-medium">
											✗ 需升级
										</span>
										<button className="bg-gray-300 text-gray-600 px-3 py-1 rounded text-sm cursor-not-allowed">
											升级解锁
										</button>
									</>
								)}
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
};

// ===================================================================
// Example 3: Free Account Dashboard
// ===================================================================

const FreeAccountDashboard: React.FC = () => {
	const { subscriptionInfo, getFeatureLimit, getRemainingUsage, canUpgrade } = useSubscription();

	const currentTier = subscriptionInfo?.subscriptionTier || 'free';

	// Mock usage data
	const usageData = {
		surveys: 2,
		questionsThisMonth: 15,
		invitees: 8,
	};

	const limits = {
		maxSurveys: getFeatureLimit('maxSurveys'),
		maxQuestionsPerSurvey: getFeatureLimit('maxQuestionsPerSurvey'),
		maxInvitees: getFeatureLimit('maxInvitees'),
	};

	const UsageCard = ({ title, current, limit, icon }: any) => {
		const percentage = limit === -1 ? 0 : (current / limit) * 100;
		const isNearLimit = percentage > 80;

		return (
			<div className="bg-white rounded-lg border border-gray-200 p-6">
				<div className="flex items-center justify-between mb-4">
					<div className="flex items-center space-x-2">
						{icon}
						<h3 className="font-medium text-gray-900">{title}</h3>
					</div>
					<span
						className={`text-sm font-medium ${
							isNearLimit ? 'text-orange-600' : 'text-gray-600'
						}`}
					>
						{current}/{limit === -1 ? '∞' : limit}
					</span>
				</div>

				{limit !== -1 && (
					<div className="w-full bg-gray-200 rounded-full h-2 mb-2">
						<div
							className={`h-2 rounded-full ${
								isNearLimit ? 'bg-orange-500' : 'bg-blue-500'
							}`}
							style={{ width: `${Math.min(percentage, 100)}%` }}
						></div>
					</div>
				)}

				{isNearLimit && limit !== -1 && (
					<p className="text-xs text-orange-600">即将达到限制，考虑升级套餐</p>
				)}
			</div>
		);
	};

	return (
		<div className="p-6">
			<div className="flex items-center justify-between mb-8">
				<div>
					<h1 className="text-2xl font-bold text-gray-900">使用概览</h1>
					<p className="text-gray-600">当前套餐：{currentTier.toUpperCase()}</p>
				</div>

				{canUpgrade() && (
					<button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium">
						升级套餐
					</button>
				)}
			</div>

			<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
				<UsageCard
					title="调查问卷"
					current={usageData.surveys}
					limit={limits.maxSurveys}
					icon={
						<svg
							className="w-5 h-5 text-blue-500"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
							/>
						</svg>
					}
				/>

				<UsageCard
					title="题目限制"
					current={0}
					limit={limits.maxQuestionsPerSurvey}
					icon={
						<svg
							className="w-5 h-5 text-green-500"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
							/>
						</svg>
					}
				/>

				<UsageCard
					title="邀请用户"
					current={usageData.invitees}
					limit={limits.maxInvitees}
					icon={
						<svg
							className="w-5 h-5 text-purple-500"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
							/>
						</svg>
					}
				/>
			</div>

			{/* Free Plan Benefits */}
			{currentTier === 'free' && (
				<div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
					<h3 className="text-lg font-medium text-blue-900 mb-3">🎉 免费套餐特权</h3>
					<ul className="space-y-2 text-blue-800">
						<li>✓ 创建最多 3 个调查问卷</li>
						<li>✓ 每个问卷最多 10 道题目</li>
						<li>✓ 邀请最多 10 位用户参与</li>
						<li>✓ 基础数据分析功能</li>
						<li>✓ 1 套问卷模板</li>
					</ul>
					<p className="text-blue-700 mt-4 text-sm">
						升级到付费套餐可以解锁更多功能和更高的使用限制！
					</p>
				</div>
			)}
		</div>
	);
};

export { SurveyCreationWithFreeAccount, FeatureAccessExample, FreeAccountDashboard };
