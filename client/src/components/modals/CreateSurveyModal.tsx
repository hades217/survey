import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAdmin } from '../../contexts/AdminContext';
import { useSurveys } from '../../hooks/useSurveys';
import { useQuestionBanks } from '../../hooks/useQuestionBanks';
import Drawer from '../Drawer';
import MultiQuestionBankModal from './MultiQuestionBankModal';
import ManualQuestionSelectionModal from './ManualQuestionSelectionModal';
import { SOURCE_TYPE, SURVEY_TYPE } from '../../constants';
import { 
	ClipboardDocumentListIcon, 
	AcademicCapIcon, 
	CheckBadgeIcon, 
	PuzzlePieceIcon 
} from '@heroicons/react/24/outline';

const CreateSurveyModal: React.FC = () => {
	const { showCreateModal, setShowCreateModal, newSurvey, setNewSurvey, loading, error } =
		useAdmin();

	const { createSurvey } = useSurveys();
	const { questionBanks } = useQuestionBanks();
	const { t } = useTranslation('admin');

	// Survey type options with icons and descriptions
	const surveyTypeOptions = [
		{
			value: SURVEY_TYPE.SURVEY,
			label: t('createModal.surveyTypes.survey.label'),
			icon: ClipboardDocumentListIcon,
			description: t('createModal.surveyTypes.survey.description')
		},
		{
			value: SURVEY_TYPE.QUIZ,
			label: t('createModal.surveyTypes.quiz.label'),
			icon: PuzzlePieceIcon,
			description: t('createModal.surveyTypes.quiz.description')
		},
		{
			value: SURVEY_TYPE.ASSESSMENT,
			label: t('createModal.surveyTypes.assessment.label'),
			icon: CheckBadgeIcon,
			description: t('createModal.surveyTypes.assessment.description')
		},
		{
			value: SURVEY_TYPE.IQ,
			label: t('createModal.surveyTypes.iq.label'),
			icon: AcademicCapIcon,
			description: t('createModal.surveyTypes.iq.description')
		}
	];

	// Modal states for multi-question selection
	const [showMultiBankModal, setShowMultiBankModal] = useState(false);
	const [showManualSelectionModal, setShowManualSelectionModal] = useState(false);

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

	const isAssessmentType = [SURVEY_TYPE.QUIZ, SURVEY_TYPE.ASSESSMENT, SURVEY_TYPE.IQ].includes(
		newSurvey.type
	);

	const handleMultiBankSave = (config: unknown[]) => {
		setNewSurvey(prev => ({ ...prev, multiQuestionBankConfig: config }));
	};

	const handleManualSelectionSave = (selectedQuestions: unknown[]) => {
		setNewSurvey(prev => ({ ...prev, selectedQuestions }));
	};

	return (
		<Drawer
			show={showCreateModal}
			onClose={() => setShowCreateModal(false)}
			title={t('createModal.title')}
			actions={
				<div className='flex justify-end space-x-3'>
					<button
						type='button'
						onClick={() => setShowCreateModal(false)}
						className='btn-secondary'
					>
						{t('createModal.cancel')}
					</button>
					<button
						type='submit'
						form='create-survey-form'
						disabled={loading}
						className='btn-primary disabled:opacity-50 disabled:cursor-not-allowed'
					>
						{loading ? t('createModal.creating') : t('createModal.createButton')}
					</button>
				</div>
			}
		>
			<form id='create-survey-form' onSubmit={createSurvey} className='space-y-6'>
				{/* Basic Information */}
				<div>
					<h3 className='text-lg font-medium text-gray-900 mb-4'>{t('createModal.basicInfo.title')}</h3>
					<div className='space-y-4'>
						<div>
							<label className='block text-sm font-medium text-gray-700 mb-1'>
								{t('createModal.basicInfo.titleRequired')}
							</label>
							<input
								type='text'
								required
								value={newSurvey.title}
								onChange={e => handleInputChange('title', e.target.value)}
								className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
								placeholder={t('createModal.basicInfo.titlePlaceholder')}
							/>
						</div>

						<div>
							<label className='block text-sm font-medium text-gray-700 mb-1'>
								{t('createModal.basicInfo.description')}
							</label>
							<textarea
								value={newSurvey.description}
								onChange={e => handleInputChange('description', e.target.value)}
								className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
								rows={3}
								placeholder={t('createModal.basicInfo.descriptionPlaceholder')}
							/>
						</div>

						<div>
							<label className='block text-sm font-medium text-gray-700 mb-3'>
								{t('createModal.basicInfo.typeRequired')}
							</label>
							<div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
								{surveyTypeOptions.map((option) => {
									const IconComponent = option.icon;
									const isSelected = newSurvey.type === option.value;
									
									return (
										<label
											key={option.value}
											className={`relative flex items-start p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md ${
												isSelected
													? 'border-[#FF5A5F] bg-[#FF5A5F]/5 shadow-sm'
													: 'border-gray-200 hover:border-[#FF5A5F]/50'
											}`}
										>
											<input
												type="radio"
												name="surveyType"
												value={option.value}
												checked={isSelected}
												onChange={(e) => handleInputChange('type', e.target.value)}
												className="sr-only"
											/>
											<div className="flex items-start space-x-3 w-full">
												<div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
													isSelected 
														? 'bg-[#FF5A5F] text-white' 
														: 'bg-gray-100 text-gray-600'
												}`}>
													<IconComponent className="w-5 h-5" />
												</div>
												<div className="flex-1 min-w-0">
													<div className={`text-sm font-semibold ${
														isSelected ? 'text-[#FF5A5F]' : 'text-gray-900'
													}`}>
														{option.label}
													</div>
													<div className="text-xs text-gray-500 mt-1">
														{option.description}
													</div>
												</div>
											</div>
											{isSelected && (
												<div className="absolute top-2 right-2">
													<div className="w-4 h-4 bg-[#FF5A5F] rounded-full flex items-center justify-center">
														<svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
															<path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
														</svg>
													</div>
												</div>
											)}
										</label>
									);
								})}
							</div>
						</div>
					</div>
				</div>

				{/* Question Source */}
				<div>
					<h3 className='text-lg font-medium text-gray-900 mb-4'>{t('createModal.questionSource.title')}</h3>
					<div className='space-y-4'>
						<div>
							<label className='block text-sm font-medium text-gray-700 mb-1'>
								{t('createModal.questionSource.sourceType')}
							</label>
							<select
								value={newSurvey.sourceType}
								onChange={e => handleInputChange('sourceType', e.target.value)}
								className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
								disabled={newSurvey.type === SURVEY_TYPE.SURVEY}
							>
								<option value={SOURCE_TYPE.MANUAL}>
									{t('createModal.questionSource.manual')}
								</option>
								<option value={SOURCE_TYPE.QUESTION_BANK}>
									{t('createModal.questionSource.singleBank')}
								</option>
								<option value={SOURCE_TYPE.MULTI_QUESTION_BANK}>
									{t('createModal.questionSource.multiBank')}
								</option>
								<option value={SOURCE_TYPE.MANUAL_SELECTION}>
									{t('createModal.questionSource.manualSelection')}
								</option>
							</select>
							{newSurvey.type === SURVEY_TYPE.SURVEY && (
								<p className='text-sm text-gray-500 mt-1'>
									{t('createModal.questionSource.surveyOnlyManual')}
								</p>
							)}
						</div>

						{/* Single Question Bank */}
						{newSurvey.sourceType === SOURCE_TYPE.QUESTION_BANK && (
							<>
								<div>
									<label className='block text-sm font-medium text-gray-700 mb-1'>
										{t('createModal.questionSource.questionBank')}
									</label>
									<select
										value={newSurvey.questionBankId || ''}
										onChange={e =>
											handleInputChange('questionBankId', e.target.value)
										}
										className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
									>
										<option value=''>{t('createModal.questionSource.selectBank')}</option>
										{questionBanks.map(bank => (
											<option key={bank._id} value={bank._id}>
												{bank.name} ({bank.questions.length} {t('createModal.questionSource.questions')})
											</option>
										))}
									</select>
								</div>

								{newSurvey.questionBankId && (
									<div>
										<label className='block text-sm font-medium text-gray-700 mb-1'>
											{t('createModal.questionSource.questionCount')}
										</label>
										<input
											type='number'
											min='1'
											max={
												questionBanks.find(
													b => b._id === newSurvey.questionBankId
												)?.questions.length || 100
											}
											value={newSurvey.questionCount || ''}
											onChange={e =>
												handleInputChange(
													'questionCount',
													parseInt(e.target.value)
												)
											}
											className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
										/>
									</div>
								)}
							</>
						)}

						{/* Multiple Question Banks */}
						{newSurvey.sourceType === SOURCE_TYPE.MULTI_QUESTION_BANK && (
							<div>
								<label className='block text-sm font-medium text-gray-700 mb-1'>
									{t('createModal.questionSource.multiBankConfig')}
								</label>
								<div className='border border-gray-300 rounded-lg p-4 bg-gray-50'>
									{newSurvey.multiQuestionBankConfig &&
									newSurvey.multiQuestionBankConfig.length > 0 ? (
											<div className='space-y-2'>
												{newSurvey.multiQuestionBankConfig.map(
													(config: unknown, index: number) => {
														const bank = questionBanks.find(
															b => b._id === config.questionBankId
														);
														return (
															<div
																key={index}
																className='text-sm text-gray-700'
															>
																<strong>
																	{bank?.name || t('createModal.questionSource.unknownBank')}
																</strong>
															: {config.questionCount} {t('createModal.questionSource.questions')}
																{config.filters &&
																Object.keys(config.filters).length >
																	0 && (
																	<span className='text-gray-500'>
																		{' '}
																		{t('createModal.questionSource.withFilters')}
																	</span>
																)}
															</div>
														);
													}
												)}
												<div className='text-xs text-gray-500 mt-2'>
												{t('createModal.questionSource.totalQuestions')}{' '}
													{newSurvey.multiQuestionBankConfig.reduce(
														(sum: number, config: unknown) =>
															sum + config.questionCount,
														0
													)}{' '}
												{t('createModal.questionSource.questions')}
												</div>
											</div>
										) : (
											<div className='text-sm text-gray-500'>
											{t('createModal.questionSource.noConfigurations')}
											</div>
										)}
									<button
										type='button'
										onClick={() => setShowMultiBankModal(true)}
										className='mt-3 btn-primary btn-small'
									>
										{t('createModal.questionSource.configureQuestionBanks')}
									</button>
								</div>
							</div>
						)}

						{/* Manual Question Selection */}
						{newSurvey.sourceType === SOURCE_TYPE.MANUAL_SELECTION && (
							<div>
								<label className='block text-sm font-medium text-gray-700 mb-1'>
									{t('createModal.questionSource.manualSelectionConfig')}
								</label>
								<div className='border border-gray-300 rounded-lg p-4 bg-gray-50'>
									{newSurvey.selectedQuestions &&
									newSurvey.selectedQuestions.length > 0 ? (
											<div className='space-y-2'>
												<div className='text-sm text-gray-700'>
													<strong>
														{newSurvey.selectedQuestions.length}
													</strong>{' '}
												{t('createModal.questionSource.questionsSelected')}
												</div>
												<div className='text-xs text-gray-500'>
												{t('createModal.questionSource.selectedFromBanks')}
												</div>
											</div>
										) : (
											<div className='text-sm text-gray-500'>
											{t('createModal.questionSource.noQuestionsSelected')}
											</div>
										)}
									<button
										type='button'
										onClick={() => setShowManualSelectionModal(true)}
										className='mt-3 btn-primary btn-small'
									>
										{t('createModal.questionSource.selectQuestions')}
									</button>
								</div>
							</div>
						)}
					</div>
				</div>

				{/* Assessment Configuration */}
				{isAssessmentType && (
					<div>
						<h3 className='text-lg font-medium text-gray-900 mb-4'>
							{t('createModal.assessmentConfig.title')}
						</h3>
						<div className='space-y-4'>
							<div>
								<label className='block text-sm font-medium text-gray-700 mb-1'>
									{t('createModal.assessmentConfig.timeLimit')}
								</label>
								<input
									type='number'
									min='1'
									value={newSurvey.timeLimit || ''}
									onChange={e =>
										handleInputChange(
											'timeLimit',
											e.target.value ? parseInt(e.target.value) : undefined
										)
									}
									className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
									placeholder={t('createModal.assessmentConfig.timeLimitPlaceholder')}
								/>
							</div>

							<div>
								<label className='block text-sm font-medium text-gray-700 mb-1'>
									{t('createModal.assessmentConfig.maxAttempts')}
								</label>
								<input
									type='number'
									min='1'
									max='10'
									value={newSurvey.maxAttempts || 1}
									onChange={e =>
										handleInputChange('maxAttempts', parseInt(e.target.value))
									}
									className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
								/>
							</div>

							<div>
								<label className='block text-sm font-medium text-gray-700 mb-1'>
									{t('createModal.assessmentConfig.navigationMode')}
								</label>
								<select
									value={newSurvey.navigationMode}
									onChange={e =>
										handleInputChange('navigationMode', e.target.value)
									}
									className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
								>
									<option value='step-by-step'>{t('createModal.assessmentConfig.stepByStep')}</option>
									<option value='paginated'>{t('createModal.assessmentConfig.paginated')}</option>
									<option value='all-in-one'>{t('createModal.assessmentConfig.allInOne')}</option>
									<option value='one-question-per-page'>{t('createModal.assessmentConfig.oneQuestionPerPage')}</option>
								</select>
							</div>

							<div>
								<label className='block text-sm font-medium text-gray-700 mb-1'>
									{t('createModal.assessmentConfig.instructions')}
								</label>
								<textarea
									value={newSurvey.instructions}
									onChange={e =>
										handleInputChange('instructions', e.target.value)
									}
									className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
									rows={3}
									placeholder={t('createModal.assessmentConfig.instructionsPlaceholder')}
								/>
							</div>
						</div>
					</div>
				)}

				{/* Scoring Settings */}
				{isAssessmentType && (
					<div>
						<h3 className='text-lg font-medium text-gray-900 mb-4'>{t('createModal.scoringSettings.title')}</h3>
						<div className='space-y-4'>
							<div>
								<label className='block text-sm font-medium text-gray-700 mb-1'>
									{t('createModal.scoringSettings.scoringMode')}
								</label>
								<select
									value={newSurvey.scoringSettings?.scoringMode || 'percentage'}
									onChange={e =>
										handleScoringChange('scoringMode', e.target.value)
									}
									className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
								>
									<option value='percentage'>{t('createModal.scoringSettings.percentage')}</option>
									<option value='accumulated'>{t('createModal.scoringSettings.accumulated')}</option>
								</select>
							</div>

							<div>
								<label className='block text-sm font-medium text-gray-700 mb-1'>
									{t('createModal.scoringSettings.passingThreshold')} (
									{newSurvey.scoringSettings?.scoringMode === 'percentage'
										? '%'
										: t('createModal.scoringSettings.points')}
									)
								</label>
								<input
									type='number'
									min='0'
									max={
										newSurvey.scoringSettings?.scoringMode === 'percentage'
											? 100
											: 1000
									}
									value={newSurvey.scoringSettings?.passingThreshold || 70}
									onChange={e =>
										handleScoringChange(
											'passingThreshold',
											parseInt(e.target.value)
										)
									}
									className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
								/>
							</div>

							<div className='space-y-3'>
								<div className='space-y-1'>
									<label className='flex items-center'>
										<input
											type='checkbox'
											checked={newSurvey.scoringSettings?.showScore ?? true}
											onChange={e =>
												handleScoringChange('showScore', e.target.checked)
											}
											className='mr-2'
										/>
										{t('createModal.scoringSettings.showScore')}
									</label>
									<p className='text-xs text-gray-500 ml-6'>
										{t('createModal.scoringSettings.showScoreHelp', 'When enabled, students will see their final score after completing the assessment. When disabled, they will only see a completion message.')}
									</p>
								</div>

								<label className='flex items-center'>
									<input
										type='checkbox'
										checked={
											newSurvey.scoringSettings?.showCorrectAnswers ?? false
										}
										onChange={e =>
											handleScoringChange(
												'showCorrectAnswers',
												e.target.checked
											)
										}
										className='mr-2'
									/>
									{t('createModal.scoringSettings.showCorrectAnswers')}
								</label>

								<label className='flex items-center'>
									<input
										type='checkbox'
										checked={
											newSurvey.scoringSettings?.showScoreBreakdown ?? true
										}
										onChange={e =>
											handleScoringChange(
												'showScoreBreakdown',
												e.target.checked
											)
										}
										className='mr-2'
									/>
									{t('createModal.scoringSettings.showScoreBreakdown')}
								</label>

								<label className='flex items-center'>
									<input
										type='checkbox'
										checked={
											newSurvey.scoringSettings?.customScoringRules
												?.useCustomPoints ?? false
										}
										onChange={e =>
											handleCustomScoringChange(
												'useCustomPoints',
												e.target.checked
											)
										}
										className='mr-2'
									/>
									{t('createModal.scoringSettings.useCustomPoints')}
								</label>

								{newSurvey.scoringSettings?.customScoringRules?.useCustomPoints && (
									<div className='ml-6'>
										<label className='block text-sm font-medium text-gray-700 mb-1'>
											{t('createModal.scoringSettings.defaultQuestionPoints')}
										</label>
										<input
											type='number'
											min='1'
											value={
												newSurvey.scoringSettings?.customScoringRules
													?.defaultQuestionPoints || 1
											}
											onChange={e =>
												handleCustomScoringChange(
													'defaultQuestionPoints',
													parseInt(e.target.value)
												)
											}
											className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
										/>
									</div>
								)}
							</div>
						</div>
					</div>
				)}

				{/* Error Display */}
				{error && (
					<div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg'>
						{error}
					</div>
				)}
			</form>

			{/* Multi-Question Bank Configuration Modal */}
			<MultiQuestionBankModal
				show={showMultiBankModal}
				onClose={() => setShowMultiBankModal(false)}
				onSave={handleMultiBankSave}
				initialConfig={newSurvey.multiQuestionBankConfig || []}
			/>

			{/* Manual Question Selection Modal */}
			<ManualQuestionSelectionModal
				show={showManualSelectionModal}
				onClose={() => setShowManualSelectionModal(false)}
				onSave={handleManualSelectionSave}
				initialSelection={newSurvey.selectedQuestions || []}
			/>
		</Drawer>
	);
};

export default CreateSurveyModal;
