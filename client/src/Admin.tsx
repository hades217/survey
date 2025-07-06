import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import QRCodeComponent from './components/QRCode';
import Modal from './components/Modal';
import { getSurveyUrl } from './utils/config';

interface Survey {
	_id: string;
	title: string;
	description: string;
	slug: string;
	type: 'survey' | 'assessment' | 'quiz' | 'iq';
	questions: { text: string; options: string[]; correctAnswer?: number; points?: number }[];
	createdAt: string;
	isActive: boolean;
	timeLimit?: number;
	maxAttempts?: number;
	instructions?: string;
	navigationMode?: 'step-by-step' | 'paginated' | 'all-in-one';
	sourceType?: 'manual' | 'question_bank';
	questionBankId?: string;
	questionCount?: number;
	scoringSettings?: {
		scoringMode: 'percentage' | 'accumulated';
		totalPoints: number;
		passingThreshold: number;
		showScore: boolean;
		showCorrectAnswers: boolean;
		showScoreBreakdown: boolean;
		customScoringRules: {
			useCustomPoints: boolean;
			defaultQuestionPoints: number;
		};
	};
}

interface QuestionBank {
	_id: string;
	name: string;
	description: string;
	questions: Question[];
	createdBy: string;
	createdAt: string;
	updatedAt: string;
	questionCount: number;
}

interface Question {
	_id: string;
	text: string;
	type: 'single_choice' | 'multiple_choice';
	options: string[];
	correctAnswer: number | number[];
	explanation?: string;
	points?: number;
	tags?: string[];
	difficulty?: 'easy' | 'medium' | 'hard';
}

interface StatsItem {
	question: string;
	options: Record<string, number>;
}

interface UserResponse {
	_id: string;
	name: string;
	email: string;
	answers: Record<string, string>;
	createdAt: string;
}

interface StatsSummary {
	totalResponses: number;
	completionRate: number;
	totalQuestions: number;
}

interface EnhancedStats {
	aggregatedStats: StatsItem[];
	userResponses: UserResponse[];
	summary: StatsSummary;
}

type TabType = 'list' | 'detail' | 'question-banks';
type StatsViewType = 'aggregated' | 'individual';

