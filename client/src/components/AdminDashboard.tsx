import React from 'react';
import { useAdmin } from '../contexts/AdminContext';
import AdminNavbar from './layout/AdminNavbar';
import AdminHeader from './layout/AdminHeader';
import NavigationTabs from './navigation/NavigationTabs';
import SurveyListView from './surveys/SurveyListView';
import SurveyDetailView from './surveys/SurveyDetailView';
import QuestionBankListView from './questionBanks/QuestionBankListView';
import QuestionBankDetailView from './questionBanks/QuestionBankDetailView';
import ProfileView from './profile/ProfileView';
import BillingView from './billing/BillingView';
import CreateSurveyModal from './modals/CreateSurveyModal';
import EditSurveyModal from './modals/EditSurveyModal';
import ScoringModal from './modals/ScoringModal';
import QuestionBankModal from './modals/QuestionBankModal';
import EditQuestionBankModal from './modals/EditQuestionBankModal';

const AdminDashboard: React.FC = () => {
	const { tab, selectedSurvey, selectedQuestionBankDetail } = useAdmin();

	const renderContent = () => {
		if (tab === 'detail' && selectedSurvey) {
			return <SurveyDetailView survey={selectedSurvey} />;
		}

		if (tab === 'question-banks') {
			if (selectedQuestionBankDetail) {
				return <QuestionBankDetailView questionBank={selectedQuestionBankDetail} />;
			}
			return <QuestionBankListView />;
		}

		if (tab === 'profile') {
			return <ProfileView />;
		}

		if (tab === 'billing') {
			return <BillingView />;
		}

		// Default: survey list view
		return <SurveyListView />;
	};

	return (
		<div className='min-h-screen bg-gradient-to-br from-gray-50 to-gray-100'>
			{/* Top Navigation */}
			<AdminNavbar />

			{/* Main Content */}
			<div className='w-full mx-auto px-4 pt-8' style={{ maxWidth: '1440px' }}>
				<AdminHeader />
				<NavigationTabs />
				{renderContent()}

				{/* Modals */}
				<CreateSurveyModal />
				<EditSurveyModal />
				<ScoringModal />
				<QuestionBankModal />
				<EditQuestionBankModal />
			</div>
		</div>
	);
};

export default AdminDashboard;
