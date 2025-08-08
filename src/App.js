import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext.js';
import ProtectedRoute from './components/ProtectedRoute.js';
import Navbar from './components/Navbar.js';
import Footer from './components/Footer.js';
import Landing from './pages/Landing.js';
import Dashboard from './pages/Dashboard.js';
import MemberDashboard from './pages/MemberDashboard.js';
import Members from './pages/Members.js';
import Groups from './pages/Groups.js';
import Payments from './pages/Payments.js';
import Banks from './pages/Banks.js';
import Payouts from './pages/Payouts.js';
import PayoutDetails from './pages/PayoutDetails.js';
import Analytics from './pages/Analytics.js';
import Users from './pages/Users.js';
import Login from './pages/Login.js';
import UserLogs from './pages/UserLogs.js';
import Profile from './pages/Profile.js';
import Messages from './pages/Messages.js';
import MemberDetailPage from './pages/MemberDetailPage.js';
import PaymentsTrashbox from './pages/PaymentsTrashbox.js';
import ArchivedPayments from './pages/ArchivedPayments.js';
import PaymentLogs from './pages/PaymentLogs.js';
import PaymentRequestsAdmin from './pages/PaymentRequestsAdmin.js';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App" style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          minHeight: '100vh' 
        }}>
          <Navbar />
          <div style={{ flex: 1 }}>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/dashboard" element={
                <main className="main-content">
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                </main>
              } />
              <Route path="/member-dashboard" element={
                <main className="main-content">
                  <ProtectedRoute>
                    <MemberDashboard />
                  </ProtectedRoute>
                </main>
              } />
              <Route path="/members" element={
                <main className="main-content">
                  <ProtectedRoute>
                    <Members />
                  </ProtectedRoute>
                </main>
              } />
              <Route path="/members/:memberId" element={
                <main className="main-content">
                  <ProtectedRoute>
                    <MemberDetailPage />
                  </ProtectedRoute>
                </main>
              } />
              <Route path="/groups" element={
                <main className="main-content">
                  <ProtectedRoute>
                    <Groups />
                  </ProtectedRoute>
                </main>
              } />
              <Route path="/payments" element={
                <main className="main-content">
                  <ProtectedRoute>
                    <Payments />
                  </ProtectedRoute>
                </main>
              } />
              <Route path="/payments/trashbox" element={
                <main className="main-content">
                  <ProtectedRoute>
                    <PaymentsTrashbox />
                  </ProtectedRoute>
                </main>
              } />
              <Route path="/payments/archive" element={
                <main className="main-content">
                  <ProtectedRoute>
                    <ArchivedPayments />
                  </ProtectedRoute>
                </main>
              } />
              <Route path="/payment-logs" element={
                <main className="main-content">
                  <ProtectedRoute>
                    <PaymentLogs />
                  </ProtectedRoute>
                </main>
              } />
              <Route path="/payment-requests" element={
                <main className="main-content">
                  <ProtectedRoute>
                    <PaymentRequestsAdmin />
                  </ProtectedRoute>
                </main>
              } />
              <Route path="/banks" element={
                <main className="main-content">
                  <ProtectedRoute>
                    <Banks />
                  </ProtectedRoute>
                </main>
              } />
              <Route path="/payouts" element={
                <main className="main-content">
                  <ProtectedRoute>
                    <Payouts />
                  </ProtectedRoute>
                </main>
              } />
              <Route path="/payouts/:groupId" element={
                <main className="main-content">
                  <ProtectedRoute>
                    <PayoutDetails />
                  </ProtectedRoute>
                </main>
              } />
              <Route
                path="/analytics"
                element={
                  <main className="main-content">
                    <ProtectedRoute>
                      <Analytics />
                    </ProtectedRoute>
                  </main>
                }
              />
              <Route
                path="/users"
                element={
                  <main className="main-content">
                    <ProtectedRoute>
                      <Users />
                    </ProtectedRoute>
                  </main>
                }
              />
              <Route path="/login" element={<Login />} />
              <Route path="/user-logs" element={
                <main className="main-content">
                  <ProtectedRoute>
                    <UserLogs />
                  </ProtectedRoute>
                </main>
              } />
              <Route path="/profile" element={
                <main className="main-content">
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                </main>
              } />
              <Route path="/messages" element={
                <main className="main-content">
                  <ProtectedRoute>
                    <Messages />
                  </ProtectedRoute>
                </main>
              } />
            </Routes>
          </div>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
