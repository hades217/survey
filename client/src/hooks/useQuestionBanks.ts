import { useEffect } from 'react';
import axios from 'axios';
import { useAdmin } from '../contexts/AdminContext';
import { QuestionBank, Question } from '../types/admin';

export const useQuestionBanks = () => {
	const {
		questionBanks,
		setQuestionBanks,
		selectedQuestionBankDetail,
		setSelectedQuestionBankDetail,
		questionBankForm,
		setQuestionBankForm,
		questionBankQuestionForms,
		setQuestionBankQuestionForms,
		questionBankQuestionEditForms,
		setQuestionBankQuestionEditForms,
		editingQuestionBankQuestions,
		setEditingQuestionBankQuestions,
		showQuestionBankModal,
		setShowQuestionBankModal,
		questionBankDetailTab,
		setQuestionBankDetailTab,
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

	// Load question banks
	useEffect(() => {
		if (loggedIn) {
			loadQuestionBanks();
		}
	}, [loggedIn]);

	// Handle URL routing for question banks
	useEffect(() => {
		if (!loggedIn || questionBanks.length === 0) return;
		
		const path = location.pathname;
		if (path.startsWith('/admin/question-bank/')) {
			const questionBankId = path.split('/').pop();
			if (questionBankId && !selectedQuestionBankDetail) {
				const questionBank = questionBanks.find(qb => qb._id === questionBankId);
				if (questionBank) {
					setSelectedQuestionBankDetail(questionBank);
				} else {
					navigate('/admin/question-banks');
				}
			}
		}
	}, [questionBanks, loggedIn, location.pathname, selectedQuestionBankDetail]);

	// Set tab based on current path
	useEffect(() => {
		if (!loggedIn) return;
		
		const path = location.pathname;
		if (path === '/admin/question-banks' || path.startsWith('/admin/question-bank/')) {
			if (tab !== 'question-banks') {
				setTab('question-banks');
			}
		}
	}, [location.pathname, loggedIn, tab]);

	const loadQuestionBanks = async () => {
		try {
			const response = await axios.get('/api/admin/question-banks');
			setQuestionBanks(response.data);
		} catch (err) {
			console.error('Error loading question banks:', err);
			setError('Failed to load question banks');
		}
	};

	const createQuestionBank = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError('');
		try {
			const response = await axios.post('/api/admin/question-banks', questionBankForm);
			setQuestionBanks([...questionBanks, response.data]);
			setQuestionBankForm({ name: '', description: '' });
			setShowQuestionBankModal(false);
		} catch (err: any) {
			setError(err.response?.data?.error || 'Failed to create question bank');
		} finally {
			setLoading(false);
		}
	};

	const updateQuestionBank = async (questionBankId: string, data: { name: string; description: string }) => {
		setLoading(true);
		setError('');
		try {
			const response = await axios.put(`/api/admin/question-banks/${questionBankId}`, data);
			const updatedQuestionBank = response.data;
			
			setQuestionBanks(prev => 
				prev.map(qb => qb._id === questionBankId ? updatedQuestionBank : qb)
			);
			
			if (selectedQuestionBankDetail?._id === questionBankId) {
				setSelectedQuestionBankDetail(updatedQuestionBank);
			}
			
			return updatedQuestionBank;
		} catch (err: any) {
			setError(err.response?.data?.error || 'Failed to update question bank');
			throw err;
		} finally {
			setLoading(false);
		}
	};

	const deleteQuestionBank = async (questionBankId: string) => {
		if (!window.confirm('Are you sure you want to delete this question bank?')) return;
		
		try {
			await axios.delete(`/api/admin/question-banks/${questionBankId}`);
			setQuestionBanks(questionBanks.filter(qb => qb._id !== questionBankId));
			if (selectedQuestionBankDetail?._id === questionBankId) {
				setSelectedQuestionBankDetail(null);
				setTab('question-banks');
				navigate('/admin/question-banks');
			}
		} catch (err: any) {
			setError(err.response?.data?.error || 'Failed to delete question bank');
		}
	};

	const handleQuestionBankClick = (questionBank: QuestionBank) => {
		console.log('Clicking question bank:', questionBank.name, questionBank._id);
		setSelectedQuestionBankDetail(questionBank);
		setQuestionBankDetailTab('detail');
		navigate(`/admin/question-bank/${questionBank._id}`);
	};

	const handleQuestionBankBackToList = () => {
		setSelectedQuestionBankDetail(null);
		setQuestionBankDetailTab('list');
		navigate('/admin/question-banks');
	};

	const addQuestionBankQuestion = async (questionBankId: string) => {
		const currentForm = questionBankQuestionForms[questionBankId];
		if (!currentForm || !currentForm.text.trim() || currentForm.options.length < 2) {
			setError('Please fill in all required fields');
			return;
		}

		try {
			const response = await axios.post(`/api/admin/question-banks/${questionBankId}/questions`, currentForm);
			const updatedQuestionBank = response.data;
			
			setQuestionBanks(prev => 
				prev.map(qb => qb._id === questionBankId ? updatedQuestionBank : qb)
			);
			
			if (selectedQuestionBankDetail?._id === questionBankId) {
				setSelectedQuestionBankDetail(updatedQuestionBank);
			}
			
			setQuestionBankQuestionForms(prev => ({
				...prev,
				[questionBankId]: { text: '', options: [], type: 'single_choice' as const },
			}));
		} catch (err: any) {
			console.error('Error adding question to question bank:', err);
			setError(err.response?.data?.error || 'Failed to add question');
		}
	};

	const updateQuestionBankQuestion = async (questionBankId: string, questionId: string) => {
		const formKey = `${questionBankId}-${questionId}`;
		const currentForm = questionBankQuestionEditForms[formKey];
		if (!currentForm) return;

		try {
			const response = await axios.put(`/api/admin/question-banks/${questionBankId}/questions/${questionId}`, currentForm);
			const updatedQuestionBank = response.data;
			
			setQuestionBanks(prev => 
				prev.map(qb => qb._id === questionBankId ? updatedQuestionBank : qb)
			);
			
			if (selectedQuestionBankDetail?._id === questionBankId) {
				setSelectedQuestionBankDetail(updatedQuestionBank);
			}
			
			setEditingQuestionBankQuestions(prev => ({
				...prev,
				[formKey]: false,
			}));
		} catch (err: any) {
			console.error('Error updating question bank question:', err);
			setError(err.response?.data?.error || 'Failed to update question');
		}
	};

	const deleteQuestionBankQuestion = async (questionBankId: string, questionId: string) => {
		if (!window.confirm('Are you sure you want to delete this question?')) return;
		
		try {
			const response = await axios.delete(`/api/admin/question-banks/${questionBankId}/questions/${questionId}`);
			const updatedQuestionBank = response.data;
			
			setQuestionBanks(prev => 
				prev.map(qb => qb._id === questionBankId ? updatedQuestionBank : qb)
			);
			
			if (selectedQuestionBankDetail?._id === questionBankId) {
				setSelectedQuestionBankDetail(updatedQuestionBank);
			}
		} catch (err: any) {
			console.error('Error deleting question bank question:', err);
			setError(err.response?.data?.error || 'Failed to delete question');
		}
	};

	const startEditQuestionBankQuestion = (questionBankId: string, questionIndex: number, question: Question) => {
		const formKey = `${questionBankId}-${questionIndex}`;
		setQuestionBankQuestionEditForms(prev => ({
			...prev,
			[formKey]: {
				text: question.text,
				options: [...question.options],
				type: question.type,
				correctAnswer: question.correctAnswer,
				points: question.points,
				explanation: question.explanation,
				tags: question.tags,
				difficulty: question.difficulty,
			},
		}));
		setEditingQuestionBankQuestions(prev => ({
			...prev,
			[formKey]: true,
		}));
	};

	const cancelEditQuestionBankQuestion = (questionBankId: string, questionIndex: number) => {
		const formKey = `${questionBankId}-${questionIndex}`;
		setEditingQuestionBankQuestions(prev => ({
			...prev,
			[formKey]: false,
		}));
		setQuestionBankQuestionEditForms(prev => {
			const newForms = { ...prev };
			delete newForms[formKey];
			return newForms;
		});
	};

	const saveQuestionBankQuestionEdit = async (questionBankId: string, questionIndex: number) => {
		const formKey = `${questionBankId}-${questionIndex}`;
		const currentForm = questionBankQuestionEditForms[formKey];
		if (!currentForm) return;

		if (!selectedQuestionBankDetail) return;
		const question = selectedQuestionBankDetail.questions[questionIndex];
		if (!question) return;

		await updateQuestionBankQuestion(questionBankId, question._id);
	};

	return {
		questionBanks,
		selectedQuestionBankDetail,
		questionBankForm,
		setQuestionBankForm,
		questionBankQuestionForms,
		setQuestionBankQuestionForms,
		questionBankQuestionEditForms,
		setQuestionBankQuestionEditForms,
		editingQuestionBankQuestions,
		setEditingQuestionBankQuestions,
		showQuestionBankModal,
		setShowQuestionBankModal,
		questionBankDetailTab,
		setQuestionBankDetailTab,
		loading,
		error,
		setError,
		// Functions
		createQuestionBank,
		updateQuestionBank,
		deleteQuestionBank,
		handleQuestionBankClick,
		handleQuestionBankBackToList,
		addQuestionBankQuestion,
		updateQuestionBankQuestion,
		deleteQuestionBankQuestion,
		startEditQuestionBankQuestion,
		cancelEditQuestionBankQuestion,
		saveQuestionBankQuestionEdit,
	};
};