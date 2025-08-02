// ===================================================================
// PROFILE PAGE INTEGRATION EXAMPLE
// ===================================================================

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import ProfilePage from '../components/ProfilePage';
import BillingPage from '../components/BillingPage'; // Standalone billing page
import useSubscription from '../hooks/useSubscription';

// ===================================================================
// Example 1: App Router Integration
// ===================================================================

const App: React.FC = () => {
	return (
		<Router>
			<div className="min-h-screen bg-gray-50">
				<Navigation />
				<Routes>
					<Route path="/" element={<HomePage />} />
					<Route path="/surveys" element={<SurveysPage />} />
					<Route path="/analytics" element={<AnalyticsPage />} />
					<Route path="/profile" element={<ProfilePage />} />
					<Route path="/billing" element={<BillingPage />} />
					{/* Other routes */}
				</Routes>
			</div>
		</Router>
	);
};

// ===================================================================
// Example 2: Navigation with Profile Link
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
							<Link
								to="/surveys"
								className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md"
							>
								调查问卷
							</Link>
							<Link
								to="/analytics"
								className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md"
							>
								数据分析
							</Link>
							<Link
								to="/billing"
								className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md"
							>
								订阅管理
							</Link>
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
									{subscriptionInfo?.subscriptionTier?.toUpperCase()}
								</span>
								<span className="w-2 h-2 bg-green-500 rounded-full"></span>
							</div>
						) : (
							<div className="flex items-center space-x-2">
								<span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
									未订阅
								</span>
								<span className="w-2 h-2 bg-red-500 rounded-full"></span>
							</div>
						)}

						{/* Profile Dropdown */}
						<div className="relative">
							<ProfileDropdown />
						</div>
					</div>
				</div>
			</div>
		</nav>
	);
};

// ===================================================================
// Example 3: Profile Dropdown Menu
// ===================================================================

const ProfileDropdown: React.FC = () => {
	const [isOpen, setIsOpen] = React.useState(false);
	const { hasActiveSubscription, subscriptionInfo } = useSubscription();

	// Mock user data - replace with actual user context
	const user = {
		name: '张三',
		email: 'zhangsan@example.com',
		avatar: null,
	};

	return (
		<div className="relative">
			<button
				onClick={() => setIsOpen(!isOpen)}
				className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md"
			>
				<div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
					{user.avatar ? (
						<img
							src={user.avatar}
							alt="Avatar"
							className="w-8 h-8 rounded-full object-cover"
						/>
					) : (
						<svg
							className="w-5 h-5 text-gray-400"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
							/>
						</svg>
					)}
				</div>
				<span className="text-sm font-medium">{user.name}</span>
				<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M19 9l-7 7-7-7"
					/>
				</svg>
			</button>

			{isOpen && (
				<div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
					<div className="py-1">
						{/* User Info */}
						<div className="px-4 py-2 border-b border-gray-100">
							<p className="text-sm font-medium text-gray-900">{user.name}</p>
							<p className="text-sm text-gray-500">{user.email}</p>
							{hasActiveSubscription && (
								<div className="mt-1">
									<span
										className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
											subscriptionInfo?.subscriptionTier === 'pro'
												? 'bg-purple-100 text-purple-800'
												: 'bg-blue-100 text-blue-800'
										}`}
									>
										{subscriptionInfo?.subscriptionTier?.toUpperCase()} 会员
									</span>
								</div>
							)}
						</div>

						{/* Menu Items */}
						<Link
							to="/profile"
							className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
							onClick={() => setIsOpen(false)}
						>
							<div className="flex items-center">
								<svg
									className="w-4 h-4 mr-2"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
									/>
								</svg>
								个人中心
							</div>
						</Link>

						<Link
							to="/billing"
							className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
							onClick={() => setIsOpen(false)}
						>
							<div className="flex items-center justify-between">
								<div className="flex items-center">
									<svg
										className="w-4 h-4 mr-2"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
										/>
									</svg>
									订阅管理
								</div>
								{!hasActiveSubscription && (
									<span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
										!
									</span>
								)}
							</div>
						</Link>

						<div className="border-t border-gray-100">
							<button
								onClick={() => {
									// Handle logout
									console.log('Logging out...');
									setIsOpen(false);
								}}
								className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
							>
								<div className="flex items-center">
									<svg
										className="w-4 h-4 mr-2"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
										/>
									</svg>
									退出登录
								</div>
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

// ===================================================================
// Example 4: Direct Link to Billing Tab in Profile
// ===================================================================

const QuickBillingAccess: React.FC = () => {
	const { hasActiveSubscription, subscriptionInfo } = useSubscription();

	return (
		<div className="bg-white rounded-lg border border-gray-200 p-4">
			<div className="flex items-center justify-between">
				<div>
					<h3 className="text-sm font-medium text-gray-900">订阅状态</h3>
					{hasActiveSubscription ? (
						<div className="mt-1">
							<span
								className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
									subscriptionInfo?.subscriptionTier === 'pro'
										? 'bg-purple-100 text-purple-800'
										: 'bg-blue-100 text-blue-800'
								}`}
							>
								{subscriptionInfo?.subscriptionTier?.toUpperCase()} 活跃
							</span>
						</div>
					) : (
						<p className="text-sm text-red-600 mt-1">未激活订阅</p>
					)}
				</div>
				<Link
					to="/profile?tab=billing"
					className="text-blue-600 hover:text-blue-500 text-sm font-medium"
				>
					管理订阅
				</Link>
			</div>
		</div>
	);
};

// ===================================================================
// Example 5: Enhanced Profile Page with URL Tab Support
// ===================================================================

const EnhancedProfilePage: React.FC = () => {
	const { hasActiveSubscription, subscriptionInfo } = useSubscription();

	// Get tab from URL params
	const urlParams = new URLSearchParams(window.location.search);
	const tabFromUrl = urlParams.get('tab');
	const [activeTab, setActiveTab] = React.useState(tabFromUrl || 'profile');

	// Update URL when tab changes
	const handleTabChange = (newTab: string) => {
		setActiveTab(newTab);
		const newUrl = new URL(window.location.href);
		if (newTab === 'profile') {
			newUrl.searchParams.delete('tab');
		} else {
			newUrl.searchParams.set('tab', newTab);
		}
		window.history.pushState({}, '', newUrl.toString());
	};

	// ... rest of the ProfilePage component logic
	// Use handleTabChange instead of setActiveTab

	return (
		<div className="min-h-screen bg-gray-50">{/* Profile page content with tab support */}</div>
	);
};

// Mock components for the example
const HomePage = () => <div>Home Page</div>;
const SurveysPage = () => <div>Surveys Page</div>;
const AnalyticsPage = () => <div>Analytics Page</div>;

export { App, Navigation, ProfileDropdown, QuickBillingAccess, EnhancedProfilePage };
