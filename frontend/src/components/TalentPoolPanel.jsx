import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { api } from '../api';

const TalentPoolPanel = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [talentData, setTalentData] = useState(null);
  const [filterDept, setFilterDept] = useState('All');
  const [sortBy, setSortBy] = useState('talent_score');

  useEffect(() => {
    fetchTalentPool();
  }, []);

  const fetchTalentPool = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.req('/advanced/talent-pool');
      setTalentData(data);
    } catch (err) {
      setError(`Failed to fetch talent pool (/advanced/talent-pool): ${err.message}`);
      console.error('TalentPoolPanel error', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="panel-loading">🔄 Analyzing talent pool...</div>;
  if (error) return <div className="panel-error">❌ Error: {error}</div>;
  if (!talentData || !talentData.talent_pool) return null;

  const talents = talentData.talent_pool || [];
  const departments = ['All', ...new Set(talents.map(t => t.department))];

  // Filter and sort
  let filtered = filterDept === 'All' 
    ? talents 
    : talents.filter(t => t.department === filterDept);

  filtered = filtered.sort((a, b) => {
    if (sortBy === 'talent_score') return b.talent_score - a.talent_score;
    if (sortBy === 'salary') return a.current_salary - b.current_salary;
    return 0;
  });

  // Prepare chart data
  const chartData = filtered.slice(0, 10).map(t => ({
    name: String(t.name || `Emp_${t.emp_id}`).substring(0, 15),
    score: Math.round(t.talent_score * 100),
    dept: t.department
  }));

  const colors = ['#10b981', '#f59e0b', '#3b82f6', '#ec4899', '#8b5cf6'];

  const getTalentColor = (score) => {
    if (score > 0.85) return '#10b981'; // Green
    if (score > 0.75) return '#f59e0b'; // Amber
    if (score > 0.65) return '#3b82f6'; // Blue
    return '#8b5cf6'; // Purple
  };

  return (
    <div className="panel talent-pool-panel">
      <h2>⭐ Hidden Talent Pool - Internal Talent Discovery</h2>

      {/* Summary Stats */}
      <div className="summary-stats">
        <div className="stat-box">
          <div className="stat-value">{talentData.total_employees_analyzed}</div>
          <div className="stat-label">Active Employees</div>
        </div>
        <div className="stat-box highlight">
          <div className="stat-value">{talentData.hidden_talents_identified}</div>
          <div className="stat-label">Hidden Talents Found</div>
        </div>
        <div className="stat-box">
          <div className="stat-value">
            {filtered.filter(t => t.readiness_level.includes('Ready Now')).length}
          </div>
          <div className="stat-label">Ready for Promotion Now</div>
        </div>
      </div>

      {/* Summary Text */}
      <div className="summary-section">
        <p className="summary-text">{talentData.summary}</p>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filter-group">
          <label>Department:</label>
          <select value={filterDept} onChange={(e) => setFilterDept(e.target.value)} className="filter-select">
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label>Sort by:</label>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="filter-select">
            <option value="talent_score">Talent Score (Highest)</option>
            <option value="salary">Current Salary (Lowest)</option>
          </select>
        </div>
      </div>

      {/* Talent Score Chart */}
      <div className="chart-section">
        <h3>Top Talents by Score</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
            <YAxis label={{ value: 'Talent Score (%)', angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Bar dataKey="score" fill="#3b82f6">
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getTalentColor(entry.score / 100)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Talent Cards */}
      <div className="talents-grid">
        <h3>Detailed Talent Profiles ({filtered.length})</h3>
        {filtered.map((talent, idx) => (
          <div key={idx} className="talent-card">
            <div className="talent-header">
              <div className="talent-info">
                <h4>{talent.name}</h4>
                <p className="position">{talent.position}</p>
                <p className="department-tag">{talent.department}</p>
              </div>
              <div className="talent-score" style={{ backgroundColor: getTalentColor(talent.talent_score) }}>
                <span className="score-value">{Math.round(talent.talent_score * 100)}%</span>
              </div>
            </div>

            <div className="talent-body">
              {/* Key Metrics */}
              <div className="metrics-row">
                <div className="metric">
                  <span className="metric-label">Current Salary</span>
                  <span className="metric-value">${talent.current_salary.toLocaleString()}</span>
                </div>
                <div className="metric">
                  <span className="metric-label">Readiness</span>
                  <span className={`readiness-badge ${talent.readiness_level.includes('Ready Now') ? 'ready-now' : 'ready-soon'}`}>
                    {talent.readiness_level}
                  </span>
                </div>
              </div>

              {/* Promotion Potential Details */}
              <div className="promotion-details">
                <h5>Promotion Potential</h5>
                <div className="detail-row">
                  <span className="detail-label">Tier:</span>
                  <span className="detail-value">{talent.promotion_potential.tier}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Timeline:</span>
                  <span className="detail-value">{talent.promotion_potential.estimated_timeline_years} year(s)</span>
                </div>
              </div>

              {/* Strengths */}
              {talent.promotion_potential.key_strengths && 
               talent.promotion_potential.key_strengths.filter(Boolean).length > 0 && (
                <div className="strengths-box">
                  <h5>✨ Key Strengths</h5>
                  <ul>
                    {talent.promotion_potential.key_strengths.map((strength, sidx) =>
                      strength && <li key={sidx}>{strength}</li>
                    )}
                  </ul>
                </div>
              )}
            </div>

            <div className="talent-footer">
              <button className="btn-action">View Development Plan</button>
            </div>
          </div>
        ))}
      </div>

      <div className="panel-footer">
        <button onClick={fetchTalentPool} className="refresh-btn">
          🔄 Refresh Talent Analysis
        </button>
      </div>

      <style jsx>{`
        .talent-pool-panel {
          padding: 24px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 12px;
          color: white;
        }

        .talent-pool-panel h2 {
          margin-bottom: 24px;
          font-size: 1.8rem;
          font-weight: bold;
        }

        .summary-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }

        .stat-box {
          background: rgba(255, 255, 255, 0.15);
          padding: 16px;
          border-radius: 8px;
          text-align: center;
          backdrop-filter: blur(10px);
        }

        .stat-box.highlight {
          background: rgba(16, 185, 129, 0.3);
          border: 2px solid #10b981;
        }

        .stat-value {
          font-size: 2rem;
          font-weight: bold;
          color: #fef3c7;
        }

        .stat-label {
          font-size: 0.9rem;
          opacity: 0.9;
          margin-top: 8px;
        }

        .summary-section {
          background: rgba(255, 255, 255, 0.1);
          padding: 16px;
          border-radius: 8px;
          margin-bottom: 24px;
          border-left: 4px solid #fbbf24;
        }

        .summary-text {
          margin: 0;
          line-height: 1.6;
        }

        .filters-section {
          display: flex;
          gap: 20px;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }

        .filter-group {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .filter-group label {
          font-weight: 500;
        }

        .filter-select {
          padding: 8px 12px;
          border-radius: 6px;
          border: none;
          background: rgba(255, 255, 255, 0.9);
          color: #333;
          cursor: pointer;
          font-size: 0.9rem;
        }

        .chart-section {
          background: rgba(255, 255, 255, 0.05);
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 24px;
        }

        .chart-section h3 {
          margin-top: 0;
          color: #fef3c7;
        }

        .talents-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 16px;
          margin-top: 24px;
        }

        .talents-grid > h3 {
          grid-column: 1 / -1;
          color: #fef3c7;
          margin-bottom: 0;
        }

        .talent-card {
          background: rgba(255, 255, 255, 0.95);
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          color: #333;
          display: flex;
          flex-direction: column;
        }

        .talent-header {
          padding: 16px;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 2px solid #e5e7eb;
        }

        .talent-info h4 {
          margin: 0 0 4px 0;
          font-size: 1.1rem;
          color: #1f2937;
        }

        .position {
          margin: 0;
          font-size: 0.9rem;
          color: #6b7280;
        }

        .department-tag {
          display: inline-block;
          background: #e0e7ff;
          color: #4f46e5;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 0.8rem;
          margin-top: 4px;
        }

        .talent-score {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 70px;
          height: 70px;
          border-radius: 50%;
          color: white;
          font-weight: bold;
        }

        .score-value {
          font-size: 1.2rem;
        }

        .talent-body {
          padding: 16px;
          flex: 1;
        }

        .metrics-row {
          display: flex;
          gap: 12px;
          margin-bottom: 16px;
        }

        .metric {
          flex: 1;
          background: #f9fafb;
          padding: 12px;
          border-radius: 6px;
        }

        .metric-label {
          display: block;
          font-size: 0.8rem;
          color: #6b7280;
          margin-bottom: 4px;
        }

        .metric-value {
          display: block;
          font-size: 0.95rem;
          font-weight: 600;
          color: #1f2937;
        }

        .readiness-badge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 0.8rem;
          font-weight: 500;
        }

        .readiness-badge.ready-now {
          background: #d1fae5;
          color: #065f46;
        }

        .readiness-badge.ready-soon {
          background: #fef3c7;
          color: #92400e;
        }

        .promotion-details {
          background: #f3f4f6;
          padding: 12px;
          border-radius: 6px;
          margin-bottom: 12px;
        }

        .promotion-details h5 {
          margin: 0 0 8px 0;
          font-size: 0.9rem;
          color: #374151;
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.85rem;
          margin: 4px 0;
        }

        .detail-label {
          color: #6b7280;
        }

        .detail-value {
          color: #1f2937;
          font-weight: 500;
        }

        .strengths-box {
          background: #f0fdf4;
          padding: 12px;
          border-radius: 6px;
          border-left: 3px solid #10b981;
        }

        .strengths-box h5 {
          margin: 0 0 8px 0;
          font-size: 0.9rem;
          color: #15803d;
        }

        .strengths-box ul {
          margin: 0;
          padding-left: 16px;
          list-style: none;
        }

        .strengths-box li {
          font-size: 0.85rem;
          color: #166534;
          margin: 4px 0;
        }

        .strengths-box li:before {
          content: "✓ ";
          font-weight: bold;
          color: #10b981;
        }

        .talent-footer {
          padding: 12px 16px;
          border-top: 1px solid #e5e7eb;
          background: #f9fafb;
        }

        .btn-action {
          width: 100%;
          padding: 8px 12px;
          background: #667eea;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.9rem;
          font-weight: 500;
          transition: background 0.3s;
        }

        .btn-action:hover {
          background: #5568d3;
        }

        .panel-footer {
          text-align: center;
          margin-top: 24px;
          padding-top: 16px;
          border-top: 1px solid rgba(255, 255, 255, 0.2);
        }

        .refresh-btn {
          padding: 10px 20px;
          background: rgba(255, 255, 255, 0.2);
          color: white;
          border: 2px solid rgba(255, 255, 255, 0.5);
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.3s;
        }

        .refresh-btn:hover {
          background: rgba(255, 255, 255, 0.3);
          border-color: white;
        }
      `}</style>
    </div>
  );
};

export default TalentPoolPanel;
