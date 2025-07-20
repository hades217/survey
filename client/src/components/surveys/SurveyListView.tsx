import React from 'react';
import { useSurveys } from '../../hooks/useSurveys';
import SurveyCard from './SurveyCard';

const SurveyListView: React.FC = () => {
	const { surveys, error, loading } = useSurveys();

	console.log('SurveyListView - surveys:', surveys, 'loading:', loading, 'error:', error);

	if (loading) {
		return (
			<div className='text-center py-8 text-gray-500'>
				<p>Loading surveys...</p>
			</div>
		);
	}

	if (error) {
		return (
			<div className='text-center py-8 text-red-500'>
				<p>Error: {error}</p>
			</div>
		);
	}

	if (!surveys || surveys.length === 0) {
		return (
			<div className='text-center py-8 text-gray-500'>
				<p>No surveys created yet.</p>
				<p className='text-sm mt-2'>Create your first survey to get started.</p>
			</div>
		);
	}

	return (
		<div className='space-y-6'>
			{surveys.map((survey, index) => (
				<SurveyCard key={survey?._id || `survey-${index}`} survey={survey} />
			))}
		</div>
	);
};

export default SurveyListView;
