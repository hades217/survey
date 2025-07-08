import { useEffect } from 'react';
import axios from 'axios';
import { useAdmin } from '../contexts/AdminContext';
import { Survey, EnhancedStats } from '../types/admin';

export const useSurveys = () => {
	const {
		surveys,
		setSurveys,
		selectedSurvey,
		setSelectedSurvey,
		newSurvey,
		setNewSurvey,
		editForm,
		setEditForm,
		questionForms,
		setQuestionForms,
		editingQuestions,
		setEditingQuestions,
		showCreateModal,
		setShowCreateModal,
		showEditModal,
		setShowEditModal,
		showScoringModal,
		setShowScoringModal,
		stats,
		setStats,
		statsView,
		setStatsView,
		loading,
		setLoading,
		error,
		setError,
		loggedIn,
		tab,
		setTab,
		navigate,
		location,
	} = useAdmin();

	// Load surveys
	useEffect(() => {
		if (loggedIn) {
			loadSurveys();
		}
	}, [loggedIn]);

	// Handle URL routing
	useEffect(() => {
		if (!loggedIn) return;
		
		const path = location.pathname;
		if (path.startsWith('/admin/survey/')) {
			const surveyId = path.split('/').pop();
			if (surveyId) {
				if (tab !== 'detail') {
					setTab('detail');
				}
				if (!selectedSurvey || selectedSurvey._id !== surveyId) {
					const survey = surveys.find(s => s._id === surveyId);
					if (survey) {
						setSelectedSurvey(survey);
					}
				}
			}
		}
	}, [location.pathname, loggedIn, surveys, selectedSurvey, tab]);

	const loadSurveys = async () => {
		try {
			const response = await axios.get('/api/admin/surveys');
			setSurveys(response.data);
		} catch (err) {
			console.error('Error loading surveys:', err);
			setError('Failed to load surveys');
		}
	};

	const createSurvey = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError('');
		try {
			// Use status field directly
			const surveyData = {
				...newSurvey,
				// Ensure isActive matches status for backward compatibility
				isActive: newSurvey.status === 'active'
			};
			
			const response = await axios.post('/api/admin/surveys', surveyData);
			setSurveys([...surveys, response.data]);
			setNewSurvey({
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
			setShowCreateModal(false);
		} catch (err: any) {
			setError(err.response?.data?.error || 'Failed to create survey');
		} finally {
			setLoading(false);
		}
	};

	const updateSurvey = async (surveyId: string, surveyData: any) => {
		try {
			// Use status field directly and ensure isActive matches
			const dataToSend = {
				...surveyData,
				// Ensure isActive matches status for backward compatibility
				isActive: surveyData.status === 'active'
			};
			
			const response = await axios.put(`/api/admin/surveys/${surveyId}`, dataToSend);
			const updatedSurvey = response.data;
			setSurveys(surveys.map(s => s._id === surveyId ? updatedSurvey : s));
			if (selectedSurvey?._id === surveyId) {
				setSelectedSurvey(updatedSurvey);
			}
			return updatedSurvey;
		} catch (err: any) {
			setError(err.response?.data?.error || 'Failed to update survey');
			throw err;
		}
	};

	const deleteSurvey = async (surveyId: string) => {
		if (!window.confirm('Are you sure you want to delete this survey?')) return;
		
		try {
			await axios.delete(`/api/admin/surveys/${surveyId}`);
			setSurveys(surveys.filter(s => s._id !== surveyId));
			if (selectedSurvey?._id === surveyId) {
				setSelectedSurvey(null);
				setTab('list');
				navigate('/admin');
			}
		} catch (err: any) {
			setError(err.response?.data?.error || 'Failed to delete survey');
		}
	};

	const toggleSurveyStatus = async (surveyId: string) => {
		try {
			const response = await axios.put(`/api/admin/surveys/${surveyId}/toggle-status`);
			const updatedSurvey = response.data;
			setSurveys(surveys.map(s => s._id === surveyId ? updatedSurvey : s));
			if (selectedSurvey?._id === surveyId) {
				setSelectedSurvey(updatedSurvey);
			}
		} catch (err: any) {
			setError(err.response?.data?.error || 'Failed to toggle survey status');
		}
	};

	const handleSurveyClick = (survey: Survey) => {
		setSelectedSurvey(survey);
		setTab('detail');
		navigate(`/admin/survey/${survey._id}`);
	};

	const handleBackToList = () => {
		setSelectedSurvey(null);
		setTab('list');
		navigate('/admin');
	};

	const openEditModal = (survey: Survey) => {
		setEditForm({
			title: survey.title,
			description: survey.description,
			slug: survey.slug,
			type: survey.type,
			questions: survey.questions,
			status: survey.status || 'draft',
			timeLimit: survey.timeLimit,
			maxAttempts: survey.maxAttempts,
			instructions: survey.instructions,
			navigationMode: survey.navigationMode,
			sourceType: survey.sourceType,
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

	const closeEditModal = () => {
		setShowEditModal(false);
		setEditForm({
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
	};

	const loadStats = async (surveyId: string) => {
		try {
			const response = await axios.get(`/api/admin/surveys/${surveyId}/statistics`);
			setStats(prev => ({
				...prev,
				[surveyId]: response.data
			}));
		} catch (err: any) {
			setError(err.response?.data?.error || 'Failed to load statistics');
		}
	};

	const addQuestion = async (surveyId: string) => {
		const form = questionForms[surveyId];
		if (!form || !form.text || form.options.filter(opt => opt.trim()).length < 2) {
			setError('Please fill in all required fields');
			return;
		}

		try {
			const response = await axios.put(`/api/admin/surveys/${surveyId}/questions`, form);
			const updatedSurvey = response.data;
			setSurveys(surveys.map(s => s._id === surveyId ? updatedSurvey : s));
			if (selectedSurvey?._id === surveyId) {
				setSelectedSurvey(updatedSurvey);
			}
			
			// Reset form
			setQuestionForms(prev => ({
				...prev,
				[surveyId]: { 
					text: '', 
					options: [],
					type: 'single_choice',
					correctAnswer: undefined,
					points: undefined 
				}
			}));
		} catch (err: any) {
			setError(err.response?.data?.error || 'Failed to add question');
		}
	};

	const updateQuestion = async (surveyId: string, questionIndex: number, questionData: any) => {
		try {
			const response = await axios.put(`/api/admin/surveys/${surveyId}/questions/${questionIndex}`, questionData);
			const updatedSurvey = response.data;
			setSurveys(surveys.map(s => s._id === surveyId ? updatedSurvey : s));
			if (selectedSurvey?._id === surveyId) {
				setSelectedSurvey(updatedSurvey);
			}
			return updatedSurvey;
		} catch (err: any) {
			setError(err.response?.data?.error || 'Failed to update question');
			throw err;
		}
	};

	const deleteQuestion = async (surveyId: string, questionIndex: number) => {
		if (!window.confirm('Are you sure you want to delete this question?')) return;
		
		try {
			const response = await axios.delete(`/api/admin/surveys/${surveyId}/questions/${questionIndex}`);
			const updatedSurvey = response.data;
			setSurveys(surveys.map(s => s._id === surveyId ? updatedSurvey : s));
			if (selectedSurvey?._id === surveyId) {
				setSelectedSurvey(updatedSurvey);
			}
		} catch (err: any) {
			setError(err.response?.data?.error || 'Failed to delete question');
		}
	};

	return {
		surveys,
		selectedSurvey,
		newSurvey,
		setNewSurvey,
		editForm,
		setEditForm,
		questionForms,
		setQuestionForms,
		editingQuestions,
		setEditingQuestions,
		showCreateModal,
		setShowCreateModal,
		showEditModal,
		setShowEditModal,
		showScoringModal,
		setShowScoringModal,
		stats,
		statsView,
		setStatsView,
		loading,
		error,
		setError,
		// Functions
		createSurvey,
		updateSurvey,
		deleteSurvey,
		toggleSurveyStatus,
		handleSurveyClick,
		handleBackToList,
		openEditModal,
		closeEditModal,
		loadStats,
		addQuestion,
		updateQuestion,
		deleteQuestion,
	};
};