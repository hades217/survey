import React from 'react';
import {
	QUESTION_TYPE,
	TYPES_REQUIRING_ANSWERS,
	type QuestionType,
	type SurveyType,
} from '../../constants';
import ImageUpload from '../common/ImageUpload';

interface SurveyQuestionForm {
	text: string;
	imageUrl?: string;
	descriptionImage?: string;
	options?: string[] | { text?: string; imageUrl?: string }[];
	type: QuestionType;
	correctAnswer?: number | number[] | string;
	points?: number;
}

interface AddSurveyQuestionModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSubmit: (form: SurveyQuestionForm) => void;
	form: SurveyQuestionForm;
	onChange: (field: string, value: unknown) => void;
	onOptionChange: (index: number, value: string | { text?: string; imageUrl?: string }) => void;
	onAddOption: () => void;
	onRemoveOption: (index: number) => void;
	loading?: boolean;
	surveyType: SurveyType;
	isCustomScoringEnabled?: boolean;
	defaultQuestionPoints?: number;
}

const AddSurveyQuestionModal: React.FC<AddSurveyQuestionModalProps> = ({
	isOpen,
	onClose,
	onSubmit,
	form,
	onChange,
	onOptionChange,
	onAddOption,
	onRemoveOption,
	loading = false,
	surveyType,
	isCustomScoringEnabled = false,
	defaultQuestionPoints = 1,
}) => {
	if (!isOpen) return null;

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		onSubmit(form);
	};

	const toggleCorrectAnswer = (optionIndex: number) => {
		let newCorrectAnswer;
		const isCorrect = Array.isArray(form.correctAnswer)
			? form.correctAnswer.includes(optionIndex)
			: form.correctAnswer === optionIndex;

		if (form.type === QUESTION_TYPE.SINGLE_CHOICE) {
			// Single choice: only one correct answer
			newCorrectAnswer = isCorrect ? undefined : optionIndex;
		} else {
			// Multiple choice: allow multiple correct answers
			if (isCorrect) {
				// Remove from correct answers
				if (Array.isArray(form.correctAnswer)) {
					newCorrectAnswer = form.correctAnswer.filter(i => i !== optionIndex);
					if (newCorrectAnswer.length === 0) newCorrectAnswer = undefined;
				} else {
					newCorrectAnswer = undefined;
				}
			} else {
				// Add to correct answers
				if (Array.isArray(form.correctAnswer)) {
					newCorrectAnswer = [...form.correctAnswer, optionIndex].sort((a, b) => a - b);
				} else if (form.correctAnswer !== undefined) {
					newCorrectAnswer = [form.correctAnswer, optionIndex].sort((a, b) => a - b);
				} else {
					newCorrectAnswer = [optionIndex];
				}
			}
		}

		onChange('correctAnswer', newCorrectAnswer);
	};

	const isFormValid = () => {
		if (!form.text.trim()) return false;

		if (form.type === QUESTION_TYPE.SHORT_TEXT) {
			return true; // Short text questions only need question text
		}

		// For choice questions, need options
		if (!form.options || form.options.length < 2) {
			return false;
		}

		// Check if options have valid content (text or image)
		const validOptions = form.options.filter(opt => {
			if (typeof opt === 'string') {
				return opt.trim().length > 0;
			} else {
				return (opt.text && opt.text.trim()) || opt.imageUrl;
			}
		});

		if (validOptions.length < 2) {
			return false;
		}

		// For assessment/quiz/iq types, need correct answer for choice questions
		if (
			TYPES_REQUIRING_ANSWERS.includes(surveyType) &&
			form.type !== QUESTION_TYPE.SHORT_TEXT
		) {
			return form.correctAnswer !== undefined;
		}

		return true;
	};

	const isAssessmentType = TYPES_REQUIRING_ANSWERS.includes(surveyType);

	return (
		<div className='fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50'>
			<div className='bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto'>
				<div className='flex justify-between items-center p-6 border-b'>
					<h2 className='text-xl font-semibold text-gray-800'>Add Question</h2>
					<button onClick={onClose} className='text-gray-400 hover:text-gray-600 text-xl'>
						×
					</button>
				</div>

				<form onSubmit={handleSubmit} className='p-6 space-y-4'>
					<div>
						<label className='block text-sm font-medium text-gray-700 mb-2'>
							Question Text *
						</label>
						<textarea
							className='input-field w-full'
							placeholder='Enter question text'
							value={form.text}
							onChange={e => onChange('text', e.target.value)}
							rows={3}
							required
						/>
					</div>

					<div>
						<label className='block text-sm font-medium text-gray-700 mb-2'>
							Question Image (Optional)
						</label>
						<ImageUpload
							imageUrl={form.imageUrl}
							onImageUpload={url => onChange('imageUrl', url)}
							onImageRemove={() => onChange('imageUrl', null)}
							placeholder='Upload question image for visual questions (IQ tests, etc.)'
							uploadMethod='cloudinary'
						/>
					</div>

					<div>
						<label className='block text-sm font-medium text-gray-700 mb-2'>
							Description Image (Optional)
						</label>
						<ImageUpload
							imageUrl={form.descriptionImage || null}
							onImageUpload={url => onChange('descriptionImage', url)}
							onImageRemove={() => onChange('descriptionImage', '')}
							placeholder='Upload image to illustrate question content'
							uploadMethod='cloudinary'
							className='w-full'
						/>
						<div className='text-xs text-gray-500 mt-1'>
							Add an image to help explain the question context (charts, diagrams,
							scenarios, etc.)
						</div>
					</div>

					<div>
						<label className='block text-sm font-medium text-gray-700 mb-2'>
							Question Type *
						</label>
						<select
							className='input-field'
							value={form.type}
							onChange={e => onChange('type', e.target.value)}
						>
							<option value='single_choice'>Single Choice</option>
							<option value='multiple_choice'>Multiple Choice</option>
							<option value='short_text'>Short Text</option>
						</select>
						<div className='text-xs text-gray-500 mt-1'>
							{form.type === QUESTION_TYPE.SINGLE_CHOICE &&
								'Users can select only one answer'}
							{form.type === QUESTION_TYPE.MULTIPLE_CHOICE &&
								'Users can select multiple answers'}
							{form.type === QUESTION_TYPE.SHORT_TEXT &&
								'Users can enter a text response'}
						</div>
					</div>

					{form.type !== QUESTION_TYPE.SHORT_TEXT && (
						<div>
							<div className='flex items-center justify-between mb-2'>
								<label className='block text-sm font-medium text-gray-700'>
									Options *
								</label>
								<button
									className='btn-secondary text-sm'
									onClick={onAddOption}
									type='button'
								>
									+ Add Option
								</button>
							</div>
							{form.options && form.options.length > 0 ? (
								<div className='space-y-3'>
									{form.options.map((option, index) => {
										const isStringOption = typeof option === 'string';
										const optionText = isStringOption
											? option
											: (option as { text?: string; imageUrl?: string })
												?.text || '';
										const optionImageUrl = isStringOption
											? null
											: (option as { text?: string; imageUrl?: string })
												?.imageUrl;

										return (
											<div
												key={index}
												className='border border-gray-200 rounded-lg p-3'
											>
												<div className='flex items-center gap-2 mb-2'>
													<span className='text-sm font-medium text-gray-700'>
														Option {index + 1}
													</span>
													{form.options && form.options.length > 2 && (
														<button
															className='ml-auto px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors'
															onClick={() => onRemoveOption(index)}
															type='button'
														>
															Remove
														</button>
													)}
												</div>

												<div className='space-y-2'>
													<input
														className='input-field w-full'
														placeholder={`Option ${index + 1} text`}
														value={optionText}
														onChange={e => {
															const newOption = isStringOption
																? e.target.value
																: {
																	text: e.target.value,
																	imageUrl: optionImageUrl,
																};
															onOptionChange(index, newOption);
														}}
													/>

													<div>
														<label className='block text-xs font-medium text-gray-600 mb-1'>
															Option Image (Optional)
														</label>
														<ImageUpload
															imageUrl={optionImageUrl}
															onImageUpload={url => {
																const newOption = {
																	text: optionText,
																	imageUrl: url,
																};
																onOptionChange(index, newOption);
															}}
															onImageRemove={() => {
																const newOption = isStringOption
																	? optionText
																	: {
																		text: optionText,
																		imageUrl: null,
																	};
																onOptionChange(index, newOption);
															}}
															placeholder='Upload option image'
															className='text-xs'
															uploadMethod='cloudinary'
														/>
													</div>
												</div>
											</div>
										);
									})}
								</div>
							) : (
								<div className='text-gray-500 text-sm p-3 border-2 border-dashed border-gray-300 rounded-lg text-center'>
									No options added yet. Click "Add Option" to start.
								</div>
							)}
						</div>
					)}

					{form.type === QUESTION_TYPE.SHORT_TEXT && isAssessmentType && (
						<div>
							<label className='block text-sm font-medium text-gray-700 mb-2'>
								Expected Answer (Optional)
							</label>
							<input
								type='text'
								className='input-field w-full'
								placeholder='Enter expected answer for scoring (optional)'
								value={
									typeof form.correctAnswer === 'string' ? form.correctAnswer : ''
								}
								onChange={e => onChange('correctAnswer', e.target.value)}
							/>
							<div className='text-xs text-gray-500 mt-1'>
								For assessment/quiz types, you can specify an expected answer for
								scoring
							</div>
						</div>
					)}

					{form.type !== QUESTION_TYPE.SHORT_TEXT &&
						isAssessmentType &&
						form.options &&
						form.options.filter(opt => {
							const text = typeof opt === 'string' ? opt : opt.text;
							return text && text.trim();
						}).length >= 2 && (
						<div>
							<label className='block text-sm font-medium text-gray-700 mb-2'>
									Select Correct Answer(s) *
							</label>
							<div className='space-y-2'>
								{form.options.map((opt, idx) => {
									const optionText =
											typeof opt === 'string' ? opt : opt?.text || '';
									const optionImage =
											typeof opt === 'string' ? null : opt?.imageUrl;

									if (!optionText.trim() && !optionImage) return null;

									const isCorrect = Array.isArray(form.correctAnswer)
										? form.correctAnswer.includes(idx)
										: form.correctAnswer === idx;
									return (
										<div key={idx} className='flex items-center gap-2'>
											<button
												type='button'
												onClick={() => toggleCorrectAnswer(idx)}
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
											<div className='flex items-center gap-2'>
												<span className='text-sm text-gray-700'>
													{optionText || `Option ${idx + 1}`}
												</span>
												{optionImage && (
													<img
														src={optionImage}
														alt={`Option ${idx + 1}`}
														className='w-8 h-8 object-cover rounded border'
													/>
												)}
											</div>
										</div>
									);
								})}
							</div>
							<div className='text-xs text-gray-500 mt-1'>
								{form.type === QUESTION_TYPE.SINGLE_CHOICE
									? 'Click to select the single correct answer'
									: 'Click the checkboxes to select multiple correct answers'}
							</div>
						</div>
					)}

					{isAssessmentType && isCustomScoringEnabled && (
						<div>
							<label className='block text-sm font-medium text-gray-700 mb-2'>
								Question Points
							</label>
							<input
								type='number'
								className='input-field w-full'
								placeholder={`Default points: ${defaultQuestionPoints}`}
								value={form.points || ''}
								onChange={e =>
									onChange(
										'points',
										e.target.value ? parseInt(e.target.value) : undefined
									)
								}
								min='1'
								max='100'
							/>
							<div className='text-xs text-gray-500 mt-1'>
								Leave empty to use default points ({defaultQuestionPoints} points)
							</div>
						</div>
					)}

					<div className='flex justify-end gap-3 pt-4 border-t'>
						<button type='button' onClick={onClose} className='btn-secondary'>
							Cancel
						</button>
						<button
							type='submit'
							className='btn-primary'
							disabled={!isFormValid() || loading}
						>
							{loading ? 'Adding...' : 'Add Question'}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};

export default AddSurveyQuestionModal;
