import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export default function AccessDenied() {
  return (
    <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '440px', padding: '40px', textAlign: 'center' }}>
      <div style={{
        width: '56px',
        height: '56px',
        borderRadius: '14px',
        backgroundColor: 'rgba(239, 68, 68, 0.15)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--accent-rose)',
        marginBottom: '16px'
      }}>
        <ShieldAlert size={30} />
      </div>

      <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff' }}>403 - Access Denied</h1>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '8px', lineHeight: 1.5 }}>
        You do not have authorization to view this private scan report or perform this administrative action.
      </p>

      <div style={{ marginTop: '24px' }}>
        <Link to="/dashboard" className="btn btn-primary" style={{ padding: '10px 20px' }}>
          <ArrowLeft size={16} />
          <span>Return to Dashboard</span>
        </Link>
      </div>
    </div>
  );
}
