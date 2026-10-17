import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Globe, 
  CheckCircle2, 
  XCircle, 
  ArrowRightCircle, 
  ShieldAlert, 
  ShieldCheck, 
  HelpCircle, 
  Smartphone, 
  AlertTriangle, 
  Clock, 
  ArrowUpRight, 
  RefreshCw,
  Search,
  ExternalLink,
  Shield,
  Activity,
  Layers,
  Copy,
  Check
} from 'lucide-react';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  const fetchStats = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/dashboard/stats');
      setStats(res.data.stats);
    } catch (err) {
      setError('Unable to load dashboard metrics. Ensure backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const primaryStats = [
    { label: 'Total Scans', value: stats?.total_urls_scanned || 0, icon: Globe, color: 'var(--accent-cyan)', bg: 'rgba(6, 182, 212, 0.12)', border: 'rgba(6, 182, 212, 0.3)' },
    { label: 'Working (2xx/3xx)', value: stats?.working_links || 0, icon: CheckCircle2, color: 'var(--accent-emerald)', bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.3)' },
    { label: 'Broken (4xx)', value: stats?.broken_links || 0, icon: XCircle, color: 'var(--accent-rose)', bg: 'rgba(239, 68, 68, 0.12)', border: 'rgba(239, 68, 68, 0.3)' },
    { label: 'Redirected (3xx)', value: stats?.redirected_links || 0, icon: ArrowRightCircle, color: 'var(--accent-blue)', bg: 'rgba(59, 130, 246, 0.12)', border: 'rgba(59, 130, 246, 0.3)' },
  ];

  const securityStats = [
    { label: 'Safe Reputation', value: stats?.safe_reputation_results || 0, icon: ShieldCheck, color: 'var(--accent-emerald)', bg: 'rgba(16, 185, 129, 0.12)' },
    { label: 'Threats Detected', value: stats?.threats_detected || 0, icon: ShieldAlert, color: 'var(--accent-rose)', bg: 'rgba(239, 68, 68, 0.15)' },
    { label: 'Access Restricted', value: stats?.access_restricted_links || 0, icon: AlertTriangle, color: 'var(--accent-amber)', bg: 'rgba(245, 158, 11, 0.12)' },
    { label: 'APK Packages', value: stats?.apk_files_analyzed || 0, icon: Smartphone, color: 'var(--accent-purple)', bg: 'rgba(168, 85, 247, 0.12)' },
  ];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Top Cyber Hero Card */}
      <div 
        className="glass-panel" 
        style={{ 
          padding: '24px 28px',
          background: 'linear-gradient(135deg, rgba(16, 23, 41, 0.9) 0%, rgba(13, 27, 56, 0.6) 100%)',
          border: '1px solid rgba(6, 182, 212, 0.25)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{
          position: 'absolute',
          top: '-30px',
          right: '5%',
          width: '180px',
          height: '180px',
          background: 'radial-gradient(circle, rgba(6, 182, 212, 0.15) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />

        <div className="responsive-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', position: 'relative', zIndex: 1 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span className="pulse-indicator online" />
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Operational Security Command
              </span>
            </div>
            <h1 style={{ fontSize: '1.85rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.01em', margin: 0, textTransform: 'uppercase' }}>
              BROKEN LINK CHECKER
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '4px', maxWidth: '620px' }}>
              Continuous automated validation of URL destinations, SSL handshakes, recursive redirects, and non-executing Android APK binary inspection.
            </p>
          </div>

          <div className="responsive-btn-group" style={{ display: 'flex', gap: '10px' }}>
            <button 
              onClick={fetchStats} 
              className="btn btn-secondary" 
              disabled={loading}
              style={{ padding: '9px 15px', fontSize: '0.85rem' }}
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
              <span>Refresh Telemetry</span>
            </button>
            <Link to="/link-checker" className="btn btn-primary" style={{ padding: '9px 18px', fontSize: '0.85rem' }}>
              <Globe size={15} />
              <span>Inspect URLs</span>
            </Link>
            <Link to="/apk-scanner" className="btn btn-cyber" style={{ padding: '9px 18px', fontSize: '0.85rem' }}>
              <Smartphone size={15} />
              <span>Upload APK</span>
            </Link>
          </div>
        </div>
      </div>

      {error && (
        <div style={{
          padding: '14px 18px',
          backgroundColor: 'rgba(239, 68, 68, 0.12)',
          border: '1px solid rgba(239, 68, 68, 0.35)',
          borderRadius: '10px',
          color: '#fca5a5',
          fontSize: '0.9rem',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Primary KPI Metrics */}
      <div>
        <div style={{
          fontSize: '0.72rem',
          fontWeight: 800,
          color: 'var(--text-dim)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          marginBottom: '10px'
        }}>
          Link Integrity Overview
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '14px'
        }}>
          {primaryStats.map((card, i) => {
            const Icon = card.icon;
            return (
              <div 
                key={i} 
                className="glass-card" 
                style={{
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  borderTop: `2px solid ${card.color}`,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                    {card.label}
                  </span>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    backgroundColor: card.bg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: card.color,
                    boxShadow: `0 0 12px ${card.bg}`
                  }}>
                    <Icon size={18} />
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.03em' }}>
                    {loading ? '...' : card.value}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Security & Threat Metrics */}
      <div>
        <div style={{
          fontSize: '0.72rem',
          fontWeight: 800,
          color: 'var(--text-dim)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          marginBottom: '10px'
        }}>
          Threat & Vulnerability Indicators
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '14px'
        }}>
          {securityStats.map((card, i) => {
            const Icon = card.icon;
            return (
              <div 
                key={i} 
                className="glass-card" 
                style={{
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  borderTop: `2px solid ${card.color}`,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                    {card.label}
                  </span>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    backgroundColor: card.bg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: card.color
                  }}>
                    <Icon size={18} />
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.03em' }}>
                    {loading ? '...' : card.value}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Launch Operations Hub */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))',
        gap: '16px'
      }}>
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(59, 130, 246, 0.2))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-cyan)',
              border: '1px solid rgba(6, 182, 212, 0.3)'
            }}>
              <Globe size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff' }}>HTTP/S Link Checker</h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Status codes, latency, hops & TLS health</p>
            </div>
          </div>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-dim)', marginBottom: '18px', lineHeight: 1.5 }}>
            Audit single addresses or bulk batch lists in parallel with hardware-level private IP block enforcement.
          </p>
          <Link to="/link-checker" className="btn btn-primary" style={{ width: '100%', fontSize: '0.85rem' }}>
            <span>Launch Link Checker</span>
            <ArrowUpRight size={15} />
          </Link>
        </div>

        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(239, 68, 68, 0.2))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-amber)',
              border: '1px solid rgba(245, 158, 11, 0.3)'
            }}>
              <AlertTriangle size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff' }}>Suspicious Link Scanner</h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Phishing probe & deceptive domain check</p>
            </div>
          </div>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-dim)', marginBottom: '18px', lineHeight: 1.5 }}>
            Investigate high-risk URLs, SMS phish lures, and masked shortened links in an isolated backend sandbox.
          </p>
          <Link to="/suspicious-checker" className="btn btn-secondary" style={{ width: '100%', fontSize: '0.85rem' }}>
            <span>Scan Suspicious Link</span>
            <ArrowUpRight size={15} />
          </Link>
        </div>

        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2), rgba(99, 102, 241, 0.2))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-purple)',
              border: '1px solid rgba(168, 85, 247, 0.3)'
            }}>
              <Smartphone size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff' }}>APK Malware Inspection</h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Manifests, permissions & embedded endpoints</p>
            </div>
          </div>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-dim)', marginBottom: '18px', lineHeight: 1.5 }}>
            Static Android analysis extracting hidden hardcoded URLs, suspicious DEX strings, and dangerous permission matrices.
          </p>
          <Link to="/apk-scanner" className="btn btn-secondary" style={{ width: '100%', fontSize: '0.85rem' }}>
            <span>Inspect APK Package</span>
            <ArrowUpRight size={15} />
          </Link>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff', margin: 0 }}>
              Recent Security Audit Logs
            </h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Historical inspection log records associated with your authenticated session.
            </p>
          </div>
          <Link 
            to="/history" 
            className="btn btn-secondary"
            style={{ fontSize: '0.82rem', padding: '6px 14px' }}
          >
            <span>View Full History</span>
            <ArrowUpRight size={14} />
          </Link>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
            <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 12px auto', color: 'var(--accent-cyan)' }} />
            <p style={{ fontWeight: 600 }}>Streaming recent telemetry...</p>
          </div>
        ) : !stats?.recent_scans || stats.recent_scans.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '48px 20px', 
            borderRadius: '12px',
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            border: '1px dashed var(--border-color)'
          }}>
            <Globe size={36} style={{ margin: '0 auto 12px auto', opacity: 0.4, color: 'var(--accent-cyan)' }} />
            <h3 style={{ fontWeight: 700, color: '#fff', fontSize: '1rem' }}>No Audit Records Found</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px', maxWidth: '400px', margin: '4px auto 16px auto' }}>
              Run your first URL test or upload an Android APK binary to view forensic telemetry here.
            </p>
            <Link to="/link-checker" className="btn btn-primary" style={{ padding: '8px 18px', fontSize: '0.85rem' }}>
              Launch First URL Scan
            </Link>
          </div>
        ) : (
          <div style={{ overflowX: 'auto', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Target / Destination</th>
                  <th>Availability</th>
                  <th>Reputation</th>
                  <th>Timestamp</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {stats.recent_scans.map((scan) => (
                  <tr key={scan.id}>
                    <td>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        backgroundColor: scan.type === 'URL' ? 'rgba(6, 182, 212, 0.15)' : 'rgba(168, 85, 247, 0.15)',
                        color: scan.type === 'URL' ? 'var(--accent-cyan)' : 'var(--accent-purple)',
                        border: `1px solid ${scan.type === 'URL' ? 'rgba(6, 182, 212, 0.3)' : 'rgba(168, 85, 247, 0.3)'}`
                      }}>
                        {scan.type === 'URL' ? <Globe size={11} /> : <Smartphone size={11} />}
                        {scan.type}
                      </span>
                    </td>
                    <td style={{ maxWidth: '340px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span 
                          className="font-mono" 
                          style={{ 
                            fontSize: '0.82rem', 
                            color: '#e2e8f0', 
                            whiteSpace: 'nowrap', 
                            overflow: 'hidden', 
                            textOverflow: 'ellipsis' 
                          }} 
                          title={scan.target}
                        >
                          {scan.target}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(scan.target, scan.id)}
                          title="Copy destination"
                          style={{
                            padding: '3px',
                            color: copiedId === scan.id ? 'var(--accent-emerald)' : 'var(--text-dim)',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          {copiedId === scan.id ? <Check size={13} /> : <Copy size={13} />}
                        </button>
                      </div>
                    </td>
                    <td>
                      <StatusBadge status={scan.status} size="sm" />
                    </td>
                    <td>
                      <StatusBadge status={scan.reputation} size="sm" />
                    </td>
                    <td style={{ color: 'var(--text-dim)', fontSize: '0.78rem' }}>
                      {scan.timestamp ? new Date(scan.timestamp * 1000).toLocaleString() : 'N/A'}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Link 
                        to={`/reports/${scan.type.toLowerCase()}/${scan.id}`}
                        className="btn btn-secondary"
                        style={{
                          padding: '4px 10px',
                          fontSize: '0.78rem',
                          color: 'var(--accent-cyan)',
                          borderColor: 'rgba(6, 182, 212, 0.3)'
                        }}
                      >
                        <span>Report</span>
                        <ExternalLink size={12} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
