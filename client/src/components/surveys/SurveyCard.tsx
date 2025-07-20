import React from 'react';
import { Survey } from '../../types/admin';
import { getSurveyUrl } from '../../utils/config';
import { useAdmin } from '../../contexts/AdminContext';
import { useSurveys } from '../../hooks/useSurveys';

interface SurveyCardProps {
	survey: Survey;
}

const SurveyCard: React.FC<SurveyCardProps> = ({ survey }) => {
	const { showQR, setShowQR, copyToClipboard } = useAdmin();
	const { toggleSurveyStatus, deleteSurvey, handleSurveyClick, openEditModal } = useSurveys();

	// Add safety checks for survey data
	if (!survey) {
		return <div className='card'>Invalid survey data</div>;
	}

	const surveyUrl = getSurveyUrl(survey.slug || '');

	const toggleQR = (surveyId: string) => {
		setShowQR(prev => ({
			...prev,
			[surveyId]: !prev[surveyId],
		}));
	};

	return (
		<div className='card hover:shadow-lg transition-shadow'>
			<div className='flex justify-between items-start mb-4'>
				<div className='flex-1'>
					<div className='flex items-center gap-2 mb-2'>
						<h3
							className='text-lg font-bold text-gray-800 cursor-pointer hover:text-blue-600'
							onClick={() => handleSurveyClick(survey)}
						>
							{survey.title}
						</h3>
						<span
							className={`px-2 py-1 text-xs font-medium rounded-full ${
								survey.type === 'survey'
									? 'bg-blue-100 text-blue-800'
									: survey.type === 'assessment'
										? 'bg-green-100 text-green-800'
										: survey.type === 'quiz'
											? 'bg-purple-100 text-purple-800'
											: 'bg-orange-100 text-orange-800'
							}`}
						>
							{survey.type
								? survey.type.charAt(0).toUpperCase() + survey.type.slice(1)
								: 'Unknown'}
						</span>
						{survey.sourceType === 'question_bank' && (
							<span className='px-2 py-1 text-xs font-medium rounded-full bg-indigo-100 text-indigo-800'>
								Question Bank
							</span>
						)}
						<span
							className={`px-2 py-1 text-xs font-medium rounded-full ${
								survey.status === 'active'
									? 'bg-green-100 text-green-800'
									: survey.status === 'draft'
										? 'bg-yellow-100 text-yellow-800'
										: 'bg-red-100 text-red-800'
							}`}
						>
							{survey.status === 'active'
								? 'Active'
								: survey.status === 'draft'
									? 'Draft'
									: 'Closed'}
						</span>
					</div>
					<p className='text-gray-600 mb-2'>{survey.description || 'No description'}</p>
					<div className='flex items-center gap-4 text-sm text-gray-500'>
						<span>{survey.questions?.length || 0} questions</span>
						<span>
							Created:{' '}
							{survey.createdAt
								? new Date(survey.createdAt).toLocaleDateString()
								: 'Unknown'}
						</span>
						{survey.timeLimit && <span>Time limit: {survey.timeLimit} minutes</span>}
					</div>
				</div>
			</div>
			<div className='flex gap-2 mt-4'>
				<button className='btn-primary text-sm' onClick={() => handleSurveyClick(survey)}>
					Manage
				</button>
				<button
					className='px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors'
					onClick={() => deleteSurvey(survey._id)}
				>
					Delete
				</button>
			</div>
		</div>
	);
};

export default SurveyCard;
