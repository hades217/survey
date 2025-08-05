import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import LanguageSwitcher from '../common/LanguageSwitcher';

const Footer: React.FC = () => {
	const { t } = useTranslation();

	const links = [
		{ key: 'features', to: '#features' },
		{ key: 'pricing', to: '#pricing' },
		{ key: 'helpCenter', to: '/help' },
		{ key: 'privacy', to: '/privacy' },
		{ key: 'terms', to: '/terms' },
	];

	return (
		<footer className="bg-gray-900 text-white py-12">
			<div className="container mx-auto px-4 sm:px-6 lg:px-8">
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
					<div className="lg:col-span-2">
						<h3 className="text-2xl font-bold mb-4">Sigma</h3>
						<p className="text-gray-400 mb-4 max-w-md">
							{t('appName')} - Smarter assessments for smarter teams.
						</p>
						<div className="mb-4">
							<LanguageSwitcher />
						</div>
					</div>

					<div>
						<h4 className="text-lg font-semibold mb-4">Links</h4>
						<ul className="space-y-2">
							{links.map((link) => (
								<li key={link.key}>
									<Link
										to={link.to}
										className="text-gray-400 hover:text-white transition duration-150 ease-in-out"
									>
										{t(`landing.footer.${link.key}`)}
									</Link>
								</li>
							))}
						</ul>
					</div>

					<div>
						<h4 className="text-lg font-semibold mb-4">Contact</h4>
						<ul className="space-y-2 text-gray-400">
							<li>hello@jiangren.com.au</li>
							<li>+61 451010217</li>
						</ul>
					</div>
				</div>

				<div className="border-t border-gray-800 pt-8 mt-8 text-center">
					<p className="text-gray-400">
						{t('landing.footer.copyright')}
					</p>
				</div>
			</div>
		</footer>
	);
};

export default Footer;
