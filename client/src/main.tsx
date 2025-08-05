import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Survey from './Survey';
import TakeSurvey from './TakeSurvey';
import StudentAssessment from './components/StudentAssessment';
import Admin from './Admin';
import OnboardingPage from './components/onboarding/OnboardingPage';
import LandingPage from './components/landing/LandingPage';
import './styles.css';
import './i18n';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
	<React.StrictMode>
		<BrowserRouter>
			<Routes>
				<Route path='/' element={<LandingPage />} />
				<Route path='/home' element={<LandingPage />} />
				<Route path='/signup' element={<OnboardingPage />} />
				<Route path='/login' element={<Admin />} />
				<Route path='/demo' element={<TakeSurvey />} />
				<Route path='/onboarding' element={<OnboardingPage />} />
				<Route path='/admin' element={<Admin />} />
				<Route path='/admin/login' element={<Admin />} />
				<Route path='/admin/register' element={<Admin />} />
				<Route path='/admin/surveys' element={<Admin />} />
				<Route path='/admin/question-banks' element={<Admin />} />
				<Route path='/admin/question-bank/:id' element={<Admin />} />
				<Route path='/admin/survey/:id' element={<Admin />} />
				<Route path='/admin/profile' element={<Admin />} />
				<Route path='/admin/billing' element={<Admin />} />
				<Route path='/admin/:id' element={<Admin />} />
				<Route path='/survey/:slug' element={<TakeSurvey />} />
				<Route path='/assessment/:slug' element={<StudentAssessment />} />
				<Route path='/legacy' element={<Survey />} />
			</Routes>
		</BrowserRouter>
	</React.StrictMode>
);
