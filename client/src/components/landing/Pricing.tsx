import React from 'react';
import { useTranslation } from 'react-i18next';
import { CheckIcon } from '@heroicons/react/24/solid';
import { Link } from 'react-router-dom';

const Pricing: React.FC = () => {
	const { t } = useTranslation();

	const plans = [
		{
			key: 'basic',
			featured: false,
			features: [
				t('landing.pricing.basic.features.0'),
				t('landing.pricing.basic.features.1'),
				t('landing.pricing.basic.features.2'),
				t('landing.pricing.basic.features.3'),
				t('landing.pricing.basic.features.4'),
			],
		},
		{
			key: 'pro',
			featured: true,
			features: [
				t('landing.pricing.pro.features.0'),
				t('landing.pricing.pro.features.1'),
				t('landing.pricing.pro.features.2'),
				t('landing.pricing.pro.features.3'),
				t('landing.pricing.pro.features.4'),
			],
		},
	];

	return (
		<section className="py-20 bg-white">
			<div className="container mx-auto px-4 sm:px-6 lg:px-8">
				<div className="text-center mb-16">
					<h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
						{t('landing.pricing.title')}
					</h2>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
					{plans.map((plan) => (
						<div
							key={plan.key}
							className={`relative rounded-2xl shadow-lg overflow-hidden ${
								plan.featured
									? 'border-2 border-blue-500 transform scale-105'
									: 'border border-gray-200'
							}`}
						>
							{plan.featured && (
								<div className="absolute top-0 right-0 bg-blue-500 text-white px-4 py-1 text-sm font-medium rounded-bl-lg">
									RECOMMENDED
								</div>
							)}
							<div className="p-8">
								<h3 className="text-2xl font-bold text-gray-900 mb-2">
									{t(`landing.pricing.${plan.key}.title`)}
								</h3>
								<p className="text-gray-600 mb-4">
									{t(`landing.pricing.${plan.key}.subtitle`)}
								</p>
								<div className="mb-8">
									<span className="text-4xl font-bold text-gray-900">
										{t(`landing.pricing.${plan.key}.price`)}
									</span>
								</div>
								<ul className="space-y-4 mb-8">
									{plan.features.map((feature, index) => (
										<li key={index} className="flex items-start">
											<CheckIcon className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
											<span className="text-gray-700">{feature}</span>
										</li>
									))}
								</ul>
								<Link
									to="/admin/register"
									className={`block w-full text-center py-3 px-6 rounded-full font-medium transition duration-150 ease-in-out ${
										plan.featured
											? 'bg-blue-600 text-white hover:bg-blue-700'
											: 'bg-gray-100 text-gray-900 hover:bg-gray-200'
									}`}
								>
									{t(`landing.pricing.${plan.key}.button`)}
								</Link>
							</div>
						</div>
					))}
				</div>
			</div>
		</section>
	);
};

export default Pricing;