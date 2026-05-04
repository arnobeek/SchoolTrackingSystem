import React, { useState, useEffect } from 'react';
import { resultApi } from '../api/api';
import { Search, Filter, GraduationCap, ArrowUpDown } from 'lucide-react';

const Results = () => {
  const [results, setResults] = useState([]);
  const [summary, setSummary] = useState([]);
  const [filters, setFilters] = useState({ class_id: '', exam_id: '', term: '' });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResults();
    fetchSummary();
  }, [filters]);

  const fetchResults = async () => {
    setLoading(true);
    try {
      const { data } = await resultApi.getAll(filters);
      setResults(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const { data } = await resultApi.getSummary();
      setSummary(data);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredResults = results.filter((res) =>
    `${res.first_name} ${res.last_name}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="results-container animate-fade-in">
      <header className="page-header">
        <h1>Examination Results</h1>
        <p>Monitor student performance across terms</p>
      </header>

      {/* Summary Stats */}
      <div className="stats-strip">
        {summary.map((item, idx) => (
          <div key={idx} className="stat-pill">
            <span className="pill-label">{item.class_name} ({item.subject})</span>
            <span className="pill-value">{Math.round(item.average_marks)}%</span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="filter-bar card">
        <div className="search-box">
          <Search size={18} />
          <input type="text" placeholder="Search student name..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="filter-selects">
          <input
            className="filter-input"
            placeholder="Class ID"
            value={filters.class_id}
            onChange={(e) => setFilters({ ...filters, class_id: e.target.value })}
          />
          <input
            className="filter-input"
            placeholder="Exam ID"
            value={filters.exam_id}
            onChange={(e) => setFilters({ ...filters, exam_id: e.target.value })}
          />
          <select 
            value={filters.term} 
            onChange={(e) => setFilters({...filters, term: e.target.value})}
            className="filter-input"
          >
            <option value="">All Terms</option>
            <option value="Term 1">Term 1</option>
            <option value="Term 2">Term 2</option>
          </select>
        </div>
      </div>

      {/* Results List (Mobile) / Table (Desktop) */}
      <div className="results-list">
        {loading ? (
          <div className="loading">Loading results...</div>
        ) : filteredResults.length === 0 ? (
          <div className="no-results">No results found for selected filters.</div>
        ) : (
          filteredResults.map(res => (
            <div key={res.id} className="result-card card">
              <div className="student-info">
                <div className="avatar-mini"><GraduationCap size={16} /></div>
                <div>
                  <h4>{res.first_name} {res.last_name}</h4>
                  <span className="sub-text">{res.class_name} • {res.exam_name}</span>
                </div>
              </div>
              <div className="score-area">
                <div className="subject-name">{res.subject}</div>
                <div className="marks-badge">
                  <span className="marks">{res.marks}</span>
                  <span className={`grade grade-${res.grade[0]}`}>{res.grade}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .page-header { margin-bottom: 1.5rem; }
        .page-header h1 { font-size: 1.5rem; font-weight: 800; color: #1e293b; }
        .page-header p { color: #64748b; font-size: 0.875rem; }

        .stats-strip { display: flex; gap: 0.75rem; overflow-x: auto; padding-bottom: 1rem; margin-bottom: 1rem; scrollbar-width: none; }
        .stats-strip::-webkit-scrollbar { display: none; }
        .stat-pill {
          white-space: nowrap; background: #e0e7ff; color: #4338ca;
          padding: 0.5rem 1rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 700;
          display: flex; align-items: center; gap: 0.5rem;
        }
        .pill-value { background: white; padding: 2px 8px; border-radius: 9999px; }

        .filter-bar { display: flex; gap: 1rem; padding: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
        .search-box { flex: 1; display: flex; align-items: center; gap: 0.75rem; background: #f8fafc; padding: 0.5rem 1rem; border-radius: 0.75rem; border: 1px solid #e2e8f0; }
        .search-box input { border: none; background: transparent; outline: none; width: 100%; font-size: 0.875rem; }
        .filter-input { background: #f8fafc; border: 1px solid #e2e8f0; padding: 0.5rem 1rem; border-radius: 0.75rem; font-size: 0.875rem; }

        .results-list { display: grid; gap: 1rem; }
        .result-card { display: flex; justify-content: space-between; align-items: center; padding: 1.25rem; }
        .student-info { display: flex; align-items: center; gap: 1rem; }
        .avatar-mini { width: 32px; height: 32px; background: #f1f5f9; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #64748b; }
        .student-info h4 { font-size: 1rem; font-weight: 700; color: #1e293b; }
        .sub-text { font-size: 0.75rem; color: #94a3b8; }

        .score-area { text-align: right; }
        .subject-name { font-size: 0.75rem; font-weight: 600; color: #64748b; margin-bottom: 4px; }
        .marks-badge { display: flex; align-items: center; gap: 0.5rem; background: #f8fafc; padding: 4px 8px; border-radius: 8px; }
        .marks { font-weight: 800; font-size: 1.1rem; color: #1e293b; }
        .grade { font-size: 0.75rem; font-weight: 800; padding: 2px 6px; border-radius: 4px; }
        .grade-D { background: #dcfce7; color: #15803d; } /* D1, D2 */
        .grade-C { background: #fef9c3; color: #a16207; } /* C3, C4, C5, C6 */
        .grade-P { background: #ffedd5; color: #c2410c; } /* P7, P8 */
        .grade-F { background: #fee2e2; color: #b91c1c; } /* F9 */
      `}} />
    </div>
  );
};

export default Results;
