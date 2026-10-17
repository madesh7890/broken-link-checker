import React, { useState } from 'react';
import { 
  Link2, 
  Send, 
  Layers, 
  CheckCircle, 
  AlertTriangle, 
  ExternalLink, 
  Clock, 
  ShieldCheck, 
  ShieldAlert, 
  RotateCw, 
  Info,
  Sparkles,
  Clipboard,
  Zap,
  ArrowRight,
  Server,
  Lock,
  Globe
} from 'lucide-react';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';

const SAMPLE_URLS = [
  { label: '200 OK Demo', url: 'https://httpbin.org/status/200' },
  { label: '404 Broken Demo', url: 'https://httpbin.org/status/404' },
  { label: 'Redirect Chain', url: 'https://httpbin.org/redirect/2' },
  { label: 'HTTPS Example', url: 'https://example.com' },
];

export default function LinkChecker() {
  const [mode, setMode] = useState('single'); // 'single' or 'batch'
  const [url, setUrl] = useState('');
  const [batchUrls, setBatchUrls] = useState('');
  const [loading, setLoading] = useState(false);
  const [singleResult, setSingleResult] = useState(null);
  const [batchResults, setBatchResults] = useState(null);
  const [error, setError] = useState('');

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setUrl(text.trim());
    } catch {
      // clipboard access denied/fallback
    }
  };

  const handleSingleSubmit = async (e) => {
    e.preventDefault();
    if (!url.trim()) return;
    setError('');
    setLoading(true);
    setSingleResult(null);

    try {
      const res = await api.post('/links/check-single', { url: url.trim() });
      setSingleResult(res.data.scan);
    } catch (err) {
      setError(err.response?.data?.message || 'Error executing URL inspection.');
    } finally {
      setLoading(false);
    }
  };

  const handleBatchSubmit = async (e) => {
    e.preventDefault();
    if (!batchUrls.trim()) return;
    setError('');
    setLoading(true);
    setBatchResults(null);

    try {
      const res = await api.post('/links/check-batch', { urls: batchUrls });
      setBatchResults(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Error executing batch URL inspection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span className="tech-tag" style={{ color: 'var(--accent-cyan)', borderColor: 'rgba(6, 182, 212, 0.3)' }}>
              <Zap size={13} />
              <span>Multi-Protocol Probe</span>
            </span>
            <span className="tech-tag" style={{ color: 'var(--accent-emerald)', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
              <ShieldCheck size={13} />
              <span>Anti-SSRF Enabled</span>
            </span>
          </div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', margin: 0 }}>
            HTTP & HTTPS Link Inspector
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
            Verify target reachability, latency benchmark, TLS certificate trust, and recursive redirect sequences.
          </p>
        </div>

        {/* Tab Switcher */}
        <div style={{
          display: 'flex',
          padding: '4px',
          background: 'rgba(16, 23, 41, 0.8)',
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
          gap: '6px'
        }}>
          <button
            onClick={() => setMode('single')}
            className={`btn ${mode === 'single' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '8px 16px', fontSize: '0.85rem', borderRadius: '8px' }}
          >
            <Link2 size={16} />
            <span>Single URL Audit</span>
          </button>
          <button
            onClick={() => setMode('batch')}
            className={`btn ${mode === 'batch' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '8px 16px', fontSize: '0.85rem', borderRadius: '8px' }}
          >
            <Layers size={16} />
            <span>Batch Multi-URL Scan</span>
          </button>
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

      {/* Single Mode Form Card */}
      {mode === 'single' && (
        <div className="glass-card" style={{ padding: '26px' }}>
          <form onSubmit={handleSingleSubmit}>
            <div className="input-group" style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label className="input-label" style={{ margin: 0 }}>Target Web Destination</label>
                <button
                  type="button"
                  onClick={handlePaste}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.76rem',
                    color: 'var(--accent-cyan)',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  <Clipboard size={12} />
                  <span>Paste from Clipboard</span>
                </button>
              </div>

              <div className="responsive-form-row" style={{ display: 'flex', gap: '10px' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <input
                    type="text"
                    className="input-control font-mono"
                    placeholder="https://example.com/target-path"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    required
                    style={{ paddingLeft: '38px' }}
                  />
                  <Globe 
                    size={18} 
                    style={{ 
                      position: 'absolute', 
                      left: '12px', 
                      top: '50%', 
                      transform: 'translateY(-50%)', 
                      color: 'var(--text-dim)' 
                    }} 
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ minWidth: '150px', padding: '12px 24px' }}
                  disabled={loading}
                >
                  {loading ? <RotateCw size={16} className="animate-spin" /> : <Send size={16} />}
                  <span>{loading ? 'Inspecting...' : 'Audit Target'}</span>
                </button>
              </div>
            </div>

            {/* Quick Preset Sample Chips */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)', fontWeight: 600 }}>Quick presets:</span>
              {SAMPLE_URLS.map((sample, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setUrl(sample.url)}
                  style={{
                    padding: '3px 10px',
                    borderRadius: '16px',
                    fontSize: '0.72rem',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--accent-cyan)';
                    e.currentTarget.style.color = '#fff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-color)';
                    e.currentTarget.style.color = 'var(--text-muted)';
                  }}
                >
                  {sample.label}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: 'var(--text-dim)' }}>
              <ShieldCheck size={14} style={{ color: 'var(--accent-emerald)', flexShrink: 0 }} />
              <span>SSRF Guard active: Loopbacks (127.0.0.1, localhost), private subnets (10.0.0.0/8, 192.168.0.0/16), and cloud metadata endpoints are strictly denied.</span>
            </div>
          </form>

          {/* Single Result Details View */}
          {singleResult && (
            <div className="animate-slide-up" style={{ marginTop: '28px', paddingTop: '24px', borderTop: '1px solid var(--border-color)' }}>
              
              {/* Grand Verdict Banner */}
              {(() => {
                const verdict = singleResult.security_verdict || 'SAFE';
                const theme = (() => {
                  if (verdict === 'UNSAFE') {
                    return {
                      status: 'UNSAFE',
                      border: '#ef4444',
                      bg: 'rgba(239, 68, 68, 0.18)',
                      glow: 'rgba(239, 68, 68, 0.35)',
                      label: 'UNSAFE — Malicious or Compromised Endpoint Detected',
                      badgeText: 'UNSAFE'
                    };
                  }
                  if (verdict === 'UNREACHABLE') {
                    return {
                      status: 'CONNECTION_FAILED',
                      border: '#ec4899',
                      bg: 'rgba(236, 72, 153, 0.12)',
                      glow: 'rgba(236, 72, 153, 0.25)',
                      label: 'URL Unreachable — Host did not respond or failed DNS resolution',
                      badgeText: 'CONNECTION FAILED'
                    };
                  }
                  if (verdict === 'ACCESS_RESTRICTED') {
                    return {
                      status: 'ACCESS_RESTRICTED',
                      border: '#f59e0b',
                      bg: 'rgba(245, 158, 11, 0.15)',
                      glow: 'rgba(245, 158, 11, 0.25)',
                      label: 'Access Restricted — 401/403 or network-level blocking',
                      badgeText: 'RESTRICTED'
                    };
                  }
                  if (verdict === 'BROKEN') {
                    return {
                      status: 'BROKEN',
                      border: '#ef4444',
                      bg: 'rgba(239, 68, 68, 0.12)',
                      glow: 'rgba(239, 68, 68, 0.25)',
                      label: 'Broken Link — Destination returned a 4xx client status',
                      badgeText: 'BROKEN LINK'
                    };
                  }
                  if (verdict === 'SERVER_ERROR') {
                    return {
                      status: 'SERVER_ERROR',
                      border: '#f97316',
                      bg: 'rgba(249, 115, 22, 0.12)',
                      glow: 'rgba(249, 115, 22, 0.25)',
                      label: 'Server Error — Destination returned a 5xx upstream failure',
                      badgeText: 'SERVER ERROR'
                    };
                  }
                  return {
                    status: 'SAFE',
                    border: '#10b981',
                    bg: 'rgba(16, 185, 129, 0.14)',
                    glow: 'rgba(16, 185, 129, 0.3)',
                    label: 'SAFE — Endpoint is verified reachable, secure & threat-free',
                    badgeText: 'SAFE DESTINATION'
                  };
                })();

                return (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '20px 24px',
                    marginBottom: '22px',
                    backgroundColor: theme.bg,
                    border: `1px solid ${theme.border}`,
                    borderRadius: '14px',
                    flexWrap: 'wrap',
                    gap: '14px',
                    boxShadow: `0 8px 24px ${theme.glow}`
                  }}>
                    <div>
                      <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-dim)' }}>
                        SECURITY VERDICT SUMMARY
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px' }}>
                        <StatusBadge status={theme.status} text={theme.badgeText} size="md" />
                        <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff' }}>
                          {theme.label}
                        </span>
                      </div>
                      {singleResult.verdict_reason && (
                        <div style={{ fontSize: '0.86rem', color: '#cbd5e1', marginTop: '6px' }}>
                          {singleResult.verdict_reason}
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', display: 'block', textTransform: 'uppercase', fontWeight: 700 }}>Protocol Security</span>
                      <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--accent-cyan)', fontSize: '0.95rem' }}>
                        {singleResult.submitted_url.startsWith('https') ? '🔒 HTTPS (TLS Encrypted)' : '⚠️ HTTP (Cleartext)'}
                      </span>
                    </div>
                  </div>
                );
              })()}

              {/* Metrics Row: Status Code, Response Latency, TLS */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '12px',
                marginBottom: '20px'
              }}>
                <div style={{ padding: '16px', backgroundColor: 'rgba(16, 23, 41, 0.8)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                    HTTP Status
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <StatusBadge status={singleResult.availability_status} size="sm" />
                    {singleResult.http_status && (
                      <span className="font-mono" style={{ fontWeight: 800, fontSize: '1.05rem', color: '#fff' }}>
                        {singleResult.http_status}
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ padding: '16px', backgroundColor: 'rgba(16, 23, 41, 0.8)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                    Response Latency
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Clock size={16} style={{ color: 'var(--accent-cyan)' }} />
                    <span className="font-mono" style={{
                      fontWeight: 800,
                      fontSize: '1.05rem',
                      color: singleResult.response_time_ms < 300 ? 'var(--accent-emerald)' : singleResult.response_time_ms < 800 ? 'var(--accent-amber)' : 'var(--accent-rose)'
                    }}>
                      {singleResult.response_time_ms} ms
                    </span>
                    <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>
                      {singleResult.response_time_ms < 300 ? '(Fast)' : singleResult.response_time_ms < 800 ? '(Moderate)' : '(High Latency)'}
                    </span>
                  </div>
                </div>

                <div style={{ padding: '16px', backgroundColor: 'rgba(16, 23, 41, 0.8)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                    TLS Certificate
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Lock size={16} style={{ color: singleResult.tls_valid === true ? 'var(--accent-emerald)' : 'var(--accent-rose)' }} />
                    <span style={{
                      fontWeight: 800,
                      fontSize: '1.05rem',
                      color: singleResult.tls_valid === true ? 'var(--accent-emerald)' : singleResult.tls_valid === false ? 'var(--accent-rose)' : 'var(--text-muted)'
                    }}>
                      {singleResult.tls_valid === true ? 'Valid Certificate' : singleResult.tls_valid === false ? 'Untrusted / Expired' : 'Not Applicable'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Threat Intelligence Card */}
              <div style={{
                padding: '18px 20px',
                marginBottom: '20px',
                backgroundColor: singleResult.reputation_status === 'SAFE' 
                  ? 'rgba(16, 185, 129, 0.08)' 
                  : singleResult.reputation_status === 'UNSAFE' 
                  ? 'rgba(239, 68, 68, 0.12)' 
                  : 'rgba(245, 158, 11, 0.08)',
                border: `1px solid ${
                  singleResult.reputation_status === 'SAFE' 
                    ? 'rgba(16, 185, 129, 0.3)' 
                    : singleResult.reputation_status === 'UNSAFE' 
                    ? 'rgba(239, 68, 68, 0.4)' 
                    : 'rgba(245, 158, 11, 0.3)'
                }`,
                borderRadius: '12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-dim)' }}>
                      Threat Intelligence Engine:
                    </span>
                    <StatusBadge status={singleResult.reputation_status} size="sm" />
                  </div>
                  <div style={{ fontSize: '0.88rem', color: '#fff' }}>
                    {singleResult.reputation_details?.reason || (singleResult.reputation_status === 'SAFE' ? 'Clean record: No active malware or deceptive phishing tags recorded.' : 'External reputation intelligence operating in isolated fallback mode.')}
                  </div>
                </div>
                {singleResult.reputation_details?.threat_types && singleResult.reputation_details.threat_types.length > 0 && (
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {singleResult.reputation_details.threat_types.map((t, idx) => (
                      <span key={idx} style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        backgroundColor: 'rgba(239, 68, 68, 0.25)',
                        color: 'var(--accent-rose)',
                        border: '1px solid rgba(239, 68, 68, 0.4)'
                      }}>
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Hop Breakdown */}
              <div style={{
                backgroundColor: 'rgba(16, 23, 41, 0.9)',
                borderRadius: '12px',
                padding: '18px 20px',
                border: '1px solid var(--border-color)',
                marginBottom: '20px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                    Redirect Sequence Analysis ({singleResult.redirect_chain?.length || 0} Hops)
                  </h4>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                    Max Allowed: 10 Hops
                  </span>
                </div>

                {singleResult.redirect_chain && singleResult.redirect_chain.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {singleResult.redirect_chain.map((hop, index) => (
                      <div key={index} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        fontSize: '0.84rem',
                        fontFamily: 'monospace',
                        padding: '10px 14px',
                        backgroundColor: 'rgba(11, 16, 27, 0.8)',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color)'
                      }}>
                        <span style={{ color: 'var(--accent-cyan)', fontWeight: 800 }}>Hop #{hop.hop}</span>
                        <span style={{ color: 'var(--text-muted)' }}>{hop.from_url}</span>
                        <span style={{
                          padding: '2px 6px',
                          borderRadius: '4px',
                          backgroundColor: 'rgba(245, 158, 11, 0.15)',
                          color: 'var(--accent-amber)',
                          fontWeight: 700
                        }}>
                          {hop.status_code}
                        </span>
                        <ArrowRight size={14} style={{ color: 'var(--accent-cyan)' }} />
                        <span style={{ color: '#fff', fontWeight: 600 }}>{hop.to_url}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: '0.84rem', color: 'var(--text-dim)', margin: 0 }}>
                    Direct destination reached. No intermediary redirects observed.
                  </p>
                )}
              </div>

              {/* Server Headers & Details */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', fontSize: '0.82rem' }}>
                <div style={{ padding: '14px', backgroundColor: 'rgba(16, 23, 41, 0.8)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                  <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px' }}>Final Destination</span>
                  <span style={{ wordBreak: 'break-all', fontFamily: 'monospace', color: '#fff', fontWeight: 600 }}>{singleResult.final_url}</span>
                </div>
                <div style={{ padding: '14px', backgroundColor: 'rgba(16, 23, 41, 0.8)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                  <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px' }}>Content-Type</span>
                  <span style={{ fontFamily: 'monospace', color: '#fff', fontWeight: 600 }}>{singleResult.content_type || 'Not reported'}</span>
                </div>
                <div style={{ padding: '14px', backgroundColor: 'rgba(16, 23, 41, 0.8)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                  <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px' }}>Server Signature</span>
                  <span style={{ fontFamily: 'monospace', color: '#fff', fontWeight: 600 }}>{singleResult.server || 'Masked / Undisclosed'}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Batch Mode Form Card */}
      {mode === 'batch' && (
        <div className="glass-card" style={{ padding: '26px' }}>
          <form onSubmit={handleBatchSubmit}>
            <div className="input-group">
              <label className="input-label">Batch URL List (One URL per line — Up to 50 URLs)</label>
              <textarea
                className="input-control font-mono"
                rows={6}
                placeholder="https://example.com&#10;https://httpbin.org/status/404&#10;https://httpbin.org/status/500&#10;https://httpbin.org/redirect/2"
                value={batchUrls}
                onChange={(e) => setBatchUrls(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
                style={{ padding: '12px 28px' }}
              >
                {loading ? <RotateCw size={16} className="animate-spin" /> : <Layers size={16} />}
                <span>{loading ? 'Executing Multi-Scan...' : 'Start Batch Audit'}</span>
              </button>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                Parallel asynchronous inspection with individual SSRF guard checks.
              </span>
            </div>
          </form>

          {/* Batch Results View */}
          {batchResults && (
            <div className="animate-slide-up" style={{ marginTop: '28px', paddingTop: '24px', borderTop: '1px solid var(--border-color)' }}>
              
              {/* Batch KPI Counters */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: '12px',
                marginBottom: '22px'
              }}>
                <div style={{ padding: '16px', backgroundColor: 'rgba(16, 23, 41, 0.8)', borderRadius: '12px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)', fontWeight: 700, textTransform: 'uppercase' }}>Total Scanned</span>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff', marginTop: '2px' }}>{batchResults.summary.total}</div>
                </div>
                <div style={{ padding: '16px', backgroundColor: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.35)', borderRadius: '12px', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.74rem', color: 'var(--accent-emerald)', fontWeight: 800, textTransform: 'uppercase' }}>Final Safe</span>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent-emerald)', marginTop: '2px' }}>
                    {batchResults.summary.safe ?? batchResults.summary.working}
                  </div>
                </div>
                <div style={{ padding: '16px', backgroundColor: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.35)', borderRadius: '12px', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.74rem', color: 'var(--accent-rose)', fontWeight: 800, textTransform: 'uppercase' }}>Final Unsafe</span>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent-rose)', marginTop: '2px' }}>
                    {batchResults.summary.unsafe ?? (batchResults.summary.broken + batchResults.summary.access_restricted + batchResults.summary.server_error)}
                  </div>
                </div>
                <div style={{ padding: '16px', backgroundColor: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: '12px', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.74rem', color: 'var(--accent-blue)', fontWeight: 700, textTransform: 'uppercase' }}>Redirects</span>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent-blue)', marginTop: '2px' }}>{batchResults.summary.redirected}</div>
                </div>
                <div style={{ padding: '16px', backgroundColor: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.25)', borderRadius: '12px', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.74rem', color: 'var(--accent-amber)', fontWeight: 700, textTransform: 'uppercase' }}>Restricted</span>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent-amber)', marginTop: '2px' }}>{batchResults.summary.access_restricted}</div>
                </div>
              </div>

              {/* Table of Batch Scans */}
              <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th style={{ minWidth: '260px' }}>Target URL</th>
                      <th>Status Code</th>
                      <th>Availability</th>
                      <th>Latency</th>
                      <th style={{ minWidth: '200px' }}>Diagnostics</th>
                      <th>Verdict</th>
                    </tr>
                  </thead>
                  <tbody>
                    {batchResults.scans.map((item, index) => {
                      const verdict = item.security_verdict || item.availability_status || 'SAFE';
                      const isError = verdict === 'UNSAFE';
                      return (
                        <tr key={index}>
                          <td style={{ maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            <span className="font-mono" title={item.submitted_url} style={{ color: '#fff', fontWeight: 500, fontSize: '0.82rem' }}>
                              {item.submitted_url}
                            </span>
                          </td>
                          <td style={{ fontFamily: 'monospace', fontWeight: 700 }}>
                            {item.http_status ? item.http_status : '-'}
                          </td>
                          <td>
                            <StatusBadge status={item.availability_status} size="sm" />
                          </td>
                          <td style={{ fontFamily: 'monospace', color: 'var(--text-dim)', fontSize: '0.82rem' }}>
                            {item.response_time_ms} ms
                          </td>
                          <td style={{ color: isError ? 'var(--accent-rose)' : item.error ? 'var(--accent-amber)' : 'var(--text-muted)', fontSize: '0.8rem' }}>
                            {item.error ? item.error : (verdict === 'SAFE' ? 'Reachable & Clean' : item.verdict_reason || 'Verified')}
                          </td>
                          <td>
                            <StatusBadge status={verdict} size="sm" />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
