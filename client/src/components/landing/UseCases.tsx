import React from 'react';
import { useTranslation } from 'react-i18next';
import {
	UserGroupIcon,
	AcademicCapIcon,
	BuildingOfficeIcon,
	BookOpenIcon,
	GlobeAsiaAustraliaIcon,
} from '@heroicons/react/24/outline';

const UseCases: React.FC = () => {
	const { t } = useTranslation();

	const useCases = [
		{
			key: 'hrTeams',
			icon: UserGroupIcon,
			color: 'bg-blue-50 text-blue-600 border-blue-200',
		},
		{
			key: 'training',
			icon: AcademicCapIcon,
			color: 'bg-green-50 text-green-600 border-green-200',
		},
		{
			key: 'startups',
			icon: BuildingOfficeIcon,
			color: 'bg-purple-50 text-purple-600 border-purple-200',
		},
		{
			key: 'universities',
			icon: BookOpenIcon,
			color: 'bg-yellow-50 text-yellow-600 border-yellow-200',
		},
		{
			key: 'international',
			icon: GlobeAsiaAustraliaIcon,
			color: 'bg-indigo-50 text-indigo-600 border-indigo-200',
		},
	];

	return (
		<section className="py-20 bg-gray-50">
			<div className="container mx-auto px-4 sm:px-6 lg:px-8">
				<div className="text-center mb-16">
					<h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
						{t('landing.useCases.title')}
					</h2>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
					{useCases.map((useCase) => {
						const Icon = useCase.icon;
						return (
							<div
								key={useCase.key}
								className={`p-8 rounded-2xl border-2 ${useCase.color} hover:shadow-lg transition-shadow duration-200`}
							>
								<div className="flex items-center justify-center w-16 h-16 rounded-lg bg-white mb-6">
									<Icon className="h-8 w-8" />
								</div>
								<h3 className="text-xl font-semibold text-gray-900 mb-3">
									{t(`landing.useCases.${useCase.key}.title`)}
								</h3>
								<p className="text-gray-600">
									{t(`landing.useCases.${useCase.key}.description`)}
								</p>
							</div>
						);
					})}
				</div>
			</div>
		</section>
	);
};

export default UseCases;