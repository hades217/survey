import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import LanguageSwitcher from '../common/LanguageSwitcher';

const LandingNavbar: React.FC = () => {
	const { t } = useTranslation();
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

	const navLinks = [
		{ key: 'features', href: '#features' },
		{ key: 'pricing', href: '#pricing' },
	];

	return (
		<nav className="bg-white shadow-sm sticky top-0 z-50">
			<div className="container mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex justify-between items-center h-16">
					<div className="flex items-center">
						<Link to="/" className="text-2xl font-bold text-blue-600">
							Sigma
						</Link>
					</div>

					{/* Desktop Navigation */}
					<div className="hidden md:flex items-center space-x-8">
						{navLinks.map((link) => (
							<a
								key={link.key}
								href={link.href}
								className="text-gray-700 hover:text-blue-600 transition duration-150 ease-in-out"
							>
								{t(`landing.footer.${link.key}`)}
							</a>
						))}
						<LanguageSwitcher />
						<Link
							to="/admin/login"
							className="text-gray-700 hover:text-blue-600 transition duration-150 ease-in-out"
						>
							Login
						</Link>
						<Link
							to="/admin/register"
							className="bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700 transition duration-150 ease-in-out"
						>
							{t('landing.hero.startFreeTrial')}
						</Link>
					</div>

					{/* Mobile menu button */}
					<div className="md:hidden">
						<button
							onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
							className="text-gray-700 hover:text-blue-600"
						>
							{mobileMenuOpen ? (
								<XMarkIcon className="h-6 w-6" />
							) : (
								<Bars3Icon className="h-6 w-6" />
							)}
						</button>
					</div>
				</div>

				{/* Mobile Navigation */}
				{mobileMenuOpen && (
					<div className="md:hidden border-t border-gray-200 py-4">
						<div className="flex flex-col space-y-4">
							{navLinks.map((link) => (
								<a
									key={link.key}
									href={link.href}
									className="text-gray-700 hover:text-blue-600 transition duration-150 ease-in-out"
									onClick={() => setMobileMenuOpen(false)}
								>
									{t(`landing.footer.${link.key}`)}
								</a>
							))}
							<div className="pt-2 border-t border-gray-200">
								<LanguageSwitcher />
							</div>
							<Link
								to="/admin/login"
								className="text-gray-700 hover:text-blue-600 transition duration-150 ease-in-out"
								onClick={() => setMobileMenuOpen(false)}
							>
								Login
							</Link>
							<Link
								to="/admin/register"
								className="bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700 transition duration-150 ease-in-out text-center"
								onClick={() => setMobileMenuOpen(false)}
							>
								{t('landing.hero.startFreeTrial')}
							</Link>
						</div>
					</div>
				)}
			</div>
		</nav>
	);
};

export default LandingNavbar;