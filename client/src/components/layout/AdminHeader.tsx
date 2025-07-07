import React from 'react';
import { useAdmin } from '../../contexts/AdminContext';

const AdminHeader: React.FC = () => {
	const { logout, setShowCreateModal } = useAdmin();

	return (
		<div className="flex justify-between items-center mb-8">
			<div>
				<h1 className="text-3xl font-bold text-gray-900">Sigma Admin Dashboard</h1>
				<p className="text-gray-600 mt-1">
					Manage your surveys, assessments and view responses
				</p>
			</div>
			<div className="flex gap-3">
				<button 
					className="btn-primary" 
					onClick={() => setShowCreateModal(true)}
				>
					+ Create Sigma
				</button>
				<button 
					className="btn-secondary" 
					onClick={logout}
				>
					Logout
				</button>
			</div>
		</div>
	);
};

export default AdminHeader;