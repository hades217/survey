import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAdmin } from '../../contexts/AdminContext';
import LanguageSwitcher from '../common/LanguageSwitcher';

const AdminHeader: React.FC = () => {
	const { logout, setShowCreateModal, navigate, profileData } = useAdmin();
	const { t } = useTranslation('admin');
	const { t: tCommon } = useTranslation(); // 默认命名空间用于通用翻译
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

	// Get company name from profile data, fallback to "Sigma" if not available
	const companyName = profileData?.company?.name || 'Sigma';

	// Update document title when company name changes
	useEffect(() => {
		document.title = `${companyName} - Admin Dashboard`;
	}, [companyName]);

	return (
		<div className='mb-8'>
			{/* Desktop Layout */}
			<div className='hidden md:flex justify-between items-center'>
				<div>
					<h1 className='text-3xl font-bold text-gray-900'>
						{t('dashboard.title', { companyName })}
					</h1>
					<p className='text-gray-600 mt-1'>{t('dashboard.subtitle')}</p>
				</div>
				<div className='flex items-center gap-3'>
					<LanguageSwitcher />
					<button className='btn-primary' onClick={() => setShowCreateModal(true)}>
						+ {t('survey.createSurvey')}
					</button>
					<button className='btn-secondary' onClick={() => navigate('/admin/profile')}>
						{tCommon('navigation.profile')}
					</button>
					<button className='btn-secondary' onClick={logout}>
						{tCommon('buttons.logout')}
					</button>
				</div>
			</div>

			{/* Mobile Layout */}
			<div className='md:hidden'>
				<div className='flex justify-between items-start mb-4'>
					<div className='flex-1'>
						<h1 className='text-2xl font-bold text-gray-900'>
							{t('dashboard.title', { companyName })}
						</h1>
						<p className='text-gray-600 text-sm mt-1'>{t('dashboard.subtitle')}</p>
					</div>
					<button
						onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
						className='ml-2 p-2 rounded-lg hover:bg-gray-100 transition-colors z-50 relative'
					>
						<svg
							className='w-6 h-6'
							fill='none'
							stroke='currentColor'
							viewBox='0 0 24 24'
						>
							{mobileMenuOpen ? (
								<path
									strokeLinecap='round'
									strokeLinejoin='round'
									strokeWidth={2}
									d='M6 18L18 6M6 6l12 12'
								/>
							) : (
								<path
									strokeLinecap='round'
									strokeLinejoin='round'
									strokeWidth={2}
									d='M4 6h16M4 12h16M4 18h16'
								/>
							)}
						</svg>
					</button>
				</div>

				{/* Create Survey Button - Always visible on mobile */}
				<div className='mb-4'>
					<button
						className='w-full btn-primary'
						onClick={() => setShowCreateModal(true)}
					>
						+ {t('survey.createSurvey')}
					</button>
				</div>

				{/* Fullscreen Mobile Menu */}
				{mobileMenuOpen && (
					<div className='fixed inset-0 bg-white z-40 flex flex-col justify-center items-center space-y-8'>
						<div className='text-center space-y-6 w-full max-w-sm px-6'>
							<div className='w-full mb-4'>
								<LanguageSwitcher />
							</div>
							
							<button
								className='w-full btn-secondary text-lg py-4'
								onClick={() => {
									navigate('/admin/profile');
									setMobileMenuOpen(false);
								}}
							>
								{tCommon('navigation.profile')}
							</button>
							
							<button
								className='w-full btn-secondary text-lg py-4'
								onClick={() => {
									logout();
									setMobileMenuOpen(false);
								}}
							>
								{tCommon('buttons.logout')}
							</button>
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

export default AdminHeader;
