import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Users, Shield, TrendingUp, Clock, CheckCircle, Star, Zap } from 'lucide-react';
import { membersApi, groupsApi } from '../services/api';
import { formatCurrency } from '../utils/validation';
import './Landing.css';

const Landing: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [memberCount, setMemberCount] = useState<number>(0);
  const [lowestMonthlyAmount, setLowestMonthlyAmount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setIsVisible(true);
    fetchLandingData();
  }, []);

  const fetchLandingData = async () => {
    try {
      setLoading(true);
      
      // Fetch total member count
      const membersResponse = await membersApi.getAll();
      if (membersResponse.data.success && membersResponse.data.data) {
        setMemberCount(membersResponse.data.data.length);
      }
      
      // Fetch groups to find the lowest monthly amount
      const groupsResponse = await groupsApi.getAll();
      if (groupsResponse.data.success && groupsResponse.data.data) {
        const groups = groupsResponse.data.data;
        if (groups.length > 0) {
          const lowestAmount = Math.min(...groups.map(group => group.monthlyAmount || 0));
          setLowestMonthlyAmount(lowestAmount);
        }
      }
    } catch (error) {
      console.error('Error fetching landing data:', error);
      // Set fallback values
      setMemberCount(0);
      setLowestMonthlyAmount(0);
    } finally {
      setLoading(false);
    }
  };

  const benefits = [
    {
      icon: Shield,
      title: "Secure & Transparent",
      description: "Every transaction is tracked and verified, ensuring complete transparency for all members."
    },
    {
      icon: Users,
      title: "Community Building",
      description: "Strengthen bonds within your community while achieving financial goals together."
    },
    {
      icon: TrendingUp,
      title: "Financial Growth",
      description: "Access lump sums when you need them most, helping you achieve major financial milestones."
    },
    {
      icon: Clock,
      title: "Flexible Scheduling",
      description: "Choose payment schedules that work for your group's needs and preferences."
    }
  ];

  const features = [
    "Real-time payment tracking",
    "Automated reminders",
    "Detailed analytics & reports",
    "Mobile-friendly interface",
    "Secure member management",
    "Flexible group configurations"
  ];

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-background">
          <div className="hero-pattern"></div>
        </div>
        <div className="container">
          <div className="hero-content">
            <div className="hero-text">
              <div className={`hero-badge ${isVisible ? 'fade-in' : ''}`}>
                <Star size={16} />
                <span>Trusted by Communities Worldwide</span>
              </div>
              
              <h1 className={`hero-title ${isVisible ? 'slide-in-left' : ''}`}>
                Tanda by Sranan Kasmoni
              </h1>
              
              <p className={`hero-subtitle ${isVisible ? 'slide-in-left' : ''}`}>
                <strong>"Building Wealth Together, One Tanda at a Time"</strong>
              </p>
              
              <p className={`hero-description ${isVisible ? 'slide-in-left' : ''}`}>
                Experience the power of community-based savings with our modern tanda system. 
                Join thousands of people who trust Tanda to manage their rotating savings and credit associations 
                with transparency, security, and ease.
              </p>
              
              <div className={`hero-actions ${isVisible ? 'fade-in-up' : ''}`}>
                <Link to="/dashboard" className="btn btn-primary btn-lg hero-btn">
                  Get Started Today
                  <ArrowRight size={20} />
                </Link>
                <button className="btn btn-outline btn-lg hero-btn">
                  Watch Demo
                </button>
              </div>
            </div>
            
            <div className={`hero-visual ${isVisible ? 'slide-in-right' : ''}`}>
              <div className="hero-image-container">
                <div className="floating-card card-1">
                  <div className="card-icon">
                    <Users size={24} />
                  </div>
                  <div className="card-content">
                    <h4>{loading ? '...' : `${memberCount} Members`}</h4>
                    <p>Active Members</p>
                  </div>
                </div>
                
                <div className="floating-card card-2">
                  <div className="card-icon">
                    <TrendingUp size={24} />
                  </div>
                  <div className="card-content">
                    <h4>{loading ? '...' : formatCurrency(lowestMonthlyAmount).replace(/\.00$/, '')}</h4>
                    <p>Starting At</p>
                  </div>
                </div>
                
                <div className="floating-card card-3">
                  <div className="card-icon">
                    <CheckCircle size={24} />
                  </div>
                  <div className="card-content">
                    <h4>100%</h4>
                    <p>On Time</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="benefits-section">
        <div className="container">
          <div className="section-header">
            <h2>Why Choose Tanda?</h2>
            <p>Discover the advantages that make Tanda the preferred choice for community savings</p>
          </div>
          
          <div className="benefits-grid">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <div 
                  key={index} 
                  className={`benefit-card ${isVisible ? 'fade-in-up' : ''}`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="benefit-icon">
                    <Icon size={32} />
                  </div>
                  <h3>{benefit.title}</h3>
                  <p>{benefit.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <div className="features-content">
            <div className="features-text">
              <h2>Everything You Need to Manage Your Tanda</h2>
              <p>
                Our comprehensive platform provides all the tools you need to run a successful 
                rotating savings and credit association. From member management to payment tracking, 
                we've got you covered.
              </p>
              
              <div className="features-list">
                {features.map((feature, index) => (
                  <div key={index} className="feature-item">
                    <CheckCircle size={20} className="feature-icon" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
              
              <Link to="/dashboard" className="btn btn-primary btn-lg">
                Start Your Tanda
                <ArrowRight size={20} />
              </Link>
            </div>
            
            <div className="features-visual">
              <div className="dashboard-preview">
                <div className="preview-header">
                  <div className="preview-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
                <div className="preview-content">
                  <div className="preview-stats">
                    <div className="preview-stat">
                      <div className="stat-circle"></div>
                      <div className="stat-text">
                        <h4>Active Groups</h4>
                        <p>3</p>
                      </div>
                    </div>
                    <div className="preview-stat">
                      <div className="stat-circle"></div>
                      <div className="stat-text">
                        <h4>Total Members</h4>
                        <p>24</p>
                      </div>
                    </div>
                  </div>
                  <div className="preview-chart">
                    <div className="chart-bar" style={{ height: '60%' }}></div>
                    <div className="chart-bar" style={{ height: '80%' }}></div>
                    <div className="chart-bar" style={{ height: '40%' }}></div>
                    <div className="chart-bar" style={{ height: '90%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <div className="cta-icon">
              <Zap size={48} />
            </div>
            <h2>Ready to Transform Your Community's Financial Future?</h2>
            <p>
              Join thousands of communities who trust Tanda to manage their rotating savings. 
              Start building wealth together today.
            </p>
            <Link to="/dashboard" className="btn btn-primary btn-lg cta-btn">
              Create Your First Tanda
              <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-brand">
              <h3>Tanda by Sranan Kasmoni</h3>
              <p>Building stronger communities through trusted financial partnerships.</p>
            </div>
            <div className="footer-links">
              <div className="footer-section">
                <h4>Product</h4>
                <Link to="/dashboard">Dashboard</Link>
                <Link to="/members">Members</Link>
                <Link to="/groups">Groups</Link>
                <Link to="/payments">Payments</Link>
              </div>
              <div className="footer-section">
                <h4>Support</h4>
                <a href="#help">Help Center</a>
                <a href="#contact">Contact Us</a>
                <a href="#privacy">Privacy Policy</a>
                <a href="#terms">Terms of Service</a>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2024 Tanda by Sranan Kasmoni. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing; 