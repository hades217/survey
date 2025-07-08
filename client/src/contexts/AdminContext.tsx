import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { 
	Survey, 
	QuestionBank, 
	Question, 
	EnhancedStats, 
	TabType, 
	StatsViewType, 
	QuestionForm, 
	LoginForm, 
	NewSurveyForm, 
	QuestionBankForm 
} from '../types/admin';

interface AdminContextType {
	// Authentication state
	loggedIn: boolean;
	loginForm: LoginForm;
	setLoginForm: React.Dispatch<React.SetStateAction<LoginForm>>;
	login: (e: React.FormEvent) => Promise<void>;
	logout: () => void;
	
	// Data state
	surveys: Survey[];
	setSurveys: React.Dispatch<React.SetStateAction<Survey[]>>;
	questionBanks: QuestionBank[];
	setQuestionBanks: React.Dispatch<React.SetStateAction<QuestionBank[]>>;
	
	// Selected items
	selectedSurvey: Survey | null;
	setSelectedSurvey: React.Dispatch<React.SetStateAction<Survey | null>>;
	selectedQuestionBankDetail: QuestionBank | null;
	setSelectedQuestionBankDetail: React.Dispatch<React.SetStateAction<QuestionBank | null>>;
	
	// Form state
	newSurvey: NewSurveyForm;
	setNewSurvey: React.Dispatch<React.SetStateAction<NewSurveyForm>>;
	editForm: NewSurveyForm;
	setEditForm: React.Dispatch<React.SetStateAction<NewSurveyForm>>;
	questionBankForm: QuestionBankForm;
	setQuestionBankForm: React.Dispatch<React.SetStateAction<QuestionBankForm>>;
	
	// Question forms
	questionForms: Record<string, QuestionForm>;
	setQuestionForms: React.Dispatch<React.SetStateAction<Record<string, QuestionForm>>>;
	questionBankQuestionForms: Record<string, QuestionForm>;
	setQuestionBankQuestionForms: React.Dispatch<React.SetStateAction<Record<string, QuestionForm>>>;
	questionBankQuestionEditForms: Record<string, QuestionForm>;
	setQuestionBankQuestionEditForms: React.Dispatch<React.SetStateAction<Record<string, QuestionForm>>>;
	
	// Editing state
	editingQuestions: Record<string, boolean>;
	setEditingQuestions: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
	editingQuestionBankQuestions: Record<string, boolean>;
	setEditingQuestionBankQuestions: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
	
	// UI state
	tab: TabType;
	setTab: React.Dispatch<React.SetStateAction<TabType>>;
	questionBankDetailTab: string;
	setQuestionBankDetailTab: React.Dispatch<React.SetStateAction<string>>;
	statsView: StatsViewType;
	setStatsView: React.Dispatch<React.SetStateAction<StatsViewType>>;
	
	// Modal state
	showCreateModal: boolean;
	setShowCreateModal: React.Dispatch<React.SetStateAction<boolean>>;
	showEditModal: boolean;
	setShowEditModal: React.Dispatch<React.SetStateAction<boolean>>;
	showQuestionBankModal: boolean;
	setShowQuestionBankModal: React.Dispatch<React.SetStateAction<boolean>>;
	showScoringModal: boolean;
	setShowScoringModal: React.Dispatch<React.SetStateAction<boolean>>;
	showQR: Record<string, boolean>;
	setShowQR: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
	
	// Loading and error state
	loading: boolean;
	setLoading: React.Dispatch<React.SetStateAction<boolean>>;
	error: string;
	setError: React.Dispatch<React.SetStateAction<string>>;
	
	// Statistics
	stats: Record<string, EnhancedStats>;
	setStats: React.Dispatch<React.SetStateAction<Record<string, EnhancedStats>>>;
	
	// Utility functions
	copyToClipboard: (text: string) => void;
	navigate: (path: string) => void;
	location: any;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const useAdmin = () => {
	const context = useContext(AdminContext);
	if (!context) {
		throw new Error('useAdmin must be used within AdminProvider');
	}
	return context;
};

interface AdminProviderProps {
	children: ReactNode;
}

export const AdminProvider: React.FC<AdminProviderProps> = ({ children }) => {
	const navigate = useNavigate();
	const location = useLocation();
	
	// Authentication state
	const [loggedIn, setLoggedIn] = useState(false);
	const [loginForm, setLoginForm] = useState<LoginForm>({ username: '', password: '' });
	
	// Data state
	const [surveys, setSurveys] = useState<Survey[]>([]);
	const [questionBanks, setQuestionBanks] = useState<QuestionBank[]>([]);
	
	// Selected items
	const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null);
	const [selectedQuestionBankDetail, setSelectedQuestionBankDetail] = useState<QuestionBank | null>(null);
	
