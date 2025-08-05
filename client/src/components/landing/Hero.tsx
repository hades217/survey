import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

const Hero: React.FC = () => {
	const { t } = useTranslation();

	return (
		<section className="relative bg-gradient-to-b from-blue-50 to-white py-20 lg:py-32">
			<div className="container mx-auto px-4 sm:px-6 lg:px-8">
				<div className="lg:grid lg:grid-cols-12 lg:gap-8 items-center">
					<div className="lg:col-span-6">
						<h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
							{t('landing.hero.title')}
						</h1>
						<p className="mt-6 text-xl text-gray-600 leading-relaxed">
							{t('landing.hero.subtitle')}
						</p>
						<div className="mt-10 flex flex-col sm:flex-row gap-4">
							<Link
								to="/admin/register"
								className="inline-flex items-center justify-center px-8 py-4 border border-transparent text-base font-medium rounded-full text-white bg-blue-600 hover:bg-blue-700 transition duration-150 ease-in-out shadow-lg hover:shadow-xl"
							>
								{t('landing.hero.startFreeTrial')}
							</Link>
							<Link
								to="/demo"
								className="inline-flex items-center justify-center px-8 py-4 border border-gray-300 text-base font-medium rounded-full text-gray-700 bg-white hover:bg-gray-50 transition duration-150 ease-in-out"
							>
								{t('landing.hero.seeLiveDemo')}
							</Link>
						</div>
					</div>
					<div className="mt-12 lg:mt-0 lg:col-span-6">
						<div className="relative">
							<div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-600 rounded-2xl transform rotate-3"></div>
							<img
								src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&h=600&q=80"
								alt="Sigma Dashboard Preview"
								className="relative rounded-2xl shadow-2xl"
								onError={(e) => {
									e.currentTarget.src = 'https://via.placeholder.com/600x400/2563eb/ffffff?text=Sigma+Dashboard';
								}}
							/>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
};

export default Hero;