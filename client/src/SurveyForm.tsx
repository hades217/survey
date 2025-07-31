import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

interface Question {
	id: string;
	text: string;
	options: string[];
}

interface SurveyFormProps {
	questions: Question[];
}

// Form values type with dynamic keys for questions
export type SurveyFormValues = {
	name: string;
	email: string;
} & Record<string, string>;

const SurveyForm: React.FC<SurveyFormProps> = ({ questions }) => {
	const { t } = useTranslation('survey');
	const { t: tCommon } = useTranslation(); // 默认命名空间用于通用翻译
	
	// Build validation schema based on question ids
	const schema = React.useMemo(() => {
		const questionShape: Record<string, z.ZodTypeAny> = {};
		for (const q of questions) {
			questionShape[q.id] = z.string().nonempty(t('form.pleaseSelectOption'));
		}
		return z
			.object({
				name: z.string().nonempty(t('form.nameRequired')),
				email: z.string().email(t('form.emailInvalid')),
			})
			.extend(questionShape);
	}, [questions, t]);

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<SurveyFormValues>({
		resolver: zodResolver(schema),
	});

	const onSubmit = async (data: SurveyFormValues) => {
		await axios.post('/api/submit', data);
	};

	return (
		<form onSubmit={handleSubmit(onSubmit)} className='space-y-4 max-w-xl mx-auto'>
			<div>
				<label className='block mb-1 font-semibold'>{tCommon('common.name')}</label>
				<input className='w-full p-2 border rounded' {...register('name')} />
				{errors.name && <p className='text-red-500 text-sm'>{errors.name.message}</p>}
			</div>

			<div>
				<label className='block mb-1 font-semibold'>{tCommon('common.email')}</label>
				<input type='email' className='w-full p-2 border rounded' {...register('email')} />
				{errors.email && <p className='text-red-500 text-sm'>{errors.email.message}</p>}
			</div>

			{questions.map(q => (
				<div key={q.id}>
					<label className='block mb-1 font-semibold'>{q.text}</label>
					{q.type === 'short_text' ? (
						<textarea
							className='w-full p-3 border border-gray-200 rounded-lg focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-colors'
							placeholder={t('form.enterAnswerHere')}
							rows={4}
							{...register(q.id)}
						/>
					) : (
						q.options.map((opt, index) => {
							const optionValue = typeof opt === 'string' ? opt : opt.text;
							const optionText = typeof opt === 'string' ? opt : opt.text;
							return (
								<label key={`${q.id}-${index}`} className='block'>
									<input
										type='radio'
										value={optionValue}
										{...register(q.id)}
										className='mr-2'
									/>
									{optionText}
								</label>
							);
						})
					)}
					{errors[q.id] && (
						<p className='text-red-500 text-sm'>{(errors as any)[q.id]?.message}</p>
					)}
				</div>
			))}

			<button className='px-4 py-2 bg-blue-500 text-white rounded' type='submit'>
				{tCommon('buttons.submit')}
			</button>
		</form>
	);
};

export default SurveyForm;
