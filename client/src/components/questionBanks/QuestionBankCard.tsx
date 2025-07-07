import React from 'react';
import { QuestionBank } from '../../types/admin';
import { useQuestionBanks } from '../../hooks/useQuestionBanks';

interface QuestionBankCardProps {
	bank: QuestionBank;
}

const QuestionBankCard: React.FC<QuestionBankCardProps> = ({ bank }) => {
	const { handleQuestionBankClick, deleteQuestionBank } = useQuestionBanks();

	return (
		<div
			className="card hover:shadow-lg transition-shadow cursor-pointer"
			onClick={() => handleQuestionBankClick(bank)}
		>
			<div className="flex justify-between items-start">
				<div className="flex-1">
					<h3 className="text-lg font-bold text-gray-800">{bank.name}</h3>
					{bank.description && (
						<p className="text-gray-600 mt-1">{bank.description}</p>
					)}
					<div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
						<span>{bank.questions.length} questions</span>
						<span>
							Created: {new Date(bank.createdAt).toLocaleDateString()}
						</span>
					</div>
				</div>
				<div className="flex gap-2">
					<button
						className="btn-secondary text-sm"
						onClick={(e) => {
							e.stopPropagation();
							handleQuestionBankClick(bank);
						}}
					>
						View Details
					</button>
					<button
						className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors"
						onClick={(e) => {
							e.stopPropagation();
							deleteQuestionBank(bank._id);
						}}
					>
						Delete
					</button>
				</div>
			</div>
		</div>
	);
};

export default QuestionBankCard;