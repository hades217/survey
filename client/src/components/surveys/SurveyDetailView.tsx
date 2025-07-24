import React, { useState, useEffect } from 'react';
import { useAdmin } from '../../contexts/AdminContext';
import { useSurveys } from '../../hooks/useSurveys';
import { Survey, Question, QuestionForm, EnhancedStats } from '../../types/admin';
import QRCodeComponent from '../QRCode';
import AddSurveyQuestionModal from '../modals/AddSurveyQuestionModal';
import InviteAssessmentModal from '../modals/InviteAssessmentModal';
import { StatisticsFilter } from './StatisticsFilter';
import api from '../../utils/axiosConfig';
import {
	SURVEY_TYPE,
	SURVEY_STATUS,
	QUESTION_TYPE,
	TAB_TYPES,
	STATS_VIEW,
	SOURCE_TYPE,
	NAVIGATION_MODE,
	SCORING_MODE,
	TYPES_REQUIRING_ANSWERS,
} from '../../constants';

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
		setError,
	} = useAdmin();

	const {
		deleteSurvey,
		toggleSurveyStatus,
		addQuestion,
		updateQuestion,
		deleteQuestion,
		loadStats,
	} = useSurveys();

	// Local state for question editing
	const [questionEditForms, setQuestionEditForms] = useState<Record<string, QuestionForm>>({});
	// Local state for add question modal
	const [showAddQuestionModal, setShowAddQuestionModal] = useState(false);
	const [showInviteModal, setShowInviteModal] = useState(false);
	const [tabLocal, setTabLocal] = useState<'detail' | 'invitations' | 'statistics'>(
		TAB_TYPES.DETAIL
	);
	const [invitations, setInvitations] = useState<any[]>([]);
	const [loadingInvitations, setLoadingInvitations] = useState(false);
	const [page, setPage] = useState(1);
	const [search, setSearch] = useState('');
	const [filterLoading, setFilterLoading] = useState(false);
	const [responsePage, setResponsePage] = useState(1);
	const PAGE_SIZE = 10;
	const RESPONSE_PAGE_SIZE = 5;

	// Handle statistics filter
	const handleStatisticsFilter = async (filters: {
		name?: string;
		email?: string;
		fromDate?: string;
		toDate?: string;
		status?: string;
	}) => {
		setFilterLoading(true);
		setResponsePage(1); // Reset pagination when applying filters
		try {
			await loadStats(survey._id, filters);
		} finally {
			setFilterLoading(false);
		}
	};

	// Load initial statistics with default filter (last 30 days)
	useEffect(() => {
		if (tabLocal === TAB_TYPES.STATISTICS && survey._id) {
			const today = new Date();
			const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
			
			handleStatisticsFilter({
				fromDate: thirtyDaysAgo.toISOString().split('T')[0],
				toDate: today.toISOString().split('T')[0],
			});
		}
	}, [tabLocal, survey._id]);

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
		if (tabLocal === TAB_TYPES.INVITATIONS) {
			loadInvitations();
		} else if (tabLocal === TAB_TYPES.STATISTICS) {
			loadStats(survey._id);
		}
	}, [tabLocal, survey._id]);

	// 复制链接
	const handleCopy = (token: string) => {
		const url = `${window.location.origin}/assessment/${token}`;
		navigator.clipboard.writeText(url);
	};

	// 过滤和分页
	const filtered = invitations.filter(
		inv =>
			!search ||
			(inv.targetEmails && inv.targetEmails.some((e: string) => e.includes(search)))
	);
	const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
	const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

	// 状态判断
	const getStatus = (inv: any) => {
		const now = new Date();
		if (inv.completedBy && inv.completedBy.length > 0)
			return { label: '已完成', color: 'green' };
		if (inv.expiresAt && new Date(inv.expiresAt) < now)
			return { label: '已过期', color: 'red' };
		return { label: '未填写', color: 'gray' };
	};

	// token 显示
	const maskToken = (token: string) =>
		token ? token.slice(0, 6) + '****' + token.slice(-4) : '';

	const s = survey;
	const currentForm = questionForms[s._id] || {
		text: '',
		options: [],
		type: QUESTION_TYPE.SINGLE_CHOICE,
	};

	const handleBackToList = () => {
		setSelectedSurvey(null);
		setTab(TAB_TYPES.LIST);
		navigate('/admin');
	};

	const openEditModal = (survey: Survey) => {
		setEditForm({
			title: survey.title,
			description: survey.description || '',
			slug: survey.slug,
			type: survey.type,
			questions: survey.questions || [],
			status: survey.status || SURVEY_STATUS.DRAFT,
			timeLimit: survey.timeLimit,
			maxAttempts: survey.maxAttempts || 1,
			instructions: survey.instructions || '',
			navigationMode: survey.navigationMode || NAVIGATION_MODE.STEP_BY_STEP,
			sourceType: survey.sourceType || SOURCE_TYPE.MANUAL,
			questionBankId: survey.questionBankId,
			questionCount: survey.questionCount,
			multiQuestionBankConfig: survey.multiQuestionBankConfig || [],
			selectedQuestions: survey.selectedQuestions || [],
			scoringSettings: survey.scoringSettings || {
				scoringMode: SCORING_MODE.PERCENTAGE,
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
			[surveyId]: !prev[surveyId],
		}));
	};

	// Question management functions
	const handleQuestionChange = (surveyId: string, field: string, value: any) => {
		setQuestionForms(prev => {
			const currentForm = prev[surveyId] || {
				text: '',
				options: [],
				type: QUESTION_TYPE.SINGLE_CHOICE,
				correctAnswer: undefined,
				points: undefined,
			};

			const updatedForm = { ...currentForm, [field]: value };

			// When changing type to short_text, clear options and correctAnswer
			if (field === 'type' && value === QUESTION_TYPE.SHORT_TEXT) {
				updatedForm.options = [];
				updatedForm.correctAnswer = undefined;
			}
			// When changing from short_text to choice types, initialize options
			else if (
				field === 'type' &&
				(value === QUESTION_TYPE.SINGLE_CHOICE || value === QUESTION_TYPE.MULTIPLE_CHOICE)
			) {
				updatedForm.options = ['', ''];
				updatedForm.correctAnswer = undefined;
			}

			return {
				...prev,
				[surveyId]: updatedForm,
			};
		});
	};

	const addOption = (surveyId: string) => {
		setQuestionForms(prev => {
			const currentForm = prev[surveyId] || {
				text: '',
				options: [],
				type: QUESTION_TYPE.SINGLE_CHOICE,
				correctAnswer: undefined,
				points: undefined,
			};
			return {
				...prev,
				[surveyId]: {
					...currentForm,
					options: [...(currentForm.options || []), ''],
				},
			};
		});
	};

	const removeOption = (surveyId: string, index: number) => {
		setQuestionForms(prev => {
			const currentForm = prev[surveyId] || {
				text: '',
				options: [],
				type: QUESTION_TYPE.SINGLE_CHOICE,
				correctAnswer: undefined,
				points: undefined,
			};
			return {
				...prev,
				[surveyId]: {
					...currentForm,
					options: (currentForm.options || []).filter((_, i) => i !== index),
				},
			};
		});
	};

	const handleOptionChange = (surveyId: string, index: number, value: string) => {
		setQuestionForms(prev => {
			const currentForm = prev[surveyId] || {
				text: '',
				options: [],
				type: QUESTION_TYPE.SINGLE_CHOICE,
				correctAnswer: undefined,
				points: undefined,
			};
			const newOptions = [...(currentForm.options || [])];
			newOptions[index] = value;
			return {
				...prev,
				[surveyId]: {
					...currentForm,
					options: newOptions,
				},
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
				type: form.type,
			};

			// Only add options for choice questions
			if (form.type !== QUESTION_TYPE.SHORT_TEXT && form.options) {
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
					type: QUESTION_TYPE.SINGLE_CHOICE,
					correctAnswer: undefined,
					points: undefined,
				},
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

		// Determine question type - if no options exist, it's likely a short text question
		let questionType = question.type;
		if (!questionType) {
			if (!question.options || question.options.length === 0) {
				questionType = QUESTION_TYPE.SHORT_TEXT;
			} else {
				questionType = QUESTION_TYPE.SINGLE_CHOICE;
			}
		}

		setQuestionEditForms(prev => ({
			...prev,
			[formKey]: {
				text: question.text,
				type: questionType,
				options: [...(question.options || [])],
				correctAnswer: question.correctAnswer,
				points: question.points,
			},
		}));

		setEditingQuestions(prev => ({
			...prev,
			[surveyId]: questionIndex,
		}));
	};

	const cancelEditQuestion = (surveyId: string) => {
		setEditingQuestions(prev => ({
			...prev,
			[surveyId]: undefined,
		}));
	};

	const handleQuestionEditChange = (
		surveyId: string,
		questionIndex: number,
		field: string,
		value: any
	) => {
		const formKey = `${surveyId}-${questionIndex}`;
		setQuestionEditForms(prev => {
			const currentForm = prev[formKey];
			const updatedForm = { ...currentForm, [field]: value };

			// When changing type to short_text, clear options and correctAnswer
			if (field === 'type' && value === QUESTION_TYPE.SHORT_TEXT) {
				updatedForm.options = [];
				updatedForm.correctAnswer = undefined;
			}
			// When changing from short_text to choice types, initialize options
			else if (
				field === 'type' &&
				(value === QUESTION_TYPE.SINGLE_CHOICE || value === QUESTION_TYPE.MULTIPLE_CHOICE)
			) {
				updatedForm.options = ['', ''];
				updatedForm.correctAnswer = undefined;
			}

			return {
				...prev,
				[formKey]: updatedForm,
			};
		});
	};

	const handleQuestionEditOptionChange = (
		surveyId: string,
		questionIndex: number,
		optionIndex: number,
		value: string
	) => {
		const formKey = `${surveyId}-${questionIndex}`;
		const currentForm = questionEditForms[formKey];
		if (currentForm) {
			const newOptions = [...(currentForm.options || [])];
			newOptions[optionIndex] = value;
			setQuestionEditForms(prev => ({
				...prev,
				[formKey]: {
					...currentForm,
					options: newOptions,
				},
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
					options: [...(currentForm.options || []), ''],
				},
			}));
		}
	};

	const removeQuestionEditOption = (
		surveyId: string,
		questionIndex: number,
		optionIndex: number
	) => {
		const formKey = `${surveyId}-${questionIndex}`;
		const currentForm = questionEditForms[formKey];
		if (currentForm) {
			setQuestionEditForms(prev => ({
				...prev,
				[formKey]: {
					...currentForm,
					options: (currentForm.options || []).filter((_, i) => i !== optionIndex),
				},
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
					newCorrectAnswer = [...currentForm.correctAnswer, optionIndex].sort(
						(a, b) => a - b
					);
				} else if (currentForm.correctAnswer !== undefined) {
					newCorrectAnswer = [currentForm.correctAnswer, optionIndex].sort(
						(a, b) => a - b
					);
				} else {
					newCorrectAnswer = optionIndex;
				}
			}

			setQuestionEditForms(prev => ({
				...prev,
				[formKey]: {
					...currentForm,
					correctAnswer: newCorrectAnswer,
				},
			}));
		}
	};

	const saveQuestionEdit = async (surveyId: string, questionIndex: number) => {
		const formKey = `${surveyId}-${questionIndex}`;
		const editForm = questionEditForms[formKey];

		if (!editForm) return;

		try {
			setLoading(true);

			// Prepare the data for the API call (PATCH method - only send necessary fields)
			const updateData: any = {
				text: editForm.text,
				type: editForm.type,
			};

			// Only include options for non-short-text questions
			if (editForm.type !== QUESTION_TYPE.SHORT_TEXT) {
				updateData.options = editForm.options || [];
				// Include correctAnswer if it exists
				if (editForm.correctAnswer !== undefined) {
					updateData.correctAnswer = editForm.correctAnswer;
				}
			} else {
				// For short text, only include correctAnswer if it's a non-empty string
				if (editForm.correctAnswer && typeof editForm.correctAnswer === 'string' && editForm.correctAnswer.trim()) {
					updateData.correctAnswer = editForm.correctAnswer;
				}
			}

			// Include points if defined
			if (editForm.points !== undefined) {
				updateData.points = editForm.points;
			}

			// Update the question via API
			await updateQuestion(surveyId, questionIndex, updateData);

			// Clear editing state
			setEditingQuestions(prev => ({
				...prev,
				[surveyId]: undefined,
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
			<div className='space-y-4'>
				<div className='flex items-center gap-4'>
					<button onClick={handleBackToList} className='btn-secondary'>
						← Back to List
					</button>
					<h2 className='text-xl font-semibold text-gray-800'>
						Survey Detail: {s.title}
					</h2>
					{s.type === SURVEY_TYPE.ASSESSMENT && (
						<button
							className='bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded ml-4'
							onClick={() => setShowInviteModal(true)}
						>
							📧 邀请用户测评
						</button>
					)}
				</div>
				{/* Tab 切换 */}
				<div className='flex gap-4 border-b mb-4'>
					<button
						className={`py-2 px-4 font-semibold border-b-2 transition-colors ${tabLocal === TAB_TYPES.DETAIL ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-blue-600'}`}
						onClick={() => setTabLocal(TAB_TYPES.DETAIL)}
					>
						测评详情
					</button>
					{s.type === SURVEY_TYPE.ASSESSMENT && (
						<button
							className={`py-2 px-4 font-semibold border-b-2 transition-colors ${tabLocal === TAB_TYPES.INVITATIONS ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-blue-600'}`}
							onClick={() => setTabLocal(TAB_TYPES.INVITATIONS)}
						>
							已邀请用户
						</button>
					)}
					<button
						className={`py-2 px-4 font-semibold border-b-2 transition-colors ${tabLocal === TAB_TYPES.STATISTICS ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-blue-600'}`}
						onClick={() => setTabLocal(TAB_TYPES.STATISTICS)}
					>
						统计数据
					</button>
				</div>
				{/* Tab 内容 */}
				{tabLocal === TAB_TYPES.DETAIL && (
					<>
						<div className='card'>
							<div className='flex justify-between items-start mb-4'>
								<div className='flex-1'>
									<div className='flex items-center gap-3 mb-2'>
										<h3 className='text-xl font-bold text-gray-800'>
											{s.title}
										</h3>
										<span
											className={`px-2 py-1 text-xs font-medium rounded-full ${
												s.type === SURVEY_TYPE.ASSESSMENT
													? 'bg-blue-100 text-blue-800'
													: s.type === SURVEY_TYPE.QUIZ
														? 'bg-green-100 text-green-800'
														: s.type === SURVEY_TYPE.IQ
															? 'bg-purple-100 text-purple-800'
															: 'bg-gray-100 text-gray-800'
											}`}
										>
											{s.type === SURVEY_TYPE.ASSESSMENT
												? 'Assessment'
												: s.type === SURVEY_TYPE.QUIZ
													? 'Quiz'
													: s.type === SURVEY_TYPE.IQ
														? 'IQ Test'
														: 'Survey'}
										</span>
										<span
											className={`px-2 py-1 text-xs font-medium rounded-full ${
												s.status === SURVEY_STATUS.ACTIVE
													? 'bg-green-100 text-green-800'
													: s.status === SURVEY_STATUS.DRAFT
														? 'bg-yellow-100 text-yellow-800'
														: 'bg-red-100 text-red-800'
											}`}
										>
											{s.status === SURVEY_STATUS.ACTIVE
												? 'Active'
												: s.status === SURVEY_STATUS.DRAFT
													? 'Draft'
													: 'Closed'}
										</span>
									</div>
									{s.description && (
										<p className='text-gray-600 mb-3'>{s.description}</p>
									)}
								</div>
								<div className='flex items-center gap-2'>
									<button
										className='btn-secondary text-sm px-3 py-1'
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
								s.navigationMode !== NAVIGATION_MODE.STEP_BY_STEP) && (
								<div className='bg-blue-50 rounded-lg p-3 mb-3'>
									<h5 className='font-medium text-gray-800 mb-2'>
										Assessment Configuration
									</h5>
									<div className='grid grid-cols-2 gap-2 text-sm'>
										{s.timeLimit && (
											<div className='flex justify-between'>
												<span className='text-gray-600'>Time Limit:</span>
												<span className='font-medium text-blue-600'>
													{s.timeLimit} minutes
												</span>
											</div>
										)}
										{s.maxAttempts !== 1 && (
											<div className='flex justify-between'>
												<span className='text-gray-600'>Max Attempts:</span>
												<span className='font-medium text-blue-600'>
													{s.maxAttempts} times
												</span>
											</div>
										)}
										{s.navigationMode !== NAVIGATION_MODE.STEP_BY_STEP && (
											<div className='flex justify-between'>
												<span className='text-gray-600'>
													Navigation Mode:
												</span>
												<span className='font-medium text-blue-600'>
													{s.navigationMode === NAVIGATION_MODE.PAGINATED
														? 'Paginated'
														: s.navigationMode ===
															  NAVIGATION_MODE.ALL_IN_ONE
															? 'All-in-one'
															: 'Step-by-step'}
												</span>
											</div>
										)}
									</div>
									{s.instructions && (
										<div className='mt-2 pt-2 border-t border-blue-200'>
											<div className='text-xs text-gray-600 mb-1'>
												Special Instructions:
											</div>
											<div className='text-sm text-gray-700'>
												{s.instructions}
											</div>
										</div>
									)}
								</div>
							)}

							{/* Scoring Settings Display */}
							{TYPES_REQUIRING_ANSWERS.includes(s.type as any) &&
								s.scoringSettings && (
								<div className='bg-green-50 rounded-lg p-3 mb-3'>
									<div className='flex items-center justify-between mb-2'>
										<h5 className='font-medium text-gray-800'>
												Scoring Rules
										</h5>
										<button
											className='text-sm text-blue-600 hover:text-blue-800'
											onClick={() => setShowScoringModal(true)}
										>
												Edit Scoring Rules
										</button>
									</div>
									<div className='grid grid-cols-2 gap-2 text-sm'>
										<div className='flex justify-between'>
											<span className='text-gray-600'>Scoring Mode:</span>
											<span className='font-medium text-green-600'>
												{s.scoringSettings.scoringMode ===
													SCORING_MODE.PERCENTAGE
													? 'Percentage'
													: 'Accumulated'}
											</span>
										</div>
										<div className='flex justify-between'>
											<span className='text-gray-600'>
													Passing Threshold:
											</span>
											<span className='font-medium text-green-600'>
												{s.scoringSettings.passingThreshold} points
											</span>
										</div>
										<div className='flex justify-between'>
											<span className='text-gray-600'>Total Score:</span>
											<span className='font-medium text-green-600'>
												{s.scoringSettings.scoringMode ===
													SCORING_MODE.PERCENTAGE
													? '100'
													: s.scoringSettings.totalPoints}{' '}
													points
											</span>
										</div>
										<div className='flex justify-between'>
											<span className='text-gray-600'>
													Custom Points:
											</span>
											<span className='font-medium text-green-600'>
												{s.scoringSettings.customScoringRules
													?.useCustomPoints
													? 'Yes'
													: 'No'}
											</span>
										</div>
									</div>
								</div>
							)}

							{/* Question Source Display */}
							{s.sourceType === SOURCE_TYPE.QUESTION_BANK && (
								<div className='bg-purple-50 rounded-lg p-3 mb-3'>
									<h5 className='font-medium text-gray-800 mb-2'>
										Question Bank Configuration
									</h5>
									<div className='grid grid-cols-2 gap-2 text-sm'>
										<div className='flex justify-between'>
											<span className='text-gray-600'>Source:</span>
											<span className='font-medium text-purple-600'>
												Question Bank
											</span>
										</div>
										<div className='flex justify-between'>
											<span className='text-gray-600'>
												Questions to Select:
											</span>
											<span className='font-medium text-purple-600'>
												{s.questionCount} random
											</span>
										</div>
									</div>
								</div>
							)}

							<div className='text-sm text-gray-500'>
								Created: {new Date(s.createdAt).toLocaleDateString()}
							</div>

							<div className='flex gap-2'>
								<button
									className='btn-secondary text-sm'
									onClick={() => toggleSurveyStatus(s._id)}
								>
									{s.status === SURVEY_STATUS.ACTIVE ? 'Deactivate' : 'Activate'}
								</button>
								<button
									className='px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors'
									onClick={() => deleteSurvey(s._id)}
								>
									Delete
								</button>
							</div>

							{/* Survey URLs */}
							<div className='bg-gray-50 rounded-lg p-4 mb-4'>
								<div className='space-y-3'>
									{s.type === SURVEY_TYPE.ASSESSMENT ? (
										// Assessment type: only show enhanced URL
										<div className='flex items-center justify-between'>
											<div>
												<label className='block text-sm font-medium text-gray-700 mb-1'>
													增强版测评 URL
												</label>
												<div className='text-sm text-gray-600 font-mono'>
													{getSurveyUrl(s.slug).replace(
														'/survey/',
														'/assessment/'
													)}
												</div>
											</div>
											<div className='flex gap-2'>
												<button
													className='btn-secondary text-sm'
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
													className='btn-primary text-sm'
													onClick={() => toggleQR(s._id)}
												>
													{showQR[s._id] ? 'Hide QR' : 'Show QR'}
												</button>
											</div>
										</div>
									) : (
										// Non-assessment types: show classic URL and optionally enhanced URL
										<>
											<div className='flex items-center justify-between'>
												<div>
													<label className='block text-sm font-medium text-gray-700 mb-1'>
														经典版 Survey URL
													</label>
													<div className='text-sm text-gray-600 font-mono'>
														{getSurveyUrl(s.slug)}
													</div>
												</div>
												<div className='flex gap-2'>
													<button
														className='btn-secondary text-sm'
														onClick={() =>
															copyToClipboard(getSurveyUrl(s.slug))
														}
													>
														Copy URL
													</button>
													<button
														className='btn-primary text-sm'
														onClick={() => toggleQR(s._id)}
													>
														{showQR[s._id] ? 'Hide QR' : 'Show QR'}
													</button>
												</div>
											</div>

											{[SURVEY_TYPE.QUIZ, SURVEY_TYPE.IQ].includes(
												s.type
											) && (
												<div className='flex items-center justify-between pt-3 border-t border-gray-200'>
													<div>
														<label className='block text-sm font-medium text-gray-700 mb-1'>
															增强版测评 URL
														</label>
														<div className='text-sm text-gray-600 font-mono'>
															{getSurveyUrl(s.slug).replace(
																'/survey/',
																'/assessment/'
															)}
														</div>
													</div>
													<div className='flex gap-2'>
														<button
															className='btn-secondary text-sm'
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
									<div className='border-t border-gray-200 pt-4'>
										<QRCodeComponent
											url={
												s.type === SURVEY_TYPE.ASSESSMENT
													? getSurveyUrl(s.slug).replace(
														'/survey/',
														'/assessment/'
													)
													: getSurveyUrl(s.slug)
											}
										/>
									</div>
								)}
							</div>

							{/* Question Management */}
							{s.sourceType === SOURCE_TYPE.MANUAL ? (
								// Manual Question Management
								<div className='mb-4'>
									<div className='flex justify-between items-center mb-3'>
										<h4 className='font-semibold text-gray-800'>
											Questions ({s.questions?.length || 0})
										</h4>
										<button
											className='btn-primary text-sm'
											onClick={() => setShowAddQuestionModal(true)}
											type='button'
										>
											+ Add Question
										</button>
									</div>
									{s.questions && s.questions.length > 0 ? (
										<div className='space-y-2'>
											{s.questions.map((q, idx) => {
												const isEditing = editingQuestions[s._id] === idx;
												const formKey = `${s._id}-${idx}`;
												const editForm = questionEditForms[formKey];

												return (
													<div
														key={idx}
														className='bg-gray-50 rounded-lg p-3'
													>
														{isEditing ? (
															// Edit mode
															<div className='space-y-3'>
																<div>
																	<label className='block text-sm font-medium text-gray-700 mb-2'>
																		Question Text
																	</label>
																	<input
																		className='input-field w-full'
																		placeholder='Enter question text'
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
																	<label className='block text-sm font-medium text-gray-700 mb-2'>
																		Question Type *
																	</label>
																	<select
																		className='input-field'
																		value={editForm?.type || ''}
																		onChange={e =>
																			handleQuestionEditChange(
																				s._id,
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
																	<div className='text-xs text-gray-500 mt-1'>
																		{editForm?.type ===
																			QUESTION_TYPE.SINGLE_CHOICE &&
																			'Users can select only one answer'}
																		{editForm?.type ===
																			QUESTION_TYPE.MULTIPLE_CHOICE &&
																			'Users can select multiple answers'}
																		{editForm?.type ===
																			QUESTION_TYPE.SHORT_TEXT &&
																			'Users can enter a text response'}
																	</div>
																</div>
																{editForm?.type !==
																	QUESTION_TYPE.SHORT_TEXT && (
																	<div>
																		<div className='flex items-center justify-between mb-2'>
																			<label className='block text-sm font-medium text-gray-700'>
																				Options
																			</label>
																			<button
																				className='btn-secondary text-sm'
																				onClick={() =>
																					addQuestionEditOption(
																						s._id,
																						idx
																					)
																				}
																				type='button'
																			>
																				+ Add Option
																			</button>
																		</div>
																		{editForm?.options &&
																		editForm.options.length >
																			0 ? (
																				<div className='space-y-2'>
																					{editForm.options.map(
																						(
																							option,
																							optionIndex
																						) => (
																							<div
																								key={
																									optionIndex
																								}
																								className='flex items-center gap-2'
																							>
																								<input
																									className='input-field flex-1'
																									placeholder={`Option ${optionIndex + 1}`}
																									value={
																										option
																									}
																									onChange={e =>
																										handleQuestionEditOptionChange(
																											s._id,
																											idx,
																											optionIndex,
																											e
																												.target
																												.value
																										)
																									}
																								/>
																								<button
																									className='px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors'
																									onClick={() =>
																										removeQuestionEditOption(
																											s._id,
																											idx,
																											optionIndex
																										)
																									}
																									type='button'
																								>
																								Remove
																								</button>
																							</div>
																						)
																					)}
																				</div>
																			) : (
																				<div className='text-gray-500 text-sm p-3 border-2 border-dashed border-gray-300 rounded-lg text-center'>
																				No options added
																				yet. Click "Add
																				Option" to start.
																				</div>
																			)}
																	</div>
																)}
																{TYPES_REQUIRING_ANSWERS.includes(
																	s.type as any
																) &&
																	editForm?.options &&
																	editForm.options.length > 0 && (
																	<div className='space-y-4'>
																		<div>
																			<label className='block text-sm font-medium text-gray-700 mb-2'>
																					Select Correct
																					Answer(s)
																			</label>
																			<div className='space-y-2'>
																				{editForm.options.map(
																					(
																						opt,
																						optIdx
																					) => {
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
																								key={
																									optIdx
																								}
																								className='flex items-center gap-2'
																							>
																								<button
																									type='button'
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
																			<div className='text-xs text-gray-500 mt-1'>
																					Click the
																					checkboxes to
																					select multiple
																					correct answers
																			</div>
																		</div>
																		{s.scoringSettings
																			?.customScoringRules
																			?.useCustomPoints && (
																			<div>
																				<label className='block text-sm font-medium text-gray-700 mb-2'>
																						Question
																						Points
																				</label>
																				<input
																					type='number'
																					className='input-field w-full'
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
																							e
																								.target
																								.value
																								? parseInt(
																									e
																										.target
																										.value
																								)
																								: undefined
																						)
																					}
																					min='1'
																					max='100'
																				/>
																				<div className='text-xs text-gray-500 mt-1'>
																						Leave empty
																						to use
																						default
																						points (
																					{
																						s
																							.scoringSettings
																							.customScoringRules
																							.defaultQuestionPoints
																					}{' '}
																						points)
																				</div>
																			</div>
																		)}
																	</div>
																)}
																<div className='flex gap-2 pt-2'>
																	<button
																		className='btn-primary text-sm'
																		onClick={() =>
																			saveQuestionEdit(
																				s._id,
																				idx
																			)
																		}
																		type='button'
																		disabled={
																			!editForm?.text ||
																			(editForm.type !==
																				QUESTION_TYPE.SHORT_TEXT &&
																				(!editForm?.options ||
																					editForm.options.filter(
																						opt =>
																							opt.trim()
																					).length ===
																						0)) ||
																			([
																				SURVEY_TYPE.ASSESSMENT,
																				SURVEY_TYPE.QUIZ,
																				SURVEY_TYPE.IQ,
																			].includes(s.type) &&
																				editForm.type !==
																					QUESTION_TYPE.SHORT_TEXT &&
																				editForm.correctAnswer ===
																					undefined)
																		}
																	>
																		Save
																	</button>
																	<button
																		className='btn-secondary text-sm'
																		onClick={() =>
																			cancelEditQuestion(
																				s._id
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
																<div className='flex justify-between items-start mb-1'>
																	<div className='flex-1'>
																		<div className='flex items-center gap-2 mb-1'>
																			<span className='font-medium text-gray-800'>
																				{idx + 1}. {q.text}
																			</span>
																			<span
																				className={`text-xs px-2 py-1 rounded ${
																					q.type ===
																					QUESTION_TYPE.MULTIPLE_CHOICE
																						? 'bg-purple-100 text-purple-800'
																						: q.type ===
																							  QUESTION_TYPE.SINGLE_CHOICE
																							? 'bg-green-100 text-green-800'
																							: q.type ===
																								  QUESTION_TYPE.SHORT_TEXT
																								? 'bg-orange-100 text-orange-800'
																								: 'bg-gray-100 text-gray-800'
																				}`}
																			>
																				{q.type ===
																				QUESTION_TYPE.MULTIPLE_CHOICE
																					? 'Multiple Choice'
																					: q.type ===
																						  QUESTION_TYPE.SINGLE_CHOICE
																						? 'Single Choice'
																						: q.type ===
																							  QUESTION_TYPE.SHORT_TEXT
																							? 'Short Text'
																							: q.type ||
																								'Single Choice'}
																			</span>
																		</div>
																	</div>
																	<div className='flex items-center gap-2'>
																		{TYPES_REQUIRING_ANSWERS.includes(
																			s.type
																		) && (
																			<div className='text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded'>
																				{q.points || 1} pts
																			</div>
																		)}
																		<button
																			className='btn-secondary text-sm px-3 py-1'
																			onClick={() =>
																				startEditQuestion(
																					s._id,
																					idx
																				)
																			}
																		>
																			Edit
																		</button>
																		<button
																			className='px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors'
																			onClick={() =>
																				deleteQuestion(
																					s._id,
																					idx
																				)
																			}
																		>
																			Delete
																		</button>
																	</div>
																</div>
																{q.type ===
																QUESTION_TYPE.SHORT_TEXT ? (
																		<div className='text-sm text-gray-600 mb-1'>
																			<div className='font-medium'>
																			Type: Text Response
																			</div>
																			{TYPES_REQUIRING_ANSWERS.includes(
																			s.type as any
																			) &&
																			q.correctAnswer &&
																			typeof q.correctAnswer ===
																				'string' && (
																				<div className='text-xs text-green-600 font-medium mt-1'>
																					✓ Expected
																					Answer:{' '}
																					{
																						q.correctAnswer
																					}
																				</div>
																			)}
																		</div>
																	) : (
																		<>
																			<div className='text-sm text-gray-600 mb-1'>
																			Options:{' '}
																				{q.options &&
																				q.options.map(
																					(
																						opt,
																						optIdx
																					) => {
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
																							<span
																								key={
																									optIdx
																								}
																								className={`${TYPES_REQUIRING_ANSWERS.includes(s.type as any) && isCorrect ? 'font-semibold text-green-600' : ''}`}
																							>
																								{
																									opt
																								}
																								{optIdx <
																								(q
																									.options
																									?.length ||
																									0) -
																									1
																									? ', '
																									: ''}
																							</span>
																						);
																					}
																				)}
																			</div>
																			{TYPES_REQUIRING_ANSWERS.includes(
																				s.type
																			) &&
																			q.correctAnswer !==
																				undefined &&
																			q.type &&
																			q.type !==
																				QUESTION_TYPE.SHORT_TEXT && (
																				<div className='text-xs text-green-600 font-medium'>
																					✓ Correct Answer
																					{Array.isArray(
																						q.correctAnswer
																					) &&
																					q.correctAnswer
																						.length > 1
																						? 's'
																						: ''}
																					:{' '}
																					{Array.isArray(
																						q.correctAnswer
																					)
																						? q.correctAnswer
																							.map(
																								idx =>
																									q
																										.options?.[
																											idx
																										]
																							)
																							.join(
																								', '
																							)
																						: q
																							.options?.[
																								q
																									.correctAnswer
																							]}
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
										<p className='text-gray-500 text-sm'>
											No questions added yet.
										</p>
									)}
								</div>
							) : (
								// Question Bank Survey Information
								<div className='mb-4'>
									<h4 className='font-semibold text-gray-800 mb-3'>
										Question Bank Survey
									</h4>
									<div className='bg-purple-50 rounded-lg p-4'>
										<div className='flex items-center justify-between mb-3'>
											<div>
												<div className='font-medium text-gray-800'>
													Random Question Selection
												</div>
												<div className='text-sm text-gray-600'>
													This survey will randomly select{' '}
													{s.questionCount} questions from the linked
													question bank for each student.
												</div>
											</div>
											<div className='text-lg font-bold text-purple-600'>
												{s.questionCount} questions
											</div>
										</div>
										<div className='text-xs text-gray-500'>
											💡 Questions are randomized per student to ensure
											assessment fairness
										</div>
									</div>
								</div>
							)}
						</div>
					</>
				)}
				{tabLocal === TAB_TYPES.STATISTICS && (
					<div className='card'>
						<div className='flex justify-between items-center mb-4'>
							<h3 className='text-xl font-bold text-gray-800'>统计数据</h3>
							<button
								className='btn-secondary text-sm'
								onClick={() => loadStats(s._id)}
								type='button'
							>
								刷新数据
							</button>
						</div>
						
						{/* Filter Component */}
						<StatisticsFilter 
							onFilter={handleStatisticsFilter}
							loading={filterLoading}
						/>
						{stats && stats[s._id] ? (
							<div className='space-y-4'>
								{/* Statistics Summary */}
								<div className='bg-blue-50 rounded-lg p-4'>
									<h5 className='font-semibold text-gray-800 mb-2'>概览</h5>
									<div className='grid grid-cols-3 gap-4 text-sm'>
										<div className='text-center'>
											<div className='font-bold text-blue-600 text-lg'>
												{stats[s._id]?.summary?.totalResponses || 0}
											</div>
											<div className='text-gray-600'>总回复数</div>
										</div>
										<div className='text-center'>
											<div className='font-bold text-green-600 text-lg'>
												{stats[s._id]?.summary?.completionRate || 0}%
											</div>
											<div className='text-gray-600'>完成率</div>
										</div>
										<div className='text-center'>
											<div className='font-bold text-purple-600 text-lg'>
												{stats[s._id]?.summary?.totalQuestions || 0}
											</div>
											<div className='text-gray-600'>总题目数</div>
										</div>
									</div>
								</div>

								{/* Statistics View Toggle */}
								<div className='flex space-x-4 border-b border-gray-200 pb-2'>
									<button
										className={`py-2 px-4 font-medium text-sm transition-colors ${
											statsView === STATS_VIEW.AGGREGATED
												? 'text-blue-600 border-b-2 border-blue-600'
												: 'text-gray-500 hover:text-blue-600'
										}`}
										onClick={() => setStatsView(STATS_VIEW.AGGREGATED)}
									>
										汇总结果
									</button>
									<button
										className={`py-2 px-4 font-medium text-sm transition-colors ${
											statsView === STATS_VIEW.INDIVIDUAL
												? 'text-blue-600 border-b-2 border-blue-600'
												: 'text-gray-500 hover:text-blue-600'
										}`}
										onClick={() => setStatsView(STATS_VIEW.INDIVIDUAL)}
									>
										个人回复 ({stats[s._id]?.userResponses?.length || 0})
									</button>
								</div>

								{/* Aggregated Statistics */}
								{statsView === STATS_VIEW.AGGREGATED && (
									<div className='space-y-4'>
										{stats[s._id]?.aggregatedStats?.map((st, idx) => (
											<div key={idx} className='bg-gray-50 rounded-lg p-4'>
												<div className='font-semibold text-gray-800 mb-2'>
													{st.question}
												</div>
												<div className='space-y-2'>
													{Object.entries(st.options).map(
														([opt, count]) => {
															const percentage =
																stats[s._id]?.summary
																	?.totalResponses > 0
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
																	className='flex justify-between items-center'
																>
																	<span className='text-gray-700'>
																		{opt}
																	</span>
																	<div className='flex items-center gap-2'>
																		<div className='w-20 bg-gray-200 rounded-full h-2'>
																			<div
																				className='bg-blue-600 h-2 rounded-full transition-all duration-300'
																				style={{
																					width: `${percentage}%`,
																				}}
																			></div>
																		</div>
																		<span className='font-medium text-blue-600 text-sm w-12'>
																			{count}
																		</span>
																		<span className='text-gray-500 text-xs w-12'>
																			({percentage}%)
																		</span>
																	</div>
																</div>
															);
														}
													)}
												</div>
											</div>
										))}
									</div>
								)}

								{/* Individual User Responses */}
								{statsView === STATS_VIEW.INDIVIDUAL && (
									<div className='space-y-4'>
										{stats[s._id]?.userResponses?.length > 0 ? (
											<>
												{/* Pagination info */}
												<div className='flex justify-between items-center text-sm text-gray-600 mb-4'>
													<div>
														共 {stats[s._id].userResponses.length} 条记录，
														显示第 {((responsePage - 1) * RESPONSE_PAGE_SIZE) + 1} - {Math.min(responsePage * RESPONSE_PAGE_SIZE, stats[s._id].userResponses.length)} 条
													</div>
												</div>
												
												{stats[s._id].userResponses
													.slice((responsePage - 1) * RESPONSE_PAGE_SIZE, responsePage * RESPONSE_PAGE_SIZE)
													.map((response, idx) => (
													<div
														key={response._id}
														className='bg-gray-50 rounded-lg p-4'
													>
														<div className='flex justify-between items-start mb-3'>
															<div>
																<div className='font-semibold text-gray-800'>
																	{response.name}
																</div>
																<div className='text-sm text-gray-500'>
																	{response.email}
																</div>
																{/* Score Information */}
																{response.score &&
																	[
																		'quiz',
																		'assessment',
																		'iq',
																	].includes(s.type) && (
																	<div className='mt-2 space-y-1'>
																		<div className='flex items-center gap-2'>
																			<span className='text-sm font-medium text-blue-600'>
																				成绩:{' '}
																				{
																					response.score
																						.displayScore
																				}
																				{response.score
																					.scoringMode ===
																					'percentage'
																					? '%'
																					: '分'}
																			</span>
																			<span
																				className={`text-xs px-2 py-1 rounded-full ${
																					response.score
																						.passed
																						? 'bg-green-100 text-green-800'
																						: 'bg-red-100 text-red-800'
																				}`}
																			>
																				{response.score
																					.passed
																					? '通过'
																					: '未通过'}
																			</span>
																		</div>
																		<div className='text-xs text-gray-500'>
																			正确:{' '}
																			{
																				response.score
																					.correctAnswers
																			}{' '}
																			/ 错误:{' '}
																			{
																				response.score
																					.wrongAnswers
																			}
																			{response.timeSpent && (
																				<span className='ml-2'>
																					用时:{' '}
																					{Math.floor(
																						response.timeSpent /
																						60
																					)}
																					分
																					{response.timeSpent %
																						60}
																					秒
																				</span>
																			)}
																		</div>
																	</div>
																)}
															</div>
															<div className='text-xs text-gray-500'>
																{new Date(
																	response.createdAt
																).toLocaleDateString()}{' '}
																{new Date(
																	response.createdAt
																).toLocaleTimeString()}
																{response.isAutoSubmit && (
																	<div className='text-orange-600 mt-1'>
																		(自动提交)
																	</div>
																)}
															</div>
														</div>
														<div className='space-y-2'>
															{Object.entries(response.answers).map(
																([question, answer]) => (
																	<div
																		key={question}
																		className='border-l-4 border-blue-200 pl-3'
																	>
																		<div className='font-medium text-gray-700 text-sm'>
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
												))}
												
												{/* Pagination Controls */}
												{stats[s._id].userResponses.length > RESPONSE_PAGE_SIZE && (
													<div className='flex justify-center items-center gap-2 mt-6'>
														<button
															onClick={() => setResponsePage(prev => Math.max(1, prev - 1))}
															disabled={responsePage === 1}
															className='px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
														>
															上一页
														</button>
														
														<div className='flex gap-1'>
															{Array.from({ length: Math.ceil(stats[s._id].userResponses.length / RESPONSE_PAGE_SIZE) }, (_, i) => i + 1)
																.filter(pageNum => {
																	const totalPages = Math.ceil(stats[s._id].userResponses.length / RESPONSE_PAGE_SIZE);
																	return pageNum === 1 || pageNum === totalPages || Math.abs(pageNum - responsePage) <= 1;
																})
																.map((pageNum, index, array) => (
																	<React.Fragment key={pageNum}>
																		{index > 0 && array[index - 1] !== pageNum - 1 && (
																			<span className='px-2 py-1 text-gray-400'>...</span>
																		)}
																		<button
																			onClick={() => setResponsePage(pageNum)}
																			className={`px-3 py-1 text-sm border rounded ${
																				responsePage === pageNum
																					? 'bg-blue-600 text-white border-blue-600'
																					: 'hover:bg-gray-50'
																			}`}
																		>
																			{pageNum}
																		</button>
																	</React.Fragment>
																))
															}
														</div>
														
														<button
															onClick={() => setResponsePage(prev => Math.min(Math.ceil(stats[s._id].userResponses.length / RESPONSE_PAGE_SIZE), prev + 1))}
															disabled={responsePage >= Math.ceil(stats[s._id].userResponses.length / RESPONSE_PAGE_SIZE)}
															className='px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
														>
															下一页
														</button>
													</div>
												)}
											</>
										) : (
											<div className='text-center py-8 text-gray-500'>
												<p>暂无回复数据</p>
											</div>
										)}
									</div>
								)}
							</div>
						) : (
							<div className='text-center py-8 text-gray-500'>
								<p>暂无统计数据，点击"刷新数据"按钮加载</p>
							</div>
						)}
					</div>
				)}
				{tabLocal === TAB_TYPES.INVITATIONS && (
					<div className='mt-4'>
						<div className='flex justify-between items-center mb-2'>
							<div className='font-medium text-gray-800'>已邀请用户列表</div>
							<input
								className='border rounded px-2 py-1 text-sm'
								placeholder='搜索邮箱'
								value={search}
								onChange={e => {
									setSearch(e.target.value);
									setPage(1);
								}}
								style={{ width: 180 }}
							/>
						</div>
						<div className='overflow-x-auto'>
							<table className='min-w-full text-sm border'>
								<thead>
									<tr className='bg-gray-100'>
										<th className='px-2 py-1 border'>Email</th>
										<th className='px-2 py-1 border'>Token</th>
										<th className='px-2 py-1 border'>邀请时间</th>
										<th className='px-2 py-1 border'>有效期</th>
										<th className='px-2 py-1 border'>状态</th>
										<th className='px-2 py-1 border'>操作</th>
									</tr>
								</thead>
								<tbody>
									{loadingInvitations ? (
										<tr>
											<td colSpan={6} className='text-center py-4'>
												加载中...
											</td>
										</tr>
									) : paged.length === 0 ? (
										<tr>
											<td colSpan={6} className='text-center py-4'>
												暂无邀请
											</td>
										</tr>
									) : (
										paged.map(inv => {
											const status = getStatus(inv);
											return (
												<tr key={inv._id}>
													<td className='px-2 py-1 border'>
														{inv.targetEmails?.[0]}
													</td>
													<td className='px-2 py-1 border font-mono'>
														{maskToken(inv.invitationCode)}
													</td>
													<td className='px-2 py-1 border'>
														{inv.createdAt
															? new Date(
																inv.createdAt
															).toLocaleString()
															: ''}
													</td>
													<td className='px-2 py-1 border'>
														{inv.expiresAt
															? new Date(
																inv.expiresAt
															).toLocaleDateString()
															: '永久'}
													</td>
													<td className='px-2 py-1 border'>
														<span
															className={`px-2 py-1 rounded text-xs font-bold ${
																status.color === 'green'
																	? 'bg-green-100 text-green-700'
																	: status.color === 'red'
																		? 'bg-red-100 text-red-700'
																		: 'bg-gray-100 text-gray-700'
															}`}
														>
															{status.label}
														</span>
													</td>
													<td className='px-2 py-1 border space-x-2'>
														<button
															className='text-blue-600 hover:underline'
															onClick={() =>
																handleCopy(inv.invitationCode)
															}
														>
															复制链接
														</button>
														{/* 可扩展：重新发送/删除邀请 */}
													</td>
												</tr>
											);
										})
									)}
								</tbody>
							</table>
						</div>
						{/* 分页 */}
						{totalPages > 1 && (
							<div className='flex justify-center items-center gap-2 mt-2'>
								<button
									disabled={page === 1}
									onClick={() => setPage(page - 1)}
									className='px-2 py-1 border rounded disabled:opacity-50'
								>
									上一页
								</button>
								<span>
									第 {page} / {totalPages} 页
								</span>
								<button
									disabled={page === totalPages}
									onClick={() => setPage(page + 1)}
									className='px-2 py-1 border rounded disabled:opacity-50'
								>
									下一页
								</button>
							</div>
						)}
					</div>
				)}
				{/* 只有 showInviteModal 为 true 时才显示弹窗 */}
				{showInviteModal && (
					<InviteAssessmentModal
						show={showInviteModal}
						onClose={() => setShowInviteModal(false)}
						surveyId={survey._id}
						surveyTitle={survey.title}
					/>
				)}

				{/* Add Question Modal */}
				<AddSurveyQuestionModal
					isOpen={showAddQuestionModal}
					onClose={() => setShowAddQuestionModal(false)}
					onSubmit={addQuestionModalHandler}
					form={currentForm}
					onChange={(field, value) => handleQuestionChange(s._id, field, value)}
					onOptionChange={(index, value) => handleOptionChange(s._id, index, value)}
					onAddOption={() => addOption(s._id)}
					onRemoveOption={index => removeOption(s._id, index)}
					loading={loading}
					surveyType={s.type}
					isCustomScoringEnabled={s.scoringSettings?.customScoringRules?.useCustomPoints}
					defaultQuestionPoints={
						s.scoringSettings?.customScoringRules?.defaultQuestionPoints || 1
					}
				/>
			</div>
		</>
	);
};

export default SurveyDetailView;
