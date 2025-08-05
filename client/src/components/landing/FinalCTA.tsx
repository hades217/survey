import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

const FinalCTA: React.FC = () => {
	const { t } = useTranslation();

	return (
		<section className="py-24 bg-gradient-to-r from-[#FF5A5F] to-[#FC642D]">
			<div className="container mx-auto px-6 lg:px-8 text-center">
				<h2 className="heading-lg text-white mb-6">
					{t('landing.cta.title')}
				</h2>
				<p className="body-xl text-white/90 mb-12 max-w-2xl mx-auto">
					{t('landing.cta.subtitle')}
				</p>
				<div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
					<Link
						to="/admin/register"
						className="inline-flex items-center justify-center px-10 py-4 bg-white text-[#FF5A5F] font-semibold rounded-xl hover:bg-gray-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
					>
						{t('landing.cta.button')}
					</Link>
				</div>
				<p className="mt-8 text-white/80 body-md">
					{t('landing.cta.contactSales')}
				</p>
			</div>
		</section>
	);
};

export default FinalCTA;