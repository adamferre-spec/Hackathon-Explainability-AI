import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter } from 'recharts';
import { api } from '../api';

const CareerDevelopmentPanel = ({ empId }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [recommendation, setRecommendation] = useState(null);

  useEffect(() => {
    if (!empId) return;
    fetchCareerRecommendation();
  }, [empId]);

  const fetchCareerRecommendation = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.req('/advanced/career-recommendation/' + empId);
      setRecommendation(data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="panel-loading">🔄 Analyzing career path...</div>;
  if (error) return <div className="panel-error">❌ Error: {error}</div>;
  if (!recommendation) return null;

  const promotionScore = recommendation.promotion_potential.promotion_score;
  const tierColor = 
    promotionScore > 0.80 ? '#10b981' :
    promotionScore > 0.65 ? '#f59e0b' :
    promotionScore > 0.50 ? '#3b82f6' : '#ef4444';

  return (
    <div className="panel career-development-panel">
      <h2>🎯 Career Development Plan</h2>

      {/* Current Position */}
      <div className="section">
        <h3>Current Profile</h3>
        <div className="employee-info">
          <div className="info-row">
            <span className="label">Position:</span>
            <span className="value">{recommendation.current_position}</span>
          </div>
          <div className="info-row">
            <span className="label">Department:</span>
            <span className="value">{recommendation.current_department}</span>
          </div>
          <div className="info-row">
            <span className="label">Current Salary:</span>
            <span className="value">${recommendation.current_salary.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Promotion Potential */}
      <div className="section promotion-potential">
        <h3>Promotion Potential Assessment</h3>
        <div className="metric-box">
          <div className="metric-header">
            <span className="metric-label">Overall Score</span>
            <span className="metric-value" style={{ color: tierColor }}>
              {(promotionScore * 100).toFixed(0)}%
            </span>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ 
                width: `${promotionScore * 100}%`,
                backgroundColor: tierColor 
              }}
            />
          </div>
          <p className="tier-label" style={{ color: tierColor }}>
            {recommendation.promotion_potential.tier}
          </p>
          <p className="timeline">
            ⏱️ Estimated timeline: <strong>{recommendation.promotion_potential.estimated_timeline_years} year(s)</strong>
          </p>
        </div>

        {/* Key Strengths */}
        {recommendation.promotion_potential.key_strengths && 
         recommendation.promotion_potential.key_strengths.filter(Boolean).length > 0 && (
          <div className="strengths-box">
            <h4>✨ Key Strengths</h4>
            <ul>
              {recommendation.promotion_potential.key_strengths.map((strength, idx) => 
                strength && <li key={idx}>{strength}</li>
              )}
            </ul>
          </div>
        )}
      </div>

      {/* Learning Paths */}
      {recommendation.learning_paths && recommendation.learning_paths.length > 0 && (
        <div className="section learning-paths">
          <h3>📚 Recommended Learning Paths</h3>
          {recommendation.learning_paths.map((path, idx) => (
            <div key={idx} className="learning-card">
              <div className="learning-header">
                <h4>{path.area}</h4>
                <span className={`priority priority-${path.priority.toLowerCase()}`}>
                  {path.priority}
                </span>
              </div>
              <p className="action"><strong>Action:</strong> {path.suggested_action}</p>
              <p className="impact"><strong>Expected Impact:</strong> {path.expected_impact}</p>
            </div>
          ))}
        </div>
      )}

      {/* Internal Mobility */}
      {recommendation.internal_mobility_opportunities && 
       recommendation.internal_mobility_opportunities.length > 0 && (
        <div className="section mobility-section">
          <h3>🚀 Internal Mobility Opportunities</h3>
          {recommendation.internal_mobility_opportunities.map((opp, idx) => (
            <div key={idx} className="opportunity-card">
              <div className="opp-header">
                <h4>Move to {opp.target_department}</h4>
                <span className={`readiness readiness-${opp.readiness.toLowerCase()}`}>
                  {opp.readiness}
                </span>
              </div>
              <div className="opp-details">
                <p><strong>Rationale:</strong> {opp.rationale}</p>
                <p><strong>Potential Salary Range:</strong> {opp.potential_salary_increase}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Peer Benchmark */}
      {recommendation.peer_benchmark && (
        <div className="section benchmark-section">
          <h3>👥 Peer Benchmark</h3>
          <p>Found <strong>{recommendation.peer_benchmark.similar_profiles_count}</strong> employees with similar career trajectory.</p>
          {recommendation.peer_benchmark.peer_examples && 
           recommendation.peer_benchmark.peer_examples.length > 0 && (
            <div className="peer-examples">
              {recommendation.peer_benchmark.peer_examples.map((peer, idx) => (
                <div key={idx} className="peer-card">
                  <p><strong>{peer.name}</strong></p>
                  <p className="peer-detail">{peer.position} - {peer.department}</p>
                  <p className="peer-salary">${peer.salary.toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Next Steps */}
      {recommendation.recommended_next_steps && (
        <div className="section next-steps">
          <h3>📋 Recommended Next Steps</h3>
          <ol>
            {recommendation.recommended_next_steps.map((step, idx) => (
              <li key={idx}>{step}</li>
            ))}
          </ol>
        </div>
      )}

      <div className="panel-footer">
        <button onClick={fetchCareerRecommendation} className="refresh-btn">
          🔄 Refresh Analysis
        </button>
      </div>
    </div>
  );
};

export default CareerDevelopmentPanel;
