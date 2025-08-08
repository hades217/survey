import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAdmin } from '../../contexts/AdminContext';

const AdminHeader: React.FC = () => {
	const { setShowCreateModal, profileData } = useAdmin();
	const { t } = useTranslation('admin');

	// Get company name from profile data, fallback to "SigmaQ" if not available
	const companyName = profileData?.company?.name || 'SigmaQ';

	// Update document title when company name changes
	useEffect(() => {
		document.title = `${companyName} - Admin Dashboard`;
	}, [companyName]);

	return (
		<div className='mb-6'>
			{/* Desktop Layout */}
			<div className='hidden md:flex justify-between items-center'>
				<div>
					<h1 className='text-3xl font-bold text-gray-900'>
						{t('dashboard.title', { companyName })}
					</h1>
					<p className='text-gray-600 mt-1'>{t('dashboard.subtitle')}</p>
				</div>
				<div>
					<button className='btn-primary' onClick={() => setShowCreateModal(true)}>
						+ {t('survey.createSurvey')}
					</button>
				</div>
			</div>

			{/* Mobile Layout */}
			<div className='md:hidden'>
				<div className='mb-4'>
					<h1 className='text-2xl font-bold text-gray-900'>
						{t('dashboard.title', { companyName })}
					</h1>
					<p className='text-gray-600 text-sm mt-1'>{t('dashboard.subtitle')}</p>
				</div>

				<div className='mb-4'>
					<button
						className='w-full btn-primary'
						onClick={() => setShowCreateModal(true)}
					>
						+ {t('survey.createSurvey')}
					</button>
				</div>
			</div>
		</div>
	);
};

export default AdminHeader;
