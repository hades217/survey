import React from 'react';
import { useAdmin } from '../../contexts/AdminContext';

const NavigationTabs: React.FC = () => {
	const { tab, setTab, navigate } = useAdmin();

	const handleTabClick = (newTab: 'list' | 'question-banks' | 'profile') => {
		setTab(newTab);
		if (newTab === 'list') {
			navigate('/admin');
		} else if (newTab === 'question-banks') {
			navigate('/admin/question-banks');
		} else if (newTab === 'profile') {
			navigate('/admin/profile');
		}
	};

	// Don't show tabs when viewing survey or question bank details
	if (tab === 'detail') {
		return null;
	}

	return (
		<div className='flex space-x-1 rounded-lg bg-gray-100 p-1 mb-6'>
			<button
				onClick={() => handleTabClick('list')}
				className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
					tab === 'list'
						? 'bg-white text-gray-900 shadow-sm'
						: 'text-gray-600 hover:text-gray-900'
				}`}
			>
				Surveys
			</button>
			<button
				onClick={() => handleTabClick('question-banks')}
				className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
					tab === 'question-banks'
						? 'bg-white text-gray-900 shadow-sm'
						: 'text-gray-600 hover:text-gray-900'
				}`}
			>
				Question Banks
			</button>
			<button
				onClick={() => handleTabClick('profile')}
				className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
					tab === 'profile'
						? 'bg-white text-gray-900 shadow-sm'
						: 'text-gray-600 hover:text-gray-900'
				}`}
			>
				Profile
			</button>
		</div>
	);
};

export default NavigationTabs;