	// Form state
	const [newSurvey, setNewSurvey] = useState<NewSurveyForm>({
		title: '',
		description: '',
		slug: '',
		type: 'survey',
		questions: [],
		status: 'draft',
		timeLimit: undefined,
		maxAttempts: undefined,
		instructions: '',
		navigationMode: 'step-by-step',
		sourceType: 'manual',
		questionBankId: undefined,
		questionCount: undefined,
		scoringSettings: {
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
	
	const [editForm, setEditForm] = useState<NewSurveyForm>({
		title: '',
		description: '',
		slug: '',
		type: 'survey',
		questions: [],
		status: 'draft',
		timeLimit: undefined,
		maxAttempts: undefined,
		instructions: '',
		navigationMode: 'step-by-step',
		sourceType: 'manual',
		questionBankId: undefined,
		questionCount: undefined,
		scoringSettings: {
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
	
	const [questionBankForm, setQuestionBankForm] = useState<QuestionBankForm>({
		name: '',
		description: '',
	});
	
	// Question forms
	const [questionForms, setQuestionForms] = useState<Record<string, QuestionForm>>({});
	const [questionBankQuestionForms, setQuestionBankQuestionForms] = useState<Record<string, QuestionForm>>({});
	const [questionBankQuestionEditForms, setQuestionBankQuestionEditForms] = useState<Record<string, QuestionForm>>({});
	
	// Editing state
	const [editingQuestions, setEditingQuestions] = useState<Record<string, boolean>>({});
	const [editingQuestionBankQuestions, setEditingQuestionBankQuestions] = useState<Record<string, boolean>>({});
	
	// UI state
	const [tab, setTab] = useState<TabType>('list');
	const [questionBankDetailTab, setQuestionBankDetailTab] = useState('list');
	const [statsView, setStatsView] = useState<StatsViewType>('aggregated');
	
	// Modal state
	const [showCreateModal, setShowCreateModal] = useState(false);
	const [showEditModal, setShowEditModal] = useState(false);
	const [showQuestionBankModal, setShowQuestionBankModal] = useState(false);
	const [showScoringModal, setShowScoringModal] = useState(false);
	const [showQR, setShowQR] = useState<Record<string, boolean>>({});
	
	// Loading and error state
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	
	// Statistics
	const [stats, setStats] = useState<Record<string, EnhancedStats>>({});
	
	// Check authentication on mount
	useEffect(() => {
		const checkAuth = async () => {
			try {
				const response = await axios.get('/api/admin/check-auth');
				console.log('Auth check response:', response);
				setLoggedIn(true);
			} catch (err) {
				console.log('Auth check failed:', err);
				setLoggedIn(false);
			}
		};
		checkAuth();
	}, []);
	
	// Authentication functions
	const login = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError('');
		try {
			const response = await axios.post('/api/admin/login', loginForm);
			if (response.data.success) {
				setLoggedIn(true);
				setLoginForm({ username: '', password: '' });
			} else {
				setError(response.data.error || 'Login failed');
			}
		} catch (err: any) {
			setError(err.response?.data?.error || 'Login failed');
		} finally {
			setLoading(false);
		}
	};
	
	const logout = async () => {
		try {
			await axios.get('/api/admin/logout');
			setLoggedIn(false);
			setSelectedSurvey(null);
			setSelectedQuestionBankDetail(null);
			setTab('list');
			navigate('/admin');
		} catch (err) {
			console.error('Logout error:', err);
		}
	};
	
	// Utility functions
	const copyToClipboard = (text: string) => {
		navigator.clipboard.writeText(text);
	};
	
	const value: AdminContextType = {
		// Authentication
		loggedIn,
		loginForm,
		setLoginForm,
		login,
		logout,
		
		// Data
		surveys,
		setSurveys,
		questionBanks,
		setQuestionBanks,
		
		// Selected items
		selectedSurvey,
		setSelectedSurvey,
		selectedQuestionBankDetail,
		setSelectedQuestionBankDetail,
		
		// Forms
		newSurvey,
		setNewSurvey,
		editForm,
		setEditForm,
		questionBankForm,
		setQuestionBankForm,
		
		// Question forms
		questionForms,
		setQuestionForms,
		questionBankQuestionForms,
		setQuestionBankQuestionForms,
		questionBankQuestionEditForms,
		setQuestionBankQuestionEditForms,
		
		// Editing state
		editingQuestions,
		setEditingQuestions,
		editingQuestionBankQuestions,
		setEditingQuestionBankQuestions,
		
		// UI state
		tab,
		setTab,
		questionBankDetailTab,
		setQuestionBankDetailTab,
		statsView,
		setStatsView,
		
		// Modal state
		showCreateModal,
		setShowCreateModal,
		showEditModal,
		setShowEditModal,
		showQuestionBankModal,
		setShowQuestionBankModal,
		showScoringModal,
		setShowScoringModal,
		showQR,
		setShowQR,
		
		// Loading and error
		loading,
		setLoading,
		error,
		setError,
		
		// Statistics
		stats,
		setStats,
		
		// Utilities
		copyToClipboard,
		navigate,
		location,
	};
	
	return (
		<AdminContext.Provider value={value}>
			{children}
		</AdminContext.Provider>
	);
};