import React from 'react';
import { useTranslation } from 'react-i18next';

interface QuestionNavigatorProps {
	currentQuestion: number;
	totalQuestions: number;
	canProceed: boolean;
	onPrevious: () => void;
	onNext: () => void;
	onSubmit: () => void;
	loading?: boolean;
}

const QuestionNavigator: React.FC<QuestionNavigatorProps> = ({
	currentQuestion,
	totalQuestions,
	canProceed,
	onPrevious,
	onNext,
	onSubmit,
	loading = false,
}) => {
	const { t } = useTranslation();
	const isFirstQuestion = currentQuestion === 0;
	const isLastQuestion = currentQuestion === totalQuestions - 1;

	return (
		<div className='flex justify-between items-center pt-8 border-t border-[#EBEBEB] mt-8'>
			{/* Previous Button */}
			<button
				type='button'
				onClick={onPrevious}
				disabled={isFirstQuestion || loading}
				className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
					isFirstQuestion || loading
						? 'bg-gray-100 text-gray-400 cursor-not-allowed'
						: 'bg-white border-2 border-[#EBEBEB] text-[#484848] hover:border-[#FF5A5F] hover:text-[#FF5A5F] hover:shadow-md'
				}`}
			>
				<svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
					<path
						strokeLinecap='round'
						strokeLinejoin='round'
						strokeWidth={2}
						d='M15 19l-7-7 7-7'
					/>
				</svg>
				{t('survey.navigation.previous', 'Previous')}
			</button>

			{/* Progress Indicator */}
			<div className='flex items-center gap-4'>
				<div className='text-sm text-[#767676] font-medium'>
					{t('survey.navigation.progress', 'Question {{current}} of {{total}}', {
						current: currentQuestion + 1,
						total: totalQuestions,
					})}
				</div>

				{/* Progress Bar */}
				<div className='w-32 h-2 bg-[#EBEBEB] rounded-full overflow-hidden'>
					<div
						className='h-full bg-gradient-to-r from-[#FF5A5F] to-[#FF8A8D] transition-all duration-500 ease-out'
						style={{
							width: `${((currentQuestion + 1) / totalQuestions) * 100}%`,
						}}
					/>
				</div>
			</div>

			{/* Next/Submit Button */}
			{isLastQuestion ? (
				<button
					type='submit'
					disabled={!canProceed || loading}
					className={`flex items-center gap-2 px-8 py-3 rounded-xl font-medium transition-all duration-300 ${
						!canProceed || loading
							? 'bg-gray-100 text-gray-400 cursor-not-allowed'
							: 'bg-[#FF5A5F] text-white hover:bg-[#E54A4F] shadow-lg hover:shadow-xl transform hover:scale-[1.02]'
					}`}
				>
					{loading ? (
						<>
							<div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
							{t('survey.navigation.submitting', 'Submitting...')}
						</>
					) : (
						<>
							{t('survey.navigation.submit', 'Submit Survey')}
							<svg
								className='w-4 h-4'
								fill='none'
								stroke='currentColor'
								viewBox='0 0 24 24'
							>
								<path
									strokeLinecap='round'
									strokeLinejoin='round'
									strokeWidth={2}
									d='M5 13l4 4L19 7'
								/>
							</svg>
						</>
					)}
				</button>
			) : (
				<button
					type='button'
					onClick={onNext}
					disabled={!canProceed || loading}
					className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
						!canProceed || loading
							? 'bg-gray-100 text-gray-400 cursor-not-allowed'
							: 'bg-[#FF5A5F] text-white hover:bg-[#E54A4F] shadow-lg hover:shadow-xl transform hover:scale-[1.02]'
					}`}
				>
					{t('survey.navigation.next', 'Next')}
					<svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
						<path
							strokeLinecap='round'
							strokeLinejoin='round'
							strokeWidth={2}
							d='M9 5l7 7-7 7'
						/>
					</svg>
				</button>
			)}
		</div>
	);
};

export default QuestionNavigator;
