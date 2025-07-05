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
	questions: { text: string; options: string[] }[];
	createdAt: string;
	isActive: boolean;
}

interface StatsItem {
	question: string;
	options: Record<string, number>;
}

type TabType = 'list' | 'detail';

const Admin: React.FC = () => {
	const { id: surveyIdFromUrl } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const [loggedIn, setLoggedIn] = useState(false);
	const [loginForm, setLoginForm] = useState({ username: '', password: '' });
	const [surveys, setSurveys] = useState<Survey[]>([]);
	const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null);
	const [showCreateModal, setShowCreateModal] = useState(false);
	const [newSurvey, setNewSurvey] = useState({ title: '', description: '' });
	const [questionForms, setQuestionForms] = useState<Record<string, { text: string; options: string }>>({});
	const [stats, setStats] = useState<Record<string, StatsItem[]>>({});
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const [showQR, setShowQR] = useState<Record<string, boolean>>({});
	const [tab, setTab] = useState<TabType>('list');

	// 登录状态持久化
	useEffect(() => {
		const isLogged = localStorage.getItem('admin_logged_in');
		if (isLogged === 'true') {
			setLoggedIn(true);
			loadSurveys();
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
			await axios.post('/api/admin/login', loginForm);
			setLoggedIn(true);
			loadSurveys();
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

	const logout = async () => {
		await axios.get('/api/admin/logout');
		setLoggedIn(false);
		setSurveys([]);
		setTab('list');
		setSelectedSurvey(null);
		navigate('/admin');
	};

	const createSurvey = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		try {
			const res = await axios.post<Survey>('/api/admin/surveys', newSurvey);
			setSurveys([...surveys, res.data]);
			setNewSurvey({ title: '', description: '' });
			setShowCreateModal(false);
		} catch (err) {
			setError('Failed to create survey. Please try again.');
		} finally {
			setLoading(false);
		}
	};

	const handleQuestionChange = (id: string, field: string, value: string) => {
		setQuestionForms({
			...questionForms,
			[id]: { ...(questionForms[id] || { text: '', options: '' }), [field]: value },
		});
	};

	const addQuestion = async (surveyId: string) => {
		const q = questionForms[surveyId];
		if (!q || !q.text || !q.options) return;
		const options = q.options.split(',').map((o) => o.trim()).filter(Boolean);
		await axios.put(`/api/admin/surveys/${surveyId}/questions`, { text: q.text, options });
		loadSurveys();
		setQuestionForms({ ...questionForms, [surveyId]: { text: '', options: '' } });
	};

	const loadStats = async (surveyId: string) => {
		const res = await axios.get<StatsItem[]>(`/api/admin/surveys/${surveyId}/statistics`);
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
				Survey 列表
			</button>
			{selectedSurvey && (
				<button
					className={`py-2 px-4 font-semibold border-b-2 transition-colors ${tab === 'detail' ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-blue-600'}`}
					onClick={() => setTab('detail')}
				>
					详情
				</button>
			)}
		</div>
	);

	// Survey 列表
	const renderSurveyList = () => (
		<div className="space-y-4">
			{surveys.map((s) => (
				<div
					key={s._id}
					className="card cursor-pointer hover:shadow-xl transition-shadow"
					onClick={() => handleSurveyClick(s)}
				>
					<div className="flex justify-between items-center">
						<div>
							<h3 className="text-lg font-bold text-gray-800">{s.title}</h3>
							<div className="text-sm text-gray-500">{s.description}</div>
						</div>
						<span className={`px-2 py-1 text-xs font-medium rounded-full ${s.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{s.isActive ? 'Active' : 'Inactive'}</span>
					</div>
				</div>
			))}
		</div>
	);

	// Survey 详情
	const renderSurveyDetail = () => {
		if (!selectedSurvey) return null;
		const s = selectedSurvey;
		return (
			<div className="card">
				<div className="flex justify-between items-start mb-4">
					<div className="flex-1">
						<div className="flex items-center gap-3 mb-2">
							<h3 className="text-xl font-bold text-gray-800">{s.title}</h3>
							<span className={`px-2 py-1 text-xs font-medium rounded-full ${s.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{s.isActive ? 'Active' : 'Inactive'}</span>
						</div>
						{s.description && <p className="text-gray-600 mb-3">{s.description}</p>}
						<div className="text-sm text-gray-500">Created: {new Date(s.createdAt).toLocaleDateString()}</div>
					</div>
					<div className="flex gap-2">
						<button className="btn-secondary text-sm" onClick={() => toggleSurveyStatus(s._id, s.isActive)}>{s.isActive ? 'Deactivate' : 'Activate'}</button>
						<button className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors" onClick={() => deleteSurvey(s._id)}>Delete</button>
					</div>
				</div>
				<div className="bg-gray-50 rounded-lg p-4 mb-4">
					<div className="flex items-center justify-between mb-3">
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">Survey URL</label>
							<div className="text-sm text-gray-600 font-mono">{getSurveyUrl(s.slug)}</div>
						</div>
						<div className="flex gap-2">
							<button className="btn-secondary text-sm" onClick={() => copyToClipboard(getSurveyUrl(s.slug))}>Copy URL</button>
							<button className="btn-primary text-sm" onClick={() => toggleQR(s._id)}>{showQR[s._id] ? 'Hide QR' : 'Show QR'}</button>
						</div>
					</div>
					{showQR[s._id] && (
						<div className="border-t border-gray-200 pt-4">
							<QRCodeComponent url={getSurveyUrl(s.slug)} />
						</div>
					)}
				</div>
				<div className="mb-4">
					<h4 className="font-semibold text-gray-800 mb-3">Questions ({s.questions.length})</h4>
					{s.questions.length > 0 ? (
						<div className="space-y-2">
							{s.questions.map((q, idx) => (
								<div key={idx} className="bg-gray-50 rounded-lg p-3">
									<div className="font-medium text-gray-800 mb-1">{idx + 1}. {q.text}</div>
									<div className="text-sm text-gray-600">Options: {q.options.join(', ')}</div>
								</div>
							))}
						</div>
					) : (
						<p className="text-gray-500 text-sm">No questions added yet.</p>
					)}
				</div>
				<div className="border-t border-gray-200 pt-4">
					<h4 className="font-semibold text-gray-800 mb-3">Add Question</h4>
					<div className="grid md:grid-cols-2 gap-3 mb-3">
						<input className="input-field" placeholder="Question text" value={questionForms[s._id]?.text || ''} onChange={(e) => handleQuestionChange(s._id, 'text', e.target.value)} />
						<input className="input-field" placeholder="Options (comma separated)" value={questionForms[s._id]?.options || ''} onChange={(e) => handleQuestionChange(s._id, 'options', e.target.value)} />
					</div>
					<button className="btn-primary text-sm" onClick={() => addQuestion(s._id)} type="button">Add Question</button>
				</div>
				<div className="border-t border-gray-200 pt-4">
					<div className="flex justify-between items-center mb-3">
						<h4 className="font-semibold text-gray-800">Statistics</h4>
						<button className="btn-secondary text-sm" onClick={() => loadStats(s._id)} type="button">View Statistics</button>
					</div>
					{stats[s._id] && (
						<div className="space-y-4">
							{stats[s._id].map((st, idx) => (
								<div key={idx} className="bg-gray-50 rounded-lg p-4">
									<div className="font-semibold text-gray-800 mb-2">{st.question}</div>
									<div className="space-y-2">
										{Object.entries(st.options).map(([opt, count]) => (
											<div key={opt} className="flex justify-between items-center">
												<span className="text-gray-700">{opt}</span>
												<span className="font-medium text-blue-600">{count}</span>
											</div>
										))}
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			</div>
		);
	};

	// 创建 Survey 弹窗
	const renderCreateModal = () => (
		<Modal show={showCreateModal} title="创建 Survey" onClose={() => setShowCreateModal(false)}>
			<form onSubmit={createSurvey} className="space-y-4">
				<div>
					<label className="block text-sm font-medium text-gray-700 mb-2">Survey Title *</label>
					<input className="input-field" placeholder="Enter survey title" value={newSurvey.title} onChange={(e) => setNewSurvey({ ...newSurvey, title: e.target.value })} required />
				</div>
				<div>
					<label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
					<input className="input-field" placeholder="Enter survey description" value={newSurvey.description} onChange={(e) => setNewSurvey({ ...newSurvey, description: e.target.value })} />
				</div>
				<button className="btn-primary w-full" type="submit" disabled={loading}>{loading ? 'Creating...' : 'Create Survey'}</button>
			</form>
		</Modal>
	);

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
		<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
			<div className="w-full max-w-3xl mx-auto">
				<div className="flex justify-between items-center mb-8">
					<div>
						<h1 className="text-3xl font-bold text-gray-900">Survey Admin Dashboard</h1>
						<p className="text-gray-600 mt-1">Manage your surveys and view responses</p>
					</div>
					<div className="flex gap-3">
						<button 
							className="btn-primary"
							onClick={() => setShowCreateModal(true)}
						>
							+ 创建 Survey
						</button>
						<button className="btn-secondary" onClick={logout}>Logout</button>
					</div>
				</div>
				{renderTabs()}
				{tab === 'list' && renderSurveyList()}
				{tab === 'detail' && renderSurveyDetail()}
				{renderCreateModal()}
			</div>
		</div>
	);
};

export default Admin;