const Admin: React.FC = () => {
	const { id: surveyIdFromUrl } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const [loggedIn, setLoggedIn] = useState(false);
	const [loginForm, setLoginForm] = useState({ username: '', password: '' });
	const [surveys, setSurveys] = useState<Survey[]>([]);
	const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null);
	const [questionBanks, setQuestionBanks] = useState<QuestionBank[]>([]);
	const [selectedQuestionBank, setSelectedQuestionBank] = useState<QuestionBank | null>(null);
	const [showCreateModal, setShowCreateModal] = useState(false);
	const [showScoringModal, setShowScoringModal] = useState(false);
	const [showQuestionBankModal, setShowQuestionBankModal] = useState(false);
	const [showEditModal, setShowEditModal] = useState(false);
	const [editingSurvey, setEditingSurvey] = useState<Survey | null>(null);
	const [editForm, setEditForm] = useState({
		title: '',
		description: '',
		type: 'survey' as 'survey' | 'assessment' | 'quiz' | 'iq',
		status: 'draft',
		timeLimit: '',
		maxAttempts: 1,
		instructions: '',
		navigationMode: 'step-by-step' as 'step-by-step' | 'paginated' | 'all-in-one'
	});
	const [newSurvey, setNewSurvey] = useState({ 
		title: '', 
		description: '', 
		type: 'survey' as 'survey' | 'assessment' | 'quiz' | 'iq',
		timeLimit: undefined as number | undefined,
		maxAttempts: 1,
		instructions: '',
		navigationMode: 'step-by-step' as 'step-by-step' | 'paginated' | 'all-in-one',
		sourceType: 'manual' as 'manual' | 'question_bank',
		questionBankId: undefined as string | undefined,
		questionCount: undefined as number | undefined,
		questions: [] as { text: string; options: string[]; correctAnswer?: number; points?: number }[],
		scoringSettings: {
			scoringMode: 'percentage' as 'percentage' | 'accumulated',
			passingThreshold: 60,
			showScore: true,
			showCorrectAnswers: false,
			showScoreBreakdown: true,
			customScoringRules: {
				useCustomPoints: false,
				defaultQuestionPoints: 1
			}
		}
	});
	const [questionForms, setQuestionForms] = useState<Record<string, { text: string; options: string[]; correctAnswer?: number; points?: number }>>({});
	const [stats, setStats] = useState<Record<string, EnhancedStats>>({});
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const [showQR, setShowQR] = useState<Record<string, boolean>>({});
	const [tab, setTab] = useState<TabType>('list');
	const [statsView, setStatsView] = useState<StatsViewType>('aggregated');
	const [newQuestionBank, setNewQuestionBank] = useState({
		name: '',
		description: ''
	});

	// 登录状态持久化
	useEffect(() => {
		const isLogged = localStorage.getItem('admin_logged_in');
		if (isLogged === 'true') {
			setLoggedIn(true);
			loadSurveys();
			loadQuestionBanks();
		}
	}, []);

	useEffect(() => {
		if (loggedIn) {
			localStorage.setItem('admin_logged_in', 'true');
		} else {
			localStorage.removeItem('admin_logged_in');
		}
	}, [loggedIn]);

	// 根据 URL 参数加载 survey
	useEffect(() => {
		if (surveyIdFromUrl && surveys.length > 0) {
			const survey = surveys.find(s => s._id === surveyIdFromUrl);
			if (survey) {
				setSelectedSurvey(survey);
				setTab('detail');
			} else {
				// 如果找不到 survey，重定向到列表页
				navigate('/admin');
			}
		}
	}, [surveyIdFromUrl, surveys, navigate]);

	const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setLoginForm({ ...loginForm, [e.target.name]: e.target.value });
	};

	const login = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError('');
		try {
			const response = await axios.post('/api/admin/login', loginForm);
			if (response.data.success) {
				setLoggedIn(true);
				loadSurveys();
				loadQuestionBanks();
			} else {
				setError('Login failed. Please check your credentials.');
			}
		} catch {
			setError('Login failed. Please check your credentials.');
		} finally {
			setLoading(false);
		}
	};

	const loadSurveys = async () => {
		try {
			const res = await axios.get<Survey[]>('/api/admin/surveys');
			setSurveys(res.data);
		} catch (err) {
			console.error('Error loading surveys:', err);
		}
	};

	const loadQuestionBanks = async () => {
		try {
			const res = await axios.get<QuestionBank[]>('/api/admin/question-banks');
			setQuestionBanks(res.data);
		} catch (err) {
			console.error('Error loading question banks:', err);
		}
	};

	const logout = async () => {
		await axios.get('/api/admin/logout');
		setLoggedIn(false);
		setSurveys([]);
		setTab('list');
		setSelectedSurvey(null);
		navigate('/admin');
	};

	const openEditModal = (survey: Survey) => {
		setEditingSurvey(survey);
		setEditForm({
			title: survey.title,
			description: survey.description,
			type: survey.type,
			status: survey.isActive ? 'active' : 'draft',
			timeLimit: survey.timeLimit ? String(survey.timeLimit) : '',
			maxAttempts: survey.maxAttempts,
			instructions: survey.instructions || '',
			navigationMode: survey.navigationMode || 'step-by-step'
		});
		setShowEditModal(true);
	};

	const closeEditModal = () => {
		setShowEditModal(false);
		setEditingSurvey(null);
	};

	const createSurvey = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		try {
			// Prepare survey data with appropriate questions based on type
			let surveyData;
			
			// Clean up undefined questionBankId if sourceType is manual
			if (newSurvey.sourceType === 'manual') {
				const { questionBankId, questionCount, ...cleanedData } = newSurvey;
				surveyData = cleanedData;
			} else {
				// For question_bank, ensure questionBankId is not undefined
				surveyData = { 
					...newSurvey,
					questionBankId: newSurvey.questionBankId || '',
					questionCount: newSurvey.questionCount || 1
				};
			}
			
			// If no questions exist, add a default question based on type
			if (surveyData.questions.length === 0) {
				if (['assessment', 'quiz', 'iq'].includes(surveyData.type)) {
					// For assessment/quiz/iq, add a question with correct answer
					surveyData.questions = [{
						text: 'Sample question - please replace with your content',
						options: ['Option A', 'Option B', 'Option C', 'Option D'],
						correctAnswer: 0, // First option is correct
						points: 1
					}];
				} else {
					// For survey, add a question without correct answer
					surveyData.questions = [{
						text: 'Sample question - please replace with your content',
						options: ['Option A', 'Option B', 'Option C', 'Option D'],
						points: 1
					}];
				}
			}
			
			const res = await axios.post<Survey>('/api/admin/surveys', surveyData);
		setSurveys([...surveys, res.data]);
		setNewSurvey({ 
			title: '', 
			description: '', 
			type: 'survey',
			timeLimit: undefined,
			maxAttempts: 1,
			instructions: '',
			navigationMode: 'step-by-step',
			sourceType: 'manual',
			questionBankId: undefined as string | undefined,
			questionCount: undefined as number | undefined,
			questions: [] as { text: string; options: string[]; correctAnswer?: number; points?: number }[],
			scoringSettings: {
				scoringMode: 'percentage',
				passingThreshold: 60,
				showScore: true,
				showCorrectAnswers: false,
				showScoreBreakdown: true,
				customScoringRules: {
					useCustomPoints: false,
					defaultQuestionPoints: 1
				}
			}
		});
		setShowCreateModal(false);
		} catch (err) {
			setError('Failed to create survey. Please try again.');
		} finally {
			setLoading(false);
		}
	};

	const handleQuestionChange = (id: string, field: string, value: string | number) => {
		if (field === 'text') {
			setQuestionForms({
				...questionForms,
				[id]: { ...(questionForms[id] || { text: '', options: [] }), [field]: value },
			});
		} else if (field === 'correctAnswer' || field === 'points') {
			setQuestionForms({
				...questionForms,
				[id]: { ...(questionForms[id] || { text: '', options: [] }), [field]: value as number },
			});
		}
	};

	const handleOptionChange = (surveyId: string, optionIndex: number, value: string) => {
		const currentForm = questionForms[surveyId] || { text: '', options: [] };
		const newOptions = [...currentForm.options];
		newOptions[optionIndex] = value;
		setQuestionForms({
			...questionForms,
			[surveyId]: { ...currentForm, options: newOptions },
		});
	};

	const addOption = (surveyId: string) => {
		const currentForm = questionForms[surveyId] || { text: '', options: [] };
		setQuestionForms({
			...questionForms,
			[surveyId]: { ...currentForm, options: [...currentForm.options, ''] },
		});
	};

	const removeOption = (surveyId: string, optionIndex: number) => {
		const currentForm = questionForms[surveyId] || { text: '', options: [] };
		const newOptions = currentForm.options.filter((_: string, index: number) => index !== optionIndex);
		// Reset correctAnswer if it was pointing to a removed option
		const correctAnswer = currentForm.correctAnswer !== undefined && currentForm.correctAnswer >= optionIndex ? 
			(currentForm.correctAnswer === optionIndex ? undefined : currentForm.correctAnswer - 1) : 
			currentForm.correctAnswer;
		setQuestionForms({
			...questionForms,
			[surveyId]: { ...currentForm, options: newOptions, correctAnswer },
		});
	};

	const addQuestion = async (surveyId: string) => {
		const q = questionForms[surveyId];
		if (!q || !q.text || !q.options.length) return;
		const options = q.options.filter((option: string) => option.trim() !== '');
		if (options.length === 0) return;
		
		const payload: { text: string; options: string[]; correctAnswer?: number; points?: number } = { 
			text: q.text, 
			options 
		};
		
		// Include correctAnswer if it's set
		if (q.correctAnswer !== undefined) {
			payload.correctAnswer = q.correctAnswer;
		}
		
		// Include points if it's set
		if (q.points !== undefined) {
			payload.points = q.points;
		}
		
		await axios.put(`/api/admin/surveys/${surveyId}/questions`, payload);
		loadSurveys();
		setQuestionForms({ ...questionForms, [surveyId]: { text: '', options: [] } });
	};

	const loadStats = async (surveyId: string) => {
		const res = await axios.get<EnhancedStats>(`/api/admin/surveys/${surveyId}/statistics`);
		setStats({ ...stats, [surveyId]: res.data });
	};

	const toggleSurveyStatus = async (surveyId: string, isActive: boolean) => {
		try {
			await axios.put(`/api/admin/surveys/${surveyId}`, { isActive: !isActive });
			loadSurveys();
		} catch (err) {
			console.error('Error toggling survey status:', err);
		}
	};

	const deleteSurvey = async (surveyId: string) => {
		if (!confirm('Are you sure you want to delete this survey?')) return;
		try {
			await axios.delete(`/api/admin/surveys/${surveyId}`);
			loadSurveys();
			setSelectedSurvey(null);
			setTab('list');
			navigate('/admin');
		} catch (err) {
			console.error('Error deleting survey:', err);
		}
	};

	const deleteQuestionBank = async (questionBankId: string) => {
		if (!confirm('Are you sure you want to delete this question bank?')) return;
		try {
			await axios.delete(`/api/admin/question-banks/${questionBankId}`);
			loadQuestionBanks();
			setSelectedQuestionBank(null);
		} catch (err) {
			console.error('Error deleting question bank:', err);
		}
	};

	const copyToClipboard = (text: string) => {
		navigator.clipboard.writeText(text);
	};

	const toggleQR = (surveyId: string) => {
		setShowQR({ ...showQR, [surveyId]: !showQR[surveyId] });
	};

	// 点击 survey 时的处理函数
	const handleSurveyClick = (survey: Survey) => {
		setSelectedSurvey(survey);
		setTab('detail');
		navigate(`/admin/survey/${survey._id}`);
	};

	// 返回列表页
	const handleBackToList = () => {
		setSelectedSurvey(null);
		setTab('list');
		navigate('/admin');
	};

	// Tab内容
	const renderTabs = () => (
		<div className="flex space-x-4 mb-6 border-b border-gray-200">
			<button
				className={`py-2 px-4 font-semibold border-b-2 transition-colors ${tab === 'list' ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-blue-600'}`}
				onClick={handleBackToList}
			>
				Survey List
			</button>
			<button
				className={`py-2 px-4 font-semibold border-b-2 transition-colors ${tab === 'question-banks' ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-blue-600'}`}
				onClick={() => setTab('question-banks')}
			>
				Question Banks
			</button>
			{selectedSurvey && (
				<button
					className={`py-2 px-4 font-semibold border-b-2 transition-colors ${tab === 'detail' ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-blue-600'}`}
					onClick={() => setTab('detail')}
				>
					Details
				</button>
			)}
		</div>
	);

	// Question Banks 列表
	const renderQuestionBanks = () => (
		<div className="space-y-4">
			<div className="flex justify-between items-center">
				<h2 className="text-xl font-semibold text-gray-800">Question Banks</h2>
				<button 
					className="btn-primary"
					onClick={() => setShowQuestionBankModal(true)}
				>
					+ Create Question Bank
				</button>
			</div>
			
			{questionBanks.length === 0 ? (
				<div className="text-center py-8 text-gray-500">
					<p>No question banks created yet.</p>
					<p className="text-sm mt-2">Create your first question bank to get started.</p>
				</div>
			) : (
				<div className="grid gap-4">
					{questionBanks.map((bank) => (
						<div key={bank._id} className="card hover:shadow-lg transition-shadow cursor-pointer">
			<div className="flex justify-between items-start">
				<div className="flex-1">
					<h3 className="text-lg font-bold text-gray-800">{bank.name}</h3>
					{bank.description && (
						<p className="text-gray-600 mt-1">{bank.description}</p>
					)}
					<div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
						<span>{bank.questions.length} questions</span>
						<span>Created: {new Date(bank.createdAt).toLocaleDateString()}</span>
					</div>
				</div>
				<div className="flex gap-2">
					<button 
						className="btn-secondary text-sm"
						onClick={() => setSelectedQuestionBank(bank)}
					>
						Edit
					</button>
					<button 
						className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors"
						onClick={() => deleteQuestionBank(bank._id)}
					>
						Delete
					</button>
				</div>
			</div>
						</div>
					))}
				</div>
			)}
		</div>
	);

	// Survey 列表
	const renderSurveyList = () => (
		<div className="space-y-4">
			{surveys.map((s) => (
				<div
					key={s._id}
					className="card hover:shadow-xl transition-shadow"
				>
					<div className="flex justify-between items-center">
						<div 
			className="flex-1 cursor-pointer"
			onClick={() => handleSurveyClick(s)}
						>
			<div className="flex items-center gap-2 mb-1">
				<h3 className="text-lg font-bold text-gray-800">{s.title}</h3>
				<span className={`px-2 py-1 text-xs font-medium rounded-full ${
					s.type === 'assessment' ? 'bg-blue-100 text-blue-800' : 
					s.type === 'quiz' ? 'bg-green-100 text-green-800' :
					s.type === 'iq' ? 'bg-purple-100 text-purple-800' :
					'bg-gray-100 text-gray-800'
				}`}>
					{s.type === 'assessment' ? 'Assessment' : 
					 s.type === 'quiz' ? 'Quiz' :
					 s.type === 'iq' ? 'IQ Test' : 'Survey'}
				</span>
				{s.timeLimit && (
					<span className="px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-800">
						⏱️ {s.timeLimit} mins
					</span>
				)}
				<span className={`px-2 py-1 text-xs font-medium rounded-full ${s.status === 'active' ? 'bg-green-100 text-green-800' : s.status === 'closed' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
					{s.status === 'active' ? 'Active' : s.status === 'closed' ? 'Closed' : 'Draft'}
				</span>
			</div>
			<div className="text-sm text-gray-500">{s.description}</div>
						</div>
						<div className="flex items-center gap-2">
						</div>
					</div>
				</div>
			))}
		</div>
	);

	// Survey 详情
	const renderSurveyDetail = () => {
		if (!selectedSurvey) return null;
		const s = selectedSurvey;
		const currentForm = questionForms[s._id] || { text: '', options: [] };
		
		return (
			<div className="card">
				<div className="flex justify-between items-start mb-4">
					<div className="flex-1">
						<div className="flex items-center gap-3 mb-2">
			<h3 className="text-xl font-bold text-gray-800">{s.title}</h3>
					<span className={`px-2 py-1 text-xs font-medium rounded-full ${
						s.type === 'assessment' ? 'bg-blue-100 text-blue-800' : 
						s.type === 'quiz' ? 'bg-green-100 text-green-800' :
						s.type === 'iq' ? 'bg-purple-100 text-purple-800' :
						'bg-gray-100 text-gray-800'
					}`}>
						{s.type === 'assessment' ? 'Assessment' : 
						 s.type === 'quiz' ? 'Quiz' :
						 s.type === 'iq' ? 'IQ Test' : 'Survey'}
					</span>
					<span className={`px-2 py-1 text-xs font-medium rounded-full ${s.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{s.isActive ? 'Active' : 'Inactive'}</span>
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
				
				{/* New Fields Display */}
				{(s.timeLimit || s.maxAttempts !== 1 || s.instructions || s.navigationMode !== 'step-by-step') && (
					<div className="bg-blue-50 rounded-lg p-3 mb-3">
						<h5 className="font-medium text-gray-800 mb-2">Assessment Configuration</h5>
						<div className="grid grid-cols-2 gap-2 text-sm">
							{s.timeLimit && (
								<div className="flex justify-between">
									<span className="text-gray-600">Time Limit:</span>
									<span className="font-medium text-blue-600">{s.timeLimit} minutes</span>
								</div>
							)}
							{s.maxAttempts !== 1 && (
								<div className="flex justify-between">
									<span className="text-gray-600">Max Attempts:</span>
									<span className="font-medium text-blue-600">{s.maxAttempts} times</span>
								</div>
							)}
							{s.navigationMode !== 'step-by-step' && (
								<div className="flex justify-between">
									<span className="text-gray-600">Navigation Mode:</span>
									<span className="font-medium text-blue-600">
										{s.navigationMode === 'paginated' ? 'Paginated' : 
										 s.navigationMode === 'all-in-one' ? 'All-in-one' : 'Step-by-step'}
									</span>
								</div>
							)}
						</div>
						{s.instructions && (
							<div className="mt-2 pt-2 border-t border-blue-200">
								<div className="text-xs text-gray-600 mb-1">Special Instructions:</div>
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
									{s.scoringSettings.scoringMode === 'percentage' ? 'Percentage' : 'Accumulated'}
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
									{s.scoringSettings.scoringMode === 'percentage' ? '100' : s.scoringSettings.totalPoints} points
								</span>
							</div>
							<div className="flex justify-between">
								<span className="text-gray-600">Custom Points:</span>
								<span className="font-medium text-green-600">
									{s.scoringSettings.customScoringRules.useCustomPoints ? 'Yes' : 'No'}
								</span>
							</div>
						</div>
					</div>
				)}
				
				{/* Question Source Display */}
				{s.sourceType === 'question_bank' && (
					<div className="bg-purple-50 rounded-lg p-3 mb-3">
						<h5 className="font-medium text-gray-800 mb-2">Question Bank Configuration</h5>
						<div className="grid grid-cols-2 gap-2 text-sm">
							<div className="flex justify-between">
								<span className="text-gray-600">Source:</span>
								<span className="font-medium text-purple-600">Question Bank</span>
							</div>
							<div className="flex justify-between">
								<span className="text-gray-600">Questions to Select:</span>
								<span className="font-medium text-purple-600">{s.questionCount} random</span>
							</div>
						</div>
					</div>
				)}
				
				<div className="text-sm text-gray-500">Created: {new Date(s.createdAt).toLocaleDateString()}</div>
				
				<div className="flex gap-2">
					<button className="btn-secondary text-sm" onClick={() => toggleSurveyStatus(s._id, s.isActive)}>{s.isActive ? 'Deactivate' : 'Activate'}</button>
					<button className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors" onClick={() => deleteSurvey(s._id)}>Delete</button>
				</div>
				
				<div className="bg-gray-50 rounded-lg p-4 mb-4">
					<div className="space-y-3">
						<div className="flex items-center justify-between">
			<div>
				<label className="block text-sm font-medium text-gray-700 mb-1">经典版 Survey URL</label>
				<div className="text-sm text-gray-600 font-mono">{getSurveyUrl(s.slug)}</div>
			</div>
			<div className="flex gap-2">
				<button className="btn-secondary text-sm" onClick={() => copyToClipboard(getSurveyUrl(s.slug))}>Copy URL</button>
				<button className="btn-primary text-sm" onClick={() => toggleQR(s._id)}>{showQR[s._id] ? 'Hide QR' : 'Show QR'}</button>
			</div>
						</div>
						
						{['quiz', 'assessment', 'iq'].includes(s.type) && (
			<div className="flex items-center justify-between pt-3 border-t border-gray-200">
				<div>
					<label className="block text-sm font-medium text-gray-700 mb-1">增强版测评 URL</label>
					<div className="text-sm text-gray-600 font-mono">{getSurveyUrl(s.slug).replace('/survey/', '/assessment/')}</div>
				</div>
				<div className="flex gap-2">
					<button className="btn-secondary text-sm" onClick={() => copyToClipboard(getSurveyUrl(s.slug).replace('/survey/', '/assessment/'))}>Copy Enhanced URL</button>
				</div>
			</div>
						)}
					</div>
					{showQR[s._id] && (
						<div className="border-t border-gray-200 pt-4">
			<QRCodeComponent url={getSurveyUrl(s.slug)} />
						</div>
					)}
				</div>
				{s.sourceType === 'manual' ? (
					// Manual Question Management
					<div className="mb-4">
						<h4 className="font-semibold text-gray-800 mb-3">Questions ({s.questions.length})</h4>
						{s.questions.length > 0 ? (
			<div className="space-y-2">
				{s.questions.map((q, idx) => (
					<div key={idx} className="bg-gray-50 rounded-lg p-3">
						<div className="flex justify-between items-start mb-1">
							<div className="font-medium text-gray-800">{idx + 1}. {q.text}</div>
							{['assessment', 'quiz', 'iq'].includes(s.type) && (
								<div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
									{q.points || 1} pts
								</div>
							)}
						</div>
						<div className="text-sm text-gray-600 mb-1">
							Options: {q.options.map((opt, optIdx) => (
								<span key={optIdx} className={`${['assessment', 'quiz', 'iq'].includes(s.type) && q.correctAnswer === optIdx ? 'font-semibold text-green-600' : ''}`}>
									{opt}{optIdx < q.options.length - 1 ? ', ' : ''}
								</span>
							))}
						</div>
						{['assessment', 'quiz', 'iq'].includes(s.type) && q.correctAnswer !== undefined && (
							<div className="text-xs text-green-600 font-medium">
								✓ Correct Answer: {q.options[q.correctAnswer]}
							</div>
						)}
					</div>
				))}
			</div>
						) : (
			<p className="text-gray-500 text-sm">No questions added yet.</p>
						)}
						
						{/* Add Question Form for Manual Surveys */}
						<div className="border-t border-gray-200 pt-4 mt-4">
			<h4 className="font-semibold text-gray-800 mb-3">Add Question</h4>
			<div className="space-y-4">
				<div>
					<label className="block text-sm font-medium text-gray-700 mb-2">Question Text</label>
					<input 
						className="input-field w-full" 
						placeholder="Enter question text" 
						value={currentForm.text} 
						onChange={(e) => handleQuestionChange(s._id, 'text', e.target.value)} 
					/>
				</div>
				<div>
					<div className="flex items-center justify-between mb-2">
						<label className="block text-sm font-medium text-gray-700">Options</label>
						<button 
							className="btn-secondary text-sm"
							onClick={() => addOption(s._id)}
							type="button"
						>
							+ Add Option
						</button>
					</div>
					{currentForm.options.length > 0 ? (
						<div className="space-y-2">
							{currentForm.options.map((option, index) => (
								<div key={index} className="flex items-center gap-2">
									<input
										className="input-field flex-1"
										placeholder={`Option ${index + 1}`}
										value={option}
										onChange={(e) => handleOptionChange(s._id, index, e.target.value)}
									/>
									<button
										className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors"
										onClick={() => removeOption(s._id, index)}
										type="button"
									>
										Remove
									</button>
								</div>
							))}
						</div>
					) : (
						<div className="text-gray-500 text-sm p-3 border-2 border-dashed border-gray-300 rounded-lg text-center">
							No options added yet. Click "Add Option" to start.
						</div>
					)}
				</div>
				{['assessment', 'quiz', 'iq'].includes(s.type) && currentForm.options.length > 0 && (
					<div className="space-y-4">
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">Select Correct Answer</label>
							<select 
								className="input-field w-full"
								value={currentForm.correctAnswer ?? ''}
								onChange={(e) => handleQuestionChange(s._id, 'correctAnswer', e.target.value ? parseInt(e.target.value) : undefined)}
							>
								<option value="">Please select correct answer</option>
								{currentForm.options.map((opt, idx) => (
									<option key={idx} value={idx}>{opt || `Option ${idx + 1}`}</option>
								))}
							</select>
						</div>
						{s.scoringSettings?.customScoringRules?.useCustomPoints && (
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">Question Points</label>
								<input
									type="number"
									className="input-field w-full"
									placeholder={`Default points: ${s.scoringSettings.customScoringRules.defaultQuestionPoints}`}
									value={currentForm.points || ''}
									onChange={(e) => handleQuestionChange(s._id, 'points', e.target.value ? parseInt(e.target.value) : undefined)}
									min="1"
									max="100"
								/>
								<div className="text-xs text-gray-500 mt-1">
									Leave empty to use default points ({s.scoringSettings.customScoringRules.defaultQuestionPoints} points)
								</div>
							</div>
						)}
					</div>
				)}
				<button 
					className="btn-primary text-sm" 
					onClick={() => addQuestion(s._id)} 
					type="button"
					disabled={!currentForm.text || currentForm.options.filter(opt => opt.trim()).length === 0 || (['assessment', 'quiz', 'iq'].includes(s.type) && currentForm.correctAnswer === undefined)}
				>
					Add Question
				</button>
			</div>
						</div>
					</div>
				) : (
					// Question Bank Survey Information
					<div className="mb-4">
						<h4 className="font-semibold text-gray-800 mb-3">Question Bank Survey</h4>
						<div className="bg-purple-50 rounded-lg p-4">
			<div className="flex items-center justify-between mb-3">
				<div>
					<div className="font-medium text-gray-800">Random Question Selection</div>
					<div className="text-sm text-gray-600">
						This survey will randomly select {s.questionCount} questions from the linked question bank for each student.
					</div>
				</div>
				<div className="text-lg font-bold text-purple-600">
					{s.questionCount} questions
				</div>
			</div>
			<div className="text-xs text-gray-500">
				💡 Questions are randomized per student to ensure assessment fairness
			</div>
						</div>
					</div>
				)}
				<div className="border-t border-gray-200 pt-4">
					<div className="flex justify-between items-center mb-3">
						<h4 className="font-semibold text-gray-800">Statistics</h4>
						<button className="btn-secondary text-sm" onClick={() => loadStats(s._id)} type="button">View Statistics</button>
					</div>
					{stats[s._id] && (
						<div className="space-y-4">
			{/* Statistics Summary */}
			<div className="bg-blue-50 rounded-lg p-4">
				<h5 className="font-semibold text-gray-800 mb-2">Summary</h5>
				<div className="grid grid-cols-3 gap-4 text-sm">
					<div className="text-center">
						<div className="font-bold text-blue-600 text-lg">{stats[s._id].summary.totalResponses}</div>
						<div className="text-gray-600">Total Responses</div>
					</div>
					<div className="text-center">
						<div className="font-bold text-green-600 text-lg">{stats[s._id].summary.completionRate}%</div>
						<div className="text-gray-600">Completion Rate</div>
					</div>
					<div className="text-center">
						<div className="font-bold text-purple-600 text-lg">{stats[s._id].summary.totalQuestions}</div>
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
					Individual Responses ({stats[s._id].userResponses.length})
				</button>
			</div>

			{/* Aggregated Statistics */}
			{statsView === 'aggregated' && (
				<div className="space-y-4">
					{stats[s._id].aggregatedStats.map((st, idx) => (
						<div key={idx} className="bg-gray-50 rounded-lg p-4">
							<div className="font-semibold text-gray-800 mb-2">{st.question}</div>
							<div className="space-y-2">
								{Object.entries(st.options).map(([opt, count]) => {
									const percentage = stats[s._id].summary.totalResponses > 0 
										? ((count / stats[s._id].summary.totalResponses) * 100).toFixed(1) 
										: 0;
									return (
										<div key={opt} className="flex justify-between items-center">
											<span className="text-gray-700">{opt}</span>
											<div className="flex items-center gap-2">
												<div className="w-20 bg-gray-200 rounded-full h-2">
													<div 
														className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
														style={{ width: `${percentage}%` }}
													></div>
												</div>
												<span className="font-medium text-blue-600 text-sm w-12">{count}</span>
												<span className="text-gray-500 text-xs w-12">({percentage}%)</span>
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
					{stats[s._id].userResponses.length > 0 ? (
						stats[s._id].userResponses.map((response, idx) => (
							<div key={response._id} className="bg-gray-50 rounded-lg p-4">
								<div className="flex justify-between items-start mb-3">
									<div>
										<div className="font-semibold text-gray-800">{response.name}</div>
										<div className="text-sm text-gray-500">{response.email}</div>
									</div>
									<div className="text-xs text-gray-500">
										{new Date(response.createdAt).toLocaleDateString()} {new Date(response.createdAt).toLocaleTimeString()}
									</div>
								</div>
								<div className="space-y-2">
									{Object.entries(response.answers).map(([question, answer]) => (
										<div key={question} className="border-l-4 border-blue-200 pl-3">
											<div className="font-medium text-gray-700 text-sm">{question}</div>
											<div className={`text-sm ${answer === 'No answer' ? 'text-gray-400 italic' : 'text-gray-900'}`}>
												{answer}
											</div>
										</div>
									))}
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
		);
	};

	// Create Sigma Modal
	const renderCreateModal = () => (
		<Modal show={showCreateModal} title="Create Sigma" onClose={() => setShowCreateModal(false)}>
			<form onSubmit={createSurvey} className="space-y-4">
				<div>
					<label className="block text-sm font-medium text-gray-700 mb-2">Sigma Title *</label>
					<input className="input-field" placeholder="Enter sigma title" value={newSurvey.title} onChange={(e) => setNewSurvey({ ...newSurvey, title: e.target.value })} required />
				</div>
				<div>
					<label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
					<textarea className="input-field" placeholder="Enter sigma description" value={newSurvey.description} onChange={(e) => setNewSurvey({ ...newSurvey, description: e.target.value })} rows={2} />
				</div>
				<div>
					<label className="block text-sm font-medium text-gray-700 mb-2">Type *</label>
					<select className="input-field" value={newSurvey.type} onChange={(e) => setNewSurvey({ ...newSurvey, type: e.target.value as 'survey' | 'assessment' | 'quiz' | 'iq' })} required>
						<option value="survey">Survey</option>
						<option value="quiz">Quiz</option>
						<option value="assessment">Assessment</option>
						<option value="iq">IQ Test</option>
					</select>
					<div className="text-xs text-gray-500 mt-1">
						{newSurvey.type === 'survey' ? 'Survey mode for collecting feedback and opinions, no correct answers needed' :
						 newSurvey.type === 'quiz' ? 'Quiz mode for simple tests with scoring features' :
						 newSurvey.type === 'assessment' ? 'Assessment mode for formal evaluation with complete assessment features' :
						 'IQ test mode for intelligence testing with professional scoring'}
					</div>
				</div>
				
				{/* Question Source Selection */}
				<div>
					<label className="block text-sm font-medium text-gray-700 mb-2">Question Source</label>
					<select 
						className="input-field" 
						value={newSurvey.sourceType} 
						onChange={(e) => setNewSurvey({ 
			...newSurvey, 
			sourceType: e.target.value as 'manual' | 'question_bank',
			questionBankId: e.target.value === 'manual' ? undefined : (newSurvey.questionBankId || ''),
			questionCount: e.target.value === 'manual' ? undefined : (newSurvey.questionCount || 1)
						})}
					>
						<option value="manual">Manual - Add questions individually</option>
						<option value="question_bank">Question Bank - Random selection from existing bank</option>
					</select>
					<div className="text-xs text-gray-500 mt-1">
						{newSurvey.sourceType === 'manual' 
			? 'Add questions one by one to this survey' 
			: 'Select questions randomly from a question bank'}
					</div>
				</div>
				
				{/* Question Bank Configuration */}
				{newSurvey.sourceType === 'question_bank' && (
					<div className="bg-purple-50 rounded-lg p-4 space-y-4">
						<h4 className="font-medium text-gray-800">Question Bank Configuration</h4>
						<div>
			<label className="block text-sm font-medium text-gray-700 mb-2">Question Bank *</label>
			<select 
				className="input-field" 
				value={newSurvey.questionBankId} 
				onChange={(e) => setNewSurvey({ ...newSurvey, questionBankId: e.target.value })}
				required
			>
				<option value="">Select a question bank</option>
				{questionBanks.map(bank => (
					<option key={bank._id} value={bank._id}>
						{bank.name} ({bank.questions.length} questions)
					</option>
				))}
			</select>
			{questionBanks.length === 0 && (
				<div className="text-xs text-red-500 mt-1">
					No question banks available. Create a question bank first.
				</div>
			)}
						</div>
						<div>
			<label className="block text-sm font-medium text-gray-700 mb-2">Number of Questions</label>
			<input 
				type="number" 
				className="input-field" 
				placeholder="Number of questions to randomly select" 
				value={newSurvey.questionCount || ''} 
				onChange={(e) => setNewSurvey({ 
					...newSurvey, 
					questionCount: e.target.value ? parseInt(e.target.value) : undefined 
				})} 
				min="1"
				max={newSurvey.questionBankId ? questionBanks.find(b => b._id === newSurvey.questionBankId)?.questions.length || 100 : 100}
			/>
			<div className="text-xs text-gray-500 mt-1">
				{newSurvey.questionBankId && questionBanks.find(b => b._id === newSurvey.questionBankId) && 
					`Available: ${questionBanks.find(b => b._id === newSurvey.questionBankId)?.questions.length} questions`
				}
			</div>
						</div>
					</div>
				)}
				
				{/* Enhanced settings for quiz/assessment/iq */}
				{['quiz', 'assessment', 'iq'].includes(newSurvey.type) && (
					<div className="bg-blue-50 rounded-lg p-4 space-y-4">
						<h4 className="font-medium text-gray-800">Assessment Configuration</h4>
						
						<div className="grid grid-cols-2 gap-4">
			<div>
				<label className="block text-sm font-medium text-gray-700 mb-2">Time Limit (minutes)</label>
				<input 
					type="number" 
					className="input-field" 
					placeholder="No limit" 
					value={newSurvey.timeLimit || ''} 
					onChange={(e) => setNewSurvey({ 
						...newSurvey, 
						timeLimit: e.target.value ? parseInt(e.target.value) : undefined 
					})} 
					min="1"
					max="300"
				/>
				<div className="text-xs text-gray-500 mt-1">Leave empty for no time limit</div>
			</div>
			<div>
				<label className="block text-sm font-medium text-gray-700 mb-2">Max Attempts</label>
				<input 
					type="number" 
					className="input-field" 
					value={newSurvey.maxAttempts} 
					onChange={(e) => setNewSurvey({ 
						...newSurvey, 
						maxAttempts: parseInt(e.target.value) || 1 
					})} 
					min="1"
					max="10"
					required
				/>
			</div>
						</div>
						
						<div>
			<label className="block text-sm font-medium text-gray-700 mb-2">Navigation Mode</label>
			<select 
				className="input-field" 
				value={newSurvey.navigationMode} 
				onChange={(e) => setNewSurvey({ 
					...newSurvey, 
					navigationMode: e.target.value as 'step-by-step' | 'paginated' | 'all-in-one' 
				})}
			>
				<option value="step-by-step">Step-by-step (Recommended)</option>
				<option value="paginated">Paginated</option>
				<option value="all-in-one">All-in-one</option>
			</select>
			<div className="text-xs text-gray-500 mt-1">
				Step-by-step: Display one question at a time for best experience
			</div>
						</div>
						
						<div>
			<label className="block text-sm font-medium text-gray-700 mb-2">Special Instructions</label>
			<textarea 
				className="input-field" 
				placeholder="Additional instructions or notes for students" 
				value={newSurvey.instructions} 
				onChange={(e) => setNewSurvey({ ...newSurvey, instructions: e.target.value })} 
				rows={3}
			/>
			<div className="text-xs text-gray-500 mt-1">These instructions will be shown to students before starting the assessment</div>
						</div>
						
						{/* Scoring Settings */}
						<div className="border-t border-blue-200 pt-4">
			<h5 className="font-medium text-gray-800 mb-3">Scoring Rules</h5>
			<div className="space-y-4">
				<div>
					<label className="block text-sm font-medium text-gray-700 mb-2">Scoring Mode</label>
					<select 
						className="input-field" 
						value={newSurvey.scoringSettings.scoringMode} 
						onChange={(e) => setNewSurvey({ 
							...newSurvey, 
							scoringSettings: {
								...newSurvey.scoringSettings,
								scoringMode: e.target.value as 'percentage' | 'accumulated'
							}
						})}
					>
						<option value="percentage">Percentage (0-100 points)</option>
						<option value="accumulated">Accumulated (sum by question points)</option>
					</select>
					<div className="text-xs text-gray-500 mt-1">
						{newSurvey.scoringSettings.scoringMode === 'percentage' 
							? 'Percentage: Final score converted to 0-100 scale regardless of question points' 
							: 'Accumulated: Total score calculated by summing actual question points'}
					</div>
				</div>
				
				<div>
					<label className="block text-sm font-medium text-gray-700 mb-2">Passing Threshold</label>
					<input 
						type="number" 
						className="input-field" 
						value={newSurvey.scoringSettings.passingThreshold} 
						onChange={(e) => setNewSurvey({ 
							...newSurvey, 
							scoringSettings: {
								...newSurvey.scoringSettings,
								passingThreshold: parseInt(e.target.value) || 60
							}
						})} 
						min="1"
						max={newSurvey.scoringSettings.scoringMode === 'percentage' ? 100 : 1000}
					/>
					<div className="text-xs text-gray-500 mt-1">
						{newSurvey.scoringSettings.scoringMode === 'percentage' 
							? 'Percentage passing threshold (1-100)' 
							: 'Accumulated scoring passing threshold (by actual points)'}
					</div>
				</div>
				
				<div className="grid grid-cols-2 gap-4">
					<div>
						<label className="flex items-center">
							<input 
								type="checkbox" 
								className="mr-2"
								checked={newSurvey.scoringSettings.customScoringRules.useCustomPoints}
								onChange={(e) => setNewSurvey({ 
									...newSurvey, 
									scoringSettings: {
										...newSurvey.scoringSettings,
										customScoringRules: {
											...newSurvey.scoringSettings.customScoringRules,
											useCustomPoints: e.target.checked
										}
									}
								})}
							/>
							<span className="text-sm text-gray-700">Use Custom Points</span>
						</label>
					</div>
					{newSurvey.scoringSettings.customScoringRules.useCustomPoints && (
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">Default Question Points</label>
							<input 
								type="number" 
								className="input-field" 
								value={newSurvey.scoringSettings.customScoringRules.defaultQuestionPoints} 
								onChange={(e) => setNewSurvey({ 
									...newSurvey, 
									scoringSettings: {
										...newSurvey.scoringSettings,
										customScoringRules: {
											...newSurvey.scoringSettings.customScoringRules,
											defaultQuestionPoints: parseInt(e.target.value) || 1
										}
									}
								})} 
								min="1"
								max="100"
							/>
						</div>
					)}
				</div>
				
				<div className="grid grid-cols-2 gap-4">
					<label className="flex items-center">
						<input 
							type="checkbox" 
							className="mr-2"
							checked={newSurvey.scoringSettings.showCorrectAnswers}
							onChange={(e) => setNewSurvey({ 
								...newSurvey, 
								scoringSettings: {
									...newSurvey.scoringSettings,
									showCorrectAnswers: e.target.checked
								}
							})}
						/>
						<span className="text-sm text-gray-700">Show Correct Answers</span>
					</label>
					<label className="flex items-center">
						<input 
							type="checkbox" 
							className="mr-2"
							checked={newSurvey.scoringSettings.showScoreBreakdown}
							onChange={(e) => setNewSurvey({ 
								...newSurvey, 
								scoringSettings: {
									...newSurvey.scoringSettings,
									showScoreBreakdown: e.target.checked
								}
							})}
						/>
						<span className="text-sm text-gray-700">Show Score Breakdown</span>
					</label>
				</div>
			</div>
						</div>
					</div>
				)}
				
				<button className="btn-primary w-full" type="submit" disabled={loading}>
					{loading ? 'Creating...' : 'Create Sigma'}
				</button>
			</form>
		</Modal>
	);

	// Question Bank Modal
	const renderQuestionBankModal = () => {
		const createQuestionBank = async (e: React.FormEvent) => {
			e.preventDefault();
			setLoading(true);
			try {
				await axios.post('/api/admin/question-banks', newQuestionBank);
				loadQuestionBanks();
				setNewQuestionBank({ name: '', description: '' });
				setShowQuestionBankModal(false);
			} catch (err) {
				setError('Failed to create question bank. Please try again.');
			} finally {
				setLoading(false);
			}
		};

		return (
			<Modal show={showQuestionBankModal} title="Create Question Bank" onClose={() => setShowQuestionBankModal(false)}>
				<form onSubmit={createQuestionBank} className="space-y-4">
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">Question Bank Name *</label>
						<input 
			className="input-field" 
			placeholder="Enter question bank name" 
			value={newQuestionBank.name} 
			onChange={(e) => setNewQuestionBank({ ...newQuestionBank, name: e.target.value })} 
			required 
						/>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
						<textarea 
			className="input-field" 
			placeholder="Enter description" 
			value={newQuestionBank.description} 
			onChange={(e) => setNewQuestionBank({ ...newQuestionBank, description: e.target.value })} 
			rows={3} 
						/>
					</div>
					<button className="btn-primary w-full" type="submit" disabled={loading}>
						{loading ? 'Creating...' : 'Create Question Bank'}
					</button>
				</form>
			</Modal>
		);
	};

	const updateScoringSettings = async (surveyId: string, scoringSettings: any) => {
		try {
			await axios.put(`/api/admin/surveys/${surveyId}/scoring`, scoringSettings);
			loadSurveys();
			setShowScoringModal(false);
		} catch (err) {
			console.error('Error updating scoring settings:', err);
		}
	};

	const renderEditModal = () => {
		if (!editingSurvey || !showEditModal) return null;

		const updateSurvey = async (e: React.FormEvent) => {
			e.preventDefault();
			setLoading(true);
			try {
				const surveyData = {
					...editForm,
					isActive: editForm.status === 'active',
					timeLimit: editForm.timeLimit ? Number(editForm.timeLimit) : undefined
				};
				
				await axios.put(`/api/admin/surveys/${editingSurvey._id}`, surveyData);
				loadSurveys();
				closeEditModal();
			} catch (err) {
				setError('Failed to update survey. Please try again.');
			} finally {
				setLoading(false);
			}
		};


		return (
			<Modal show={showEditModal} title={`Edit Survey: ${editingSurvey.title}`} onClose={closeEditModal}>
				<form onSubmit={updateSurvey} className="space-y-4 max-h-96 overflow-y-auto">
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
						<input 
			className="input-field" 
			placeholder="Enter survey title" 
			value={editForm.title} 
			onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} 
			required 
						/>
					</div>
					
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
						<textarea 
			className="input-field" 
			placeholder="Enter description" 
			value={editForm.description} 
			onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} 
			rows={3} 
						/>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div>
			<label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
			<select 
				className="input-field" 
				value={editForm.type} 
				onChange={(e) => setEditForm({ ...editForm, type: e.target.value as any })}
			>
				<option value="survey">Survey</option>
				<option value="assessment">Assessment</option>
				<option value="quiz">Quiz</option>
				<option value="iq">IQ Test</option>
			</select>
						</div>
						
						<div>
			<label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
			<select 
				className="input-field" 
				value={editForm.status} 
				onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
			>
				<option value="draft">Draft</option>
				<option value="active">Active</option>
			</select>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div>
			<label className="block text-sm font-medium text-gray-700 mb-2">Time Limit (minutes)</label>
			<input 
				type="number" 
				className="input-field" 
				placeholder="Optional" 
				value={editForm.timeLimit} 
				onChange={(e) => setEditForm({ ...editForm, timeLimit: e.target.value })} 
			/>
						</div>
						
						<div>
			<label className="block text-sm font-medium text-gray-700 mb-2">Max Attempts</label>
			<input 
				type="number" 
				className="input-field" 
				min="1" 
				value={editForm.maxAttempts} 
				onChange={(e) => setEditForm({ ...editForm, maxAttempts: Number(e.target.value) })} 
			/>
						</div>
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">Instructions</label>
						<textarea 
			className="input-field" 
			placeholder="Instructions for survey takers" 
			value={editForm.instructions} 
			onChange={(e) => setEditForm({ ...editForm, instructions: e.target.value })} 
			rows={2} 
						/>
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">Navigation Mode</label>
						<select 
			className="input-field" 
			value={editForm.navigationMode} 
			onChange={(e) => setEditForm({ ...editForm, navigationMode: e.target.value as any })}
						>
			<option value="step-by-step">Step by Step</option>
			<option value="paginated">Paginated</option>
			<option value="all-in-one">All in One</option>
						</select>
					</div>


					<div className="flex gap-3 pt-4 border-t">
						<button className="btn-primary flex-1" type="submit" disabled={loading}>
			{loading ? 'Saving...' : 'Save Changes'}
						</button>
						<button type="button" className="btn-secondary px-6" onClick={closeEditModal}>
			Cancel
						</button>
					</div>
				</form>
			</Modal>
		);
	};

	if (!loggedIn) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
				<div className="card max-w-md w-full">
					<div className="text-center mb-8">
						<h2 className="text-3xl font-bold text-gray-900">Admin Login</h2>
						<p className="mt-2 text-sm text-gray-600">Sign in to manage your surveys</p>
					</div>
					{error && <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">{error}</div>}
					<form onSubmit={login} className="space-y-6">
						<div>
			<label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
			<input name="username" className="input-field" onChange={handleLoginChange} required placeholder="Enter username" />
						</div>
						<div>
			<label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
			<input type="password" name="password" className="input-field" onChange={handleLoginChange} required placeholder="Enter password" />
						</div>
						<button className="btn-primary w-full" type="submit" disabled={loading}>{loading ? 'Signing in...' : 'Sign In'}</button>
					</form>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-8">
			<div className="w-full max-w-3xl mx-auto px-4">
				<div className="flex justify-between items-center mb-8">
					<div>
						<h1 className="text-3xl font-bold text-gray-900">Sigma Admin Dashboard</h1>
						<p className="text-gray-600 mt-1">Manage your surveys, assessments and view responses</p>
					</div>
					<div className="flex gap-3">
						<button 
			className="btn-primary"
			onClick={() => setShowCreateModal(true)}
						>
			+ Create Sigma
						</button>
						<button className="btn-secondary" onClick={logout}>Logout</button>
					</div>
				</div>
				{renderTabs()}
				{tab === 'list' && renderSurveyList()}
				{tab === 'detail' && renderSurveyDetail()}
				{tab === 'question-banks' && renderQuestionBanks()}
				{renderCreateModal()}
				{renderScoringModal()}
				{renderQuestionBankModal()}
				{renderEditModal()}
			</div>
		</div>
	);
	
	// Edit Scoring Rules Modal
	function renderScoringModal() {
		if (!selectedSurvey || !showScoringModal) return null;
		
		const [localScoring, setLocalScoring] = useState({
			scoringMode: selectedSurvey.scoringSettings?.scoringMode || 'percentage',
			passingThreshold: selectedSurvey.scoringSettings?.passingThreshold || 60,
			showScore: selectedSurvey.scoringSettings?.showScore || true,
			showCorrectAnswers: selectedSurvey.scoringSettings?.showCorrectAnswers || false,
			showScoreBreakdown: selectedSurvey.scoringSettings?.showScoreBreakdown || true,
			customScoringRules: {
				useCustomPoints: selectedSurvey.scoringSettings?.customScoringRules?.useCustomPoints || false,
				defaultQuestionPoints: selectedSurvey.scoringSettings?.customScoringRules?.defaultQuestionPoints || 1
			}
		});
		
		return (
			<Modal show={showScoringModal} title="Edit Scoring Rules" onClose={() => setShowScoringModal(false)}>
				<div className="space-y-4 max-h-96 overflow-y-auto">
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">Scoring Mode</label>
						<select 
			className="input-field" 
			value={localScoring.scoringMode} 
			onChange={(e) => setLocalScoring({ 
				...localScoring, 
				scoringMode: e.target.value as 'percentage' | 'accumulated'
			})}
						>
			<option value="percentage">Percentage (0-100 points)</option>
			<option value="accumulated">Accumulated (sum by question points)</option>
						</select>
						<div className="text-xs text-gray-500 mt-1">
			{localScoring.scoringMode === 'percentage' 
				? 'Percentage: Final score converted to 0-100 scale regardless of question points' 
				: 'Accumulated: Total score calculated by summing actual question points'}
						</div>
					</div>
					
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">Passing Threshold</label>
						<input 
			type="number" 
			className="input-field" 
			value={localScoring.passingThreshold} 
			onChange={(e) => setLocalScoring({ 
				...localScoring, 
				passingThreshold: parseInt(e.target.value) || 60
			})} 
			min="1"
			max={localScoring.scoringMode === 'percentage' ? 100 : 1000}
						/>
						<div className="text-xs text-gray-500 mt-1">
			{localScoring.scoringMode === 'percentage' 
				? 'Percentage passing threshold (1-100)' 
				: 'Accumulated scoring passing threshold (by actual points)'}
						</div>
					</div>
					
					<div className="grid grid-cols-2 gap-4">
						<div>
			<label className="flex items-center">
				<input 
					type="checkbox" 
					className="mr-2"
					checked={localScoring.customScoringRules.useCustomPoints}
					onChange={(e) => setLocalScoring({ 
						...localScoring, 
						customScoringRules: {
							...localScoring.customScoringRules,
							useCustomPoints: e.target.checked
						}
					})}
				/>
				<span className="text-sm text-gray-700">Use Custom Points</span>
			</label>
						</div>
						{localScoring.customScoringRules.useCustomPoints && (
			<div>
				<label className="block text-sm font-medium text-gray-700 mb-2">Default Question Points</label>
				<input 
					type="number" 
					className="input-field" 
					value={localScoring.customScoringRules.defaultQuestionPoints} 
					onChange={(e) => setLocalScoring({ 
						...localScoring, 
						customScoringRules: {
							...localScoring.customScoringRules,
							defaultQuestionPoints: parseInt(e.target.value) || 1
						}
					})} 
					min="1"
					max="100"
				/>
			</div>
						)}
					</div>
					
					<div className="space-y-2">
						<label className="flex items-center">
			<input 
				type="checkbox" 
				className="mr-2"
				checked={localScoring.showScore}
				onChange={(e) => setLocalScoring({ 
					...localScoring, 
					showScore: e.target.checked
				})}
			/>
			<span className="text-sm text-gray-700">Show Score</span>
						</label>
						<label className="flex items-center">
			<input 
				type="checkbox" 
				className="mr-2"
				checked={localScoring.showCorrectAnswers}
				onChange={(e) => setLocalScoring({ 
					...localScoring, 
					showCorrectAnswers: e.target.checked
				})}
			/>
			<span className="text-sm text-gray-700">Show Correct Answers</span>
						</label>
						<label className="flex items-center">
			<input 
				type="checkbox" 
				className="mr-2"
				checked={localScoring.showScoreBreakdown}
				onChange={(e) => setLocalScoring({ 
					...localScoring, 
					showScoreBreakdown: e.target.checked
				})}
			/>
			<span className="text-sm text-gray-700">Show Score Breakdown</span>
						</label>
					</div>
					
					<div className="flex justify-end space-x-3 pt-4 border-t">
						<button 
			className="btn-secondary"
			onClick={() => setShowScoringModal(false)}
						>
			Cancel
						</button>
						<button 
			className="btn-primary"
			onClick={() => updateScoringSettings(selectedSurvey._id, localScoring)}
			disabled={loading}
						>
			{loading ? 'Saving...' : 'Save Settings'}
						</button>
					</div>
				</div>
			</Modal>
		);
	}
};

export default Admin;
