import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { InstallBanner } from './components/InstallBanner';
import { Login } from './pages/Login';
import { Onboarding } from './pages/Onboarding';
import { MainPage } from './pages/MainPage';
import { Session } from './pages/Session';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/main" element={<MainPage />} />
          <Route path="/session/:id" element={<Session />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
        <InstallBanner />
      </div>
    </BrowserRouter>
  );
}

export default App;
