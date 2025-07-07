import React from 'react';
import { useAdmin } from '../../contexts/AdminContext';
import { useSurveys } from '../../hooks/useSurveys';
import { useQuestionBanks } from '../../hooks/useQuestionBanks';
import Modal from '../Modal';

const CreateSurveyModal: React.FC = () => {
	const {
		showCreateModal,
		setShowCreateModal,
		newSurvey,
		setNewSurvey,
		loading,
		error,
	} = useAdmin();
	
	const { createSurvey } = useSurveys();
	const { questionBanks } = useQuestionBanks();

	if (!showCreateModal) return null;

	const handleInputChange = (field: string, value: string | number | boolean | undefined) => {
		setNewSurvey(prev => ({ ...prev, [field]: value }));
	};

	const handleScoringChange = (field: string, value: string | number | boolean) => {
		setNewSurvey(prev => ({
			...prev,
			scoringSettings: {
				...prev.scoringSettings!,
				[field]: value,
			},
		}));
	};

	const handleCustomScoringChange = (field: string, value: string | number | boolean) => {
		setNewSurvey(prev => ({
			...prev,
			scoringSettings: {
				...prev.scoringSettings!,
				customScoringRules: {
					...prev.scoringSettings!.customScoringRules,
					[field]: value,
				},
			},
		}));
	};

	const isAssessmentType = ['quiz', 'assessment', 'iq'].includes(newSurvey.type);

	return (
		<Modal
			show={showCreateModal}
			onClose={() => setShowCreateModal(false)}
			title="Create New Survey"
		>
			<form onSubmit={createSurvey} className="space-y-6">
				{/* Basic Information */}
				<div>
					<h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
					<div className="space-y-4">
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Title *
							</label>
							<input
								type="text"
								required
								value={newSurvey.title}
								onChange={(e) => handleInputChange('title', e.target.value)}
								className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
								placeholder="Enter survey title"
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Description
							</label>
							<textarea
								value={newSurvey.description}
								onChange={(e) => handleInputChange('description', e.target.value)}
								className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
								rows={3}
								placeholder="Describe your survey"
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Type *
							</label>
							<select
								value={newSurvey.type}
								onChange={(e) => handleInputChange('type', e.target.value)}
								className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							>
								<option value="survey">Survey</option>
								<option value="quiz">Quiz</option>
								<option value="assessment">Assessment</option>
								<option value="iq">IQ Test</option>
							</select>
						</div>
					</div>
				</div>

				{/* Question Source */}
				<div>
					<h3 className="text-lg font-medium text-gray-900 mb-4">Question Source</h3>
					<div className="space-y-4">
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Source Type
							</label>
							<select
								value={newSurvey.sourceType}
								onChange={(e) => handleInputChange('sourceType', e.target.value)}
								className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
								disabled={newSurvey.type === 'survey'}
							>
								<option value="manual">Manual (Create questions manually)</option>
								<option value="question_bank">Question Bank (Random selection)</option>
							</select>
							{newSurvey.type === 'survey' && (
								<p className="text-sm text-gray-500 mt-1">
									Surveys only support manual question creation
								</p>
							)}
						</div>

						{newSurvey.sourceType === 'question_bank' && (
							<>
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Question Bank
									</label>
									<select
										value={newSurvey.questionBankId || ''}
										onChange={(e) => handleInputChange('questionBankId', e.target.value)}
										className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
									>
										<option value="">Select a question bank</option>
										{questionBanks.map((bank) => (
											<option key={bank._id} value={bank._id}>
												{bank.name} ({bank.questions.length} questions)
											</option>
										))}
									</select>
								</div>

								{newSurvey.questionBankId && (
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-1">
											Number of Questions
										</label>
										<input
											type="number"
											min="1"
											max={questionBanks.find(b => b._id === newSurvey.questionBankId)?.questions.length || 100}
											value={newSurvey.questionCount || ''}
											onChange={(e) => handleInputChange('questionCount', parseInt(e.target.value))}
											className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
										/>
									</div>
								)}
							</>
						)}
					</div>
				</div>

				{/* Assessment Configuration */}
				{isAssessmentType && (
					<div>
						<h3 className="text-lg font-medium text-gray-900 mb-4">Assessment Configuration</h3>
						<div className="space-y-4">
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Time Limit (minutes)
								</label>
								<input
									type="number"
									min="1"
									value={newSurvey.timeLimit || ''}
									onChange={(e) => handleInputChange('timeLimit', e.target.value ? parseInt(e.target.value) : undefined)}
									className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
									placeholder="No time limit"
								/>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Maximum Attempts
								</label>
								<input
									type="number"
									min="1"
									max="10"
									value={newSurvey.maxAttempts || 1}
									onChange={(e) => handleInputChange('maxAttempts', parseInt(e.target.value))}
									className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
								/>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Navigation Mode
								</label>
								<select
									value={newSurvey.navigationMode}
									onChange={(e) => handleInputChange('navigationMode', e.target.value)}
									className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
								>
									<option value="step-by-step">Step by Step</option>
									<option value="paginated">Paginated</option>
									<option value="all-in-one">All in One</option>
								</select>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Instructions
								</label>
								<textarea
									value={newSurvey.instructions}
									onChange={(e) => handleInputChange('instructions', e.target.value)}
									className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
									rows={3}
									placeholder="Special instructions for test takers"
								/>
							</div>
						</div>
					</div>
				)}

				{/* Scoring Settings */}
				{isAssessmentType && (
					<div>
						<h3 className="text-lg font-medium text-gray-900 mb-4">Scoring Settings</h3>
						<div className="space-y-4">
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Scoring Mode
								</label>
								<select
									value={newSurvey.scoringSettings?.scoringMode || 'percentage'}
									onChange={(e) => handleScoringChange('scoringMode', e.target.value)}
									className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
								>
									<option value="percentage">Percentage</option>
									<option value="accumulated">Accumulated Points</option>
								</select>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Passing Threshold ({newSurvey.scoringSettings?.scoringMode === 'percentage' ? '%' : 'points'})
								</label>
								<input
									type="number"
									min="0"
									max={newSurvey.scoringSettings?.scoringMode === 'percentage' ? 100 : 1000}
									value={newSurvey.scoringSettings?.passingThreshold || 70}
									onChange={(e) => handleScoringChange('passingThreshold', parseInt(e.target.value))}
									className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
								/>
							</div>

							<div className="space-y-3">
								<label className="flex items-center">
									<input
										type="checkbox"
										checked={newSurvey.scoringSettings?.showScore ?? true}
										onChange={(e) => handleScoringChange('showScore', e.target.checked)}
										className="mr-2"
									/>
									Show score to participants
								</label>

								<label className="flex items-center">
									<input
										type="checkbox"
										checked={newSurvey.scoringSettings?.showCorrectAnswers ?? false}
										onChange={(e) => handleScoringChange('showCorrectAnswers', e.target.checked)}
										className="mr-2"
									/>
									Show correct answers after completion
								</label>

								<label className="flex items-center">
									<input
										type="checkbox"
										checked={newSurvey.scoringSettings?.showScoreBreakdown ?? true}
										onChange={(e) => handleScoringChange('showScoreBreakdown', e.target.checked)}
										className="mr-2"
									/>
									Show score breakdown
								</label>

								<label className="flex items-center">
									<input
										type="checkbox"
										checked={newSurvey.scoringSettings?.customScoringRules?.useCustomPoints ?? false}
										onChange={(e) => handleCustomScoringChange('useCustomPoints', e.target.checked)}
										className="mr-2"
									/>
									Use custom points per question
								</label>

								{newSurvey.scoringSettings?.customScoringRules?.useCustomPoints && (
									<div className="ml-6">
										<label className="block text-sm font-medium text-gray-700 mb-1">
											Default Question Points
										</label>
										<input
											type="number"
											min="1"
											value={newSurvey.scoringSettings?.customScoringRules?.defaultQuestionPoints || 1}
											onChange={(e) => handleCustomScoringChange('defaultQuestionPoints', parseInt(e.target.value))}
											className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
										/>
									</div>
								)}
							</div>
						</div>
					</div>
				)}

				{/* Error Display */}
				{error && (
					<div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
						{error}
					</div>
				)}

				{/* Form Actions */}
				<div className="flex justify-end space-x-3 pt-6 border-t">
					<button
						type="button"
						onClick={() => setShowCreateModal(false)}
						className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
					>
						Cancel
					</button>
					<button
						type="submit"
						disabled={loading}
						className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
					>
						{loading ? 'Creating...' : 'Create Survey'}
					</button>
				</div>
			</form>
		</Modal>
	);
};

export default CreateSurveyModal;