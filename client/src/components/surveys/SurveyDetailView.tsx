import React, { useState, useEffect } from 'react';
import { useAdmin } from '../../contexts/AdminContext';
import { useSurveys } from '../../hooks/useSurveys';
import { Survey, Question, QuestionForm, EnhancedStats } from '../../types/admin';
import QRCodeComponent from '../QRCode';
import AddSurveyQuestionModal from '../modals/AddSurveyQuestionModal';
import InviteAssessmentModal from '../modals/InviteAssessmentModal';
import api from '../../utils/axiosConfig';

interface SurveyDetailViewProps {
  survey: Survey;
}

const SurveyDetailView: React.FC<SurveyDetailViewProps> = ({ survey }) => {
	const { 
		setSelectedSurvey, 
		setTab, 
		navigate, 
		showQR, 
		setShowQR,
		copyToClipboard,
		questionForms,
		setQuestionForms,
		editingQuestions,
		setEditingQuestions,
		stats,
		setStats,
		statsView,
		setStatsView,
		setShowEditModal,
		setEditForm,
		setShowScoringModal,
		loading,
		setLoading,
		error,
		setError
	} = useAdmin();

  
	const { deleteSurvey, toggleSurveyStatus, addQuestion, updateQuestion, deleteQuestion, loadStats } = useSurveys();
  
	// Local state for question editing
	const [questionEditForms, setQuestionEditForms] = useState<Record<string, QuestionForm>>({});
	// Local state for add question modal
	const [showAddQuestionModal, setShowAddQuestionModal] = useState(false);
	const [showInviteModal, setShowInviteModal] = useState(false);
	const [tabLocal, setTabLocal] = useState<'detail' | 'invitations'>('detail');
	const [invitations, setInvitations] = useState<any[]>([]);
	const [loadingInvitations, setLoadingInvitations] = useState(false);
	const [page, setPage] = useState(1);
	const [search, setSearch] = useState('');
	const PAGE_SIZE = 10;

	// 加载邀请列表
	const loadInvitations = async () => {
		setLoadingInvitations(true);
		try {
			const res = await api.get(`/invitations/survey/${survey._id}`);
			setInvitations(res.data || []);
		} catch (err) {
			// ignore
		} finally {
			setLoadingInvitations(false);
		}
	};

	useEffect(() => {
		if (tabLocal === 'invitations') {
			loadInvitations();
		}
	}, [tabLocal, survey._id]);

	// 复制链接
	const handleCopy = (token: string) => {
		const url = `${window.location.origin}/assessment/${token}`;
		navigator.clipboard.writeText(url);
	};

	// 过滤和分页
	const filtered = invitations.filter(inv =>
		!search || (inv.targetEmails && inv.targetEmails.some((e: string) => e.includes(search)))
	);
	const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
	const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

	// 状态判断
	const getStatus = (inv: any) => {
		const now = new Date();
		if (inv.completedBy && inv.completedBy.length > 0) return { label: '已完成', color: 'green' };
		if (inv.expiresAt && new Date(inv.expiresAt) < now) return { label: '已过期', color: 'red' };
		return { label: '未填写', color: 'gray' };
	};

	// token 显示
	const maskToken = (token: string) => token ? token.slice(0, 6) + '****' + token.slice(-4) : '';

	const s = survey;
	const currentForm = questionForms[s._id] || { text: '', options: [], type: 'single_choice' as const };

	const handleBackToList = () => {
		setSelectedSurvey(null);
		setTab('list');
		navigate('/admin');
	};

	const openEditModal = (survey: Survey) => {
		setEditForm({
			title: survey.title,
			description: survey.description || '',
			slug: survey.slug,
			type: survey.type,
			questions: survey.questions || [],
			status: survey.status || 'draft',
			timeLimit: survey.timeLimit,
			maxAttempts: survey.maxAttempts || 1,
			instructions: survey.instructions || '',
			navigationMode: survey.navigationMode || 'step-by-step',
			sourceType: survey.sourceType || 'manual',
			questionBankId: survey.questionBankId,
			questionCount: survey.questionCount,
			scoringSettings: survey.scoringSettings || {
				scoringMode: 'percentage',
				totalPoints: 0,
				passingThreshold: 70,
				showScore: true,
				showCorrectAnswers: true,
				showScoreBreakdown: true,
				customScoringRules: {
					useCustomPoints: false,
					defaultQuestionPoints: 1,
				},
			},
		});
		setShowEditModal(true);
	};

	const getSurveyUrl = (slug: string) => {
		return `${window.location.origin}/survey/${slug}`;
	};

	const toggleQR = (surveyId: string) => {
		setShowQR(prev => ({
			...prev,
			[surveyId]: !prev[surveyId]
		}));
	};

	// Question management functions
	const handleQuestionChange = (surveyId: string, field: string, value: any) => {
		setQuestionForms(prev => {
			const currentForm = prev[surveyId] || {
				text: '',
				options: [],
				type: 'single_choice' as const,
				correctAnswer: undefined,
				points: undefined
			};
			
			const updatedForm = { ...currentForm, [field]: value };
			
			// When changing type to short_text, clear options and correctAnswer
			if (field === 'type' && value === 'short_text') {
				updatedForm.options = [];
				updatedForm.correctAnswer = undefined;
			}
			// When changing from short_text to choice types, initialize options
			else if (field === 'type' && (value === 'single_choice' || value === 'multiple_choice')) {
				updatedForm.options = ['', ''];
				updatedForm.correctAnswer = undefined;
			}
			
			return {
				...prev,
				[surveyId]: updatedForm
			};
		});
	};

	const addOption = (surveyId: string) => {
		setQuestionForms(prev => {
			const currentForm = prev[surveyId] || { text: '', options: [], type: 'single_choice', correctAnswer: undefined, points: undefined };
			return {
				...prev,
				[surveyId]: {
					...currentForm,
					options: [...(currentForm.options || []), '']
				}
			};
		});
	};

	const removeOption = (surveyId: string, index: number) => {
		setQuestionForms(prev => {
			const currentForm = prev[surveyId] || { text: '', options: [], type: 'single_choice', correctAnswer: undefined, points: undefined };
			return {
				...prev,
				[surveyId]: {
					...currentForm,
					options: (currentForm.options || []).filter((_, i) => i !== index)
				}
			};
		});
	};

	const handleOptionChange = (surveyId: string, index: number, value: string) => {
		setQuestionForms(prev => {
			const currentForm = prev[surveyId] || { text: '', options: [], type: 'single_choice', correctAnswer: undefined, points: undefined };
			const newOptions = [...(currentForm.options || [])];
			newOptions[index] = value;
			return {
				...prev,
				[surveyId]: {
					...currentForm,
					options: newOptions
				}
			};
		});
	};

	// Add question modal handler
	const addQuestionModalHandler = async (form: any) => {
		try {
			setLoading(true);
			
			// Prepare form data - don't send options for short_text
			const formData: any = {
				text: form.text,
				type: form.type
			};
			
			// Only add options for choice questions
			if (form.type !== 'short_text' && form.options) {
				formData.options = form.options;
			}
			
			// Add correctAnswer if provided
			if (form.correctAnswer !== undefined) {
				formData.correctAnswer = form.correctAnswer;
			}
			
			// Add points if provided
			if (form.points !== undefined) {
				formData.points = form.points;
			}
			
			await addQuestion(s._id, formData);
			
			// Reset form and close modal
			setQuestionForms(prev => ({
				...prev,
				[s._id]: { 
					text: '', 
					options: ['', ''], 
					type: 'single_choice' as const,
					correctAnswer: undefined,
					points: undefined
				}
			}));
			setShowAddQuestionModal(false);
			
			setLoading(false);
		} catch (err: any) {
			console.error('Add question error:', err);
			setError(err.response?.data?.error || 'Failed to add question. Please try again.');
			setLoading(false);
		}
	};

	// Question editing functions
	const startEditQuestion = (surveyId: string, questionIndex: number) => {
		const question = s.questions[questionIndex];
		const formKey = `${surveyId}-${questionIndex}`;
    
		setQuestionEditForms(prev => ({
			...prev,
			[formKey]: {
				text: question.text,
				type: question.type || 'single_choice',
				options: [...(question.options || [])],
				correctAnswer: question.correctAnswer,
				points: question.points
			}
		}));
    
		setEditingQuestions(prev => ({
			...prev,
			[surveyId]: questionIndex
		}));
	};

	const cancelEditQuestion = (surveyId: string) => {
		setEditingQuestions(prev => ({
			...prev,
			[surveyId]: undefined
		}));
	};

	const handleQuestionEditChange = (surveyId: string, questionIndex: number, field: string, value: any) => {
		const formKey = `${surveyId}-${questionIndex}`;
		setQuestionEditForms(prev => ({
			...prev,
			[formKey]: {
				...prev[formKey],
				[field]: value
			}
		}));
	};

	const handleQuestionEditOptionChange = (surveyId: string, questionIndex: number, optionIndex: number, value: string) => {
		const formKey = `${surveyId}-${questionIndex}`;
		const currentForm = questionEditForms[formKey];
		if (currentForm) {
			const newOptions = [...(currentForm.options || [])];
			newOptions[optionIndex] = value;
			setQuestionEditForms(prev => ({
				...prev,
				[formKey]: {
					...currentForm,
					options: newOptions
				}
			}));
		}
	};

	const addQuestionEditOption = (surveyId: string, questionIndex: number) => {
		const formKey = `${surveyId}-${questionIndex}`;
		const currentForm = questionEditForms[formKey];
		if (currentForm) {
			setQuestionEditForms(prev => ({
				...prev,
				[formKey]: {
					...currentForm,
					options: [...(currentForm.options || []), '']
				}
			}));
		}
	};

	const removeQuestionEditOption = (surveyId: string, questionIndex: number, optionIndex: number) => {
		const formKey = `${surveyId}-${questionIndex}`;
		const currentForm = questionEditForms[formKey];
		if (currentForm) {
			setQuestionEditForms(prev => ({
				...prev,
				[formKey]: {
					...currentForm,
					options: (currentForm.options || []).filter((_, i) => i !== optionIndex)
				}
			}));
		}
	};

	const toggleCorrectAnswer = (surveyId: string, questionIndex: number, optionIndex: number) => {
		const formKey = `${surveyId}-${questionIndex}`;
		const currentForm = questionEditForms[formKey];
		if (currentForm) {
			const isCorrect = Array.isArray(currentForm.correctAnswer)
				? currentForm.correctAnswer.includes(optionIndex)
				: currentForm.correctAnswer === optionIndex;

			let newCorrectAnswer;
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
					newCorrectAnswer = [...currentForm.correctAnswer, optionIndex].sort((a, b) => a - b);
				} else if (currentForm.correctAnswer !== undefined) {
					newCorrectAnswer = [currentForm.correctAnswer, optionIndex].sort((a, b) => a - b);
				} else {
					newCorrectAnswer = optionIndex;
				}
			}

			setQuestionEditForms(prev => ({
				...prev,
				[formKey]: {
					...currentForm,
					correctAnswer: newCorrectAnswer
				}
			}));
		}
	};

	const saveQuestionEdit = async (surveyId: string, questionIndex: number) => {
		const formKey = `${surveyId}-${questionIndex}`;
		const editForm = questionEditForms[formKey];
    
		if (!editForm) return;

		try {
			setLoading(true);
      
			// Update the question via API
			await updateQuestion(surveyId, questionIndex, editForm);
      
			// Clear editing state
			setEditingQuestions(prev => ({
				...prev,
				[surveyId]: undefined
			}));
			
			// Clear edit form
			setQuestionEditForms(prev => {
				const updated = { ...prev };
				delete updated[formKey];
				return updated;
			});
      
		} catch (err) {
			setError('Failed to save question. Please try again.');
		} finally {
			setLoading(false);
		}
	};

	return (
		<>
			<div className="space-y-4">
				<div className="flex items-center gap-4">
					<button onClick={handleBackToList} className="btn-secondary">
          ← Back to List
					</button>
					<h2 className="text-xl font-semibold text-gray-800">
          Survey Detail: {s.title}
					</h2>
					{s.type === 'assessment' && (
						<button
							className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded ml-4"
							onClick={() => setShowInviteModal(true)}
						>
							📧 邀请用户测评
						</button>
					)}
				</div>
				{/* Tab 切换 */}
				<div className="flex gap-4 border-b mb-4">
					<button
						className={`py-2 px-4 font-semibold border-b-2 transition-colors ${tabLocal === 'detail' ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-blue-600'}`}
						onClick={() => setTabLocal('detail')}
					>
						测评详情
					</button>
					{s.type === 'assessment' && (
						<button
							className={`py-2 px-4 font-semibold border-b-2 transition-colors ${tabLocal === 'invitations' ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-blue-600'}`}
							onClick={() => setTabLocal('invitations')}
						>
							已邀请用户
						</button>
					)}
				</div>
				{/* Tab 内容 */}
				{tabLocal === 'detail' && (
					<>
						<div className="card">
							<div className="flex justify-between items-start mb-4">
								<div className="flex-1">
									<div className="flex items-center gap-3 mb-2">
										<h3 className="text-xl font-bold text-gray-800">{s.title}</h3>
										<span
											className={`px-2 py-1 text-xs font-medium rounded-full ${
												s.type === 'assessment'
													? 'bg-blue-100 text-blue-800'
													: s.type === 'quiz'
														? 'bg-green-100 text-green-800'
														: s.type === 'iq'
															? 'bg-purple-100 text-purple-800'
															: 'bg-gray-100 text-gray-800'
											}`}
										>
											{s.type === 'assessment'
												? 'Assessment'
												: s.type === 'quiz'
													? 'Quiz'
													: s.type === 'iq'
														? 'IQ Test'
														: 'Survey'}
										</span>
										<span
											className={`px-2 py-1 text-xs font-medium rounded-full ${
												s.status === 'active' ? 'bg-green-100 text-green-800' : 
													s.status === 'draft' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
											}`}
										>
											{s.status === 'active' ? 'Active' : 
												s.status === 'draft' ? 'Draft' : 'Closed'}
										</span>
									</div>
									{s.description && <p className="text-gray-600 mb-3">{s.description}</p>}
								</div>
								<div className="flex items-center gap-2">
									<button
										className="btn-secondary text-sm px-3 py-1"
										onClick={() => openEditModal(s)}
									>
                  编辑
									</button>
								</div>
							</div>

							{/* Assessment Configuration Display */}
							{(s.timeLimit ||
								s.maxAttempts !== 1 ||
								s.instructions ||
								s.navigationMode !== 'step-by-step') && (
								<div className="bg-blue-50 rounded-lg p-3 mb-3">
									<h5 className="font-medium text-gray-800 mb-2">Assessment Configuration</h5>
									<div className="grid grid-cols-2 gap-2 text-sm">
										{s.timeLimit && (
											<div className="flex justify-between">
												<span className="text-gray-600">Time Limit:</span>
												<span className="font-medium text-blue-600">
													{s.timeLimit} minutes
												</span>
											</div>
										)}
										{s.maxAttempts !== 1 && (
											<div className="flex justify-between">
												<span className="text-gray-600">Max Attempts:</span>
												<span className="font-medium text-blue-600">
													{s.maxAttempts} times
												</span>
											</div>
										)}
										{s.navigationMode !== 'step-by-step' && (
											<div className="flex justify-between">
												<span className="text-gray-600">Navigation Mode:</span>
												<span className="font-medium text-blue-600">
													{s.navigationMode === 'paginated'
														? 'Paginated'
														: s.navigationMode === 'all-in-one'
															? 'All-in-one'
															: 'Step-by-step'}
												</span>
											</div>
										)}
									</div>
									{s.instructions && (
										<div className="mt-2 pt-2 border-t border-blue-200">
											<div className="text-xs text-gray-600 mb-1">
                      Special Instructions:
											</div>
											<div className="text-sm text-gray-700">{s.instructions}</div>
										</div>
									)}
								</div>
							)}

							{/* Scoring Settings Display */}
							{['quiz', 'assessment', 'iq'].includes(s.type) && s.scoringSettings && (
								<div className="bg-green-50 rounded-lg p-3 mb-3">
									<div className="flex items-center justify-between mb-2">
										<h5 className="font-medium text-gray-800">Scoring Rules</h5>
										<button
											className="text-sm text-blue-600 hover:text-blue-800"
											onClick={() => setShowScoringModal(true)}
										>
                      Edit Scoring Rules
										</button>
									</div>
									<div className="grid grid-cols-2 gap-2 text-sm">
										<div className="flex justify-between">
											<span className="text-gray-600">Scoring Mode:</span>
											<span className="font-medium text-green-600">
												{s.scoringSettings.scoringMode === 'percentage'
													? 'Percentage'
													: 'Accumulated'}
											</span>
										</div>
										<div className="flex justify-between">
											<span className="text-gray-600">Passing Threshold:</span>
											<span className="font-medium text-green-600">
												{s.scoringSettings.passingThreshold} points
											</span>
										</div>
										<div className="flex justify-between">
											<span className="text-gray-600">Total Score:</span>
											<span className="font-medium text-green-600">
												{s.scoringSettings.scoringMode === 'percentage'
													? '100'
													: s.scoringSettings.totalPoints}{' '}
                      points
											</span>
										</div>
										<div className="flex justify-between">
											<span className="text-gray-600">Custom Points:</span>
											<span className="font-medium text-green-600">
												{s.scoringSettings.customScoringRules?.useCustomPoints
													? 'Yes'
													: 'No'}
											</span>
										</div>
									</div>
								</div>
							)}

							{/* Question Source Display */}
							{s.sourceType === 'question_bank' && (
								<div className="bg-purple-50 rounded-lg p-3 mb-3">
									<h5 className="font-medium text-gray-800 mb-2">
                Question Bank Configuration
									</h5>
									<div className="grid grid-cols-2 gap-2 text-sm">
										<div className="flex justify-between">
											<span className="text-gray-600">Source:</span>
											<span className="font-medium text-purple-600">Question Bank</span>
										</div>
										<div className="flex justify-between">
											<span className="text-gray-600">Questions to Select:</span>
											<span className="font-medium text-purple-600">
												{s.questionCount} random
											</span>
										</div>
									</div>
								</div>
							)}

							<div className="text-sm text-gray-500">
              Created: {new Date(s.createdAt).toLocaleDateString()}
							</div>

							<div className="flex gap-2">
								<button
									className="btn-secondary text-sm"
									onClick={() => toggleSurveyStatus(s._id)}
								>
									{s.status === 'active' ? 'Deactivate' : 'Activate'}
								</button>
								<button
									className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors"
									onClick={() => deleteSurvey(s._id)}
								>
                Delete
								</button>
							</div>

							{/* Survey URLs */}
							<div className="bg-gray-50 rounded-lg p-4 mb-4">
								<div className="space-y-3">
									{s.type === 'assessment' ? (
										// Assessment type: only show enhanced URL
										<div className="flex items-center justify-between">
											<div>
												<label className="block text-sm font-medium text-gray-700 mb-1">
													增强版测评 URL
												</label>
												<div className="text-sm text-gray-600 font-mono">
													{getSurveyUrl(s.slug).replace('/survey/', '/assessment/')}
												</div>
											</div>
											<div className="flex gap-2">
												<button
													className="btn-secondary text-sm"
													onClick={() =>
														copyToClipboard(
															getSurveyUrl(s.slug).replace(
																'/survey/',
																'/assessment/'
															)
														)
													}
												>
													Copy URL
												</button>
												<button
													className="btn-primary text-sm"
													onClick={() => toggleQR(s._id)}
												>
													{showQR[s._id] ? 'Hide QR' : 'Show QR'}
												</button>
											</div>
										</div>
									) : (
										// Non-assessment types: show classic URL and optionally enhanced URL
										<>
											<div className="flex items-center justify-between">
												<div>
													<label className="block text-sm font-medium text-gray-700 mb-1">
													经典版 Survey URL
													</label>
													<div className="text-sm text-gray-600 font-mono">
														{getSurveyUrl(s.slug)}
													</div>
												</div>
												<div className="flex gap-2">
													<button
														className="btn-secondary text-sm"
														onClick={() => copyToClipboard(getSurveyUrl(s.slug))}
													>
														Copy URL
													</button>
													<button
														className="btn-primary text-sm"
														onClick={() => toggleQR(s._id)}
													>
														{showQR[s._id] ? 'Hide QR' : 'Show QR'}
													</button>
												</div>
											</div>

											{['quiz', 'iq'].includes(s.type) && (
												<div className="flex items-center justify-between pt-3 border-t border-gray-200">
													<div>
														<label className="block text-sm font-medium text-gray-700 mb-1">
															增强版测评 URL
														</label>
														<div className="text-sm text-gray-600 font-mono">
															{getSurveyUrl(s.slug).replace('/survey/', '/assessment/')}
														</div>
													</div>
													<div className="flex gap-2">
														<button
															className="btn-secondary text-sm"
															onClick={() =>
																copyToClipboard(
																	getSurveyUrl(s.slug).replace(
																		'/survey/',
																		'/assessment/'
																	)
																)
															}
														>
															Copy Enhanced URL
														</button>
													</div>
												</div>
											)}
										</>
									)}
								</div>
								{showQR[s._id] && (
									<div className="border-t border-gray-200 pt-4">
										<QRCodeComponent url={
											s.type === 'assessment' 
												? getSurveyUrl(s.slug).replace('/survey/', '/assessment/')
												: getSurveyUrl(s.slug)
										} />
									</div>
								)}
							</div>

							{/* Question Management */}
							{s.sourceType === 'manual' ? (
							// Manual Question Management
								<div className="mb-4">
									<div className="flex justify-between items-center mb-3">
										<h4 className="font-semibold text-gray-800">
											Questions ({s.questions?.length || 0})
										</h4>
										<button
											className="btn-primary text-sm"
											onClick={() => setShowAddQuestionModal(true)}
											type="button"
										>
											+ Add Question
										</button>
									</div>
									{s.questions && s.questions.length > 0 ? (
										<div className="space-y-2">
											{s.questions.map((q, idx) => {
												const isEditing = editingQuestions[s._id] === idx;
												const formKey = `${s._id}-${idx}`;
												const editForm = questionEditForms[formKey];

												return (
													<div key={idx} className="bg-gray-50 rounded-lg p-3">
														{isEditing ? (
														// Edit mode
															<div className="space-y-3">
																<div>
																	<label className="block text-sm font-medium text-gray-700 mb-2">
                              Question Text
																	</label>
																	<input
																		className="input-field w-full"
																		placeholder="Enter question text"
																		value={editForm?.text || ''}
																		onChange={e =>
																			handleQuestionEditChange(
																				s._id,
																				idx,
																				'text',
																				e.target.value
																			)
																		}
																	/>
																</div>
																<div>
																	<div className="flex items-center justify-between mb-2">
																		<label className="block text-sm font-medium text-gray-700">
                                Options
																		</label>
																		<button
																			className="btn-secondary text-sm"
																			onClick={() =>
																				addQuestionEditOption(
																					s._id,
																					idx
																				)
																			}
																			type="button"
																		>
                                + Add Option
																		</button>
																	</div>
																	{editForm?.options &&
                            editForm.options.length > 0 ? (
																			<div className="space-y-2">
																				{editForm.options.map(
																					(option, optionIndex) => (
																						<div
																							key={optionIndex}
																							className="flex items-center gap-2"
																						>
																							<input
																								className="input-field flex-1"
																								placeholder={`Option ${optionIndex + 1}`}
																								value={option}
																								onChange={e =>
																									handleQuestionEditOptionChange(
																										s._id,
																										idx,
																										optionIndex,
																										e.target
																											.value
																									)
																								}
																							/>
																							<button
																								className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors"
																								onClick={() =>
																									removeQuestionEditOption(
																										s._id,
																										idx,
																										optionIndex
																									)
																								}
																								type="button"
																							>
                                        Remove
																							</button>
																						</div>
																					)
																				)}
																			</div>
																		) : (
																			<div className="text-gray-500 text-sm p-3 border-2 border-dashed border-gray-300 rounded-lg text-center">
                                No options added yet. Click "Add
                                Option" to start.
																			</div>
																		)}
																</div>
																{['assessment', 'quiz', 'iq'].includes(
																	s.type
																) &&
                            editForm?.options &&
                            editForm.options.length > 0 && (
																	<div className="space-y-4">
																		<div>
																			<label className="block text-sm font-medium text-gray-700 mb-2">
                                  Select Correct Answer(s)
																			</label>
																			<div className="space-y-2">
																				{editForm.options.map(
																					(opt, optIdx) => {
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
																								className="flex items-center gap-2"
																							>
																								<button
																									type="button"
																									onClick={() =>
																										toggleCorrectAnswer(
																											s._id,
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
																											className="w-3 h-3"
																											fill="currentColor"
																											viewBox="0 0 20 20"
																										>
																											<path
																												fillRule="evenodd"
																												d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
																												clipRule="evenodd"
																											/>
																										</svg>
																									)}
																								</button>
																								<span className="text-sm text-gray-700">
																									{opt ||
                                              `Option ${optIdx + 1}`}
																								</span>
																							</div>
																						);
																					}
																				)}
																			</div>
																			<div className="text-xs text-gray-500 mt-1">
                                  Click the checkboxes to
                                  select multiple correct
                                  answers
																			</div>
																		</div>
																		{s.scoringSettings
																			?.customScoringRules
																			?.useCustomPoints && (
																			<div>
																				<label className="block text-sm font-medium text-gray-700 mb-2">
                                    Question Points
																				</label>
																				<input
																					type="number"
																					className="input-field w-full"
																					placeholder={`Default points: ${s.scoringSettings.customScoringRules.defaultQuestionPoints}`}
																					value={
																						editForm.points ||
                                        ''
																					}
																					onChange={e =>
																						handleQuestionEditChange(
																							s._id,
																							idx,
																							'points',
																							e.target.value
																								? parseInt(
																									e
																										.target
																										.value
																								)
																								: undefined
																						)
																					}
																					min="1"
																					max="100"
																				/>
																				<div className="text-xs text-gray-500 mt-1">
                                    Leave empty to use
                                    default points (
																					{
																						s.scoringSettings
																							.customScoringRules
																							.defaultQuestionPoints
																					}{' '}
                                    points)
																				</div>
																			</div>
																		)}
																	</div>
																)}
																<div className="flex gap-2 pt-2">
																	<button
																		className="btn-primary text-sm"
																		onClick={() =>
																			saveQuestionEdit(s._id, idx)
																		}
																		type="button"
																		disabled={
																			!editForm?.text ||
																		(editForm.type !== 'short_text' && (
																			!editForm?.options ||
																			editForm.options.filter(opt =>
																				opt.trim()
																			).length === 0
																		)) ||
																		([
																			'assessment',
																			'quiz',
																			'iq',
																		].includes(s.type) &&
																		editForm.type !== 'short_text' &&
																		editForm.correctAnswer === undefined)
																		}
																	>
                              Save
																	</button>
																	<button
																		className="btn-secondary text-sm"
																		onClick={() =>
																			cancelEditQuestion(s._id)
																		}
																		type="button"
																	>
                              Cancel
																	</button>
																</div>
															</div>
														) : (
														// Display mode
															<div>
																<div className="flex justify-between items-start mb-1">
																	<div className="flex-1">
																		<div className="flex items-center gap-2 mb-1">
																			<span className="font-medium text-gray-800">
																				{idx + 1}. {q.text}
																			</span>
																			<span className={`text-xs px-2 py-1 rounded ${
																				q.type === 'multiple_choice' ? 'bg-purple-100 text-purple-800' :
																					q.type === 'single_choice' ? 'bg-green-100 text-green-800' :
																						q.type === 'short_text' ? 'bg-orange-100 text-orange-800' :
																							'bg-gray-100 text-gray-800'
																			}`}>
																				{q.type === 'multiple_choice' ? 'Multiple Choice' :
																			 q.type === 'single_choice' ? 'Single Choice' :
																			 q.type === 'short_text' ? 'Short Text' :
																			 q.type || 'Single Choice'}
																			</span>
																		</div>
																	</div>
																	<div className="flex items-center gap-2">
																		{['assessment', 'quiz', 'iq'].includes(
																			s.type
																		) && (
																			<div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
																				{q.points || 1} pts
																			</div>
																		)}
																		<button
																			className="btn-secondary text-sm px-3 py-1"
																			onClick={() =>
																				startEditQuestion(s._id, idx)
																			}
																		>
                                Edit
																		</button>
																		<button
																			className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors"
																			onClick={() =>
																				deleteQuestion(s._id, idx)
																			}
																		>
                                Delete
																		</button>
																	</div>
																</div>
																{q.type === 'short_text' ? (
																	<div className="text-sm text-gray-600 mb-1">
																		<div className="font-medium">Type: Text Response</div>
																		{['assessment', 'quiz', 'iq'].includes(s.type) && 
																	 q.correctAnswer && typeof q.correctAnswer === 'string' && (
																			<div className="text-xs text-green-600 font-medium mt-1">
																			✓ Expected Answer: {q.correctAnswer}
																			</div>
																		)}
																	</div>
																) : (
																	<>
																		<div className="text-sm text-gray-600 mb-1">
																		Options:{' '}
																			{q.options && q.options.map((opt, optIdx) => {
																				const isCorrect = Array.isArray(
																					q.correctAnswer
																				)
																					? q.correctAnswer.includes(optIdx)
																					: q.correctAnswer === optIdx;
																				return (
																					<span
																						key={optIdx}
																						className={`${['assessment', 'quiz', 'iq'].includes(s.type) && isCorrect ? 'font-semibold text-green-600' : ''}`}
																					>
																						{opt}
																						{optIdx < (q.options?.length || 0) - 1
																							? ', '
																							: ''}
																					</span>
																				);
																			})}
																		</div>
																		{['assessment', 'quiz', 'iq'].includes(
																			s.type
																		) &&
																	q.correctAnswer !== undefined &&
																	q.type !== 'short_text' && (
																			<div className="text-xs text-green-600 font-medium">
																			✓ Correct Answer
																				{Array.isArray(q.correctAnswer) &&
																			q.correctAnswer.length > 1
																					? 's'
																					: ''}
																			:{' '}
																				{Array.isArray(q.correctAnswer)
																					? q.correctAnswer
																						.map(
																							idx =>
																								q.options?.[idx]
																						)
																						.join(', ')
																					: q.options?.[q.correctAnswer]}
																			</div>
																		)}
																	</>
																)}
															</div>
														)}
													</div>
												);
											})}
										</div>
									) : (
										<p className="text-gray-500 text-sm">No questions added yet.</p>
									)}

								</div>
							) : (
							// Question Bank Survey Information
								<div className="mb-4">
									<h4 className="font-semibold text-gray-800 mb-3">Question Bank Survey</h4>
									<div className="bg-purple-50 rounded-lg p-4">
										<div className="flex items-center justify-between mb-3">
											<div>
												<div className="font-medium text-gray-800">
                    Random Question Selection
												</div>
												<div className="text-sm text-gray-600">
                    This survey will randomly select {s.questionCount} questions
                    from the linked question bank for each student.
												</div>
											</div>
											<div className="text-lg font-bold text-purple-600">
												{s.questionCount} questions
											</div>
										</div>
										<div className="text-xs text-gray-500">
                💡 Questions are randomized per student to ensure assessment
                fairness
										</div>
									</div>
								</div>
							)}

							{/* Statistics Section */}
							<div className="border-t border-gray-200 pt-4">
								<div className="flex justify-between items-center mb-3">
									<h4 className="font-semibold text-gray-800">Statistics</h4>
									<button
										className="btn-secondary text-sm"
										onClick={() => loadStats(s._id)}
										type="button"
									>
                  View Statistics
									</button>
								</div>
								{stats && stats[s._id] && (
									<div className="space-y-4">
										{/* Statistics Summary */}
										<div className="bg-blue-50 rounded-lg p-4">
											<h5 className="font-semibold text-gray-800 mb-2">Summary</h5>
											<div className="grid grid-cols-3 gap-4 text-sm">
												<div className="text-center">
													<div className="font-bold text-blue-600 text-lg">
														{stats[s._id]?.summary?.totalResponses || 0}
													</div>
													<div className="text-gray-600">Total Responses</div>
												</div>
												<div className="text-center">
													<div className="font-bold text-green-600 text-lg">
														{stats[s._id]?.summary?.completionRate || 0}%
													</div>
													<div className="text-gray-600">Completion Rate</div>
												</div>
												<div className="text-center">
													<div className="font-bold text-purple-600 text-lg">
														{stats[s._id]?.summary?.totalQuestions || 0}
													</div>
													<div className="text-gray-600">Total Questions</div>
												</div>
											</div>
										</div>

										{/* Statistics View Toggle */}
										<div className="flex space-x-4 border-b border-gray-200 pb-2">
											<button
												className={`py-2 px-4 font-medium text-sm transition-colors ${
													statsView === 'aggregated'
														? 'text-blue-600 border-b-2 border-blue-600'
														: 'text-gray-500 hover:text-blue-600'
												}`}
												onClick={() => setStatsView('aggregated')}
											>
                      Aggregated Results
											</button>
											<button
												className={`py-2 px-4 font-medium text-sm transition-colors ${
													statsView === 'individual'
														? 'text-blue-600 border-b-2 border-blue-600'
														: 'text-gray-500 hover:text-blue-600'
												}`}
												onClick={() => setStatsView('individual')}
											>
                      Individual Responses ({stats[s._id]?.userResponses?.length || 0})
											</button>
										</div>

										{/* Aggregated Statistics */}
										{statsView === 'aggregated' && (
											<div className="space-y-4">
												{stats[s._id]?.aggregatedStats?.map((st, idx) => (
													<div key={idx} className="bg-gray-50 rounded-lg p-4">
														<div className="font-semibold text-gray-800 mb-2">
															{st.question}
														</div>
														<div className="space-y-2">
															{Object.entries(st.options).map(([opt, count]) => {
																const percentage =
                            stats[s._id]?.summary?.totalResponses > 0
                            	? (
                            		(count /
                                  stats[s._id].summary
                                  	.totalResponses) *
                                  100
                            	).toFixed(1)
                            	: 0;
																return (
																	<div
																		key={opt}
																		className="flex justify-between items-center"
																	>
																		<span className="text-gray-700">
																			{opt}
																		</span>
																		<div className="flex items-center gap-2">
																			<div className="w-20 bg-gray-200 rounded-full h-2">
																				<div
																					className="bg-blue-600 h-2 rounded-full transition-all duration-300"
																					style={{
																						width: `${percentage}%`,
																					}}
																				></div>
																			</div>
																			<span className="font-medium text-blue-600 text-sm w-12">
																				{count}
																			</span>
																			<span className="text-gray-500 text-xs w-12">
                                  ({percentage}%)
																			</span>
																		</div>
																	</div>
																);
															})}
														</div>
													</div>
												))}
											</div>
										)}

										{/* Individual User Responses */}
										{statsView === 'individual' && (
											<div className="space-y-4">
												{stats[s._id]?.userResponses?.length > 0 ? (
													stats[s._id].userResponses.map((response, idx) => (
														<div
															key={response._id}
															className="bg-gray-50 rounded-lg p-4"
														>
															<div className="flex justify-between items-start mb-3">
																<div>
																	<div className="font-semibold text-gray-800">
																		{response.name}
																	</div>
																	<div className="text-sm text-gray-500">
																		{response.email}
																	</div>
																</div>
																<div className="text-xs text-gray-500">
																	{new Date(
																		response.createdAt
																	).toLocaleDateString()}{' '}
																	{new Date(
																		response.createdAt
																	).toLocaleTimeString()}
																</div>
															</div>
															<div className="space-y-2">
																{Object.entries(response.answers).map(
																	([question, answer]) => (
																		<div
																			key={question}
																			className="border-l-4 border-blue-200 pl-3"
																		>
																			<div className="font-medium text-gray-700 text-sm">
																				{question}
																			</div>
																			<div
																				className={`text-sm ${answer === 'No answer' ? 'text-gray-400 italic' : 'text-gray-900'}`}
																			>
																				{answer}
																			</div>
																		</div>
																	)
																)}
															</div>
														</div>
													))
												) : (
													<div className="text-center py-8 text-gray-500">
														<p>No responses yet for this survey.</p>
													</div>
												)}
											</div>
										)}
									</div>
								)}
							</div>
						</div>
					</>
				)}
				{tabLocal === 'invitations' && (
					<div className="mt-4">
						<div className="flex justify-between items-center mb-2">
							<div className="font-medium text-gray-800">已邀请用户列表</div>
							<input
								className="border rounded px-2 py-1 text-sm"
								placeholder="搜索邮箱"
								value={search}
								onChange={e => { setSearch(e.target.value); setPage(1); }}
								style={{ width: 180 }}
							/>
						</div>
						<div className="overflow-x-auto">
							<table className="min-w-full text-sm border">
								<thead>
									<tr className="bg-gray-100">
										<th className="px-2 py-1 border">Email</th>
										<th className="px-2 py-1 border">Token</th>
										<th className="px-2 py-1 border">邀请时间</th>
										<th className="px-2 py-1 border">有效期</th>
										<th className="px-2 py-1 border">状态</th>
										<th className="px-2 py-1 border">操作</th>
									</tr>
								</thead>
								<tbody>
									{loadingInvitations ? (
										<tr><td colSpan={6} className="text-center py-4">加载中...</td></tr>
									) : paged.length === 0 ? (
										<tr><td colSpan={6} className="text-center py-4">暂无邀请</td></tr>
									) : paged.map(inv => {
										const status = getStatus(inv);
										return (
											<tr key={inv._id}>
												<td className="px-2 py-1 border">{inv.targetEmails?.[0]}</td>
												<td className="px-2 py-1 border font-mono">{maskToken(inv.invitationCode)}</td>
												<td className="px-2 py-1 border">{inv.createdAt ? new Date(inv.createdAt).toLocaleString() : ''}</td>
												<td className="px-2 py-1 border">{inv.expiresAt ? new Date(inv.expiresAt).toLocaleDateString() : '永久'}</td>
												<td className="px-2 py-1 border">
													<span className={`px-2 py-1 rounded text-xs font-bold bg-${status.color}-100 text-${status.color}-700`}>
														{status.label}
													</span>
												</td>
												<td className="px-2 py-1 border space-x-2">
													<button className="text-blue-600 hover:underline" onClick={() => handleCopy(inv.invitationCode)}>复制链接</button>
													{/* 可扩展：重新发送/删除邀请 */}
												</td>
											</tr>
										);
									})}
								</tbody>
							</table>
						</div>
						{/* 分页 */}
						{totalPages > 1 && (
							<div className="flex justify-center items-center gap-2 mt-2">
								<button disabled={page === 1} onClick={() => setPage(page - 1)} className="px-2 py-1 border rounded disabled:opacity-50">上一页</button>
								<span>第 {page} / {totalPages} 页</span>
								<button disabled={page === totalPages} onClick={() => setPage(page + 1)} className="px-2 py-1 border rounded disabled:opacity-50">下一页</button>
							</div>
						)}
					</div>
				)}
				<InviteAssessmentModal
					show={showInviteModal}
					onClose={() => setShowInviteModal(false)}
					surveyId={survey._id}
					surveyTitle={survey.title}
				/>

				{/* Add Question Modal */}
				<AddSurveyQuestionModal
					isOpen={showAddQuestionModal}
					onClose={() => setShowAddQuestionModal(false)}
					onSubmit={addQuestionModalHandler}
					form={currentForm}
					onChange={(field, value) => handleQuestionChange(s._id, field, value)}
					onOptionChange={(index, value) => handleOptionChange(s._id, index, value)}
					onAddOption={() => addOption(s._id)}
					onRemoveOption={(index) => removeOption(s._id, index)}
					loading={loading}
					surveyType={s.type}
					isCustomScoringEnabled={s.scoringSettings?.customScoringRules?.useCustomPoints}
					defaultQuestionPoints={s.scoringSettings?.customScoringRules?.defaultQuestionPoints || 1}
				/>
			</div>
		</>
	);
};

export default SurveyDetailView;