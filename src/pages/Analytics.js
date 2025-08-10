import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { analyticsApi } from '../services/api';
import '../styles/Analytics.css';

const Analytics = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('month');

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await analyticsApi.getStats();
      if (response.data && response.data.success) {
        setAnalytics(response.data.data);
      } else {
        setAnalytics(null);
      }
      setError(null);
    } catch (err) {
      setError('Failed to fetch analytics data');
      console.error('Analytics error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="analytics-container">
        <div className="loading-spinner">Loading analytics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="analytics-container">
        <div className="error-message">{error}</div>
        <button onClick={fetchAnalytics} className="retry-button">
          Retry
        </button>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="analytics-container">
        <div className="no-data">No analytics data available</div>
      </div>
    );
  }

  return (
    <div className="analytics-container">
      <div className="analytics-header">
        <h1>Analytics Dashboard</h1>
        <div className="time-range-selector">
          <label>Time Range:</label>
          <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
            <option value="quarter">Last Quarter</option>
            <option value="year">Last Year</option>
          </select>
        </div>
      </div>

      <div className="analytics-grid">
        {/* Summary Cards */}
        <div className="summary-cards">
          <div className="summary-card">
            <h3>Total Members</h3>
            <div className="summary-value">{analytics.totalMembers || 0}</div>
            <div className="summary-change positive">+{analytics.memberGrowth || 0}%</div>
          </div>
          
          <div className="summary-card">
            <h3>Active Groups</h3>
            <div className="summary-value">{analytics.activeGroups || 0}</div>
            <div className="summary-change positive">+{analytics.groupGrowth || 0}%</div>
          </div>
          
          <div className="summary-card">
            <h3>Total Payments</h3>
            <div className="summary-value">${analytics.totalPayments || 0}</div>
            <div className="summary-change positive">+{analytics.paymentGrowth || 0}%</div>
          </div>
          
          <div className="summary-card">
            <h3>Success Rate</h3>
            <div className="summary-value">{analytics.successRate || 0}%</div>
            <div className="summary-change positive">+{analytics.successRateGrowth || 0}%</div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="charts-section">
          <div className="chart-container">
            <h3>Payment Trends</h3>
            <div className="chart-placeholder">
              Payment trends chart would be displayed here
            </div>
          </div>
          
          <div className="chart-container">
            <h3>Member Distribution</h3>
            <div className="chart-placeholder">
              Member distribution chart would be displayed here
            </div>
          </div>
        </div>

        {/* Detailed Statistics */}
        <div className="detailed-stats">
          <h3>Detailed Statistics</h3>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-label">Average Payment Amount:</span>
              <span className="stat-value">${analytics.averagePayment || 0}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Payment Frequency:</span>
              <span className="stat-value">{analytics.paymentFrequency || 0} per month</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Group Completion Rate:</span>
              <span className="stat-value">{analytics.groupCompletionRate || 0}%</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Member Retention:</span>
              <span className="stat-value">{analytics.memberRetention || 0}%</span>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="recent-activity">
          <h3>Recent Activity</h3>
          <div className="activity-list">
            {analytics.recentActivity && analytics.recentActivity.length > 0 ? (
              analytics.recentActivity.map((activity, index) => (
                <div key={index} className="activity-item">
                  <div className="activity-icon">📊</div>
                  <div className="activity-content">
                    <div className="activity-title">{activity.title}</div>
                    <div className="activity-time">{activity.time}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-activity">No recent activity</div>
            )}
          </div>
        </div>
      </div>

      <div className="analytics-footer">
        <button onClick={fetchAnalytics} className="refresh-button">
          Refresh Data
        </button>
        <div className="last-updated">
          Last updated: {new Date().toLocaleString()}
        </div>
      </div>
    </div>
  );
};

export default Analytics;
