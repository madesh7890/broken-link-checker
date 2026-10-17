import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Shield, AlertCircle, Lock, User, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!identifier.trim() || !password) return;
    setError('');
    setLoading(true);

    try {
      await login(identifier.trim(), password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid username/email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel animate-fade-in" style={{
      width: '100%',
      maxWidth: '440px',
      padding: '38px',
      border: '1px solid rgba(6, 182, 212, 0.25)',
      boxShadow: '0 16px 40px rgba(0, 0, 0, 0.6), 0 0 24px rgba(6, 182, 212, 0.15)',
      position: 'relative'
    }}>
      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <div style={{
          width: '54px',
          height: '54px',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, #0284c7 0%, #06b6d4 100%)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          marginBottom: '14px',
          boxShadow: '0 0 24px rgba(6, 182, 212, 0.45)',
          border: '1px solid rgba(255, 255, 255, 0.25)'
        }}>
          <Shield size={28} />
        </div>
        <h1 style={{ 
          fontSize: '1.65rem', 
          fontWeight: 900, 
          letterSpacing: '-0.01em', 
          margin: 0,
          background: 'linear-gradient(90deg, #ffffff, #e0f2fe)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          textTransform: 'uppercase'
        }}>
          BROKEN LINK CHECKER
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', marginTop: '6px' }}>
          Account Sign In & Security Suite
        </p>
      </div>

      {error && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '12px 14px',
          marginBottom: '20px',
          backgroundColor: 'rgba(239, 68, 68, 0.12)',
          border: '1px solid rgba(239, 68, 68, 0.35)',
          borderRadius: '10px',
          color: '#fca5a5',
          fontSize: '0.86rem'
        }}>
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      {/* One-time account hint */}
      <div style={{
        padding: '10px 14px',
        marginBottom: '18px',
        backgroundColor: 'rgba(6, 182, 212, 0.08)',
        border: '1px solid rgba(6, 182, 212, 0.25)',
        borderRadius: '8px',
        fontSize: '0.78rem',
        color: '#e0f2fe',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <CheckCircle2 size={16} style={{ color: 'var(--accent-cyan)', flexShrink: 0 }} />
        <span>Login using either your <strong>Username</strong> or registered <strong>Email</strong> with your password.</span>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <label className="input-label">Username or Email Address</label>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              className="input-control"
              placeholder="Enter your username or email"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
              autoFocus
              style={{ paddingLeft: '38px' }}
            />
            <User size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
          </div>
        </div>

        <div className="input-group" style={{ marginBottom: '22px' }}>
          <label className="input-label">Password</label>
          <div style={{ position: 'relative' }}>
            <input
              type="password"
              className="input-control"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ paddingLeft: '38px' }}
            />
            <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          style={{ width: '100%', padding: '13px', fontSize: '0.95rem' }}
          disabled={loading}
        >
          {loading ? 'Verifying credentials...' : 'Sign In'}
        </button>
      </form>

      <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.86rem', color: 'var(--text-muted)' }}>
        Don't have an account yet?{' '}
        <Link to="/register" style={{ color: 'var(--accent-cyan)', fontWeight: 700 }}>
          Create Account
        </Link>
      </div>
    </div>
  );
}
