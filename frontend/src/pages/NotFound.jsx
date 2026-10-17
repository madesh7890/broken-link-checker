import React from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '440px', padding: '40px', textAlign: 'center' }}>
      <div style={{
        width: '56px',
        height: '56px',
        borderRadius: '14px',
        backgroundColor: 'rgba(6, 182, 212, 0.15)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--accent-cyan)',
        marginBottom: '16px'
      }}>
        <HelpCircle size={30} />
      </div>

      <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff' }}>404 - Endpoint Not Found</h1>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '8px', lineHeight: 1.5 }}>
        The requested URL path or security report does not exist on this server.
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
