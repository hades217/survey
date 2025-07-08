import React from 'react';
import Modal from '../Modal';
import { useQuestionBanks } from '../../hooks/useQuestionBanks';
import { useAdmin } from '../../contexts/AdminContext';

const CreateQuestionBankModal: React.FC = () => {
	const {
		showQuestionBankModal,
		setShowQuestionBankModal,
		questionBankForm,
		setQuestionBankForm,
		loading,
		error,
		setError,
	} = useAdmin();

	const { createQuestionBank } = useQuestionBanks();

	const handleClose = () => {
		setShowQuestionBankModal(false);
		setQuestionBankForm({ name: '', description: '' });
		setError('');
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		
		if (!questionBankForm.name.trim()) {
			setError('Question bank name is required');
			return;
		}

		await createQuestionBank(e);
	};

	return (
		<Modal show={showQuestionBankModal} onClose={handleClose}>
			<div className="bg-white rounded-lg p-6 w-full max-w-md mx-auto">
				<h2 className="text-xl font-bold text-gray-800 mb-4">Create New Question Bank</h2>
				
				{error && (
					<div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4">
						{error}
					</div>
				)}

				<form onSubmit={handleSubmit} className="space-y-4">
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">
							Name *
						</label>
						<input
							type="text"
							className="input-field w-full"
							placeholder="Enter question bank name"
							value={questionBankForm.name}
							onChange={(e) =>
								setQuestionBankForm({ ...questionBankForm, name: e.target.value })
							}
							required
						/>
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">
							Description
						</label>
						<textarea
							className="input-field w-full"
							placeholder="Enter description (optional)"
							value={questionBankForm.description}
							onChange={(e) =>
								setQuestionBankForm({
									...questionBankForm,
									description: e.target.value,
								})
							}
							rows={3}
						/>
					</div>

					<div className="flex gap-3 pt-4">
						<button
							type="button"
							onClick={handleClose}
							className="btn-secondary flex-1"
							disabled={loading}
						>
							Cancel
						</button>
						<button
							type="submit"
							className="btn-primary flex-1"
							disabled={loading || !questionBankForm.name.trim()}
						>
							{loading ? 'Creating...' : 'Create Question Bank'}
						</button>
					</div>
				</form>
			</div>
		</Modal>
	);
};

export default CreateQuestionBankModal;