import React, { useState, useEffect } from 'react';
import { Activity, Clock, User, LogOut, LogIn, AlertTriangle, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { authApi } from '../services/api';
import { UserLog } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface UserLogsPageProps {}

const UserLogs: React.FC<UserLogsPageProps> = () => {
  const [logs, setLogs] = useState<UserLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'login' | 'logout' | 'failed_login'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [logsPerPage, setLogsPerPage] = useState(25);
  const { user, isAuthenticated } = useAuth();

  // Check if user has administrator role
  const isAdministrator = isAuthenticated && user && user.role === 'administrator';

  useEffect(() => {
    if (!isAdministrator) {
      setError('Access denied. Only administrators can view user logs.');
      return;
    }
    fetchLogs();
  }, [isAdministrator]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const response = await authApi.getLogs();
      if (response.data.success && response.data.data) {
        setLogs(response.data.data);
        setError(null);
      } else {
        setError('Failed to load user logs');
      }
    } catch (err) {
      setError('Failed to load user logs');
      console.error('Error fetching user logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'login':
        return <LogIn size={16} className="text-success" />;
      case 'logout':
        return <LogOut size={16} className="text-warning" />;
      case 'failed_login':
        return <AlertTriangle size={16} className="text-danger" />;
      default:
        return <Activity size={16} className="text-secondary" />;
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'login':
        return 'Login';
      case 'logout':
        return 'Logout';
      case 'failed_login':
        return 'Failed Login';
      default:
        return action;
    }
  };

  const getActionClass = (action: string) => {
    switch (action) {
      case 'login':
        return 'badge-success';
      case 'logout':
        return 'badge-warning';
      case 'failed_login':
        return 'badge-danger';
      default:
        return 'badge-secondary';
    }
  };

  const formatDate = (dateString: string) => {
    // Parse the UTC timestamp and convert to local time
    const utcDate = new Date(dateString + ' UTC');
    return utcDate.toLocaleString(undefined, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  const filteredLogs = logs.filter(log => {
    if (filter === 'all') return true;
    return log.action === filter;
  });

  // Pagination logic
  const totalLogs = filteredLogs.length;
  const totalPages = Math.ceil(totalLogs / logsPerPage);
  const startIndex = (currentPage - 1) * logsPerPage;
  const endIndex = startIndex + logsPerPage;
  const currentLogs = filteredLogs.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleLogsPerPageChange = (newLogsPerPage: number) => {
    setLogsPerPage(newLogsPerPage);
    setCurrentPage(1); // Reset to first page when changing logs per page
  };

  const goToFirstPage = () => handlePageChange(1);
  const goToLastPage = () => handlePageChange(totalPages);
  const goToPreviousPage = () => handlePageChange(Math.max(1, currentPage - 1));
  const goToNextPage = () => handlePageChange(Math.min(totalPages, currentPage + 1));

  if (!isAdministrator) {
    return (
      <div className="container">
        <div className="card">
          <div className="text-center">
            <h2>Access Denied</h2>
            <p>Only administrators can view user logs.</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container">
        <div className="card">
          <div className="text-center">
            <div className="loading-spinner"></div>
            <p>Loading user logs...</p>
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
            <div className="alert alert-danger">{error}</div>
            <button className="btn btn-primary" onClick={fetchLogs}>
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
          <div className="card-header-content">
            <div>
              <h1 className="card-title">
                <Activity className="card-title-icon" />
                User Activity Logs
              </h1>
              <p>Monitor user login and logout activity</p>
            </div>
            <div className="filter-controls">
              <select
                className="form-control"
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
              >
                <option value="all">All Actions</option>
                <option value="login">Login</option>
                <option value="logout">Logout</option>
                <option value="failed_login">Failed Login</option>
              </select>
            </div>
          </div>
        </div>

        {/* Logs per page selector */}
        <div className="pagination-controls">
          <div className="logs-per-page">
            <label htmlFor="logsPerPage">Logs per page:</label>
            <select
              id="logsPerPage"
              className="form-control"
              value={logsPerPage}
              onChange={(e) => handleLogsPerPageChange(Number(e.target.value))}
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        <div className="logs-container">
          {currentLogs.length === 0 ? (
            <div className="empty-state">
              <p>No logs found for the selected filter.</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="logs-table">
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Action</th>
                    <th>IP Address</th>
                    <th>User Agent</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {currentLogs.map((log) => (
                    <tr key={log.id}>
                                             <td>
                         <div className="user-info">
                           <User size={16} />
                           <span>{log.username}</span>
                         </div>
                       </td>
                      <td>
                        <div className="action-info">
                          {getActionIcon(log.action)}
                          <span className={`badge ${getActionClass(log.action)}`}>
                            {getActionLabel(log.action)}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className="ip-address">
                          {log.ipAddress || 'N/A'}
                        </span>
                      </td>
                      <td>
                        <span className="user-agent" title={log.userAgent || 'N/A'}>
                          {log.userAgent ? 
                            log.userAgent.length > 50 ? 
                              log.userAgent.substring(0, 50) + '...' : 
                              log.userAgent 
                            : 'N/A'
                          }
                        </span>
                      </td>
                      <td>
                        <div className="timestamp">
                          <Clock size={14} />
                          <span>{formatDate(log.createdAt)}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="pagination">
            <div className="pagination-info">
              <span>
                Showing {startIndex + 1} to {Math.min(endIndex, totalLogs)} of {totalLogs} logs
              </span>
            </div>
            <div className="pagination-controls">
              <button
                className="btn btn-outline-secondary"
                onClick={goToFirstPage}
                disabled={currentPage === 1}
              >
                <ChevronsLeft size={16} />
              </button>
              <button
                className="btn btn-outline-secondary"
                onClick={goToPreviousPage}
                disabled={currentPage === 1}
              >
                <ChevronLeft size={16} />
              </button>
              
              <div className="page-numbers">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNumber: number;
                  if (totalPages <= 5) {
                    pageNumber = i + 1;
                  } else if (currentPage <= 3) {
                    pageNumber = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNumber = totalPages - 4 + i;
                  } else {
                    pageNumber = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNumber}
                      className={`btn ${currentPage === pageNumber ? 'btn-primary' : 'btn-outline-secondary'}`}
                      onClick={() => handlePageChange(pageNumber)}
                    >
                      {pageNumber}
                    </button>
                  );
                })}
              </div>
              
              <button
                className="btn btn-outline-secondary"
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
              >
                <ChevronRight size={16} />
              </button>
              <button
                className="btn btn-outline-secondary"
                onClick={goToLastPage}
                disabled={currentPage === totalPages}
              >
                <ChevronsRight size={16} />
              </button>
            </div>
          </div>
        )}

        <div className="logs-summary">
          <div className="summary-stats">
            <div className="stat-item">
              <span className="stat-label">Total Logs:</span>
              <span className="stat-value">{filteredLogs.length}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Logins:</span>
              <span className="stat-value">{filteredLogs.filter(log => log.action === 'login').length}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Logouts:</span>
              <span className="stat-value">{filteredLogs.filter(log => log.action === 'logout').length}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Failed Logins:</span>
              <span className="stat-value">{filteredLogs.filter(log => log.action === 'failed_login').length}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserLogs; 