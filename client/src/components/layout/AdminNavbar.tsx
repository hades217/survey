import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAdmin } from '../../contexts/AdminContext';
import LanguageSwitcher from '../common/LanguageSwitcher';
import { 
	UserCircleIcon, 
	ArrowRightOnRectangleIcon,
	Bars3Icon,
	XMarkIcon 
} from '@heroicons/react/24/outline';

const AdminNavbar: React.FC = () => {
	const { logout, navigate } = useAdmin();
	const { t } = useTranslation();
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

	const handleProfileClick = () => {
		navigate('/admin/profile');
		setMobileMenuOpen(false);
	};

	const handleLogout = () => {
		logout();
		setMobileMenuOpen(false);
	};

	return (
		<nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
			<div className="w-full mx-auto px-4" style={{ maxWidth: '1440px' }}>
				<div className="flex justify-between items-center h-16">
					{/* Logo */}
					<Link to="/admin" className="flex items-center">
						<img src="/SigmaQ-logo.svg" alt="SigmaQ" className="h-10" />
					</Link>

					{/* Desktop Navigation */}
					<div className="hidden md:flex items-center space-x-4">
						<LanguageSwitcher />
						
						<button
							onClick={handleProfileClick}
							className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:text-[#FF5A5F] transition-colors duration-200 cursor-pointer"
						>
							<UserCircleIcon className="w-5 h-5" />
							<span className="font-medium">{t('navigation.profile')}</span>
						</button>
						
						<button
							onClick={handleLogout}
							className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:text-red-600 transition-colors duration-200 cursor-pointer"
						>
							<ArrowRightOnRectangleIcon className="w-5 h-5" />
							<span className="font-medium">{t('buttons.logout')}</span>
						</button>
					</div>

					{/* Mobile menu button */}
					<div className="md:hidden">
						<button
							onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
							className="p-2 text-gray-700 hover:text-gray-900 transition-colors duration-200 cursor-pointer"
						>
							{mobileMenuOpen ? (
								<XMarkIcon className="h-6 w-6" />
							) : (
								<Bars3Icon className="h-6 w-6" />
							)}
						</button>
					</div>
				</div>
			</div>

			{/* Mobile Navigation Menu */}
			{mobileMenuOpen && (
				<div className="md:hidden border-t border-gray-200 bg-white">
					<div className="px-4 py-4 space-y-3">
						<div className="pb-3 border-b border-gray-100">
							<LanguageSwitcher />
						</div>
						
						<button
							onClick={handleProfileClick}
							className="flex items-center gap-3 w-full px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200 cursor-pointer"
						>
							<UserCircleIcon className="w-5 h-5" />
							<span className="font-medium">{t('navigation.profile')}</span>
						</button>
						
						<button
							onClick={handleLogout}
							className="flex items-center gap-3 w-full px-3 py-2 text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors duration-200 cursor-pointer"
						>
							<ArrowRightOnRectangleIcon className="w-5 h-5" />
							<span className="font-medium">{t('buttons.logout')}</span>
						</button>
					</div>
				</div>
			)}
		</nav>
	);
};

export default AdminNavbar;