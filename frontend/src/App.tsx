import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { EventProvider } from './contexts/EventContext';
import AdminLogin from './components/AdminLogin';
import AdminSignup from './components/AdminSignup';
import EventList from './components/EventList';
import EventCreation from './components/EventCreation';
import PrizeManagement from './components/PrizeManagement';
import FieldSettings from './components/FieldSettings';
import EntryStatus from './components/EntryStatus';
import FinalResults from './components/FinalResults';
import QRPage from './components/QRPage';

function App() {
  return (
    <div className="app-container">
      <EventProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Navigate to="/admin-login" replace />} />
            <Route path="/admin-login" element={<AdminLogin />} />
            <Route path="/admin-signup" element={<AdminSignup />} />
            <Route path="/event-list" element={<EventList />} />
            <Route path="/event-creation" element={<EventCreation />} />
            <Route path="/prize-management" element={<PrizeManagement />} />
            <Route path="/field-settings" element={<FieldSettings />} />
            <Route path="/entry-status" element={<EntryStatus />} />
            <Route path="/final-results" element={<FinalResults />} />
            <Route path="/qr-page" element={<QRPage />} />
          </Routes>
        </Router>
      </EventProvider>
    </div>
  );
}

export default App;
