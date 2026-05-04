import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { attendanceApi } from '../api/api';
import { Fingerprint, MapPin, CheckCircle2, Clock as ClockIcon, LogOut, AlertCircle } from 'lucide-react';

const ClockIn = () => {
  const { user } = useAuth();
  const [time, setTime] = useState(new Date());
  const [isGpsEnabled, setIsGpsEnabled] = useState(true);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [todayLogs, setTodayLogs] = useState([]);
  const [todayStatus, setTodayStatus] = useState(null);
  const [error, setError] = useState('');

  const hasTeacherAccount = Boolean(user?.teacher_id);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    loadAttendanceState();
    return () => clearInterval(timer);
  }, []);

  const loadAttendanceState = async () => {
    await Promise.all([fetchTodayLogs(), fetchTodayStatus()]);
  };

  const fetchTodayLogs = async () => {
    try {
      const { data } = await attendanceApi.getToday();
      setTodayLogs(data);
    } catch (err) {
      console.error('Error fetching logs', err);
    }
  };

  const fetchTodayStatus = async () => {
    if (!hasTeacherAccount) {
      setTodayStatus(null);
      return;
    }

    try {
      const { data } = await attendanceApi.getStatus(user.teacher_id);
      setTodayStatus(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to load your attendance status.');
    }
  };

  const handleClockIn = async () => {
    if (!hasTeacherAccount) {
      setError('Your user account is not linked to a teacher profile yet.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const { data } = await attendanceApi.clockIn({
        teacher_id: user.teacher_id,
        gps_verified: isGpsEnabled,
        fingerprint_verified: true
      });
      setStatus(data);
      await loadAttendanceState();
    } catch (err) {
      setError(err.response?.data?.error || 'Clock-in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleClockOut = async () => {
    if (!hasTeacherAccount) {
      setError('Your user account is not linked to a teacher profile yet.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const { data } = await attendanceApi.clockOut({
        teacher_id: user.teacher_id,
      });
      setStatus(data);
      await loadAttendanceState();
    } catch (err) {
      setError(err.response?.data?.error || 'Clock-out failed');
    } finally {
      setLoading(false);
    }
  };

  const getOwnStatusText = () => {
    if (!hasTeacherAccount) return 'Teacher profile missing';
    if (!todayStatus?.check_in_time) return 'Not clocked in yet';
    if (todayStatus.check_out_time) return `Clocked out at ${todayStatus.check_out_time}`;
    return `Clocked in at ${todayStatus.check_in_time}`;
  };

  const getLogText = (log) => {
    if (!log.check_in_time) return 'No clock-in recorded today';
    if (log.check_out_time) return `Clocked in at ${log.check_in_time} and out at ${log.check_out_time}`;
    return `Clocked in at ${log.check_in_time} - waiting for clock-out`;
  };

  return (
    <div className="clockin-container animate-fade-in">
      <div className="clock-card card">
        <ClockIcon size={32} className="clock-icon-bg" />
        <div className="digital-clock">
          {time.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </div>
        <div className="date-display">
          {time.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
        </div>
      </div>

      <div className="action-card card">
        <div className="status-panel">
          <div>
            <h3>Your attendance today</h3>
            <p>{getOwnStatusText()}</p>
          </div>
          {todayStatus?.status && (
            <span className={`badge badge-${todayStatus.status}`}>{todayStatus.status}</span>
          )}
        </div>

        <div className="gps-toggle">
          <div className={`status-dot ${isGpsEnabled ? 'active' : ''}`}></div>
          <span>Demo GPS evidence {isGpsEnabled ? 'enabled' : 'disabled'}</span>
          <button
            className={`toggle-btn ${isGpsEnabled ? 'active' : ''}`}
            onClick={() => setIsGpsEnabled(!isGpsEnabled)}
            type="button"
          >
            <MapPin size={18} />
          </button>
        </div>

        <div className="fingerprint-action">
          <p>Demo identity confirmation before attendance actions</p>
          <button
            className={`fingerprint-btn ${loading ? 'loading' : ''}`}
            onClick={handleClockIn}
            disabled={loading || !hasTeacherAccount || Boolean(todayStatus?.check_in_time)}
            type="button"
          >
            <Fingerprint size={64} />
          </button>
          <div className="pulse-ring"></div>
        </div>

        <div className="action-buttons">
          <button
            className="btn btn-primary"
            onClick={handleClockIn}
            disabled={loading || !hasTeacherAccount || Boolean(todayStatus?.check_in_time)}
            type="button"
          >
            {loading ? 'Saving...' : 'Clock In'}
          </button>
          <button
            className="btn btn-outline"
            onClick={handleClockOut}
            disabled={loading || !todayStatus?.check_in_time || Boolean(todayStatus?.check_out_time)}
            type="button"
          >
            <LogOut size={18} /> Clock Out
          </button>
        </div>

        <div className="helper-note">
          GPS and fingerprint indicators are demo verification flags for this prototype. They improve visibility for testers but do not represent hardware-backed verification.
        </div>
      </div>

      {error && (
        <div className="error-card card">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {status && (
        <div className="success-card card animate-fade-in">
          <div className="success-icon">
            <CheckCircle2 size={48} />
          </div>
          <h3>{status.action === 'clock_out' ? 'Clock-out Successful!' : 'Clock-in Successful!'}</h3>
          <p>Recorded for {status.teacher_name}</p>
          <div className="summary-row">
            <span>Time: <strong>{status.time}</strong></span>
            <span>Status: <span className={`badge badge-${status.status}`}>{status.status}</span></span>
          </div>
          {status.check_in_time && <p className="summary-detail">Check-in time: {status.check_in_time}</p>}
          <button className="btn btn-primary" onClick={() => setStatus(null)}>Done</button>
        </div>
      )}

      <div className="logs-section">
        <h3>Today's Attendance Log</h3>
        <div className="logs-list">
          {todayLogs.length === 0 ? (
            <p className="no-data">No records found for today yet.</p>
          ) : (
            todayLogs.map(log => (
              <div key={`${log.teacher_id}-${log.date || 'today'}`} className="log-item card">
                <div className="log-info">
                  <strong>{log.first_name} {log.last_name}</strong>
                  <span>{getLogText(log)}</span>
                </div>
                <span className={`badge badge-${log.status}`}>{log.status}</span>
              </div>
            ))
          )}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .clockin-container { display: flex; flex-direction: column; gap: 1.5rem; }
        
        .clock-card { text-align: center; position: relative; overflow: hidden; background: linear-gradient(135deg, #1e1b4b, #312e81); color: white; padding: 2rem; }
        .clock-icon-bg { position: absolute; top: -10px; right: -10px; opacity: 0.1; transform: scale(3); }
        .digital-clock { font-size: 3rem; font-weight: 800; font-family: monospace; }
        .date-display { opacity: 0.7; font-weight: 500; }

        .action-card { text-align: center; padding: 3rem 2rem; }
        .status-panel { display: flex; justify-content: space-between; align-items: center; gap: 1rem; text-align: left; margin-bottom: 1rem; }
        .status-panel h3 { color: #1e293b; margin-bottom: 0.25rem; }
        .status-panel p { color: #64748b; }
        .gps-toggle { display: flex; align-items: center; justify-content: center; gap: 0.5rem; margin-bottom: 2rem; font-size: 0.875rem; color: #64748b; }
        .status-dot { width: 8px; height: 8px; border-radius: 50%; background: #94a3b8; }
        .status-dot.active { background: #22c55e; box-shadow: 0 0 8px #22c55e; }
        .toggle-btn { background: #f1f5f9; border: none; padding: 0.5rem; border-radius: 8px; cursor: pointer; color: #64748b; }
        .toggle-btn.active { background: #e0e7ff; color: #4f46e5; }

        .fingerprint-action { position: relative; display: flex; flex-direction: column; align-items: center; }
        .fingerprint-action p { margin-bottom: 1.5rem; color: #64748b; font-weight: 500; }
        
        .fingerprint-btn {
          width: 120px; height: 120px; border-radius: 50%; background: white;
          border: 4px solid #e0e7ff; color: #4f46e5; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.3s; z-index: 2; position: relative;
          animation: pulse-custom 2s infinite;
        }
        .fingerprint-btn:active { transform: scale(0.95); }
        .fingerprint-btn.loading { opacity: 0.7; animation: none; }
        .fingerprint-btn:disabled { opacity: 0.45; cursor: not-allowed; animation: none; }
        .action-buttons { display: flex; justify-content: center; gap: 1rem; flex-wrap: wrap; margin-top: 2rem; }
        .helper-note { margin-top: 1rem; color: #64748b; font-size: 0.8rem; line-height: 1.5; }

        .success-card { text-align: center; padding: 2.5rem; border: 2px solid #22c55e; }
        .success-icon { color: #22c55e; margin-bottom: 1rem; }
        .summary-row { display: flex; justify-content: center; gap: 2rem; margin: 1.5rem 0; font-size: 1.1rem; }
        .summary-detail { color: #64748b; margin-bottom: 1rem; }

        .error-card {
          display: flex; align-items: center; gap: 0.75rem; color: #991b1b;
          background: #fee2e2; border: 1px solid #fecaca; padding: 1rem 1.25rem;
        }

        .logs-section h3 { margin-bottom: 1rem; font-size: 1.1rem; color: #1e293b; }
        .logs-list { display: flex; flex-direction: column; gap: 0.75rem; }
        .log-item { display: flex; justify-content: space-between; align-items: center; padding: 1rem; }
        .log-info { display: flex; flex-direction: column; }
        .log-info span { font-size: 0.875rem; color: #64748b; }
        .no-data { text-align: center; color: #94a3b8; padding: 2rem; }
      `}} />
    </div>
  );
};

export default ClockIn;
