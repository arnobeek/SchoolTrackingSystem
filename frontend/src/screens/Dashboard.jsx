import React, { useEffect, useMemo, useState } from 'react';
import { attendanceApi, reportApi, teacherApi } from '../api/api';
import { useAuth } from '../context/AuthContext';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';
import { UserCheck, UserMinus, Clock, TrendingUp, Wallet, BookOpen } from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [trends, setTrends] = useState([]);
  const [attendanceReport, setAttendanceReport] = useState({ summary: {}, rows: [] });
  const [performanceReport, setPerformanceReport] = useState({ summary: {}, rows: [] });
  const [feesReport, setFeesReport] = useState({ summary: {}, rows: [] });
  const [teachers, setTeachers] = useState([]);
  const [teacherStatus, setTeacherStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - 13);
    const dateRange = {
      from: from.toISOString().split('T')[0],
      to: to.toISOString().split('T')[0],
    };

    try {
      const requests = [
        attendanceApi.getSummary(),
        attendanceApi.getTrends(),
        reportApi.getAttendance(dateRange),
        reportApi.getPerformance({}),
        reportApi.getFees({}),
        teacherApi.getAll(dateRange),
      ];
      if (user?.teacher_id) {
        requests.push(attendanceApi.getStatus(user.teacher_id));
      }

      const [summRes, trendRes, attendanceRes, perfRes, feesRes, teacherRes, teacherStatusRes] = await Promise.all(requests);
      setSummary(summRes.data);
      setTrends(trendRes.data);
      setAttendanceReport(attendanceRes.data);
      setPerformanceReport(perfRes.data);
      setFeesReport(feesRes.data);
      setTeachers(teacherRes.data);
      setTeacherStatus(teacherStatusRes?.data || null);
    } catch (err) {
      console.error('Error fetching dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#4f46e5', '#f43f5e', '#eab308'];
  const pieData = [
    { name: 'Present', value: summary?.present || 0 },
    { name: 'Late', value: summary?.late || 0 },
    { name: 'Absent', value: summary?.absent || 0 },
  ];
  const punctualTop = useMemo(() => [...teachers].sort((a, b) => b.present_count - a.present_count).slice(0, 5), [teachers]);
  const flaggedBottom = useMemo(() => [...teachers].sort((a, b) => b.missing_clock_out_count - a.missing_clock_out_count).slice(0, 5), [teachers]);
  const topPerformance = useMemo(() => [...performanceReport.rows].slice(0, 5), [performanceReport.rows]);
  const feeExposure = useMemo(() => [...feesReport.rows].slice(0, 5), [feesReport.rows]);
  const role = user?.role;
  const isTeacher = role === 'teacher';
  const isAccountant = role === 'accountant';
  const isAdminOrHead = role === 'admin' || role === 'head_teacher';

  if (loading) return <div className="loading-skeleton card">Loading dashboard...</div>;

  return (
    <div className="dashboard-container animate-fade-in">
      <header className="dashboard-header">
        <h1>Welcome back, {user.username}</h1>
        <p>Today's cards show current-day status, while charts and rankings show the last 14 days.</p>
      </header>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="card kpi-card">
          <div className="kpi-icon icon-blue"><UserCheck /></div>
          <div className="kpi-info">
            <label>Present</label>
            <div className="value">{summary?.present}</div>
          </div>
        </div>
        <div className="card kpi-card">
          <div className="kpi-icon icon-red"><UserMinus /></div>
          <div className="kpi-info">
            <label>Absent</label>
            <div className="value">{summary?.absent}</div>
          </div>
        </div>
        <div className="card kpi-card">
          <div className="kpi-icon icon-yellow"><Clock /></div>
          <div className="kpi-info">
            <label>Late</label>
            <div className="value">{summary?.late}</div>
          </div>
        </div>
        <div className="card kpi-card">
          <div className="kpi-icon icon-indigo">{isAccountant ? <Wallet /> : isTeacher ? <Clock /> : <TrendingUp />}</div>
          <div className="kpi-info">
            <label>{isAccountant ? 'Outstanding Fees' : isTeacher ? 'My Status' : 'Attendance Rate'}</label>
            <div className="value">
              {isAccountant
                ? `UGX ${(feesReport.summary.total_outstanding || 0).toLocaleString()}`
                : isTeacher
                  ? (teacherStatus?.check_out_time
                    ? `Out ${teacherStatus.check_out_time}`
                    : teacherStatus?.check_in_time
                      ? `In ${teacherStatus.check_in_time}`
                      : 'Pending')
                  : `${summary?.rate}%`}
            </div>
          </div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="card chart-card">
          <h3>Attendance Trends (Last 14 Days)</h3>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={trends}>
                <defs>
                  <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b'}} />
                <Tooltip 
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}} 
                />
                <Area type="monotone" dataKey="present" stroke="#4f46e5" fillOpacity={1} fill="url(#colorPresent)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {isAdminOrHead ? (
          <div className="card chart-card">
            <h3>Today's Attendance Mix</h3>
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" outerRadius={90}>
                    {pieData.map((entry, index) => (<Cell key={entry.name} fill={COLORS[index % COLORS.length]} />))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <div className="card chart-card">
            <h3>{isAccountant ? 'Fee Status Exposure' : 'Teacher Attendance (Last 14 Days)'}</h3>
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={isAccountant ? feesReport.chart : teachers}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey={isAccountant ? 'status' : 'first_name'} axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b'}} />
                  <Tooltip />
                  <Bar dataKey={isAccountant ? 'total_balance' : 'present_count'} fill="#4f46e5" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      <div className="charts-grid">
        <div className="card chart-card">
          <h3>
            {isTeacher ? 'My Attendance Today' : isAccountant ? 'Largest Outstanding Balances' : 'Most Punctual Teachers (Last 14 Days)'}
          </h3>
          {isTeacher ? (
            <div className="teacher-summary">
              <div className="list-row"><span>Status</span><span className={`badge badge-${teacherStatus?.status || 'absent'}`}>{teacherStatus?.status || 'absent'}</span></div>
              <div className="list-row"><span>Clock-in</span><span>{teacherStatus?.check_in_time || 'Not yet'}</span></div>
              <div className="list-row"><span>Clock-out</span><span>{teacherStatus?.check_out_time || 'Pending'}</span></div>
            </div>
          ) : (
            (isAccountant ? feeExposure : punctualTop).map((item, index) => (
              <div key={isAccountant ? `${item.student_name}-${index}` : item.id} className="list-row">
                <span>{isAccountant ? item.student_name : `${item.first_name} ${item.last_name}`}</span>
                <span className="badge badge-present">
                  {isAccountant ? `UGX ${Number(item.balance || 0).toLocaleString()}` : `${item.present_count} present`}
                </span>
              </div>
            ))
          )}
        </div>
        <div className="card chart-card">
          <h3>
            {isAccountant ? 'Overdue Accounts' : isTeacher ? 'Top Performance Highlights' : 'Attention Needed'}
          </h3>
          {(isAccountant ? feeExposure.filter((row) => row.status === 'overdue').slice(0, 5) : isTeacher ? topPerformance : flaggedBottom).map((item, idx) => (
            <div key={idx} className="list-row">
              <span>
                {isAccountant
                  ? item.student_name
                  : isTeacher
                    ? `${item.class_name} - ${item.subject}`
                    : `${item.first_name} ${item.last_name}`}
              </span>
              <span className="badge badge-late">
                {isAccountant
                  ? item.due_date
                  : isTeacher
                    ? `${Math.round(item.average_marks)}%`
                    : `${item.missing_clock_out_count} open`}
              </span>
            </div>
          ))}
        </div>
      </div>

      {!isTeacher && (
        <div className="charts-grid">
          <div className="card chart-card">
            <h3><BookOpen size={18} /> Performance Snapshot</h3>
            {topPerformance.map((item, idx) => (
              <div key={idx} className="list-row">
                <span>{item.class_name} - {item.subject}</span>
                <span className="badge badge-present">{Math.round(item.average_marks)}%</span>
              </div>
            ))}
          </div>
          <div className="card chart-card">
            <h3><Wallet size={18} /> Fee Snapshot</h3>
            <div className="list-row"><span>Collected</span><span>UGX {(feesReport.summary.total_collected || 0).toLocaleString()}</span></div>
            <div className="list-row"><span>Outstanding</span><span>UGX {(feesReport.summary.total_outstanding || 0).toLocaleString()}</span></div>
            <div className="list-row"><span>Overdue</span><span>{feesReport.summary.overdue_count || 0} accounts</span></div>
            <div className="list-row"><span>Missing clock-outs</span><span>{attendanceReport.summary.missing_clock_outs || 0}</span></div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .dashboard-header { margin-bottom: 2rem; }
        .dashboard-header h1 { font-size: 1.75rem; font-weight: 800; color: #1e293b; }
        .dashboard-header p { color: #64748b; }

        .kpi-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; margin-bottom: 2rem; }
        @media (min-width: 1024px) { .kpi-grid { grid-template-columns: repeat(4, 1fr); } }

        .kpi-card { display: flex; align-items: center; gap: 1rem; padding: 1.25rem; }
        .kpi-icon { 
          width: 48px; height: 48px; border-radius: 12px; display: flex; 
          align-items: center; justify-content: center;
        }
        .icon-blue { background: #e0e7ff; color: #4338ca; }
        .icon-red { background: #fee2e2; color: #b91c1c; }
        .icon-yellow { background: #fef9c3; color: #a16207; }
        .icon-indigo { background: #f5f3ff; color: #6d28d9; }

        .kpi-info label { font-size: 0.75rem; font-weight: 600; color: #64748b; text-transform: uppercase; }
        .kpi-info .value { font-size: 1.25rem; font-weight: 700; color: #1e293b; }

        .charts-grid { display: grid; grid-template-columns: 1fr; gap: 1.5rem; }
        @media (min-width: 1024px) { .charts-grid { grid-template-columns: 2fr 1fr; } }

        .chart-card h3 { font-size: 1rem; margin-bottom: 1.5rem; color: #1e293b; }
        .chart-wrapper { width: 100%; min-height: 300px; }
        .list-row { display: flex; justify-content: space-between; padding: 0.6rem 0; border-bottom: 1px solid #eef2ff; }
        .teacher-summary { display: flex; flex-direction: column; gap: 0.25rem; }
      `}} />
    </div>
  );
};

export default Dashboard;
