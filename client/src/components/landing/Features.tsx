import React from 'react';
import { useTranslation } from 'react-i18next';
import {
	ChartBarIcon,
	DocumentChartBarIcon,
	SparklesIcon,
	FolderIcon,
	GlobeAltIcon,
	SwatchIcon,
} from '@heroicons/react/24/outline';

const Features: React.FC = () => {
	const { t } = useTranslation();

	const getFeatureImage = (index: number) => {
		const images = [
			// Feature 1: Create professional assessments easily
			'https://images.unsplash.com/photo-1586953208448-b95a79798f07?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&h=300&q=80',
			// Feature 2: Visual analytics & reporting  
			'https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&h=300&q=80',
			// Feature 3: AI-powered insights
			'https://images.unsplash.com/photo-1677442136019-21780ecad995?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&h=300&q=80',
			// Feature 4: Question bank manager
			'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&h=300&q=80',
			// Feature 5: Multilingual assessments
			'https://images.unsplash.com/photo-1451187580459-43490279c0fa?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&h=300&q=80',
			// Feature 6: Branding & company customization
			'https://images.unsplash.com/photo-1611224923853-80b023f02d71?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&h=300&q=80'
		];
		return images[index] || images[0];
	};

	const features = [
		{
			key: 'feature1',
			icon: ChartBarIcon,
			color: 'bg-blue-100 text-blue-600',
		},
		{
			key: 'feature2',
			icon: DocumentChartBarIcon,
			color: 'bg-green-100 text-green-600',
		},
		{
			key: 'feature3',
			icon: SparklesIcon,
			color: 'bg-purple-100 text-purple-600',
		},
		{
			key: 'feature4',
			icon: FolderIcon,
			color: 'bg-yellow-100 text-yellow-600',
		},
		{
			key: 'feature5',
			icon: GlobeAltIcon,
			color: 'bg-indigo-100 text-indigo-600',
		},
		{
			key: 'feature6',
			icon: SwatchIcon,
			color: 'bg-pink-100 text-pink-600',
		},
	];

	return (
		<section className="py-20 bg-white">
			<div className="container mx-auto px-4 sm:px-6 lg:px-8">
				<div className="text-center mb-16">
					<h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
						{t('landing.features.title')}
					</h2>
				</div>

				<div className="space-y-20">
					{features.map((feature, index) => {
						const Icon = feature.icon;
						const isEven = index % 2 === 0;

						return (
							<div
								key={feature.key}
								className={`flex flex-col lg:flex-row items-center gap-12 ${
									!isEven ? 'lg:flex-row-reverse' : ''
								}`}
							>
								<div className="flex-1">
									<div className={`inline-flex p-3 rounded-lg ${feature.color} mb-4`}>
										<Icon className="h-8 w-8" />
									</div>
									<h3 className="text-2xl font-semibold text-gray-900 mb-4">
										{t(`landing.features.${feature.key}.title`)}
									</h3>
									<p className="text-lg text-gray-600 leading-relaxed">
										{t(`landing.features.${feature.key}.description`)}
									</p>
								</div>
								<div className="flex-1">
									<div className="relative">
										<div
											className={`absolute inset-0 ${feature.color} rounded-2xl transform ${
												isEven ? 'rotate-3' : '-rotate-3'
											} opacity-20`}
										></div>
										<img
											src={getFeatureImage(index)}
											alt={t(`landing.features.${feature.key}.title`)}
											className="relative rounded-2xl shadow-lg"
											onError={(e) => {
												e.currentTarget.src = `https://via.placeholder.com/500x300/f3f4f6/6b7280?text=Feature+${
													index + 1
												}`;
											}}
										/>
									</div>
								</div>
							</div>
						);
					})}
				</div>
			</div>
		</section>
	);
};

export default Features;