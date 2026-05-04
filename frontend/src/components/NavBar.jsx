import React from 'react';
import { LayoutDashboard, Clock, GraduationCap, Receipt, Bell, BarChart3, LogOut, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const NavBar = ({ activeTab, setActiveTab }) => {
  const { user, logout } = useAuth();
  
  if (!user) return null;

  const tabs = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard, roles: ['admin', 'head_teacher', 'teacher', 'accountant'] },
    { id: 'clockin', label: 'Clock In', icon: Clock, roles: ['teacher'] },
    { id: 'results', label: 'Results', icon: GraduationCap, roles: ['admin', 'head_teacher', 'teacher'] },
    { id: 'fees', label: 'Fees', icon: Receipt, roles: ['admin', 'accountant'] },
    { id: 'notifications', label: 'Alerts', icon: Bell, roles: ['admin', 'head_teacher', 'teacher', 'accountant'] },
    { id: 'reports', label: 'Reports', icon: BarChart3, roles: ['admin', 'head_teacher'] },
  ];

  const filteredTabs = tabs.filter(tab => tab.roles.includes(user.role));

  return (
    <>
      {/* Desktop Sidebar (Hidden on mobile) */}
      <nav className="desktop-nav">
        <div className="nav-header">
          <div className="logo">STS</div>
          <div className="user-info">
            <div className="user-avatar"><User size={20} /></div>
            <div>
              <div className="user-name">{user.username}</div>
              <div className="user-role">{user.role.replace('_', ' ')}</div>
            </div>
          </div>
        </div>
        <div className="nav-links">
          {filteredTabs.map(tab => (
            <button 
              key={tab.id} 
              className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <tab.icon size={20} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
        <button className="nav-item logout" onClick={logout}>
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </nav>

      {/* Mobile Bottom Nav */}
      <nav className="mobile-nav">
        {filteredTabs.map(tab => (
          <button 
            key={tab.id} 
            className={`mobile-nav-item ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <tab.icon size={24} />
            <span>{tab.label}</span>
          </button>
        ))}
        <button className="mobile-nav-item" onClick={logout}>
          <LogOut size={24} />
          <span>Out</span>
        </button>
      </nav>

      <style dangerouslySetInnerHTML={{ __html: `
        .desktop-nav {
          display: none;
          width: 260px;
          height: 100vh;
          background: #1e1b4b;
          color: white;
          padding: 1.5rem;
          flex-direction: column;
          position: fixed;
        }

        .nav-header { padding-bottom: 2rem; border-bottom: 1px solid rgba(255,255,255,0.1); margin-bottom: 2rem; }
        .logo { font-size: 1.5rem; font-weight: 800; color: #818cf8; margin-bottom: 1.5rem; }
        .user-info { display: flex; align-items: center; gap: 1rem; }
        .user-avatar { width: 40px; height: 40px; background: #312e81; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
        .user-name { font-weight: 600; font-size: 0.9rem; }
        .user-role { font-size: 0.75rem; color: #a5b4fc; text-transform: capitalize; }

        .nav-links { flex: 1; display: flex; flex-direction: column; gap: 0.5rem; }
        .nav-item {
          display: flex; align-items: center; gap: 1rem; padding: 0.875rem 1rem;
          border-radius: 12px; color: #a5b4fc; background: transparent; border: none;
          cursor: pointer; transition: all 0.2s; width: 100%; text-align: left;
        }
        .nav-item:hover { background: rgba(255,255,255,0.05); color: white; }
        .nav-item.active { background: #4f46e5; color: white; }
        .nav-item.logout { margin-top: auto; color: #fca5a5; }

        .mobile-nav {
          position: fixed; bottom: 0; left: 0; right: 0;
          height: 70px; background: white; border-top: 1px solid #e2e8f0;
          display: flex; justify-content: space-around; align-items: center;
          padding: 0 1rem; z-index: 1000;
        }
        .mobile-nav-item {
          display: flex; flex-direction: column; align-items: center; gap: 4px;
          background: transparent; border: none; color: #64748b; font-size: 10px; font-weight: 600;
        }
        .mobile-nav-item.active { color: #4f46e5; }

        @media (min-width: 1024px) {
          .desktop-nav { display: flex; }
          .mobile-nav { display: none; }
          .main-content { margin-left: 260px; }
        }
      `}} />
    </>
  );
};

export default NavBar;
