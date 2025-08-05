import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

const FinalCTA: React.FC = () => {
	const { t } = useTranslation();

	return (
		<section className="py-20 bg-blue-600">
			<div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
				<h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
					{t('landing.cta.title')}
				</h2>
				<p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
					{t('landing.cta.subtitle')}
				</p>
				<div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
					<Link
						to="/admin/register"
						className="inline-flex items-center justify-center px-8 py-4 border border-transparent text-base font-medium rounded-full text-blue-600 bg-white hover:bg-gray-50 transition duration-150 ease-in-out shadow-lg hover:shadow-xl"
					>
						{t('landing.cta.button')}
					</Link>
				</div>
				<p className="mt-6 text-blue-200 text-sm">
					{t('landing.cta.contactSales')}
				</p>
			</div>
		</section>
	);
};

export default FinalCTA;