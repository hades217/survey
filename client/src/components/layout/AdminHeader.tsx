import React, { useEffect } from 'react';
import { useAdmin } from '../../contexts/AdminContext';

const AdminHeader: React.FC = () => {
	const { logout, setShowCreateModal, navigate, profileData } = useAdmin();

	// Get company name from profile data, fallback to "Sigma" if not available
	const companyName = profileData?.company?.name || 'Sigma';

	// Update document title when company name changes
	useEffect(() => {
		document.title = `${companyName} - Admin Dashboard`;
	}, [companyName]);

	return (
		<div className='flex justify-between items-center mb-8'>
			<div>
				<h1 className='text-3xl font-bold text-gray-900'>{companyName} Admin Dashboard</h1>
				<p className='text-gray-600 mt-1'>
					Manage your surveys, assessments and view responses
				</p>
			</div>
			<div className='flex items-center gap-3'>
				<button className='btn-primary' onClick={() => setShowCreateModal(true)}>
					+ Create Survey
				</button>
				<button className='btn-secondary' onClick={() => navigate('/admin/profile')}>
					Profile
				</button>
				<button className='btn-secondary' onClick={logout}>
					Logout
				</button>
			</div>
		</div>
	);
};

export default AdminHeader;
