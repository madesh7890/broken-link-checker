import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Activity, User, LogOut, Radio, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function Navbar({ onToggleMobileMenu }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [integrations, setIntegrations] = useState(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await api.get('/integrations/status');
        setIntegrations(res.data.integrations);
      } catch (err) {
        // quiet fallback
      }
    };
    fetchStatus();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isSafeBrowsingConfigured = integrations?.google_safe_browsing?.configured;

  return (
    <header style={{
      height: '66px',
      borderBottom: '1px solid var(--border-color)',
      backgroundColor: 'rgba(9, 13, 22, 0.85)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      position: 'sticky',
      top: 0,
      zIndex: 40,
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* Mobile menu toggle hamburger */}
        {onToggleMobileMenu && (
          <button
            type="button"
            className="mobile-menu-btn btn-secondary"
            onClick={onToggleMobileMenu}
            aria-label="Toggle navigation menu"
            style={{
              padding: '7px 11px',
              borderRadius: '10px',
              border: '1px solid var(--border-color)',
              color: 'var(--text-main)',
              cursor: 'pointer'
            }}
          >
            <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>☰</span>
          </button>
        )}

        <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #0284c7 0%, #06b6d4 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 0 20px rgba(6, 182, 212, 0.45)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <Shield size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ 
                fontWeight: 900, 
                fontSize: '1.15rem', 
                letterSpacing: '-0.01em', 
                background: 'linear-gradient(90deg, #ffffff, #e0f2fe)', 
                WebkitBackgroundClip: 'text', 
                WebkitTextFillColor: 'transparent',
                textTransform: 'uppercase'
              }}>
                BROKEN LINK CHECKER
              </span>
            </div>
            <span style={{ fontSize: '0.72rem', display: 'block', color: 'var(--text-dim)', marginTop: '-1px' }}>
              URL Integrity & APK Security Suite
            </span>
          </div>
        </Link>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Offline Fallback / Integration Indicator */}
        <div 
          className="navbar-status-badge"
          title={isSafeBrowsingConfigured ? "External Security APIs Active" : "Operating in safe local analysis fallback mode."}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 14px',
            borderRadius: '24px',
            fontSize: '0.78rem',
            fontWeight: 600,
            backgroundColor: isSafeBrowsingConfigured ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
            border: `1px solid ${isSafeBrowsingConfigured ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
            color: isSafeBrowsingConfigured ? 'var(--accent-emerald)' : 'var(--accent-amber)',
            boxShadow: isSafeBrowsingConfigured ? '0 0 12px rgba(16, 185, 129, 0.15)' : 'none'
          }}
        >
          <span className={`pulse-indicator ${isSafeBrowsingConfigured ? 'online' : 'warning'}`} />
          <span>{isSafeBrowsingConfigured ? "Security Radar Online" : "Isolated Offline Guard"}</span>
        </div>

        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Link 
              to="/profile" 
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '6px 14px',
                backgroundColor: 'rgba(22, 30, 49, 0.7)',
                border: '1px solid var(--border-color)',
                borderRadius: '10px',
                fontSize: '0.85rem',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.3), rgba(99, 102, 241, 0.3))',
                border: '1px solid rgba(6, 182, 212, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-cyan)'
              }}>
                <User size={14} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-main)', lineHeight: 1.2 }}>
                  {user.display_name || user.username}
                </span>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>
                  {user.role === 'admin' ? 'Administrator' : 'SecOps Analyst'}
                </span>
              </div>
            </Link>

            <button 
              onClick={handleLogout}
              className="btn btn-secondary"
              style={{ padding: '7px 12px', fontSize: '0.85rem' }}
              title="Sign Out"
            >
              <LogOut size={14} />
              <span>Logout</span>
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '10px' }}>
            <Link to="/login" className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>Login</Link>
            <Link to="/register" className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>Create Account</Link>
          </div>
        )}
      </div>
    </header>
  );
}
