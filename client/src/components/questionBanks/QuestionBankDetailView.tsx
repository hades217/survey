import React, { useState } from 'react';
import { useAdmin } from '../../contexts/AdminContext';
import { useQuestionBanks } from '../../hooks/useQuestionBanks';
import { QuestionBank, Question, QuestionForm } from '../../types/admin';
import AddQuestionModal from '../modals/AddQuestionModal';
import ImportCSVModal from '../modals/ImportCSVModal';
import ImportResultModal from '../modals/ImportResultModal';

interface QuestionBankDetailViewProps {
	questionBank: QuestionBank;
}

const QuestionBankDetailView: React.FC<QuestionBankDetailViewProps> = ({ questionBank }) => {
	const {
		setSelectedQuestionBankDetail,
		setQuestionBankDetailTab,
		navigate,
		questionBankQuestionForms,
		setQuestionBankQuestionForms,
		editingQuestionBankQuestions,
		setEditingQuestionBankQuestions,
		showEditQuestionBankModal,
		setShowEditQuestionBankModal,
		editQuestionBankForm,
		setEditQuestionBankForm,
		loading,
		setLoading,
		error,
		setError,
	} = useAdmin();

	const { addQuestionBankQuestion, deleteQuestionBankQuestion, updateQuestionBankQuestion } =
		useQuestionBanks();

	// Local state for question editing
	const [questionBankQuestionEditForms, setQuestionBankQuestionEditForms] = useState<
		Record<string, QuestionForm>
	>({});
	// Local state for add question modal
	const [showAddQuestionModal, setShowAddQuestionModal] = useState(false);
	// Local state for CSV import
	const [showImportCSVModal, setShowImportCSVModal] = useState(false);
	const [showImportResultModal, setShowImportResultModal] = useState(false);
	const [importResult, setImportResult] = useState<{
		success: boolean;
		message: string;
		imported: number;
		warnings?: string[];
		errors?: string[];
	} | null>(null);

	const qb = questionBank;
	const currentForm = questionBankQuestionForms[qb._id] || {
		text: '',
		options: ['', ''],
		type: 'single_choice' as const,
		correctAnswer: undefined,
		points: 1,
	};

	const handleQuestionBankBackToList = () => {
		setSelectedQuestionBankDetail(null);
		setQuestionBankDetailTab('list');
		navigate('/admin/question-banks');
	};

	// Question management functions
	const handleQuestionBankQuestionChange = (
		questionBankId: string,
		field: string,
		value: any
	) => {
		setQuestionBankQuestionForms(prev => {
			const currentForm = prev[questionBankId] || {
				text: '',
				options: ['', ''],
				type: 'single_choice' as const,
				correctAnswer: undefined,
				points: 1,
			};

			const updatedForm = { ...currentForm, [field]: value };

			// When changing type to short_text, clear options and correctAnswer
			if (field === 'type' && value === 'short_text') {
				updatedForm.options = [];
				updatedForm.correctAnswer = undefined;
			}
			// When changing from short_text to choice types, initialize options
			else if (
				field === 'type' &&
				(value === 'single_choice' || value === 'multiple_choice')
			) {
				updatedForm.options = ['', ''];
				updatedForm.correctAnswer = undefined;
			}

			return {
				...prev,
				[questionBankId]: updatedForm,
			};
		});
	};

	const addQuestionBankOption = (questionBankId: string) => {
		setQuestionBankQuestionForms(prev => {
			const currentForm = prev[questionBankId] || {
				text: '',
				options: ['', ''],
				type: 'single_choice',
			};
			return {
				...prev,
				[questionBankId]: {
					...currentForm,
					options: [...currentForm.options, ''],
				},
			};
		});
	};

	const removeQuestionBankOption = (questionBankId: string, index: number) => {
		setQuestionBankQuestionForms(prev => {
			const currentForm = prev[questionBankId] || {
				text: '',
				options: ['', ''],
				type: 'single_choice',
			};
			return {
				...prev,
				[questionBankId]: {
					...currentForm,
					options: currentForm.options.filter((_, i) => i !== index),
				},
			};
		});
	};

	const handleQuestionBankOptionChange = (
		questionBankId: string,
		index: number,
		value: string
	) => {
		setQuestionBankQuestionForms(prev => {
			const currentForm = prev[questionBankId] || {
				text: '',
				options: ['', ''],
				type: 'single_choice',
			};
			const newOptions = [...currentForm.options];
			newOptions[index] = value;
			return {
				...prev,
				[questionBankId]: {
					...currentForm,
					options: newOptions,
				},
			};
		});
	};

	// Question editing functions
	const startEditQuestionBankQuestion = (questionBankId: string, questionIndex: number) => {
		const question = qb.questions[questionIndex];
		const formKey = `${questionBankId}-${questionIndex}`;

		setQuestionBankQuestionEditForms(prev => ({
			...prev,
			[formKey]: {
				text: question.text,
				options: [...question.options],
				type: question.type || 'single_choice',
				correctAnswer: question.correctAnswer,
				points: question.points || 1,
			},
		}));

		setEditingQuestionBankQuestions(prev => ({
			...prev,
			[questionBankId]: questionIndex,
		}));
	};

	const cancelEditQuestionBankQuestion = (questionBankId: string) => {
		setEditingQuestionBankQuestions(prev => ({
			...prev,
			[questionBankId]: undefined,
		}));
	};

	const handleQuestionBankQuestionEditChange = (
		questionBankId: string,
		questionIndex: number,
		field: string,
		value: any
	) => {
		const formKey = `${questionBankId}-${questionIndex}`;
		setQuestionBankQuestionEditForms(prev => ({
			...prev,
			[formKey]: {
				...prev[formKey],
				[field]: value,
			},
		}));
	};

	const handleQuestionBankQuestionEditOptionChange = (
		questionBankId: string,
		questionIndex: number,
		optionIndex: number,
		value: string
	) => {
		const formKey = `${questionBankId}-${questionIndex}`;
		const currentForm = questionBankQuestionEditForms[formKey];
		if (currentForm) {
			const newOptions = [...currentForm.options];
			newOptions[optionIndex] = value;
			setQuestionBankQuestionEditForms(prev => ({
				...prev,
				[formKey]: {
					...currentForm,
					options: newOptions,
				},
			}));
		}
	};

	const addQuestionBankQuestionEditOption = (questionBankId: string, questionIndex: number) => {
		const formKey = `${questionBankId}-${questionIndex}`;
		const currentForm = questionBankQuestionEditForms[formKey];
		if (currentForm) {
			setQuestionBankQuestionEditForms(prev => ({
				...prev,
				[formKey]: {
					...currentForm,
					options: [...currentForm.options, ''],
				},
			}));
		}
	};

	const removeQuestionBankQuestionEditOption = (
		questionBankId: string,
		questionIndex: number,
		optionIndex: number
	) => {
		const formKey = `${questionBankId}-${questionIndex}`;
		const currentForm = questionBankQuestionEditForms[formKey];
		if (currentForm) {
			setQuestionBankQuestionEditForms(prev => ({
				...prev,
				[formKey]: {
					...currentForm,
					options: currentForm.options.filter((_, i) => i !== optionIndex),
				},
			}));
		}
	};

	const toggleQuestionBankCorrectAnswer = (
		questionBankId: string,
		questionIndex: number,
		optionIndex: number
	) => {
		const formKey = `${questionBankId}-${questionIndex}`;
		const currentForm = questionBankQuestionEditForms[formKey];
		if (currentForm) {
			const isCorrect = Array.isArray(currentForm.correctAnswer)
				? currentForm.correctAnswer.includes(optionIndex)
				: currentForm.correctAnswer === optionIndex;

			let newCorrectAnswer;
			if (currentForm.type === 'single_choice') {
				// Single choice: only one correct answer
				newCorrectAnswer = isCorrect ? undefined : optionIndex;
			} else {
				// Multiple choice: allow multiple correct answers
				if (isCorrect) {
					// Remove from correct answers
					if (Array.isArray(currentForm.correctAnswer)) {
						newCorrectAnswer = currentForm.correctAnswer.filter(i => i !== optionIndex);
						if (newCorrectAnswer.length === 0) newCorrectAnswer = undefined;
					} else {
						newCorrectAnswer = undefined;
					}
				} else {
					// Add to correct answers
					if (Array.isArray(currentForm.correctAnswer)) {
						newCorrectAnswer = [...currentForm.correctAnswer, optionIndex].sort(
							(a, b) => a - b
						);
					} else if (currentForm.correctAnswer !== undefined) {
						newCorrectAnswer = [currentForm.correctAnswer, optionIndex].sort(
							(a, b) => a - b
						);
					} else {
						newCorrectAnswer = [optionIndex];
					}
				}
			}

			setQuestionBankQuestionEditForms(prev => ({
				...prev,
				[formKey]: {
					...currentForm,
					correctAnswer: newCorrectAnswer,
				},
			}));
		}
	};

	const saveQuestionBankQuestionEdit = async (questionBankId: string, questionIndex: number) => {
		const formKey = `${questionBankId}-${questionIndex}`;
		const editForm = questionBankQuestionEditForms[formKey];

		if (!editForm) return;

		try {
			setLoading(true);
			await updateQuestionBankQuestion(questionBankId, questionIndex, editForm);

			setEditingQuestionBankQuestions(prev => ({
				...prev,
				[questionBankId]: undefined,
			}));

			setLoading(false);
		} catch (err) {
			setError('Failed to save question. Please try again.');
			setLoading(false);
		}
	};

	const addQuestionBankQuestionHandler = async (form: QuestionForm) => {
		try {
			setLoading(true);
			await addQuestionBankQuestion(qb._id, form);

			// Reset form and close modal
			setQuestionBankQuestionForms(prev => ({
				...prev,
				[qb._id]: {
					text: '',
					options: ['', ''],
					type: 'single_choice',
					correctAnswer: undefined,
					points: 1,
				},
			}));
			setShowAddQuestionModal(false);

			setLoading(false);
		} catch (err) {
			setError('Failed to add question. Please try again.');
			setLoading(false);
		}
	};

	// CSV import functions
	const handleCSVImport = async (file: File) => {
		try {
			setLoading(true);

			const formData = new FormData();
			formData.append('csvFile', file);

			const response = await fetch(`/api/question-banks/${qb._id}/import-csv`, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
				},
				body: formData,
			});

			const data = await response.json();

			if (response.ok) {
				// Update the question bank data
				if (data.questionBank) {
					// Trigger a refresh of the question bank data
					window.location.reload();
				}

				setImportResult({
					success: true,
					message: data.message,
					imported: data.imported,
					warnings: data.warnings,
				});
			} else {
				setImportResult({
					success: false,
					message: data.error || 'Import failed',
					imported: 0,
					errors: data.errors,
				});
			}

			setShowImportResultModal(true);
			setLoading(false);
		} catch (error) {
			console.error('CSV import error:', error);
			setImportResult({
				success: false,
				message: 'Network error occurred during import',
				imported: 0,
			});
			setShowImportResultModal(true);
			setLoading(false);
		}
	};

	const handleDownloadTemplate = () => {
		const link = document.createElement('a');
		link.href = '/api/question-banks/csv-template/download';
		link.setAttribute('download', 'question_bank_template.csv');
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	};

	return (
		<>
			<div className='space-y-4'>
				<div className='flex items-center gap-4'>
					<button onClick={handleQuestionBankBackToList} className='btn-secondary'>
						← Back to List
					</button>
					<h2 className='text-xl font-semibold text-gray-800'>
						Question Bank Detail: {qb.name}
					</h2>
				</div>

				<div className='card'>
					<div className='flex justify-between items-start mb-4'>
						<div className='flex-1'>
							<h3 className='text-xl font-bold text-gray-800 mb-2'>{qb.name}</h3>
							{qb.description && (
								<p className='text-gray-600 mb-3'>{qb.description}</p>
							)}
							<div className='flex items-center gap-4 text-sm text-gray-500'>
								<span>Questions: {qb.questions?.length || 0}</span>
								<span>Created: {new Date(qb.createdAt).toLocaleDateString()}</span>
							</div>
						</div>
						<div className='flex items-center gap-2'>
							<button
								className='btn-primary text-sm px-3 py-1'
								onClick={() => {
									setEditQuestionBankForm({
										name: qb.name,
										description: qb.description || '',
									});
									setShowEditQuestionBankModal(true);
								}}
							>
								Edit Question Bank
							</button>
						</div>
					</div>

					{/* Add New Question Button */}
					<div className='border-t border-gray-200 pt-4'>
						<div className='flex justify-between items-center'>
							<h4 className='font-semibold text-gray-800'>
								Questions ({qb.questions?.length || 0})
							</h4>
							<div className='flex gap-2'>
								<button
									className='btn-secondary text-sm'
									onClick={() => setShowImportCSVModal(true)}
									type='button'
									disabled={loading}
								>
									📄 导入 CSV
								</button>
								<button
									className='btn-primary text-sm'
									onClick={() => setShowAddQuestionModal(true)}
									type='button'
								>
									+ Add New Question
								</button>
							</div>
						</div>
					</div>

					{/* Questions List */}
					<div className='pt-4 mt-4'>
						{qb.questions && qb.questions.length > 0 ? (
							<div className='space-y-4'>
								{qb.questions.map((q, idx) => {
									const isEditing = editingQuestionBankQuestions[qb._id] === idx;
									const formKey = `${qb._id}-${idx}`;
									const editForm = questionBankQuestionEditForms[formKey];

									return (
										<div key={idx} className='bg-gray-50 rounded-lg p-4'>
											{isEditing ? (
												// Edit mode - similar to add form but for editing
												<div className='space-y-3'>
													<div>
														<label className='block text-sm font-medium text-gray-700 mb-2'>
															Question Text
														</label>
														<textarea
															className='input-field w-full'
															placeholder='Enter question text'
															value={editForm?.text || ''}
															onChange={e =>
																handleQuestionBankQuestionEditChange(
																	qb._id,
																	idx,
																	'text',
																	e.target.value
																)
															}
															rows={3}
														/>
													</div>

													<div>
														<label className='block text-sm font-medium text-gray-700 mb-2'>
															Question Type
														</label>
														<select
															className='input-field'
															value={
																editForm?.type || 'single_choice'
															}
															onChange={e =>
																handleQuestionBankQuestionEditChange(
																	qb._id,
																	idx,
																	'type',
																	e.target.value
																)
															}
														>
															<option value='single_choice'>
																Single Choice
															</option>
															<option value='multiple_choice'>
																Multiple Choice
															</option>
															<option value='short_text'>
																Short Text
															</option>
														</select>
													</div>

													<div>
														<div className='flex items-center justify-between mb-2'>
															<label className='block text-sm font-medium text-gray-700'>
																Options
															</label>
															<button
																className='btn-secondary text-sm'
																onClick={() =>
																	addQuestionBankQuestionEditOption(
																		qb._id,
																		idx
																	)
																}
																type='button'
															>
																+ Add Option
															</button>
														</div>
														{editForm?.options &&
															editForm.options.length > 0 && (
															<div className='space-y-2'>
																{editForm.options.map(
																	(option, optionIndex) => (
																		<div
																			key={optionIndex}
																			className='flex items-center gap-2'
																		>
																			<input
																				className='input-field flex-1'
																				placeholder={`Option ${optionIndex + 1}`}
																				value={option}
																				onChange={e =>
																					handleQuestionBankQuestionEditOptionChange(
																						qb._id,
																						idx,
																						optionIndex,
																						e.target
																							.value
																					)
																				}
																			/>
																			{editForm.options
																				.length > 2 && (
																				<button
																					className='px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors'
																					onClick={() =>
																						removeQuestionBankQuestionEditOption(
																							qb._id,
																							idx,
																							optionIndex
																						)
																					}
																					type='button'
																				>
																						Remove
																				</button>
																			)}
																		</div>
																	)
																)}
															</div>
														)}
													</div>

													{editForm?.options &&
														editForm.options.filter(opt => opt.trim())
															.length >= 2 && (
														<div>
															<label className='block text-sm font-medium text-gray-700 mb-2'>
																	Select Correct Answer(s)
															</label>
															<div className='space-y-2'>
																{editForm.options.map(
																	(opt, optIdx) => {
																		if (!opt.trim())
																			return null;
																		const isCorrect =
																				Array.isArray(
																					editForm.correctAnswer
																				)
																					? editForm.correctAnswer.includes(
																						optIdx
																					)
																					: editForm.correctAnswer ===
																						optIdx;
																		return (
																			<div
																				key={optIdx}
																				className='flex items-center gap-2'
																			>
																				<button
																					type='button'
																					onClick={() =>
																						toggleQuestionBankCorrectAnswer(
																							qb._id,
																							idx,
																							optIdx
																						)
																					}
																					className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
																						isCorrect
																							? 'bg-green-500 border-green-500 text-white'
																							: 'border-gray-300 hover:border-green-400'
																					}`}
																				>
																					{isCorrect && (
																						<svg
																							className='w-3 h-3'
																							fill='currentColor'
																							viewBox='0 0 20 20'
																						>
																							<path
																								fillRule='evenodd'
																								d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
																								clipRule='evenodd'
																							/>
																						</svg>
																					)}
																				</button>
																				<span className='text-sm text-gray-700'>
																					{opt ||
																							`Option ${optIdx + 1}`}
																				</span>
																			</div>
																		);
																	}
																)}
															</div>
														</div>
													)}

													<div>
														<label className='block text-sm font-medium text-gray-700 mb-2'>
															Points
														</label>
														<input
															type='number'
															className='input-field w-full'
															value={editForm?.points || ''}
															onChange={e =>
																handleQuestionBankQuestionEditChange(
																	qb._id,
																	idx,
																	'points',
																	e.target.value
																		? parseInt(e.target.value)
																		: 1
																)
															}
															min='1'
															max='100'
														/>
													</div>

													<div className='flex gap-2 pt-2'>
														<button
															className='btn-primary text-sm'
															onClick={() =>
																saveQuestionBankQuestionEdit(
																	qb._id,
																	idx
																)
															}
															type='button'
															disabled={
																!editForm?.text ||
																(editForm?.type !== 'short_text' &&
																	(!editForm?.options ||
																		editForm.options.filter(
																			opt => opt.trim()
																		).length < 2 ||
																		editForm.correctAnswer ===
																			undefined)) ||
																loading
															}
														>
															{loading ? 'Saving...' : 'Save'}
														</button>
														<button
															className='btn-secondary text-sm'
															onClick={() =>
																cancelEditQuestionBankQuestion(
																	qb._id
																)
															}
															type='button'
														>
															Cancel
														</button>
													</div>
												</div>
											) : (
												// Display mode
												<div>
													<div className='flex justify-between items-start mb-2'>
														<div className='flex-1'>
															<div className='flex items-center gap-2 mb-1'>
																<span className='font-medium text-gray-800'>
																	{idx + 1}. {q.text}
																</span>
																<span className='text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded'>
																	{q.type === 'multiple_choice'
																		? 'Multiple Choice'
																		: q.type === 'single_choice'
																			? 'Single Choice'
																			: 'Short Text'}
																</span>
																<span className='text-xs bg-green-100 text-green-800 px-2 py-1 rounded'>
																	{q.points || 1} pts
																</span>
															</div>
														</div>
														<div className='flex items-center gap-2'>
															<button
																className='btn-secondary text-sm px-3 py-1'
																onClick={() =>
																	startEditQuestionBankQuestion(
																		qb._id,
																		idx
																	)
																}
															>
																Edit
															</button>
															<button
																className='px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors'
																onClick={() =>
																	deleteQuestionBankQuestion(
																		qb._id,
																		idx
																	)
																}
															>
																Delete
															</button>
														</div>
													</div>
													<div className='text-sm text-gray-600 space-y-1'>
														{q.type === 'short_text' ? (
															<div>
																<div className='font-medium'>
																	Type: Text Response
																</div>
																{q.correctAnswer &&
																	typeof q.correctAnswer ===
																		'string' && (
																	<div className='pl-4 text-green-600 font-semibold'>
																			Expected Answer:{' '}
																		{q.correctAnswer}
																	</div>
																)}
															</div>
														) : (
															<div>
																<div className='font-medium'>
																	Options:
																</div>
																{q.options &&
																	q.options.map((opt, optIdx) => {
																		const isCorrect =
																			Array.isArray(
																				q.correctAnswer
																			)
																				? q.correctAnswer.includes(
																					optIdx
																				)
																				: q.correctAnswer ===
																					optIdx;
																		return (
																			<div
																				key={optIdx}
																				className={`flex items-center gap-2 pl-4 ${
																					isCorrect
																						? 'text-green-600 font-semibold'
																						: ''
																				}`}
																			>
																				{isCorrect && (
																					<svg
																						className='w-4 h-4'
																						fill='currentColor'
																						viewBox='0 0 20 20'
																					>
																						<path
																							fillRule='evenodd'
																							d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
																							clipRule='evenodd'
																						/>
																					</svg>
																				)}
																				<span>{opt}</span>
																			</div>
																		);
																	})}
															</div>
														)}
													</div>
												</div>
											)}
										</div>
									);
								})}
							</div>
						) : (
							<p className='text-gray-500 text-sm'>No questions added yet.</p>
						)}
					</div>
				</div>
			</div>

			{/* Add Question Modal */}
			<AddQuestionModal
				isOpen={showAddQuestionModal}
				onClose={() => setShowAddQuestionModal(false)}
				onSubmit={addQuestionBankQuestionHandler}
				form={currentForm}
				onChange={(field, value) => handleQuestionBankQuestionChange(qb._id, field, value)}
				onOptionChange={(index, value) =>
					handleQuestionBankOptionChange(qb._id, index, value)
				}
				onAddOption={() => addQuestionBankOption(qb._id)}
				onRemoveOption={index => removeQuestionBankOption(qb._id, index)}
				loading={loading}
			/>

			{/* Import CSV Modal */}
			<ImportCSVModal
				isOpen={showImportCSVModal}
				onClose={() => setShowImportCSVModal(false)}
				onImport={handleCSVImport}
				onDownloadTemplate={handleDownloadTemplate}
				loading={loading}
			/>

			{/* Import Result Modal */}
			<ImportResultModal
				isOpen={showImportResultModal}
				onClose={() => setShowImportResultModal(false)}
				result={importResult}
			/>
		</>
	);
};

export default QuestionBankDetailView;
