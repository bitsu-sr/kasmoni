import React, { useState, useEffect } from 'react';
import { DollarSign, CreditCard, Clock, Building, Banknote } from 'lucide-react';
import { analyticsApi } from '../services/api';
import { AnalyticsStats } from '../types';
import { formatCurrency } from '../utils/validation';
import { useAuth } from '../contexts/AuthContext';

const Analytics: React.FC = () => {
  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchAnalyticsData();
  }, [user]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const response = await analyticsApi.getStats();
      if (response.data.success && response.data.data) {
        setStats(response.data.data);
        setError(null);
      } else {
        setError('Failed to load analytics data');
      }
    } catch (err) {
      setError('Failed to load analytics data');
      console.error('Error fetching analytics data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentMonthYear = (): string => {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const monthName = now.toLocaleDateString('en-US', { month: 'long' });
    return `${monthName} ${year}`;
  };

  if (loading) {
    return (
      <div className="container">
        <div className="card">
          <div className="d-flex justify-center align-center" style={{ minHeight: '200px' }}>
            <div className="spinner"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="card">
          <div className="text-center">
            <h2>Error</h2>
            <p>{error}</p>
            <button className="btn btn-primary" onClick={fetchAnalyticsData}>
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="card">
        <div className="card-header">
          <h1 className="card-title">Analytics</h1>
          <p>Financial analytics and insights for {getCurrentMonthYear()}</p>
        </div>

        {stats && (
          <>
            {/* First Row: Total expected amount, total paid, total received, total pending */}
            <div className="grid grid-4">
              <div className="stats-card">
                <div className="stats-card-icon">
                  <DollarSign size={32} />
                </div>
                <div className="stats-card-content">
                  <h3>{formatCurrency(stats.totalExpectedAmount)}</h3>
                  <p>Total Expected Amount</p>
                </div>
              </div>

              <div className="stats-card">
                <div className="stats-card-icon">
                  <DollarSign size={32} />
                </div>
                <div className="stats-card-content">
                  <h3>{formatCurrency(stats.totalPaid)}</h3>
                  <p>Total Paid</p>
                </div>
              </div>

              <div className="stats-card">
                <div className="stats-card-icon">
                  <CreditCard size={32} />
                </div>
                <div className="stats-card-content">
                  <h3>{formatCurrency(stats.totalReceived)}</h3>
                  <p>Total Received</p>
                </div>
              </div>

              <div className="stats-card">
                <div className="stats-card-icon">
                  <Clock size={32} />
                </div>
                <div className="stats-card-content">
                  <h3>{formatCurrency(stats.totalPending)}</h3>
                  <p>Total Pending</p>
                </div>
              </div>
            </div>

            {/* Second Row: DSB, Finabank, Cash */}
            <div className="grid grid-3 mt-4">
              <div className="stats-card">
                <div className="stats-card-icon">
                  <Building size={32} />
                </div>
                <div className="stats-card-content">
                  <h3>{stats.dsbMembers}</h3>
                  <p>DSB</p>
                </div>
              </div>

              <div className="stats-card">
                <div className="stats-card-icon">
                  <Building size={32} />
                </div>
                <div className="stats-card-content">
                  <h3>{stats.finabankMembers}</h3>
                  <p>Finabank</p>
                </div>
              </div>

              <div className="stats-card">
                <div className="stats-card-icon">
                  <Banknote size={32} />
                </div>
                <div className="stats-card-content">
                  <h3>{stats.cashMembers}</h3>
                  <p>Cash</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Analytics; 