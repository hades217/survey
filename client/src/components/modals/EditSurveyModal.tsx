import React, { useState, useEffect } from 'react';
import { useAdmin } from '../../contexts/AdminContext';
import { useSurveys } from '../../hooks/useSurveys';
import { SOURCE_TYPE } from '../../constants/index';
import MultiQuestionBankModal from './MultiQuestionBankModal';
import ManualQuestionSelectionModal from './ManualQuestionSelectionModal';
import api from '../../utils/axiosConfig';

interface ModalProps {
	show: boolean;
	title: string;
	onClose: () => void;
	children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ show, title, onClose, children }) => {
	if (!show) return null;

	return (
		<div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4'>
			<div className='bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden'>
				<div className='flex justify-between items-center p-6 border-b border-gray-200'>
					<h3 className='text-lg font-semibold text-gray-900'>{title}</h3>
					<button
						onClick={onClose}
						className='text-gray-400 hover:text-gray-600 transition-colors'
					>
						<svg
							className='w-6 h-6'
							fill='none'
							stroke='currentColor'
							viewBox='0 0 24 24'
						>
							<path
								strokeLinecap='round'
								strokeLinejoin='round'
								strokeWidth={2}
								d='M6 18L18 6M6 6l12 12'
							/>
						</svg>
					</button>
				</div>
				<div className='p-6 overflow-y-auto max-h-[calc(90vh-120px)]'>{children}</div>
			</div>
		</div>
	);
};

