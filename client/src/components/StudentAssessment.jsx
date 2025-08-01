import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const api = axios.create({
	baseURL: '/api',
});

const isInvitationCode = str => /^[a-f0-9]{32}$/i.test(str);

const StudentAssessment = () => {
	const { slug } = useParams();
	const navigate = useNavigate();

	// State
	const [survey, setSurvey] = useState(null);
	const [form, setForm] = useState({ name: '', email: '', answers: {} });
	const [currentStep, setCurrentStep] = useState('instructions');
	const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
	const [timer, setTimer] = useState({ timeLeft: 0, isActive: false, isExpired: false });
	const [submitted, setSubmitted] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const [assessmentResults, setAssessmentResults] = useState([]);
	const [startTime, setStartTime] = useState(null);
	const [invitationInfo, setInvitationInfo] = useState(null);

	const timerRef = useRef(null);
	const autoSubmitRef = useRef(false);

	// Load survey data and questions (supports invitation codes and slug)
	useEffect(() => {
		if (!slug) return;
		setLoading(true);
		setError('');
		setInvitationInfo(null);

		const loadSurveyAndQuestions = async (surveyData, invitationData = null) => {
			try {
				setSurvey(surveyData);
				setInvitationInfo(invitationData);

				if (surveyData.timeLimit) {
					setTimer({
						timeLeft: surveyData.timeLimit * 60,
						isActive: false,
						isExpired: false,
					});
				}

				// For question bank-based surveys, fetch questions separately
				if (
					['question_bank', 'multi_question_bank', 'manual_selection'].includes(
						surveyData.sourceType
					)
				) {
					// Need to get questions via the questions endpoint
					// This will be called when user starts the assessment with email
					console.log('Survey uses question bank source type:', surveyData.sourceType);
				}
			} catch (err) {
				console.error('Error processing survey data:', err);
				setError('Failed to load survey data');
			}
		};

		if (isInvitationCode(slug)) {
			// Get survey through invitation code
			api.get(`/invitations/access/${slug}`)
				.then(res => {
					loadSurveyAndQuestions(res.data.survey, res.data.invitation);
				})
				.catch(err => {
					setError(err.response?.data?.error || 'Invalid or expired invitation code');
					console.error('Error fetching invitation:', err);
				})
				.finally(() => setLoading(false));
		} else {
			// Compatible with original slug logic
			api.get(`/survey/${slug}`)
				.then(res => {
					loadSurveyAndQuestions(res.data);
				})
				.catch(err => {
					console.error('Error fetching survey:', err);
					if (err.code === 'ERR_NETWORK') {
						setError(
							'Network error: Unable to connect to server. Please check if the server is running.'
						);
					} else if (err.response?.status === 404) {
						setError('Assessment not found');
					} else if (err.response?.status >= 500) {
						setError('Server error: Please try again later.');
					} else {
						setError(
							`Error: ${err.response?.data?.message || err.message || 'Unknown error'}`
						);
					}
				})
				.finally(() => setLoading(false));
		}
	}, [slug]);

	// Timer logic
	useEffect(() => {
		if (timer.isActive && timer.timeLeft > 0) {
			timerRef.current = setInterval(() => {
				setTimer(prev => {
					if (prev.timeLeft <= 1) {
						if (!autoSubmitRef.current) {
							autoSubmitRef.current = true;
							handleAutoSubmit();
						}
						return { ...prev, timeLeft: 0, isActive: false, isExpired: true };
					}
					return { ...prev, timeLeft: prev.timeLeft - 1 };
				});
			}, 1000);
		} else if (timerRef.current) {
			clearInterval(timerRef.current);
		}

		return () => {
			if (timerRef.current) {
				clearInterval(timerRef.current);
			}
		};
	}, [timer.isActive, timer.timeLeft]);

	// Format time display
	const formatTime = seconds => {
		const hours = Math.floor(seconds / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);
		const secs = seconds % 60;

		if (hours > 0) {
			return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
		}
		return `${minutes}:${secs.toString().padStart(2, '0')}`;
	};

	// Start assessment
	const startAssessment = async () => {
		if (!survey) return;

		setLoading(true);
		try {
			// For question bank-based surveys, fetch questions first
			if (
				['question_bank', 'multi_question_bank', 'manual_selection'].includes(
					survey.sourceType
				)
			) {
				const questionsResponse = await api.get(`/survey/${slug}/questions`, {
					params: {
						email: form.email,
						attempt: 1,
					},
				});

				// Debug: Log the questions data
				console.log('Questions response:', questionsResponse.data);
				console.log('Questions with descriptionImage:', questionsResponse.data.questions.map((q, idx) => ({
					index: idx,
					text: q.text?.substring(0, 50),
					hasDescriptionImage: !!q.descriptionImage,
					descriptionImage: q.descriptionImage
				})));

				// Update survey with fetched questions
				setSurvey(prev => ({
					...prev,
					questions: questionsResponse.data.questions,
				}));
			}

			setCurrentStep('questions');
			setStartTime(new Date());
			if (survey?.timeLimit) {
				setTimer(prev => ({ ...prev, isActive: true }));
			}
		} catch (err) {
			console.error('Error fetching questions:', err);
			if (err.code === 'ERR_NETWORK') {
				setError(
					'Network error: Unable to connect to server. Please check if the server is running.'
				);
			} else if (err.response?.status === 400) {
				setError(
					`Failed to load questions: ${err.response?.data?.message || 'Invalid request'}`
				);
			} else if (err.response?.status === 404) {
				setError('Questions not found for this assessment.');
			} else {
				setError(
					`Failed to load questions: ${err.response?.data?.message || err.message || 'Unknown error'}`
				);
			}
		} finally {
			setLoading(false);
		}
	};

	// Handle answer change
	const handleAnswerChange = (questionId, value) => {
		setForm(prev => ({
			...prev,
			answers: { ...prev.answers, [questionId]: value },
		}));
	};

	// Handle single choice change
	const handleSingleChoiceChange = (questionId, value) => {
		handleAnswerChange(questionId, value);
	};

	// Handle multiple choice change
	const handleMultipleChoiceChange = (questionId, optionValue, checked) => {
		const currentAnswers = form.answers[questionId] || [];
		let newAnswers;

		if (checked) {
			newAnswers = [...currentAnswers, optionValue];
		} else {
			newAnswers = currentAnswers.filter(answer => answer !== optionValue);
		}

		handleAnswerChange(questionId, newAnswers);
	};

	// Navigate questions
	const nextQuestion = () => {
		if (survey && survey.questions && currentQuestionIndex < survey.questions.length - 1) {
			setCurrentQuestionIndex(prev => prev + 1);
		}
	};

	const prevQuestion = () => {
		if (currentQuestionIndex > 0) {
			setCurrentQuestionIndex(prev => prev - 1);
		}
	};

	// Auto submit when time expires
	const handleAutoSubmit = useCallback(async () => {
		if (survey && !submitted) {
			await handleSubmit(true);
		}
	}, [survey, submitted, form]);

	// Submit assessment (supports invitation codes)
	const handleSubmit = async (isAutoSubmit = false) => {
		if (!survey || submitted) return;
		setLoading(true);
		setTimer(prev => ({ ...prev, isActive: false }));
		try {
			const timeSpent = startTime
				? Math.round((new Date().getTime() - startTime.getTime()) / 1000)
				: 0;
			const payload = {
				name: form.name,
				email: form.email,
				surveyId: survey._id,
				answers: survey.questions.map(q => form.answers[q._id] || ''),
				timeSpent,
				isAutoSubmit,
			};
			if (isInvitationCode(slug)) {
				payload.invitationCode = slug;
			}
			await api.post(`/surveys/${survey._id}/responses`, payload);
			if (isInvitationCode(slug)) {
				await api.post(`/invitations/complete/${slug}`, {
					userId: null,
					email: form.email || null,
				});
			}
					// Calculate results for assessment
		if (['assessment'].includes(survey.type)) {
				const results = survey.questions.map(q => {
					const userAnswer = form.answers[q._id];
					let correctAnswer = '';
					let isCorrect = false;
					if (q.type === 'single_choice' && typeof q.correctAnswer === 'number') {
						correctAnswer = q.options[q.correctAnswer];
						isCorrect = userAnswer === correctAnswer;
					} else if (q.type === 'multiple_choice' && Array.isArray(q.correctAnswer)) {
						correctAnswer = q.correctAnswer.map(idx => q.options[idx]);
						const userAnswerArray = Array.isArray(userAnswer) ? userAnswer : [];
						isCorrect =
							correctAnswer.length === userAnswerArray.length &&
							correctAnswer.every(ans => userAnswerArray.includes(ans));
					}
					return {
						questionId: q._id,
						questionText: q.text,
						descriptionImage: q.descriptionImage,
						userAnswer: userAnswer || '',
						correctAnswer,
						isCorrect,
						explanation: q.explanation,
						points: q.points || 1,
					};
				});
				setAssessmentResults(results);
			}
			setSubmitted(true);
			setCurrentStep('results');
		} catch (err) {
			setError('Failed to submit assessment. Please try again.');
			console.error('Error submitting assessment:', err);
		} finally {
			setLoading(false);
		}
	};

	// Render loading state
	if (loading) {
		return (
			<div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center'>
				<div className='text-center'>
					<div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4'></div>
					<p className='text-gray-600'>Loading assessment...</p>
				</div>
			</div>
		);
	}

	// Render error state
	if (error) {
		return (
			<div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center'>
				<div className='bg-white rounded-lg shadow-lg p-8 max-w-md mx-auto text-center'>
					<div className='text-red-500 text-6xl mb-4'>⚠️</div>
					<h2 className='text-2xl font-bold text-gray-800 mb-2'>
						{isInvitationCode(slug) ? 'Invalid or expired invitation code' : 'Assessment Not Found'}
					</h2>
					<p className='text-gray-600 mb-6'>{error}</p>
					<button
						onClick={() => navigate('/')}
						className='bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors'
					>
						Go Back
					</button>
				</div>
			</div>
		);
	}

	if (!survey) return null;

	// Render instructions step
	if (currentStep === 'instructions') {
		return (
			<div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8'>
				<div className='max-w-4xl mx-auto px-4'>
					<div className='bg-white rounded-lg shadow-lg p-8'>
						{/* Company Logo */}
						{survey.company && survey.company.logoUrl && (
							<div className='text-center mb-6'>
								<img
									src={survey.company.logoUrl}
									alt={survey.company.name || 'Company Logo'}
									className='mx-auto max-h-20 max-w-48 object-contain'
									onError={(e) => {
										console.error('Company logo failed to load:', survey.company.logoUrl);
										e.currentTarget.style.display = 'none';
									}}
								/>
							</div>
						)}

						<div className='text-center mb-8'>
							<h1 className='text-3xl font-bold text-gray-800 mb-2'>
								{survey.title}
							</h1>
							<div className='flex justify-center items-center gap-4 mb-4'>
								<span
									className={`px-3 py-1 rounded-full text-sm font-medium ${
										survey.type === 'survey'
											? 'bg-gray-100 text-gray-800'
											: survey.type === 'quiz'
												? 'bg-blue-100 text-blue-800'
												: survey.type === 'assessment'
													? 'bg-green-100 text-green-800'
													: 'bg-purple-100 text-purple-800'
									}`}
								>
									{survey.type === 'survey'
										? 'Survey'
										: survey.type === 'quiz'
											? 'Quiz'
											: survey.type === 'assessment'
												? 'Assessment'
												: 'IQ Test'}
								</span>
								{survey.timeLimit && (
									<span className='px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium'>
										时间限制: {survey.timeLimit} 分钟
									</span>
								)}
							</div>
						</div>

						<div className='grid md:grid-cols-2 gap-8 mb-8'>
							<div className='space-y-4'>
								<h3 className='text-lg font-semibold text-gray-800'>Assessment Information</h3>
								<div className='space-y-2 text-sm'>
									<div className='flex justify-between'>
										<span className='text-gray-600'>Number of Questions:</span>
										<span className='font-medium'>
											{survey.sourceType === 'manual'
												? `${survey.questions.length} questions`
												: survey.sourceType === 'question_bank'
													? `${survey.questionCount || 'random'} questions`
													: survey.sourceType === 'multi_question_bank'
														? `${survey.multiQuestionBankConfig?.reduce((sum, config) => sum + config.questionCount, 0) || 'Multiple Question Banks'} questions`
														: survey.sourceType === 'manual_selection'
															? `${survey.selectedQuestions?.length || 'selected'} questions`
															: `${survey.questions?.length || 0} questions`}
										</span>
									</div>
									{survey.timeLimit && (
										<div className='flex justify-between'>
											<span className='text-gray-600'>Estimated Time:</span>
											<span className='font-medium'>
												{survey.timeLimit} minutes
											</span>
										</div>
									)}
									{survey.maxAttempts && (
										<div className='flex justify-between'>
											<span className='text-gray-600'>Maximum Attempts:</span>
											<span className='font-medium'>
												{survey.maxAttempts} times
											</span>
										</div>
									)}
									<div className='flex justify-between'>
										<span className='text-gray-600'>Question Type:</span>
										<span className='font-medium'>
											{survey.sourceType === 'manual' &&
											survey.questions?.length > 0
												? survey.questions.some(
														q => q.type === 'multiple_choice'
													)
													? 'Single Choice + Multiple Choice'
													: 'Single Choice'
												: 'Mixed Question Types'}
										</span>
									</div>
								</div>
							</div>

							<div className='space-y-4'>
								<h3 className='text-lg font-semibold text-gray-800'>Rules Description</h3>
								<div className='text-sm text-gray-600 space-y-2'>
									{survey.type === 'survey' ? (
										<>
											<p>• This is a survey questionnaire with no standard answers</p>
											<p>• Please answer based on your true thoughts</p>
											<p>• A thank you page will be displayed after submission</p>
										</>
									) : (
										<>
											<p>
												• This is a
												{survey.type === 'quiz'
													? 'Quiz'
													: survey.type === 'assessment'
														? 'Assessment'
														: 'IQ Test'}
												with standard answers
											</p>
											<p>• Please read each question carefully before answering</p>
											<p>• Scores and correct answers will be displayed after submission</p>
											{survey.timeLimit && <p>• Auto-submit when time expires</p>}
										</>
									)}
									<p>• All questions are required</p>
									<p>• Answers cannot be modified after submission</p>
								</div>
							</div>
						</div>

						{survey.description && (
							<div className='mb-8'>
								<h3 className='text-lg font-semibold text-gray-800 mb-2'>
									详细说明
								</h3>
								<p className='text-gray-600'>{survey.description}</p>
							</div>
						)}

						<div className='border-t pt-6'>
							<div className='grid md:grid-cols-2 gap-4 mb-6'>
								<div>
									<label className='block mb-2 font-medium text-gray-700'>
										姓名 *
									</label>
									<input
										type='text'
										className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
										value={form.name}
										onChange={e =>
											setForm(prev => ({ ...prev, name: e.target.value }))
										}
										placeholder='请输入您的姓名'
										required
									/>
								</div>
								<div>
									<label className='block mb-2 font-medium text-gray-700'>
										邮箱 *
									</label>
									<input
										type='email'
										className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
										value={form.email}
										onChange={e =>
											setForm(prev => ({ ...prev, email: e.target.value }))
										}
										placeholder='请输入您的邮箱'
										required
									/>
								</div>
							</div>

							<div className='text-center'>
								<button
									onClick={startAssessment}
									disabled={!form.name || !form.email}
									className='bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-lg font-medium'
								>
									开始
									{survey.type === 'survey'
										? 'Survey'
										: survey.type === 'quiz'
											? 'Quiz'
											: survey.type === 'assessment'
												? 'Assessment'
												: 'IQ Test'}
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	}

	// Get current question for step-by-step mode
	const currentQuestion = survey?.questions?.[currentQuestionIndex];

	return (
		<div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8'>
			<div className='max-w-4xl mx-auto px-4'>
				{/* Timer and progress */}
				{currentStep === 'questions' && (
					<div className='bg-white rounded-lg shadow-lg p-4 mb-6'>
						{/* Company Logo */}
						{survey.company && survey.company.logoUrl && (
							<div className='text-center mb-4'>
								<img
									src={survey.company.logoUrl}
									alt={survey.company.name || 'Company Logo'}
									className='mx-auto max-h-12 max-w-32 object-contain'
									onError={(e) => {
										console.error('Company logo failed to load:', survey.company.logoUrl);
										e.currentTarget.style.display = 'none';
									}}
								/>
							</div>
						)}

						<div className='flex justify-between items-center'>
							<div className='flex items-center gap-4'>
								<h2 className='text-lg font-semibold text-gray-800'>
									{survey.title}
								</h2>
								<span className='text-sm text-gray-500'>
									题目 {currentQuestionIndex + 1} /{' '}
									{survey.questions?.length || 0}
								</span>
							</div>

							<div className='flex items-center gap-4'>
								{survey.timeLimit && (
									<div
										className={`flex items-center gap-2 px-3 py-1 rounded-lg ${
											timer.timeLeft < 300
												? 'bg-red-100 text-red-700'
												: 'bg-blue-100 text-blue-700'
										}`}
									>
										<span className='text-sm'>⏱️</span>
										<span className='font-mono font-medium'>
											{formatTime(timer.timeLeft)}
										</span>
									</div>
								)}

								<div className='w-48 bg-gray-200 rounded-full h-2'>
									<div
										className='bg-blue-600 h-2 rounded-full transition-all duration-300'
										style={{
											width: `${((currentQuestionIndex + 1) / (survey.questions?.length || 1)) * 100}%`,
										}}
									/>
								</div>
							</div>
						</div>
					</div>
				)}

				{/* Question content */}
				{currentStep === 'questions' && currentQuestion && (
					<div className='bg-white rounded-lg shadow-lg p-8'>
						<div className='mb-6'>
							<h3 className='text-xl font-semibold text-gray-800 mb-4'>
								{currentQuestionIndex + 1}. {currentQuestion.text}
							</h3>

							{/* Main question image */}
							{currentQuestion.imageUrl && (
								<div className='mb-4'>
									<img
										src={currentQuestion.imageUrl}
										alt='Question image'
										className='max-w-full h-auto rounded-lg border border-gray-300'
										onLoad={() => {
											console.log('Main image loaded successfully:', currentQuestion.imageUrl);
										}}
										onError={(e) => {
											console.error('Main image failed to load:', currentQuestion.imageUrl);
											console.error('Error event:', e);
											e.currentTarget.style.display = 'none';
										}}
									/>
								</div>
							)}

							{/* Description image */}
							{currentQuestion.descriptionImage && (
								<div className='mb-4'>
									<img
										src={currentQuestion.descriptionImage}
										alt='Question illustration'
										className='max-w-full h-auto rounded-lg border border-gray-300'
										onLoad={() => {
											console.log('Description image loaded successfully:', currentQuestion.descriptionImage);
										}}
										onError={(e) => {
											console.error('Description image failed to load:', currentQuestion.descriptionImage);
											console.error('Error event:', e);
											e.currentTarget.style.display = 'none';
										}}
									/>
								</div>
							)}
							{(currentQuestion.imageUrl || currentQuestion.descriptionImage) && console.log('Rendering images for current question, imageUrl:', currentQuestion.imageUrl, 'descriptionImage:', currentQuestion.descriptionImage)}

							<div className='space-y-3'>
								{currentQuestion.type === 'short_text' ? (
									// Short text input
									<textarea
										className='w-full p-3 border border-gray-200 rounded-lg focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-colors'
										placeholder='Enter your answer here...'
										rows={4}
										value={form.answers[currentQuestion._id] || ''}
										onChange={e =>
											handleSingleChoiceChange(
												currentQuestion._id,
												e.target.value
											)
										}
									/>
								) : currentQuestion.type === 'single_choice' ? (
									// Single choice options
									currentQuestion.options.map((option, index) => {
										const optionValue = typeof option === 'string' ? option : option.text;
										const optionText = typeof option === 'string' ? option : option.text;
										const optionImage = typeof option === 'object' ? option.imageUrl : null;
										return (
										<label
											key={index}
											className='flex items-start p-3 border border-gray-200 rounded-lg hover:border-blue-300 cursor-pointer transition-colors'
										>
											<input
												type='radio'
												name={currentQuestion._id}
												value={optionValue}
												checked={
													form.answers[currentQuestion._id] === optionValue
												}
												onChange={() =>
													handleSingleChoiceChange(
														currentQuestion._id,
														optionValue
													)
												}
												className='mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 mt-1'
											/>
											<div className='flex-1'>
												{optionText && (
													<span className='text-gray-700 block mb-2'>{optionText}</span>
												)}
												{optionImage && (
													<img
														src={optionImage}
														alt={`Option ${index + 1}`}
														className='max-w-full h-auto rounded border border-gray-300'
														style={{ maxHeight: '200px' }}
														onLoad={() => {
															console.log('Option image loaded successfully:', optionImage);
														}}
														onError={(e) => {
															console.error('Option image failed to load:', optionImage);
															e.currentTarget.style.display = 'none';
														}}
													/>
												)}
											</div>
										</label>
										);
									})
								) : (
									// Multiple choice options
									currentQuestion.options.map((option, index) => {
										const optionValue = typeof option === 'string' ? option : option.text;
										const optionText = typeof option === 'string' ? option : option.text;
										const optionImage = typeof option === 'object' ? option.imageUrl : null;
										return (
										<label
											key={index}
											className='flex items-start p-3 border border-gray-200 rounded-lg hover:border-blue-300 cursor-pointer transition-colors'
										>
											<input
												type='checkbox'
												value={optionValue}
												checked={(
													form.answers[currentQuestion._id] || []
												).includes(optionValue)}
												onChange={e =>
													handleMultipleChoiceChange(
														currentQuestion._id,
														optionValue,
														e.target.checked
													)
												}
												className='mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1'
											/>
											<div className='flex-1'>
												{optionText && (
													<span className='text-gray-700 block mb-2'>{optionText}</span>
												)}
												{optionImage && (
													<img
														src={optionImage}
														alt={`Option ${index + 1}`}
														className='max-w-full h-auto rounded border border-gray-300'
														style={{ maxHeight: '200px' }}
														onLoad={() => {
															console.log('Option image loaded successfully:', optionImage);
														}}
														onError={(e) => {
															console.error('Option image failed to load:', optionImage);
															e.currentTarget.style.display = 'none';
														}}
													/>
												)}
											</div>
										</label>
										);
									})
								)}
							</div>
						</div>

						{/* Navigation buttons */}
						<div className='flex justify-between items-center pt-6 border-t'>
							<button
								onClick={prevQuestion}
								disabled={currentQuestionIndex === 0}
								className='px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
							>
								上一题
							</button>

							<div className='flex gap-3'>
								{currentQuestionIndex === (survey.questions?.length || 0) - 1 ? (
									<button
										onClick={() => handleSubmit(false)}
										disabled={loading}
										className='px-8 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors'
									>
										{loading ? '提交中...' : '提交答案'}
									</button>
								) : (
									<button
										onClick={nextQuestion}
										className='px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
									>
										下一题
									</button>
								)}
							</div>
						</div>
					</div>
				)}

				{/* Results */}
				{currentStep === 'results' && (
					<div className='bg-white rounded-lg shadow-lg p-8'>
						{/* Company Logo */}
						{survey.company && survey.company.logoUrl && (
							<div className='text-center mb-6'>
								<img
									src={survey.company.logoUrl}
									alt={survey.company.name || 'Company Logo'}
									className='mx-auto max-h-16 max-w-40 object-contain'
									onError={(e) => {
										console.error('Company logo failed to load:', survey.company.logoUrl);
										e.currentTarget.style.display = 'none';
									}}
								/>
							</div>
						)}

						{survey.type === 'survey' ? (
							// Survey thank you page
							<div className='text-center'>
								<div className='text-green-500 text-6xl mb-4'>✅</div>
								<h2 className='text-3xl font-bold text-gray-800 mb-4'>
									感谢您的参与！
								</h2>
								<p className='text-gray-600 text-lg mb-6'>
									您的调研回答已成功提交，感谢您的宝贵意见。
								</p>
							</div>
						) : (
							// Assessment results
							<div>
								<div className='text-center mb-8'>
									<div className='text-blue-500 text-6xl mb-4'>📊</div>
									<h2 className='text-3xl font-bold text-gray-800 mb-2'>
										测评结果
									</h2>
									<div className='text-lg text-gray-600 mb-4'>
										总分: {assessmentResults.filter(r => r.isCorrect).length} /{' '}
										{assessmentResults.length}
									</div>
									<div className='text-2xl font-bold text-blue-600'>
										{Math.round(
											(assessmentResults.filter(r => r.isCorrect).length /
												assessmentResults.length) *
												100
										)}
										%
									</div>
								</div>

								<div className='space-y-4 mb-8'>
									{assessmentResults.map((result, index) => (
										<div
											key={result.questionId}
											className={`p-4 rounded-lg border-2 ${
												result.isCorrect
													? 'border-green-300 bg-green-50'
													: 'border-red-300 bg-red-50'
											}`}
										>
											<div className='flex items-start gap-3'>
												<span
													className={`text-2xl ${result.isCorrect ? 'text-green-600' : 'text-red-600'}`}
												>
													{result.isCorrect ? '✅' : '❌'}
												</span>
												<div className='flex-1'>
													<div className='font-semibold text-gray-800 mb-2'>
														{index + 1}. {result.questionText}
													</div>
													{result.descriptionImage && (
														<div className='mb-2'>
															<img
																src={result.descriptionImage}
																alt='Question illustration'
																className='max-w-full h-auto rounded-lg border border-gray-300'
																onError={(e) => {
																	e.currentTarget.style.display = 'none';
																}}
															/>
														</div>
													)}
													<div className='space-y-1 text-sm'>
														<div className='text-gray-700'>
															<span className='font-medium'>
																您的答案:
															</span>{' '}
															{Array.isArray(result.userAnswer)
																? result.userAnswer.map(ans =>
																	typeof ans === 'object' ? ans.text || ans.value || JSON.stringify(ans) : ans
																  ).join(', ')
																: typeof result.userAnswer === 'object'
																	? result.userAnswer?.text || result.userAnswer?.value || JSON.stringify(result.userAnswer)
																	: result.userAnswer || '未作答'}
														</div>
														{!result.isCorrect && (
															<div className='text-green-700'>
																<span className='font-medium'>
																	正确答案:
																</span>{' '}
																{Array.isArray(result.correctAnswer)
																	? result.correctAnswer.map(ans =>
																		typeof ans === 'object' ? ans.text || ans.value || JSON.stringify(ans) : ans
																	  ).join(', ')
																	: typeof result.correctAnswer === 'object'
																		? result.correctAnswer?.text || result.correctAnswer?.value || JSON.stringify(result.correctAnswer)
																		: result.correctAnswer}
															</div>
														)}
														{result.explanation && (
															<div className='text-blue-700 mt-2'>
																<span className='font-medium'>
																	解释:
																</span>{' '}
																{result.explanation}
															</div>
														)}
													</div>
												</div>
											</div>
										</div>
									))}
								</div>
							</div>
						)}
					</div>
				)}
			</div>
		</div>
	);
};

export default StudentAssessment;
