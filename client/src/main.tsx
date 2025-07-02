import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Survey from './Survey';
import TakeSurvey from './TakeSurvey';
import Admin from './Admin';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<TakeSurvey />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/legacy" element={<Survey />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
