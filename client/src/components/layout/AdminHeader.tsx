import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAdmin } from '../../contexts/AdminContext';
import LanguageSwitcher from '../common/LanguageSwitcher';

const AdminHeader: React.FC = () => {
	const { logout, setShowCreateModal, navigate, profileData } = useAdmin();
	const { t } = useTranslation('admin');
	const { t: tCommon } = useTranslation(); // 默认命名空间用于通用翻译

	// Get company name from profile data, fallback to "Sigma" if not available
	const companyName = profileData?.company?.name || 'Sigma';

	// Update document title when company name changes
	useEffect(() => {
		document.title = `${companyName} - Admin Dashboard`;
	}, [companyName]);

	return (
		<div className='flex justify-between items-center mb-8'>
			<div>
				<h1 className='text-3xl font-bold text-gray-900'>
					{t('dashboard.title', { companyName })}
				</h1>
				<p className='text-gray-600 mt-1'>
					{t('dashboard.subtitle')}
				</p>
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
	);
};

export default AdminHeader;
