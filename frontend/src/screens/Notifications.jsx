import React, { useState, useEffect } from 'react';
import { notificationApi } from '../api/api';
import { Bell, Clock, Receipt, Settings, CheckCheck } from 'lucide-react';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [activeTab, setActiveTab] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const { data } = await notificationApi.getAll();
      setNotifications(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const markRead = async (id) => {
    try {
      await notificationApi.markRead(id);
      setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: 1 } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const tabs = ['All', 'attendance', 'fees', 'system'];
  
  const filtered = activeTab === 'All' 
    ? notifications 
    : notifications.filter(n => n.type === activeTab);

  const getIcon = (type) => {
    switch (type) {
      case 'attendance': return <Clock size={18} />;
      case 'fees': return <Receipt size={18} />;
      default: return <Settings size={18} />;
    }
  };

  return (
    <div className="notifications-container animate-fade-in">
      <header className="page-header">
        <div className="header-with-action">
          <h1>Notifications</h1>
          <div className="unread-badge">{notifications.filter(n => !n.is_read).length} Unread</div>
        </div>
      </header>

      <div className="tabs-strip">
        {tabs.map(tab => (
          <button 
            key={tab} 
            className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="notifications-list">
        {loading ? (
          <div className="loading">Fetching alerts...</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state card">
            <Bell size={48} />
            <p>You're all caught up!</p>
          </div>
        ) : (
          filtered.map(notif => (
            <div key={notif.id} className={`notif-card card ${notif.is_read ? 'read' : 'unread'}`}>
              <div className={`notif-icon icon-${notif.type}`}>
                {getIcon(notif.type)}
              </div>
              <div className="notif-content">
                <p>{notif.message}</p>
                <span className="notif-time">{new Date(notif.sent_at).toLocaleString()}</span>
              </div>
              {!notif.is_read && (
                <button className="read-btn" onClick={() => markRead(notif.id)}>
                  <CheckCheck size={18} />
                </button>
              )}
            </div>
          ))
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .header-with-action { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem; }
        .unread-badge { background: #4f46e5; color: white; padding: 2px 10px; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; }

        .tabs-strip { display: flex; gap: 0.5rem; margin-bottom: 1.5rem; overflow-x: auto; padding-bottom: 0.5rem; }
        .tab-btn {
          padding: 0.5rem 1.25rem; border-radius: 9999px; border: 1px solid #e2e8f0;
          background: white; color: #64748b; font-size: 0.875rem; font-weight: 600;
          cursor: pointer; transition: all 0.2s; text-transform: capitalize;
          white-space: nowrap;
        }
        .tab-btn.active { background: #4f46e5; color: white; border-color: #4f46e5; }

        .notifications-list { display: flex; flex-direction: column; gap: 0.75rem; }
        .notif-card { display: flex; gap: 1rem; align-items: flex-start; padding: 1.25rem; position: relative; }
        .notif-card.unread { border-left: 4px solid #4f46e5; }
        .notif-card.read { opacity: 0.7; }

        .notif-icon { 
          width: 40px; height: 40px; border-radius: 10px; display: flex; 
          align-items: center; justify-content: center; flex-shrink: 0;
        }
        .icon-attendance { background: #e0e7ff; color: #4338ca; }
        .icon-fees { background: #ffedd5; color: #c2410c; }
        .icon-system { background: #f1f5f9; color: #64748b; }

        .notif-content { flex: 1; }
        .notif-content p { font-size: 0.9rem; color: #1e293b; margin-bottom: 4px; }
        .notif-time { font-size: 0.75rem; color: #94a3b8; }

        .read-btn { background: transparent; border: none; color: #4f46e5; cursor: pointer; padding: 0.5rem; border-radius: 50%; transition: background 0.2s; }
        .read-btn:hover { background: #f5f3ff; }

        .empty-state { text-align: center; padding: 4rem 2rem; color: #94a3b8; }
        .empty-state p { margin-top: 1rem; font-weight: 500; }
      `}} />
    </div>
  );
};

export default Notifications;
