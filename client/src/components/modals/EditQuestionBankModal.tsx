import React, { useEffect } from 'react';
import Modal from '../Modal';
import { useQuestionBanks } from '../../hooks/useQuestionBanks';
import { useAdmin } from '../../contexts/AdminContext';

const EditQuestionBankModal: React.FC = () => {
	const {
		showEditQuestionBankModal,
		setShowEditQuestionBankModal,
		editQuestionBankForm,
		setEditQuestionBankForm,
		selectedQuestionBankDetail,
		loading,
		error,
		setError,
	} = useAdmin();

	const { updateQuestionBank } = useQuestionBanks();

	// Populate form when modal opens
	useEffect(() => {
		if (showEditQuestionBankModal && selectedQuestionBankDetail) {
			setEditQuestionBankForm({
				name: selectedQuestionBankDetail.name,
				description: selectedQuestionBankDetail.description,
			});
		}
	}, [showEditQuestionBankModal, selectedQuestionBankDetail, setEditQuestionBankForm]);

	const handleClose = () => {
		setShowEditQuestionBankModal(false);
		setEditQuestionBankForm({ name: '', description: '' });
		setError('');
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		
		if (!editQuestionBankForm.name.trim()) {
			setError('Question bank name is required');
			return;
		}

		if (!selectedQuestionBankDetail) {
			setError('No question bank selected');
			return;
		}

		try {
			await updateQuestionBank(selectedQuestionBankDetail._id, {
				name: editQuestionBankForm.name.trim(),
				description: editQuestionBankForm.description.trim(),
			});
			handleClose();
		} catch (err) {
			// Error is already handled in the hook
		}
	};

	return (
		<Modal show={showEditQuestionBankModal} onClose={handleClose}>
			<div className="bg-white rounded-lg p-6 w-full max-w-md mx-auto">
				<h2 className="text-xl font-bold text-gray-800 mb-4">Edit Question Bank</h2>
				
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
							value={editQuestionBankForm.name}
							onChange={(e) =>
								setEditQuestionBankForm({ 
									...editQuestionBankForm, 
									name: e.target.value 
								})
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
							value={editQuestionBankForm.description}
							onChange={(e) =>
								setEditQuestionBankForm({
									...editQuestionBankForm,
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
							disabled={loading || !editQuestionBankForm.name.trim()}
						>
							{loading ? 'Updating...' : 'Update Question Bank'}
						</button>
					</div>
				</form>
			</div>
		</Modal>
	);
};

export default EditQuestionBankModal;