import React, { useMemo, useState, useEffect } from 'react';
import { reportApi } from '../api/api';
import { Download, BarChart2, PieChart, TrendingUp, Filter } from 'lucide-react';

const Reports = () => {
  const [loading, setLoading] = useState(false);
  const [attendanceFilters, setAttendanceFilters] = useState({ from: '', to: '', teacherId: '' });
  const [performanceFilters, setPerformanceFilters] = useState({ term: '', year: '', classId: '', subject: '' });
  const [feeFilters, setFeeFilters] = useState({ status: '', dueBefore: '', classId: '' });
  const [data, setData] = useState({
    attendance: { summary: {}, rows: [], chart: [] },
    performance: { summary: {}, rows: [], chart: [] },
    fees: { summary: {}, rows: [], chart: [] },
  });
  const [error, setError] = useState('');

  useEffect(() => {
    loadReports();
  }, [attendanceFilters, performanceFilters, feeFilters]);

  const loadReports = async () => {
    setLoading(true);
    setError('');
    try {
      const [attendance, performance, fees] = await Promise.all([
        reportApi.getAttendance(attendanceFilters),
        reportApi.getPerformance(performanceFilters),
        reportApi.getFees(feeFilters),
      ]);
      setData({
        attendance: attendance.data,
        performance: performance.data,
        fees: fees.data,
      });
    } catch (err) {
      setError('Unable to load reports right now.');
    } finally {
      setLoading(false);
    }
  };

  const reports = [
    { 
      id: 'attendance', 
      title: 'Teacher Attendance Report', 
      desc: 'Filtered attendance KPIs, recent trends, missing clock-outs, and teacher comparisons.',
      icon: <TrendingUp />,
      color: 'blue'
    },
    { 
      id: 'performance', 
      title: 'Student Performance Analysis', 
      desc: 'Class and subject averages, mark ranges, and pass-rate comparisons.',
      icon: <BarChart2 />,
      color: 'indigo'
    },
    { 
      id: 'fees', 
      title: 'Financial Collection Summary', 
      desc: 'Outstanding balances, overdue accounts, and debtor detail rows.',
      icon: <PieChart />,
      color: 'purple'
    }
  ];

  const topAttendance = useMemo(() => data.attendance.rows.slice(0, 5), [data.attendance.rows]);
  const topPerformance = useMemo(() => data.performance.rows.slice(0, 5), [data.performance.rows]);
  const topFees = useMemo(() => data.fees.rows.slice(0, 5), [data.fees.rows]);

  const handleDownload = async (id) => {
    if (id === 'attendance') {
      await reportApi.exportAttendanceCsv(attendanceFilters);
    }
    if (id === 'performance') {
      await reportApi.exportPerformanceCsv(performanceFilters);
    }
    if (id === 'fees') {
      await reportApi.exportFeesCsv(feeFilters);
    }
  };

  return (
    <div className="reports-container animate-fade-in">
      <header className="page-header">
        <h1>Administrative Reports</h1>
        <p>Review filtered report previews and export the current view as CSV.</p>
      </header>

      {error && <div className="error-card card">{error}</div>}

      <div className="reports-grid">
        {reports.map(report => (
          <div key={report.id} className="report-card card">
            <div className={`report-icon icon-${report.color}`}>
              {report.icon}
            </div>
            <div className="report-info">
              <h3>{report.title}</h3>
              <p>{report.desc}</p>
            </div>
            <button 
              className="btn btn-download" 
              onClick={() => handleDownload(report.id)}
              disabled={loading}
            >
              {loading ? 'Loading...' : <><Download size={18} /> Export CSV</>}
            </button>
          </div>
        ))}
      </div>

      <div className="preview-grid">
        <section className="preview-card card">
          <div className="section-heading">
            <h3>Attendance Preview</h3>
            <span>{data.attendance.rows.length} teachers</span>
          </div>
          <div className="filters-grid">
            <label>
              <span>From</span>
              <input type="date" value={attendanceFilters.from} onChange={(e) => setAttendanceFilters({ ...attendanceFilters, from: e.target.value })} />
            </label>
            <label>
              <span>To</span>
              <input type="date" value={attendanceFilters.to} onChange={(e) => setAttendanceFilters({ ...attendanceFilters, to: e.target.value })} />
            </label>
            <label>
              <span>Teacher ID</span>
              <input type="number" value={attendanceFilters.teacherId} onChange={(e) => setAttendanceFilters({ ...attendanceFilters, teacherId: e.target.value })} placeholder="All" />
            </label>
          </div>
          <div className="kpi-row">
            <div className="mini-kpi"><strong>{data.attendance.summary.attendance_rate || 0}%</strong><span>attendance rate</span></div>
            <div className="mini-kpi"><strong>{data.attendance.summary.late_count || 0}</strong><span>late records</span></div>
            <div className="mini-kpi"><strong>{data.attendance.summary.missing_clock_outs || 0}</strong><span>missing clock-outs</span></div>
          </div>
          <div className="preview-list">
            {topAttendance.map((row) => (
              <div key={row.teacher_name} className="preview-row">
                <span>{row.teacher_name}</span>
                <span>{row.attendance_rate}% rate</span>
              </div>
            ))}
          </div>
        </section>

        <section className="preview-card card">
          <div className="section-heading">
            <h3>Performance Preview</h3>
            <span>{data.performance.rows.length} grouped rows</span>
          </div>
          <div className="filters-grid">
            <label>
              <span>Term</span>
              <select value={performanceFilters.term} onChange={(e) => setPerformanceFilters({ ...performanceFilters, term: e.target.value })}>
                <option value="">All terms</option>
                <option value="Term 1">Term 1</option>
                <option value="Term 2">Term 2</option>
              </select>
            </label>
            <label>
              <span>Year</span>
              <input type="number" value={performanceFilters.year} onChange={(e) => setPerformanceFilters({ ...performanceFilters, year: e.target.value })} placeholder="2026" />
            </label>
            <label>
              <span>Class ID</span>
              <input type="number" value={performanceFilters.classId} onChange={(e) => setPerformanceFilters({ ...performanceFilters, classId: e.target.value })} placeholder="All" />
            </label>
            <label>
              <span>Subject</span>
              <input type="text" value={performanceFilters.subject} onChange={(e) => setPerformanceFilters({ ...performanceFilters, subject: e.target.value })} placeholder="All subjects" />
            </label>
          </div>
          <div className="kpi-row">
            <div className="mini-kpi"><strong>{data.performance.summary.school_average || 0}%</strong><span>school average</span></div>
            <div className="mini-kpi"><strong>{data.performance.summary.pass_rate || 0}%</strong><span>pass rate</span></div>
            <div className="mini-kpi"><strong>{data.performance.summary.highest_marks || 0}</strong><span>highest mark</span></div>
          </div>
          <div className="preview-list">
            {topPerformance.map((row, index) => (
              <div key={`${row.class_name}-${row.subject}-${index}`} className="preview-row">
                <span>{row.class_name} - {row.subject}</span>
                <span>{row.average_marks}% avg</span>
              </div>
            ))}
          </div>
        </section>

        <section className="preview-card card">
          <div className="section-heading">
            <h3>Fees Preview</h3>
            <span>{data.fees.rows.length} fee records</span>
          </div>
          <div className="filters-grid">
            <label>
              <span>Status</span>
              <select value={feeFilters.status} onChange={(e) => setFeeFilters({ ...feeFilters, status: e.target.value })}>
                <option value="">All statuses</option>
                <option value="paid">paid</option>
                <option value="partial">partial</option>
                <option value="overdue">overdue</option>
              </select>
            </label>
            <label>
              <span>Due before</span>
              <input type="date" value={feeFilters.dueBefore} onChange={(e) => setFeeFilters({ ...feeFilters, dueBefore: e.target.value })} />
            </label>
            <label>
              <span>Class ID</span>
              <input type="number" value={feeFilters.classId} onChange={(e) => setFeeFilters({ ...feeFilters, classId: e.target.value })} placeholder="All" />
            </label>
          </div>
          <div className="kpi-row">
            <div className="mini-kpi"><strong>UGX {(data.fees.summary.total_collected || 0).toLocaleString()}</strong><span>collected</span></div>
            <div className="mini-kpi"><strong>UGX {(data.fees.summary.total_outstanding || 0).toLocaleString()}</strong><span>outstanding</span></div>
            <div className="mini-kpi"><strong>{data.fees.summary.overdue_count || 0}</strong><span>overdue accounts</span></div>
          </div>
          <div className="preview-list">
            {topFees.map((row) => (
              <div key={row.student_name} className="preview-row">
                <span>{row.student_name}</span>
                <span>UGX {Number(row.balance || 0).toLocaleString()} due</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="table-section card">
        <div className="section-heading">
          <h3><Filter size={18} /> Current Preview Tables</h3>
          <span>Top 5 rows from each filtered report</span>
        </div>
        <div className="table-grid">
          <div>
            <h4>Attendance</h4>
            {topAttendance.map((row) => (
              <div key={row.teacher_name} className="table-row">
                <span>{row.teacher_name}</span>
                <span>{row.present_days} present / {row.late_days} late</span>
              </div>
            ))}
          </div>
          <div>
            <h4>Performance</h4>
            {topPerformance.map((row, index) => (
              <div key={`${row.class_name}-${index}`} className="table-row">
                <span>{row.class_name} - {row.subject}</span>
                <span>{row.average_marks}%</span>
              </div>
            ))}
          </div>
          <div>
            <h4>Fees</h4>
            {topFees.map((row) => (
              <div key={row.student_name} className="table-row">
                <span>{row.student_name}</span>
                <span>{row.status} / UGX {Number(row.balance || 0).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .reports-grid { display: grid; gap: 1.25rem; margin-bottom: 2rem; }
        .preview-grid { display: grid; grid-template-columns: 1fr; gap: 1.25rem; margin-bottom: 2rem; }
        .table-grid { display: grid; grid-template-columns: 1fr; gap: 1rem; }
        .table-row, .preview-row { display: flex; justify-content: space-between; gap: 1rem; padding: 0.75rem 0; border-bottom: 1px solid #eef2ff; font-size: 0.875rem; }
        .section-heading { display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin-bottom: 1rem; color: #1e293b; }
        .filters-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 0.75rem; margin-bottom: 1rem; }
        .filters-grid label { display: flex; flex-direction: column; gap: 0.35rem; font-size: 0.75rem; color: #64748b; }
        .filters-grid input, .filters-grid select {
          background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 0.65rem 0.8rem;
        }
        .kpi-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 0.75rem; margin-bottom: 1rem; }
        .mini-kpi { background: #f8fafc; border-radius: 12px; padding: 0.85rem; display: flex; flex-direction: column; gap: 0.35rem; }
        .mini-kpi strong { color: #1e293b; }
        .mini-kpi span { color: #64748b; font-size: 0.75rem; }
        .preview-card, .table-section { padding: 1.5rem; }
        .error-card { padding: 1rem 1.25rem; margin-bottom: 1rem; border: 1px solid #fecaca; background: #fee2e2; color: #991b1b; }
        
        .report-card { display: flex; flex-direction: column; gap: 1.25rem; padding: 2rem; position: relative; }
        @media (min-width: 1024px) { .report-card { flex-direction: row; align-items: center; } }
        @media (min-width: 1024px) { .preview-grid, .table-grid { grid-template-columns: repeat(3, 1fr); } }

        .report-icon {
          width: 56px; height: 56px; border-radius: 16px; display: flex;
          align-items: center; justify-content: center; flex-shrink: 0;
        }
        .icon-blue { background: #e0e7ff; color: #4338ca; }
        .icon-indigo { background: #f5f3ff; color: #6d28d9; }
        .icon-purple { background: #fae8ff; color: #a21caf; }

        .report-info { flex: 1; }
        .report-info h3 { font-size: 1.1rem; color: #1e293b; margin-bottom: 0.25rem; }
        .report-info p { color: #64748b; font-size: 0.875rem; line-height: 1.5; }

        .btn-download { 
          white-space: nowrap; background: #f8fafc; border: 1.5px solid #e2e8f0; 
          color: #1e293b; padding: 0.75rem 1.25rem; font-size: 0.875rem;
        }
        .btn-download:hover { background: #4f46e5; color: white; border-color: #4f46e5; }
      `}} />
    </div>
  );
};

export default Reports;
