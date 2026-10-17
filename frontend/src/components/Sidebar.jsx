import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Link2, 
  AlertTriangle, 
  Smartphone, 
  FileCode, 
  History, 
  User, 
  Settings as SettingsIcon,
  ShieldCheck,
  Zap,
  Activity
} from 'lucide-react';

const NAV_GROUPS = [
  {
    title: 'Core Telemetry',
    items: [
      { to: '/dashboard', label: 'Main Dashboard', icon: LayoutDashboard },
      { to: '/history', label: 'Scan History', icon: History, badge: 'Logs' },
    ]
  },
  {
    title: 'Security Scanners',
    items: [
      { to: '/link-checker', label: 'HTTP/S Link Checker', icon: Link2, badge: 'Fast' },
      { to: '/suspicious-checker', label: 'Suspicious URL Scanner', icon: AlertTriangle, badge: 'Shield' },
      { to: '/apk-scanner', label: 'APK Malware Scanner', icon: Smartphone, badge: 'Deep' },
      { to: '/apk-urls', label: 'APK Embedded URLs', icon: FileCode },
    ]
  },
  {
    title: 'System & Profile',
    items: [
      { to: '/profile', label: 'User Profile', icon: User },
      { to: '/settings', label: 'Settings & Integrations', icon: SettingsIcon },
    ]
  }
];

export default function Sidebar({ className = '', onCloseMobile }) {
  return (
    <aside 
      className={`app-sidebar ${className}`}
      style={{
        width: '265px',
        backgroundColor: 'rgba(11, 16, 27, 0.95)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderRight: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '20px 14px',
        minHeight: 'calc(100vh - 66px)',
        boxShadow: '4px 0 20px rgba(0, 0, 0, 0.25)'
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {NAV_GROUPS.map((group, groupIdx) => (
          <div key={groupIdx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{
              fontSize: '0.68rem',
              fontWeight: 800,
              color: 'var(--text-dim)',
              textTransform: 'uppercase',
              letterSpacing: '0.09em',
              padding: '4px 12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <span>{group.title}</span>
            </div>

            {group.items.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onCloseMobile}
                  style={({ isActive }) => ({
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '9px 12px',
                    borderRadius: '10px',
                    fontSize: '0.86rem',
                    fontWeight: isActive ? 600 : 500,
                    color: isActive ? '#ffffff' : 'var(--text-muted)',
                    background: isActive 
                      ? 'linear-gradient(90deg, rgba(6, 182, 212, 0.18) 0%, rgba(59, 130, 246, 0.08) 100%)' 
                      : 'transparent',
                    border: isActive ? '1px solid rgba(6, 182, 212, 0.35)' : '1px solid transparent',
                    boxShadow: isActive ? '0 2px 10px rgba(6, 182, 212, 0.15)' : 'none',
                    transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
                    position: 'relative'
                  })}
                >
                  {({ isActive }) => (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '11px' }}>
                        <div style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: isActive ? 'rgba(6, 182, 212, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                          color: isActive ? 'var(--accent-cyan)' : 'var(--text-dim)',
                          transition: 'all 0.18s ease'
                        }}>
                          <Icon size={16} />
                        </div>
                        <span style={{ letterSpacing: '-0.01em' }}>{item.label}</span>
                      </div>

                      {item.badge && (
                        <span style={{
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: '10px',
                          backgroundColor: isActive ? 'rgba(6, 182, 212, 0.25)' : 'rgba(255, 255, 255, 0.06)',
                          color: isActive ? 'var(--accent-cyan)' : 'var(--text-dim)',
                          border: `1px solid ${isActive ? 'rgba(6, 182, 212, 0.4)' : 'rgba(255, 255, 255, 0.08)'}`,
                          letterSpacing: '0.02em'
                        }}>
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>
        ))}
      </div>

      {/* Cyber Security Status Indicator Widget */}
      <div style={{
        padding: '14px',
        background: 'linear-gradient(145deg, rgba(16, 23, 41, 0.8), rgba(11, 16, 27, 0.9))',
        borderRadius: '12px',
        border: '1px solid rgba(6, 182, 212, 0.2)',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Glow accent */}
        <div style={{
          position: 'absolute',
          top: '-20px',
          right: '-20px',
          width: '60px',
          height: '60px',
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.2) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-emerald)', fontWeight: 700, fontSize: '0.8rem' }}>
            <span className="pulse-indicator online" />
            <span>SSRF Shield Active</span>
          </div>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>v2.4.0</span>
        </div>
        
        <p style={{ lineHeight: 1.45, color: 'var(--text-dim)', fontSize: '0.74rem' }}>
          Hardware & socket-level blocking for private IP ranges, cloud metadata endpoints, and DNS rebinding attacks.
        </p>
      </div>
    </aside>
  );
}
