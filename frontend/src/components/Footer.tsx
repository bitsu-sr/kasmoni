import React from 'react';
import { Facebook, Twitter, Mail } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer style={{
      backgroundColor: '#1a5f3c',
      color: 'white',
      padding: '1rem 0',
      marginTop: 'auto',
      width: '100%'
    }}>
      <div className="container">
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          {/* Left side - Copyright */}
          <div style={{ fontSize: '0.875rem' }}>
            ©2025
          </div>

          {/* Center - Social Media and Contact */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1.5rem'
          }}>
            {/* Facebook */}
            <a
              href="https://www.facebook.com/kasmoni.sr/"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: 'white',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'opacity 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
            >
              <Facebook size={20} />
              <span style={{ fontSize: '0.875rem' }}>Facebook</span>
            </a>

            {/* Twitter/X */}
            <a
              href="https://x.com/sr_kasmoni"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: 'white',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'opacity 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
            >
              <Twitter size={20} />
              <span style={{ fontSize: '0.875rem' }}>Twitter</span>
            </a>

            {/* Email */}
            <a
              href="mailto:bitsu.sr@gmail.com"
              style={{
                color: 'white',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'opacity 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
            >
              <Mail size={20} />
              <span style={{ fontSize: '0.875rem' }}>bitsu.sr@gmail.com</span>
            </a>
          </div>

          {/* Right side - Made by */}
          <div style={{ fontSize: '0.875rem' }}>
            Made by: Stasio for Sranan Kasmoni
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 