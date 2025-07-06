import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import type { SurveyResponse } from '../../shared/surveyResponse';

interface Survey {
  _id: string;
  title: string;
  description: string;
  slug: string;
  type: 'survey' | 'assessment' | 'quiz' | 'iq';
  questions: { _id: string; text: string; options: string[]; correctAnswer?: number }[];
  status?: 'draft' | 'active' | 'closed';
  timeLimit?: number;
  maxAttempts?: number;
  instructions?: string;
  navigationMode?: 'step-by-step' | 'paginated' | 'all-in-one';
}

interface FormState {
  name: string;
  email: string;
  answers: Record<string, string>;
}

interface AssessmentResult {
  questionId: string;
  questionText: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
}

const TakeSurvey: React.FC = () => {
	const { slug } = useParams<{ slug: string }>();
	const navigate = useNavigate();
	const [surveys, setSurveys] = useState<Survey[]>([]);
	const [survey, setSurvey] = useState<Survey | null>(null);
	const [form, setForm] = useState<FormState>({ name: '', email: '', answers: {} });
	const [submitted, setSubmitted] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const [assessmentResults, setAssessmentResults] = useState<AssessmentResult[]>([]);

	useEffect(() => {
		// If slug is provided, fetch that specific survey
		if (slug) {
			setLoading(true);
			axios.get<Survey>(`/api/survey/${slug}`)
				.then(res => {
					console.log('Survey data received:', res.data);
					console.log('Questions length:', res.data.questions?.length);
					setSurvey(res.data);
				})
				.catch(err => {
					setError('Survey not found');
					console.error('Error fetching survey:', err);
				})
				.finally(() => setLoading(false));
		} else {
			// Otherwise fetch all surveys for selection
			axios.get<Survey[]>('/api/surveys').then(res => setSurveys(res.data));
		}
	}, [slug]);


	const handleAnswerChange = (qid: string, value: string) => {
		setForm({ ...form, answers: { ...form.answers, [qid]: value } });
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!survey) return;
		
		setLoading(true);
		try {
			const payload: SurveyResponse = {
				name: form.name,
				email: form.email,
				surveyId: survey._id,
				answers: survey.questions.map((q) => form.answers[q._id]),
			};
			await axios.post(`/api/surveys/${survey._id}/responses`, payload);
			
			// Calculate assessment results if this is an assessment, quiz, or iq test
			if (['assessment', 'quiz', 'iq'].includes(survey.type)) {
				const results: AssessmentResult[] = survey.questions.map((q: { _id: string; text: string; options: string[]; correctAnswer?: number }) => {
					const userAnswer = form.answers[q._id];
					const correctAnswer = q.correctAnswer !== undefined ? q.options[q.correctAnswer] : '';
					return {
						questionId: q._id,
						questionText: q.text,
						userAnswer: userAnswer || '',
						correctAnswer: correctAnswer,
						isCorrect: userAnswer === correctAnswer
					};
				});
				setAssessmentResults(results);
			}
			
			setSubmitted(true);
		} catch (err) {
			setError('Failed to submit survey. Please try again.');
			console.error('Error submitting survey:', err);
		} finally {
			setLoading(false);
		}
	};

	if (loading) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
					<p className="text-gray-600">Loading survey...</p>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
				<div className="card max-w-md mx-auto text-center">
					<div className="text-red-500 text-6xl mb-4">⚠️</div>
					<h2 className="text-2xl font-bold text-gray-800 mb-2">Survey Not Found</h2>
					<p className="text-gray-600 mb-6">{error}</p>
					<button 
						onClick={() => navigate('/')}
						className="btn-primary"
					>
						Go to Home
					</button>
				</div>
			</div>
		);
	}

	// Check if survey is not active
	if (survey && survey.status && survey.status !== 'active') {
		return (
			<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
				<div className="card max-w-md mx-auto text-center">
					<div className="text-yellow-500 text-6xl mb-4">🚫</div>
					<h2 className="text-2xl font-bold text-gray-800 mb-2">Survey Unavailable</h2>
					<p className="text-gray-600 mb-6">
						{survey.status === 'draft' 
							? '此问卷尚未开放。' 
							: '此问卷已关闭。'
						}
					</p>
					<button 
						onClick={() => navigate('/')}
						className="btn-primary"
					>
						Go to Home
					</button>
				</div>
			</div>
		);
	}

	// Check if survey has no questions
	if (survey && (!survey.questions || survey.questions.length === 0)) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
				<div className="card max-w-md mx-auto text-center">
					<div className="text-orange-500 text-6xl mb-4">📝</div>
					<h2 className="text-2xl font-bold text-gray-800 mb-2">Survey In Progress</h2>
					<p className="text-gray-600 mb-6">
						This survey is still being prepared. Please check back later.
					</p>
					<div className="mb-4 p-3 bg-gray-100 rounded text-left text-xs">
						<strong>Debug Info:</strong><br/>
						Survey: {survey ? 'loaded' : 'null'}<br/>
						Questions: {survey?.questions ? `array(${survey.questions.length})` : 'undefined'}<br/>
						Status: {survey?.status || 'undefined'}
					</div>
					<button 
						onClick={() => navigate('/')}
						className="btn-primary"
					>
						Go to Home
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
			<div className={`mx-auto px-4 ${slug ? 'max-w-2xl' : 'max-w-6xl'}`}>
				{!slug && (
					<div className="mb-8">
						<div className="text-center mb-8">
							<h1 className="text-4xl font-bold text-gray-800 mb-4">Available Surveys</h1>
							<p className="text-gray-600 text-lg">Choose a survey to participate in</p>
						</div>
						
						{surveys.length === 0 ? (
							<div className="card text-center">
								<div className="text-gray-400 text-6xl mb-4">📝</div>
								<h3 className="text-xl font-semibold text-gray-700 mb-2">No Surveys Available</h3>
								<p className="text-gray-500">There are currently no active surveys to participate in.</p>
							</div>
						) : (
							<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
								{surveys.map(s => (
									<div key={s._id} className="card border-2 border-transparent hover:border-blue-200 hover:shadow-xl transition-all duration-200">
										<div className="mb-4">
											<div className="flex items-center gap-2 mb-2">
												<h3 className="text-xl font-bold text-gray-800">{s.title}</h3>
												<span className={`px-2 py-1 text-xs font-medium rounded-full ${
													s.type === 'assessment' ? 'bg-blue-100 text-blue-800' : 
													s.type === 'quiz' ? 'bg-green-100 text-green-800' :
													s.type === 'iq' ? 'bg-purple-100 text-purple-800' :
													'bg-gray-100 text-gray-800'
												}`}>
													{s.type === 'assessment' ? '测评' : 
													 s.type === 'quiz' ? '测验' :
													 s.type === 'iq' ? 'IQ测试' : '调研'}
												</span>
											</div>
											{s.description && (
												<p className="text-gray-600 text-sm line-clamp-3">{s.description}</p>
											)}
										</div>
										<div className="flex flex-col gap-2">
											{/* Enhanced Assessment Interface for quiz/assessment/iq */}
											{['quiz', 'assessment', 'iq'].includes(s.type) && (
												<button 
													onClick={() => navigate(`/assessment/${s.slug || s._id}`)}
													className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
												>
													开始增强版测评 →
												</button>
											)}
											{/* Regular Interface */}
											<button 
												onClick={() => navigate(`/survey/${s.slug || s._id}`)}
												className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
											>
												{s.type === 'assessment' ? '经典版测评' : 
												 s.type === 'quiz' ? '经典版测验' :
												 s.type === 'iq' ? '经典版IQ测试' : '开始调研'} →
											</button>
										</div>
									</div>
								))}
							</div>
						)}
					</div>
				)}

				{survey && !submitted && (
					<div className="card">
						<div className="mb-8">
							<h1 className="text-3xl font-bold text-gray-800 mb-2">{survey.title}</h1>
							{survey.description && (
								<p className="text-gray-600 text-lg">{survey.description}</p>
							)}
						</div>

						<form onSubmit={handleSubmit} className="space-y-6">
							<div className="grid md:grid-cols-2 gap-6">
								<div>
									<label className="block mb-2 font-semibold text-gray-700">Full Name *</label>
									<input
										className="input-field"
										value={form.name}
										onChange={e => setForm({ ...form, name: e.target.value })}
										required
										placeholder="Enter your full name"
									/>
								</div>
								<div>
									<label className="block mb-2 font-semibold text-gray-700">Email Address *</label>
									<input
										type="email"
										className="input-field"
										value={form.email}
										onChange={e => setForm({ ...form, email: e.target.value })}
										required
										placeholder="Enter your email"
									/>
								</div>
							</div>

							<div className="space-y-6">
								<h3 className="text-xl font-semibold text-gray-800 border-b border-gray-200 pb-2">
									Questions
								</h3>
								{survey.questions.map((q, index) => (
									<div key={q._id} className="bg-gray-50 rounded-lg p-6">
										<label className="block mb-4 font-semibold text-gray-800 text-lg">
											{index + 1}. {q.text}
										</label>
										<div className="space-y-3">
											{q.options.map(opt => (
												<label key={opt} className="flex items-center p-3 bg-white rounded-lg border border-gray-200 hover:border-primary-300 cursor-pointer transition-colors">
													<input
														type="radio"
														name={q._id}
														className="mr-3 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
														value={opt}
														onChange={() => handleAnswerChange(q._id, opt)}
														required
													/>
													<span className="text-gray-700">{opt}</span>
												</label>
											))}
										</div>
									</div>
								))}
							</div>

							<div className="flex justify-end pt-6 border-t border-gray-200">
								<button 
									className="btn-primary px-8 py-3 text-lg"
									type="submit"
									disabled={loading}
								>
									{loading ? 'Submitting...' : 'Submit Survey'}
								</button>
							</div>
						</form>
					</div>
				)}

				{submitted && (
					<div className="card">
						{['assessment', 'quiz', 'iq'].includes(survey?.type || '') && assessmentResults.length > 0 ? (
							<div>
								<div className="text-center mb-6">
									<div className="text-blue-500 text-6xl mb-4">📊</div>
									<h2 className="text-3xl font-bold text-gray-800 mb-2">Assessment Results</h2>
									<div className="text-lg text-gray-600 mb-4">
										Your score: {assessmentResults.filter(r => r.isCorrect).length} / {assessmentResults.length}
									</div>
								</div>
								
								<div className="space-y-4 mb-6">
									{assessmentResults.map((result, index) => (
										<div key={result.questionId} className={`p-4 rounded-lg border-2 ${result.isCorrect ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'}`}>
											<div className="flex items-center gap-2 mb-2">
												<span className={`text-2xl ${result.isCorrect ? 'text-green-600' : 'text-red-600'}`}>
													{result.isCorrect ? '✅' : '❌'}
												</span>
												<div className="font-semibold text-gray-800">
													{index + 1}. {result.questionText}
												</div>
											</div>
											<div className="space-y-1 text-sm">
												<div className="text-gray-700">
													<span className="font-medium">Your answer:</span> {result.userAnswer}
												</div>
												{!result.isCorrect && (
													<div className="text-green-700">
														<span className="font-medium">Correct answer:</span> {result.correctAnswer}
													</div>
												)}
											</div>
										</div>
									))}
								</div>
								
								<div className="text-center">
									<button 
										onClick={() => {
											if (slug) {
												// If we're on a specific survey page, reset the form
												setSubmitted(false);
												setForm({ name: '', email: '', answers: {} });
												setAssessmentResults([]);
											} else {
												// If we're on the home page, go back to survey list
												navigate('/');
											}
										}}
										className="btn-secondary"
									>
										{slug ? 'Take This Assessment Again' : 'Choose Another Survey'}
									</button>
								</div>
							</div>
						) : (
							<div className="text-center">
								<div className="text-green-500 text-6xl mb-4">✅</div>
								<h2 className="text-3xl font-bold text-gray-800 mb-4">Thank You!</h2>
								<p className="text-gray-600 text-lg mb-6">
									Your survey response has been submitted successfully.
								</p>
								<button 
									onClick={() => {
										if (slug) {
											// If we're on a specific survey page, reset the form
											setSubmitted(false);
											setForm({ name: '', email: '', answers: {} });
										} else {
											// If we're on the home page, go back to survey list
											navigate('/');
										}
									}}
									className="btn-secondary"
								>
									{slug ? 'Take This Survey Again' : 'Choose Another Survey'}
								</button>
							</div>
						)}
					</div>
				)}
			</div>
		</div>
	);
};

export default TakeSurvey;