const EditSurveyModal: React.FC = () => {
	const {
		showEditModal,
		setShowEditModal,
		editForm,
		setEditForm,
		selectedSurvey,
		loading,
		setLoading,
		setError,
		questionBanks,
		setQuestionBanks,
	} = useAdmin();

	const { updateSurvey } = useSurveys();

	// Modal state for question bank configuration
	const [showMultiBankModal, setShowMultiBankModal] = useState(false);
	const [showManualSelectionModal, setShowManualSelectionModal] = useState(false);

	// Initialize scoring settings if not present
	useEffect(() => {
		if (selectedSurvey && !editForm.scoringSettings) {
			setEditForm(prev => ({
				...prev,
				scoringSettings: {
					scoringMode: selectedSurvey.scoringSettings?.scoringMode || 'percentage',
					passingThreshold: selectedSurvey.scoringSettings?.passingThreshold || 60,
					showScore: selectedSurvey.scoringSettings?.showScore ?? true,
					showCorrectAnswers: selectedSurvey.scoringSettings?.showCorrectAnswers ?? false,
					showScoreBreakdown: selectedSurvey.scoringSettings?.showScoreBreakdown ?? true,
					customScoringRules: selectedSurvey.scoringSettings?.customScoringRules || {
						useCustomPoints: false,
						defaultQuestionPoints: 1,
					},
				},
			}));
		}
	}, [selectedSurvey, editForm.scoringSettings, setEditForm]);

	// Load question banks when modal opens
	useEffect(() => {
		const loadQuestionBanks = async () => {
			if (showEditModal && (!questionBanks || questionBanks.length === 0)) {
				console.log('EditSurveyModal: Loading question banks...');
				try {
					const response = await api.get('/admin/question-banks');
					console.log('EditSurveyModal: Question banks loaded:', response.data);
					setQuestionBanks(response.data);
				} catch (err) {
					console.error('Error loading question banks:', err);
					setError('Failed to load question banks');
				}
			} else if (showEditModal) {
				console.log(
					'EditSurveyModal: Question banks already available:',
					questionBanks?.length
				);
			}
		};

		loadQuestionBanks();
	}, [showEditModal, questionBanks, setQuestionBanks, setError]);

	// Debug log for editForm changes
	useEffect(() => {
		if (showEditModal) {
			console.log('EditSurveyModal: editForm state:', {
				sourceType: editForm.sourceType,
				questionBankId: editForm.questionBankId,
				questionCount: editForm.questionCount,
				multiQuestionBankConfig: editForm.multiQuestionBankConfig,
				selectedQuestions: editForm.selectedQuestions,
			});
		}
	}, [showEditModal, editForm]);

	if (!selectedSurvey || !showEditModal) return null;

	const closeEditModal = () => {
		setShowEditModal(false);
	};

	const handleUpdateSurvey = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		try {
			const surveyData = {
				...editForm,
				// Ensure isActive matches status for backward compatibility
				isActive: editForm.status === 'active',
				timeLimit: editForm.timeLimit ? Number(editForm.timeLimit) : undefined,
				maxAttempts: editForm.maxAttempts || 1,
				// Include scoring settings if it's an assessment type
				...(['quiz', 'assessment', 'iq'].includes(editForm.type) &&
					editForm.scoringSettings && {
					scoringSettings: editForm.scoringSettings,
				}),
			};

			await updateSurvey(selectedSurvey._id, surveyData);
			closeEditModal();
		} catch (err) {
			setError('Failed to update survey. Please try again.');
		} finally {
			setLoading(false);
		}
	};

	return (
		<Modal
			show={showEditModal}
			title={`Edit Survey: ${selectedSurvey.title}`}
			onClose={closeEditModal}
		>
			<form onSubmit={handleUpdateSurvey} className='space-y-4'>
				<div>
					<label className='block text-sm font-medium text-gray-700 mb-2'>Title *</label>
					<input
						className='input-field'
						placeholder='Enter survey title'
						value={editForm.title}
						onChange={e => setEditForm({ ...editForm, title: e.target.value })}
						required
					/>
				</div>

				<div>
					<label className='block text-sm font-medium text-gray-700 mb-2'>
						Description
					</label>
					<textarea
						className='input-field'
						placeholder='Enter description'
						value={editForm.description}
						onChange={e => setEditForm({ ...editForm, description: e.target.value })}
						rows={3}
					/>
				</div>

				<div className='grid grid-cols-2 gap-4'>
					<div>
						<label className='block text-sm font-medium text-gray-700 mb-2'>Type</label>
						<select
							className='input-field'
							value={editForm.type}
							onChange={e =>
								setEditForm({ ...editForm, type: e.target.value as any })
							}
						>
							<option value='survey'>Survey</option>
							<option value='assessment'>Assessment</option>
							<option value='quiz'>Quiz</option>
							<option value='iq'>IQ Test</option>
						</select>
					</div>

					<div>
						<label className='block text-sm font-medium text-gray-700 mb-2'>
							Status
						</label>
						<select
							className='input-field'
							value={editForm.status}
							onChange={e =>
								setEditForm({
									...editForm,
									status: e.target.value as 'draft' | 'active' | 'closed',
								})
							}
						>
							<option value='draft'>Draft</option>
							<option value='active'>Active</option>
							<option value='closed'>Closed</option>
						</select>
					</div>
				</div>

				{/* Question Bank Configuration */}
				<div className='bg-gray-50 rounded-lg p-4 space-y-4'>
					<h4 className='font-medium text-gray-800'>Question Configuration</h4>

					<div>
						<label className='block text-sm font-medium text-gray-700 mb-2'>
							Question Source
						</label>

						{/* Display current source type info */}
						<div className='mb-2 p-2 bg-gray-50 border border-gray-200 rounded-lg'>
							<div className='text-sm text-gray-700'>
								<strong>Current source:</strong>{' '}
								{editForm.sourceType === SOURCE_TYPE.MANUAL
									? 'Manual Questions'
									: editForm.sourceType === SOURCE_TYPE.QUESTION_BANK
										? 'Question Bank (Random)'
										: editForm.sourceType === SOURCE_TYPE.MULTI_QUESTION_BANK
											? 'Multi-Question Bank'
											: editForm.sourceType === SOURCE_TYPE.MANUAL_SELECTION
												? 'Manual Selection'
												: 'Manual Questions (default)'}
							</div>
						</div>

						<select
							className='input-field'
							value={editForm.sourceType || SOURCE_TYPE.MANUAL}
							onChange={e => {
								const sourceType = e.target.value;
								setEditForm({
									...editForm,
									sourceType,
									// Clear other source-specific fields when changing type
									...(sourceType !== SOURCE_TYPE.QUESTION_BANK && {
										questionBankId: undefined,
										questionCount: undefined,
									}),
									...(sourceType !== SOURCE_TYPE.MULTI_QUESTION_BANK && {
										multiQuestionBankConfig: [],
									}),
									...(sourceType !== SOURCE_TYPE.MANUAL_SELECTION && {
										selectedQuestions: [],
									}),
								});
							}}
						>
							<option value={SOURCE_TYPE.MANUAL}>Manual Questions</option>
							<option value={SOURCE_TYPE.QUESTION_BANK}>
								Question Bank (Random)
							</option>
							<option value={SOURCE_TYPE.MULTI_QUESTION_BANK}>
								Multi-Question Bank
							</option>
							<option value={SOURCE_TYPE.MANUAL_SELECTION}>Manual Selection</option>
						</select>
						<div className='text-xs text-gray-500 mt-1'>
							Choose how questions are sourced for this survey
						</div>
					</div>

					{/* Single Question Bank Configuration */}
					{editForm.sourceType === SOURCE_TYPE.QUESTION_BANK && (
						<div className='space-y-4'>
							<div>
								<label className='block text-sm font-medium text-gray-700 mb-2'>
									Question Bank
								</label>

								{/* Display current selection info */}
								{editForm.questionBankId && (
									<div className='mb-2 p-2 bg-blue-50 border border-blue-200 rounded-lg'>
										<div className='text-sm text-blue-800'>
											<strong>Currently selected:</strong>{' '}
											{questionBanks?.find(
												bank => bank._id === editForm.questionBankId
											)?.name ||
												'Unknown Bank (ID: ' +
													editForm.questionBankId +
													')'}
										</div>
										{editForm.questionCount && (
											<div className='text-xs text-blue-600 mt-1'>
												Configured to select {editForm.questionCount}{' '}
												questions
											</div>
										)}
									</div>
								)}

								<select
									className='input-field'
									value={editForm.questionBankId || ''}
									onChange={e =>
										setEditForm({
											...editForm,
											questionBankId: e.target.value || undefined,
										})
									}
									required
								>
									<option value=''>Select a question bank</option>
									{questionBanks?.map(bank => (
										<option key={bank._id} value={bank._id}>
											{bank.name} ({bank.questions?.length || 0} questions)
										</option>
									))}
								</select>

								{(!questionBanks || questionBanks.length === 0) && (
									<div className='text-sm text-red-600 mt-1'>
										No question banks available. Please create a question bank
										first.
									</div>
								)}
							</div>

							<div>
								<label className='block text-sm font-medium text-gray-700 mb-2'>
									Number of Questions
								</label>
								<input
									type='number'
									className='input-field'
									value={editForm.questionCount || ''}
									onChange={e =>
										setEditForm({
											...editForm,
											questionCount: e.target.value
												? parseInt(e.target.value)
												: undefined,
										})
									}
									placeholder='All questions'
									min='1'
								/>
								<div className='text-xs text-gray-500 mt-1'>
									Number of questions to randomly select (leave empty for all)
								</div>
							</div>
						</div>
					)}

					{/* Multi-Question Bank Configuration */}
					{editForm.sourceType === SOURCE_TYPE.MULTI_QUESTION_BANK && (
						<div>
							<label className='block text-sm font-medium text-gray-700 mb-1'>
								Multi-Question Bank Configuration
							</label>
							<div className='border border-gray-300 rounded-lg p-4 bg-white'>
								{editForm.multiQuestionBankConfig &&
								editForm.multiQuestionBankConfig.length > 0 ? (
										<div className='space-y-2'>
											{editForm.multiQuestionBankConfig.map(
												(config: unknown, index: number) => {
													const bank = questionBanks?.find(
														b => b._id === config.questionBankId
													);
													return (
														<div
															key={index}
															className='text-sm text-gray-700'
														>
															<strong>
																{bank?.name || 'Unknown Bank'}
															</strong>
														: {config.questionCount} questions
															{config.filters &&
															Object.keys(config.filters).length >
																0 && (
																<span className='text-gray-500'>
																	{' '}
																	(with filters)
																</span>
															)}
														</div>
													);
												}
											)}
											<div className='text-xs text-gray-500 mt-2'>
											Total:{' '}
												{editForm.multiQuestionBankConfig.reduce(
													(sum: number, config: unknown) =>
														sum + config.questionCount,
													0
												)}{' '}
											questions
											</div>
										</div>
									) : (
										<div className='text-sm text-gray-500'>
										No configurations set
										</div>
									)}
								<button
									type='button'
									onClick={() => setShowMultiBankModal(true)}
									className='mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors'
								>
									Configure Question Banks
								</button>
							</div>
						</div>
					)}

					{/* Manual Question Selection */}
					{editForm.sourceType === SOURCE_TYPE.MANUAL_SELECTION && (
						<div>
							<label className='block text-sm font-medium text-gray-700 mb-1'>
								Manual Question Selection
							</label>
							<div className='border border-gray-300 rounded-lg p-4 bg-white'>
								{editForm.selectedQuestions &&
								editForm.selectedQuestions.length > 0 ? (
										<div className='space-y-2'>
											<div className='text-sm text-gray-700'>
												<strong>{editForm.selectedQuestions.length}</strong>{' '}
											questions selected
											</div>
											<div className='text-xs text-gray-500'>
											Questions selected from various question banks
											</div>
										</div>
									) : (
										<div className='text-sm text-gray-500'>
										No questions selected
										</div>
									)}
								<button
									type='button'
									onClick={() => setShowManualSelectionModal(true)}
									className='mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors'
								>
									Select Questions
								</button>
							</div>
						</div>
					)}
				</div>

				{/* Enhanced settings for quiz/assessment/iq */}
				{['quiz', 'assessment', 'iq'].includes(editForm.type) && (
					<div className='bg-blue-50 rounded-lg p-4 space-y-4'>
						<h4 className='font-medium text-gray-800'>Assessment Configuration</h4>

						<div className='grid grid-cols-2 gap-4'>
							<div>
								<label className='block text-sm font-medium text-gray-700 mb-2'>
									Time Limit (minutes)
								</label>
								<input
									type='number'
									className='input-field'
									placeholder='No limit'
									value={editForm.timeLimit || ''}
									onChange={e =>
										setEditForm({
											...editForm,
											timeLimit: e.target.value
												? parseInt(e.target.value)
												: undefined,
										})
									}
									min='1'
									max='300'
								/>
								<div className='text-xs text-gray-500 mt-1'>
									Leave empty for no time limit
								</div>
							</div>
							<div>
								<label className='block text-sm font-medium text-gray-700 mb-2'>
									Max Attempts
								</label>
								<input
									type='number'
									className='input-field'
									value={editForm.maxAttempts}
									onChange={e =>
										setEditForm({
											...editForm,
											maxAttempts: parseInt(e.target.value) || 1,
										})
									}
									min='1'
									max='10'
									required
								/>
							</div>
						</div>

						<div>
							<label className='block text-sm font-medium text-gray-700 mb-2'>
								Navigation Mode
							</label>
							<select
								className='input-field'
								value={editForm.navigationMode}
								onChange={e =>
									setEditForm({
										...editForm,
										navigationMode: e.target.value as
											| 'step-by-step'
											| 'paginated'
											| 'all-in-one'
											| 'one-question-per-page',
									})
								}
							>
								<option value='step-by-step'>Step-by-step (Recommended)</option>
								<option value='paginated'>Paginated</option>
								<option value='all-in-one'>All-in-one</option>
								<option value='one-question-per-page'>
									One Question Per Page (Typeform-like)
								</option>
							</select>
							<div className='text-xs text-gray-500 mt-1'>
								Choose how questions are displayed to users: Step-by-step (classic),
								One Question Per Page (Typeform-like with progress bar), Paginated,
								or All-in-one
							</div>
						</div>

						<div>
							<label className='block text-sm font-medium text-gray-700 mb-2'>
								Special Instructions
							</label>
							<textarea
								className='input-field'
								placeholder='Additional instructions or notes for students'
								value={editForm.instructions}
								onChange={e =>
									setEditForm({ ...editForm, instructions: e.target.value })
								}
								rows={3}
							/>
							<div className='text-xs text-gray-500 mt-1'>
								These instructions will be shown to students before starting the
								assessment
							</div>
						</div>

						{/* Scoring Settings */}
						<div className='mt-4 pt-4 border-t border-gray-200'>
							<h5 className='font-medium text-gray-800 mb-3'>Scoring Settings</h5>

							<div className='space-y-3'>
								<div className='grid grid-cols-2 gap-4'>
									<div>
										<label className='block text-sm font-medium text-gray-700 mb-2'>
											Scoring Mode
										</label>
										<select
											className='input-field'
											value={
												editForm.scoringSettings?.scoringMode ||
												'percentage'
											}
											onChange={e =>
												setEditForm({
													...editForm,
													scoringSettings: {
														...editForm.scoringSettings,
														scoringMode: e.target.value,
													},
												})
											}
										>
											<option value='percentage'>Percentage</option>
											<option value='accumulated'>Accumulated Points</option>
										</select>
									</div>
									<div>
										<label className='block text-sm font-medium text-gray-700 mb-2'>
											Passing Threshold
										</label>
										<input
											type='number'
											className='input-field'
											value={editForm.scoringSettings?.passingThreshold || 60}
											onChange={e =>
												setEditForm({
													...editForm,
													scoringSettings: {
														...editForm.scoringSettings,
														passingThreshold:
															parseInt(e.target.value) || 0,
													},
												})
											}
											min='0'
											max={
												editForm.scoringSettings?.scoringMode ===
												'percentage'
													? '100'
													: '1000'
											}
										/>
										<div className='text-xs text-gray-500 mt-1'>
											{editForm.scoringSettings?.scoringMode === 'percentage'
												? 'Percentage needed to pass (0-100)'
												: 'Points needed to pass'}
										</div>
									</div>
								</div>

								<div className='space-y-2'>
									<div>
										<label className='flex items-center'>
											<input
												type='checkbox'
												className='mr-2'
												checked={
													editForm.scoringSettings?.showScore ?? true
												}
												onChange={e =>
													setEditForm({
														...editForm,
														scoringSettings: {
															...editForm.scoringSettings,
															showScore: e.target.checked,
														},
													})
												}
											/>
											<span className='text-sm text-gray-700'>
												Show final score to students
											</span>
										</label>
										<p className='text-xs text-gray-500 ml-6'>
											When enabled, students will see their final score after
											completing the assessment. When disabled, they will only
											see a completion message.
										</p>
									</div>

									<label className='flex items-center'>
										<input
											type='checkbox'
											className='mr-2'
											checked={
												editForm.scoringSettings?.showCorrectAnswers ??
												false
											}
											onChange={e =>
												setEditForm({
													...editForm,
													scoringSettings: {
														...editForm.scoringSettings,
														showCorrectAnswers: e.target.checked,
													},
												})
											}
										/>
										<span className='text-sm text-gray-700'>
											Show correct answers after completion
										</span>
									</label>

									<label className='flex items-center'>
										<input
											type='checkbox'
											className='mr-2'
											checked={
												editForm.scoringSettings?.showScoreBreakdown ?? true
											}
											onChange={e =>
												setEditForm({
													...editForm,
													scoringSettings: {
														...editForm.scoringSettings,
														showScoreBreakdown: e.target.checked,
													},
												})
											}
										/>
										<span className='text-sm text-gray-700'>
											Show detailed score breakdown
										</span>
									</label>
								</div>
							</div>
						</div>
					</div>
				)}

				<div className='flex gap-3 pt-4 border-t'>
					<button className='btn-primary flex-1' type='submit' disabled={loading}>
						{loading ? 'Saving...' : 'Save Changes'}
					</button>
					<button type='button' className='btn-secondary px-6' onClick={closeEditModal}>
						Cancel
					</button>
				</div>
			</form>

			{/* Question Bank Configuration Modals */}
			{showMultiBankModal && (
				<MultiQuestionBankModal
					show={showMultiBankModal}
					onClose={() => setShowMultiBankModal(false)}
					onSave={config => {
						setEditForm({
							...editForm,
							multiQuestionBankConfig: config,
						});
						setShowMultiBankModal(false);
					}}
					initialConfig={editForm.multiQuestionBankConfig || []}
					questionBanks={questionBanks || []}
				/>
			)}

			{showManualSelectionModal && (
				<ManualQuestionSelectionModal
					show={showManualSelectionModal}
					onClose={() => setShowManualSelectionModal(false)}
					onSave={selectedQuestions => {
						setEditForm({
							...editForm,
							selectedQuestions,
						});
						setShowManualSelectionModal(false);
					}}
					initialSelection={editForm.selectedQuestions || []}
					questionBanks={questionBanks || []}
				/>
			)}
		</Modal>
	);
};

export default EditSurveyModal;
