import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Survey from './Survey';
import TakeSurvey from './TakeSurvey';
// @ts-expect-error - Legacy JSX component without TypeScript
import StudentAssessment from './components/StudentAssessment.jsx';
import Admin from './Admin';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
	<React.StrictMode>
		<BrowserRouter>
			<Routes>
				<Route path='/' element={<TakeSurvey />} />
				<Route path='/admin' element={<Admin />} />
				<Route path='/admin/login' element={<Admin />} />
				<Route path='/admin/register' element={<Admin />} />
				<Route path='/admin/surveys' element={<Admin />} />
				<Route path='/admin/question-banks' element={<Admin />} />
				<Route path='/admin/question-bank/:id' element={<Admin />} />
				<Route path='/admin/survey/:id' element={<Admin />} />
				<Route path='/admin/profile' element={<Admin />} />
				<Route path='/admin/:id' element={<Admin />} />
				<Route path='/survey/:slug' element={<TakeSurvey />} />
				<Route path='/assessment/:slug' element={<StudentAssessment />} />
				<Route path='/legacy' element={<Survey />} />
			</Routes>
		</BrowserRouter>
	</React.StrictMode>
);
