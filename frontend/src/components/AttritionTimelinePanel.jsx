import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const AttritionTimelinePanel = ({ empId }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [timeline, setTimeline] = useState(null);

  const fetchTimeline = async () => {
    if (!empId) return;
    
    setLoading(true);
    setError(null);
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
      const response = await fetch(`${baseUrl}/advanced/timeline/${empId}`);
      if (!response.ok) throw new Error('Failed to fetch timeline');
      const data = await response.json();
      setTimeline(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (empId) {
      fetchTimeline();
    }
  }, [empId]);

  if (loading) return <div className="panel-loading">⏳ Predicting departure timeline...</div>;
  if (error) return <div className="panel-error">❌ Error: {error}</div>;
  if (!timeline) return null;

  const tl = timeline.timeline;
  const riskColor = 
    tl.risk_level === 'CRITICAL' ? '#ef4444' :
    tl.risk_level === 'HIGH' ? '#f59e0b' :
    tl.risk_level === 'MEDIUM' ? '#3b82f6' : '#10b981';

  const riskEmoji = 
    tl.risk_level === 'CRITICAL' ? '🔴' :
    tl.risk_level === 'HIGH' ? '🟠' :
    tl.risk_level === 'MEDIUM' ? '🟡' : '🟢';

  // Timeline visualization data
  const timelineData = [
    { month: '0', months_to_departure: Math.max(tl.months_until_departure - 12, 0) },
    { month: '6', months_to_departure: Math.max(tl.months_until_departure - 6, 0) },
    { month: '12', months_to_departure: Math.max(tl.months_until_departure, 1) },
    { month: 'Now', months_to_departure: tl.months_until_departure },
  ];

  return (
    <div className="panel attrition-timeline-panel" style={{
      padding: '24px',
      background: '#1B2E45',
      borderRadius: '12px',
      border: '2px solid ' + riskColor,
    }}>
      <h2 style={{ margin: '0 0 24px 0', color: '#00C9A7' }}>⏱️ Attrition Timeline Prediction</h2>

      {/* Main Risk Indicator */}
      <div style={{
        background: riskColor + '20',
        border: '2px solid ' + riskColor,
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '24px',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '12px' }}>{riskEmoji}</div>
        <p style={{ color: riskColor, fontSize: '1.3rem', fontWeight: 'bold', margin: '0 0 8px 0' }}>
          {tl.risk_level} RISK
        </p>
        <p style={{ color: '#8BA5BF', margin: '0', fontSize: '1.1rem' }}>
          {tl.risk_description}
        </p>
      </div>

      {/* Key Metrics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '16px',
        marginBottom: '24px',
      }}>
        <div style={{
          background: '#2D3E52',
          padding: '16px',
          borderRadius: '8px',
          textAlign: 'center',
        }}>
          <p style={{ color: '#8BA5BF', margin: '0 0 8px 0', fontSize: '0.9rem' }}>
            Time Until Departure
          </p>
          <p style={{ color: '#00C9A7', fontSize: '1.8rem', fontWeight: 'bold', margin: '0' }}>
            {Math.round(tl.months_until_departure)} <span style={{ fontSize: '0.7em' }}>months</span>
          </p>
          <p style={{ color: '#6B7A8F', margin: '4px 0 0 0', fontSize: '0.85rem' }}>
            (~{tl.years_until_departure} years)
          </p>
        </div>

        <div style={{
          background: '#2D3E52',
          padding: '16px',
          borderRadius: '8px',
          textAlign: 'center',
        }}>
          <p style={{ color: '#8BA5BF', margin: '0 0 8px 0', fontSize: '0.9rem' }}>
            Estimated Departure Date
          </p>
          <p style={{ color: '#F59E0B', fontSize: '1.5rem', fontWeight: 'bold', margin: '0' }}>
            {new Date(tl.departure_date).toLocaleDateString()}
          </p>
          <p style={{ color: '#6B7A8F', margin: '4px 0 0 0', fontSize: '0.85rem' }}>
            {tl.departure_quarter}
          </p>
        </div>

        <div style={{
          background: '#2D3E52',
          padding: '16px',
          borderRadius: '8px',
          textAlign: 'center',
        }}>
          <p style={{ color: '#8BA5BF', margin: '0 0 8px 0', fontSize: '0.9rem' }}>
            Prediction Confidence
          </p>
          <p style={{ color: '#3B82F6', fontSize: '1.8rem', fontWeight: 'bold', margin: '0' }}>
            {(tl.confidence * 100).toFixed(0)}%
          </p>
          <p style={{ color: '#6B7A8F', margin: '4px 0 0 0', fontSize: '0.85rem' }}>
            Uncertainty: {(tl.uncertainty * 100).toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Timeline Visualization */}
      <div style={{
        background: '#0D1B2A',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '24px',
      }}>
        <h3 style={{ color: '#00C9A7', margin: '0 0 16px 0' }}>Timeline</h3>
        <div style={{
          position: 'relative',
          height: '80px',
          background: '#1B2E45',
          borderRadius: '8px',
          padding: '0 16px',
          display: 'flex',
          alignItems: 'center',
        }}>
          {/* Timeline Bar */}
          <div style={{
            position: 'absolute',
            left: '16px',
            right: '16px',
            height: '4px',
            background: '#2D3E52',
            borderRadius: '2px',
          }} />

          {/* Now Marker */}
          <div style={{
            position: 'absolute',
            left: '16px',
            width: '16px',
            height: '16px',
            background: '#00C9A7',
            borderRadius: '50%',
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 10,
            border: '3px solid #1B2E45',
          }} />

          {/* Departure Marker */}
          <div style={{
            position: 'absolute',
            left: 'calc(16px + ' + (Math.min(tl.months_until_departure, 300) / 300 * 100) + '%)',
            width: '16px',
            height: '16px',
            background: riskColor,
            borderRadius: '50%',
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 10,
            border: '3px solid #1B2E45',
          }} />

          {/* Labels */}
          <div style={{
            position: 'absolute',
            left: '0',
            top: '50px',
            fontSize: '0.8rem',
            color: '#6B7A8F',
          }}>
            Now
          </div>

          <div style={{
            position: 'absolute',
            right: '0',
            top: '50px',
            fontSize: '0.8rem',
            color: riskColor,
            fontWeight: 'bold',
          }}>
            Departure
          </div>
        </div>
      </div>

      {/* Interpretation */}
      <div style={{
        background: riskColor + '15',
        border: '1px solid ' + riskColor + '50',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '24px',
      }}>
        <p style={{ color: '#E5E7EB', margin: '0', lineHeight: '1.6' }}>
          {timeline.interpretation}
        </p>
      </div>

      {/* Recommended Actions */}
      <div style={{
        background: '#0D1B2A',
        padding: '16px',
        borderRadius: '8px',
        border: '1px solid #2D3E52',
      }}>
        <h3 style={{ color: '#10B981', margin: '0 0 12px 0' }}>🎯 Recommended Actions</h3>
        <ul style={{
          margin: '0',
          paddingLeft: '20px',
          color: '#8BA5BF',
          lineHeight: '1.8',
          fontSize: '0.95rem'
        }}>
          {tl.risk_level === 'CRITICAL' && (
            <>
              <li>Schedule urgent stay interview today</li>
              <li>Identify specific concerns and pain points</li>
              <li>Present immediate retention offer/promotion</li>
              <li>Escalate to senior leadership</li>
            </>
          )}
          {tl.risk_level === 'HIGH' && (
            <>
              <li>Schedule career development conversation this week</li>
              <li>Review compensation and benefits competitiveness</li>
              <li>Propose promotion or rotation opportunity</li>
              <li>Check on work environment and manager relationship</li>
            </>
          )}
          {tl.risk_level === 'MEDIUM' && (
            <>
              <li>Maintain regular career development conversations</li>
              <li>Create clear growth path for next 2 years</li>
              <li>Ensure compensation is competitive</li>
              <li>Look for stretch assignment opportunities</li>
            </>
          )}
          {tl.risk_level === 'LOW' && (
            <>
              <li>Continue standard engagement initiatives</li>
              <li>Annual career development review</li>
              <li>Monitor for any changes in engagement level</li>
              <li>Plan for career advancement in 3-5 years</li>
            </>
          )}
        </ul>
      </div>

      {/* Footer */}
      <div style={{
        marginTop: '24px',
        paddingTop: '16px',
        borderTop: '1px solid #2D3E52',
        textAlign: 'center',
      }}>
        <p style={{ color: '#6B7A8F', margin: '0', fontSize: '0.85rem' }}>
          ℹ️ Timeline is based on ML ensemble model trained on historical departure patterns. 
          Consider alongside other factors for holistic assessment.
        </p>
      </div>
    </div>
  );
};

export default AttritionTimelinePanel;
