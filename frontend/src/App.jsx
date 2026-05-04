import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import NavBar from './components/NavBar';
import Login from './screens/Login';
import Dashboard from './screens/Dashboard';
import ClockIn from './screens/ClockIn';
import Results from './screens/Results';
import Fees from './screens/Fees';
import Notifications from './screens/Notifications';
import Reports from './screens/Reports';

const AppContent = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (!user) {
    return <Login />;
  }

  const renderScreen = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'clockin': return <ClockIn />;
      case 'results': return <Results />;
      case 'fees': return <Fees />;
      case 'notifications': return <Notifications />;
      case 'reports': return <Reports />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="app-container">
      <NavBar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="main-content">
        {renderScreen()}
      </main>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
