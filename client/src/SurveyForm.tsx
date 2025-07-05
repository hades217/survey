import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
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
	// Build validation schema based on question ids
	const schema = React.useMemo(() => {
		const questionShape: Record<string, z.ZodTypeAny> = {};
		for (const q of questions) {
			questionShape[q.id] = z.string().nonempty('请选择一项');
		}
		return z.object({
			name: z.string().nonempty('姓名不能为空'),
			email: z.string().email('邮箱格式不正确'),
		}).extend(questionShape);
	}, [questions]);

	const { register, handleSubmit, formState: { errors } } = useForm<SurveyFormValues>({
		resolver: zodResolver(schema),
	});

	const onSubmit = async (data: SurveyFormValues) => {
		await axios.post('/api/submit', data);
	};

	return (
		<form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-xl mx-auto">
			<div>
				<label className="block mb-1 font-semibold">姓名</label>
				<input className="w-full p-2 border rounded" {...register('name')} />
				{errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
			</div>

			<div>
				<label className="block mb-1 font-semibold">邮箱</label>
				<input type="email" className="w-full p-2 border rounded" {...register('email')} />
				{errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
			</div>

			{questions.map((q) => (
				<div key={q.id}>
					<label className="block mb-1 font-semibold">{q.text}</label>
					{q.options.map((opt) => (
						<label key={opt} className="block">
							<input
								type="radio"
								value={opt}
								{...register(q.id)}
								className="mr-2"
							/>
							{opt}
						</label>
					))}
					{errors[q.id] &&
            <p className="text-red-500 text-sm">{(errors as any)[q.id]?.message}</p>
					}
				</div>
			))}

			<button className="px-4 py-2 bg-blue-500 text-white rounded" type="submit">提交</button>
		</form>
	);
};

export default SurveyForm;
