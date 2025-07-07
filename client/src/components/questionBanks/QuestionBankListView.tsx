import React from 'react';
import { useQuestionBanks } from '../../hooks/useQuestionBanks';
import { useAdmin } from '../../contexts/AdminContext';
import QuestionBankCard from './QuestionBankCard';

const QuestionBankListView: React.FC = () => {
	const { questionBanks } = useQuestionBanks();
	const { setShowQuestionBankModal } = useAdmin();

	return (
		<div className="space-y-4">
			<div className="flex justify-between items-center">
				<h2 className="text-xl font-semibold text-gray-800">Question Banks</h2>
				<div className="flex gap-2">
					<button className="btn-secondary text-sm" onClick={() => {
						console.log('Current state:', {
							questionBanksLength: questionBanks.length
						});
					}}>
						Debug State
					</button>
					<button className="btn-primary" onClick={() => setShowQuestionBankModal(true)}>
						+ Create Question Bank
					</button>
				</div>
			</div>

			{questionBanks.length === 0 ? (
				<div className="text-center py-8 text-gray-500">
					<p>No question banks created yet.</p>
					<p className="text-sm mt-2">Create your first question bank to get started.</p>
				</div>
			) : (
				<div className="grid gap-4">
					{questionBanks.map(bank => (
						<QuestionBankCard key={bank._id} bank={bank} />
					))}
				</div>
			)}
		</div>
	);
};

export default QuestionBankListView;