import React from 'react';
import { useAdmin } from '../contexts/AdminContext';
import AdminHeader from './layout/AdminHeader';
import NavigationTabs from './navigation/NavigationTabs';
import SurveyListView from './surveys/SurveyListView';
import SurveyDetailView from './surveys/SurveyDetailView';
import QuestionBankListView from './questionBanks/QuestionBankListView';
import QuestionBankDetailView from './questionBanks/QuestionBankDetailView';
import CreateSurveyModal from './modals/CreateSurveyModal';
import EditSurveyModal from './modals/EditSurveyModal';
import ScoringModal from './modals/ScoringModal';


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
		
		// Default: survey list view
		return <SurveyListView />;
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-8">
			<div className="w-full max-w-3xl mx-auto px-4">
				<AdminHeader />
				<NavigationTabs />
				{renderContent()}
				
				{/* Modals */}
				<CreateSurveyModal />
				<EditSurveyModal />
				<ScoringModal />
				
				{/* Debug info */}
				<div className="fixed bottom-4 right-4 bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
					<div>Refactored Admin Dashboard</div>
					<div>Tab: {tab}</div>
					<div>Selected Survey: {selectedSurvey?._id || 'None'}</div>
					<div>Selected QB: {selectedQuestionBankDetail?._id || 'None'}</div>
				</div>
			</div>
		</div>
	);
};

export default AdminDashboard;