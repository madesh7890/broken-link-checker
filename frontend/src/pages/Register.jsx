import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, UserPlus, AlertCircle, CheckCircle2, User, Mail, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: '',
    display_name: '',
    email: '',
    password: '',
    password_confirm: ''
  });
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (errors[e.target.name]) {
      setErrors(prev => ({ ...prev, [e.target.name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setGeneralError('');

    if (formData.password !== formData.password_confirm) {
      setErrors({ password_confirm: 'Passwords do not match.' });
      return;
    }

    setLoading(true);
    try {
      await register(formData);
      navigate('/dashboard');
    } catch (err) {
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      }
      setGeneralError(err.response?.data?.message || 'Registration failed. Please check your credentials or ensure the backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel animate-fade-in" style={{
      width: '100%',
      maxWidth: '480px',
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
          Create your account once. You can sign in using either your Username or Email.
        </p>
      </div>

      {generalError && (
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
          <span>{generalError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <label className="input-label">Username</label>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              name="username"
              className="input-control"
              placeholder="e.g. security_auditor"
              value={formData.username}
              onChange={handleChange}
              required
              style={{ paddingLeft: '38px' }}
            />
            <User size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
          </div>
          {errors.username && <span style={{ color: 'var(--accent-rose)', fontSize: '0.78rem', marginTop: '4px', display: 'block' }}>{errors.username}</span>}
        </div>

        <div className="input-group">
          <label className="input-label">Display Name</label>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              name="display_name"
              className="input-control"
              placeholder="e.g. Alex Morgan"
              value={formData.display_name}
              onChange={handleChange}
              required
              style={{ paddingLeft: '38px' }}
            />
            <User size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
          </div>
          {errors.display_name && <span style={{ color: 'var(--accent-rose)', fontSize: '0.78rem', marginTop: '4px', display: 'block' }}>{errors.display_name}</span>}
        </div>

        <div className="input-group">
          <label className="input-label">Email Address</label>
          <div style={{ position: 'relative' }}>
            <input
              type="email"
              name="email"
              className="input-control"
              placeholder="alex@company.org"
              value={formData.email}
              onChange={handleChange}
              required
              style={{ paddingLeft: '38px' }}
            />
            <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
          </div>
          {errors.email && <span style={{ color: 'var(--accent-rose)', fontSize: '0.78rem', marginTop: '4px', display: 'block' }}>{errors.email}</span>}
        </div>

        <div className="input-group">
          <label className="input-label">Password</label>
          <div style={{ position: 'relative' }}>
            <input
              type="password"
              name="password"
              className="input-control"
              placeholder="At least 8 characters"
              value={formData.password}
              onChange={handleChange}
              required
              style={{ paddingLeft: '38px' }}
            />
            <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
          </div>
          {errors.password && <span style={{ color: 'var(--accent-rose)', fontSize: '0.78rem', marginTop: '4px', display: 'block' }}>{errors.password}</span>}
        </div>

        <div className="input-group" style={{ marginBottom: '22px' }}>
          <label className="input-label">Confirm Password</label>
          <div style={{ position: 'relative' }}>
            <input
              type="password"
              name="password_confirm"
              className="input-control"
              placeholder="Re-enter password"
              value={formData.password_confirm}
              onChange={handleChange}
              required
              style={{ paddingLeft: '38px' }}
            />
            <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
          </div>
          {errors.password_confirm && <span style={{ color: 'var(--accent-rose)', fontSize: '0.78rem', marginTop: '4px', display: 'block' }}>{errors.password_confirm}</span>}
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          style={{ width: '100%', padding: '13px', fontSize: '0.95rem' }}
          disabled={loading}
        >
          {loading ? 'Creating workspace account...' : 'Create Account'}
        </button>
      </form>

      <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.86rem', color: 'var(--text-muted)' }}>
        Already have an account?{' '}
        <Link to="/login" style={{ color: 'var(--accent-cyan)', fontWeight: 700 }}>
          Log In
        </Link>
      </div>
    </div>
  );
}
