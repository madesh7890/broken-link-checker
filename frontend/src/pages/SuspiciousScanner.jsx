import React, { useState } from 'react';
import { 
  AlertTriangle, 
  ShieldCheck, 
  ShieldAlert, 
  HelpCircle, 
  Search, 
  RotateCw, 
  ExternalLink,
  Info,
  CheckCircle2,
  AlertOctagon,
  CornerDownRight,
  Clipboard,
  Shield,
  Zap,
  ArrowRight,
  FileDown,
  Calendar
} from 'lucide-react';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';
import { generatePdfReport } from '../services/pdfReportGenerator';

const SAMPLE_SUSPICIOUS = [
  { label: 'Shortened URL (Bitly)', url: 'https://bit.ly/3sample-link' },
  { label: 'Raw IP Host', url: 'http://192.0.2.1/login-verify' },
  { label: 'Brand Keyword Spoof', url: 'http://secure-paypal-login-update.example.com' },
];

export default function SuspiciousScanner() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState('');

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setUrl(text.trim());
    } catch {
      // ignore
    }
  };

  const handleScan = async (e) => {
    e.preventDefault();
    if (!url.trim()) return;

    setError('');
    setLoading(true);
    setScanResult(null);

    try {
      const res = await api.post('/suspicious/scan', { url: url.trim() });
      setScanResult(res.data.scan);
    } catch (err) {
      if (err.response?.data?.scan) {
        setScanResult(err.response.data.scan);
      } else {
        setError(err.response?.data?.message || 'Error occurred while scanning suspicious URL.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <span className="tech-tag" style={{ color: 'var(--accent-amber)', borderColor: 'rgba(245, 158, 11, 0.3)' }}>
            <AlertTriangle size={13} />
            <span>Phishing & Spoof Detector</span>
          </span>
          <span className="tech-tag" style={{ color: 'var(--accent-cyan)', borderColor: 'rgba(6, 182, 212, 0.3)' }}>
            <ShieldCheck size={13} />
            <span>Isolated Cloud Sandbox</span>
          </span>
        </div>
        <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', margin: 0 }}>
          Suspicious URL & Phishing Scanner
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
          Dissect deceptive links, SMS lures, and shortened redirects safely inside an isolated backend environment.
        </p>
      </div>

      {/* Safety Notice Banner */}
      <div style={{
        padding: '16px 20px',
        backgroundColor: 'rgba(6, 182, 212, 0.08)',
        border: '1px solid rgba(6, 182, 212, 0.25)',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        fontSize: '0.86rem',
        color: '#e0f2fe'
      }}>
        <Info size={20} style={{ color: 'var(--accent-cyan)', flexShrink: 0, marginTop: '2px' }} />
        <div>
          <strong style={{ color: '#fff' }}>Isolated Probing Guarantee:</strong> Never open untrusted, disguised, or unverified links directly on your local device. Every request is executed through isolated server-side proxies equipped with strict SSRF defense.
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

      {/* Form Card */}
      <div className="glass-card" style={{ padding: '26px' }}>
        <form onSubmit={handleScan}>
          <div className="input-group" style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label className="input-label" style={{ margin: 0 }}>Suspicious URL Destination</label>
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
              <input
                type="text"
                className="input-control font-mono"
                placeholder="Paste link from email, SMS, or message (e.g. https://bit.ly/sample or http://192.0.2.1/verify)"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
              />
              <button
                type="submit"
                className="btn btn-primary"
                style={{ minWidth: '160px', padding: '12px 24px', background: 'linear-gradient(135deg, #d97706 0%, #f59e0b 50%, #06b6d4 100%)' }}
                disabled={loading}
              >
                {loading ? <RotateCw size={16} className="animate-spin" /> : <Search size={16} />}
                <span>{loading ? 'Inspecting...' : 'Analyze Threat'}</span>
              </button>
            </div>
          </div>

          {/* Quick presets */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)', fontWeight: 600 }}>Quick test patterns:</span>
            {SAMPLE_SUSPICIOUS.map((sample, idx) => (
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
                  e.currentTarget.style.borderColor = 'var(--accent-amber)';
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
        </form>

        {/* Loading Box */}
        {loading && (
          <div className="animate-pulse-scan" style={{
            marginTop: '24px',
            padding: '24px',
            backgroundColor: 'rgba(245, 158, 11, 0.08)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: '14px',
            textAlign: 'center'
          }}>
            <RotateCw size={30} className="animate-spin" style={{ color: 'var(--accent-amber)', margin: '0 auto 12px' }} />
            <div style={{ color: '#fff', fontWeight: 800, fontSize: '1.05rem' }}>Probing Suspicious Host...</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.84rem', marginTop: '6px', maxWidth: '520px', margin: '6px auto 0 auto' }}>
              Executing isolated DNS resolution, checking Google Safe Browsing threat databases, and calculating syntactic heuristic scores.
            </div>
          </div>
        )}

        {/* Scan Results */}
        {scanResult && (() => {
          const theme = (() => {
            const risk = scanResult.risk_level || (scanResult.security_status === 'SAFE' ? 'NO_INDICATORS_FOUND' : 'HIGH_RISK');
            const sec = scanResult.security_status;

            if (risk === 'HIGH_RISK' || sec === 'UNSAFE') {
              return {
                badgeStatus: 'HIGH_RISK',
                border: '#ef4444',
                bg: 'rgba(239, 68, 68, 0.18)',
                glow: 'rgba(239, 68, 68, 0.35)',
                title: scanResult.status_title || 'High Risk — Active Threat or Deceptive Indicator',
                badgeText: 'UNSAFE / HIGH RISK'
              };
            }
            if (risk === 'POTENTIALLY_SUSPICIOUS' || sec === 'MODERATE') {
              return {
                badgeStatus: 'POTENTIALLY_SUSPICIOUS',
                border: '#f59e0b',
                bg: 'rgba(245, 158, 11, 0.15)',
                glow: 'rgba(245, 158, 11, 0.25)',
                title: scanResult.status_title || 'Potentially Suspicious — Exercise Extreme Caution',
                badgeText: 'MODERATE / SUSPICIOUS'
              };
            }
            if (risk === 'URL_UNREACHABLE' || sec === 'UNREACHABLE') {
              return {
                badgeStatus: 'URL_UNREACHABLE',
                border: '#38bdf8',
                bg: 'rgba(56, 189, 248, 0.12)',
                glow: 'rgba(56, 189, 248, 0.25)',
                title: scanResult.status_title || 'URL Unreachable — Destination Offline or DNS Failed',
                badgeText: 'UNREACHABLE'
              };
            }
            if (risk === 'NO_INDICATORS_FOUND' || sec === 'SAFE') {
              return {
                badgeStatus: 'SAFE',
                border: '#10b981',
                bg: 'rgba(16, 185, 129, 0.14)',
                glow: 'rgba(16, 185, 129, 0.3)',
                title: scanResult.status_title || 'Safe — No Threat Indicators or Spoofing Found',
                badgeText: 'CLEAN / SAFE'
              };
            }
            return {
              badgeStatus: 'SCAN_FAILED',
              border: '#f43f5e',
              bg: 'rgba(244, 63, 94, 0.12)',
              glow: 'rgba(244, 63, 94, 0.25)',
              title: scanResult.status_title || 'Scan Incomplete',
              badgeText: 'SCAN FAILED'
            };
          })();

          return (
            <div className="animate-slide-up" style={{ marginTop: '28px', paddingTop: '24px', borderTop: '1px solid var(--border-color)' }}>
              
              {/* Final Security Result Banner */}
              <div style={{
                padding: '22px 26px',
                backgroundColor: theme.bg,
                borderRadius: '14px',
                border: `1px solid ${theme.border}`,
                marginBottom: '22px',
                boxShadow: `0 8px 24px ${theme.glow}`
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                  <div>
                    <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 800, letterSpacing: '0.08em' }}>
                      SECURITY VERDICT
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
                      <StatusBadge status={theme.badgeStatus} text={theme.badgeText} size="md" />
                      <span style={{ fontSize: '1.15rem', color: '#fff', fontWeight: 800 }}>
                        {theme.title}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => generatePdfReport(scanResult, 'url')}
                      className="btn btn-secondary"
                      style={{
                        padding: '6px 14px',
                        fontSize: '0.8rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        color: 'var(--accent-cyan)',
                        borderColor: 'rgba(6, 182, 212, 0.4)'
                      }}
                    >
                      <FileDown size={14} />
                      <span>Export PDF Report</span>
                    </button>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', display: 'block', textTransform: 'uppercase', fontWeight: 700 }}>Telemetry Engine</span>
                      <span style={{ fontSize: '0.88rem', color: '#fff', fontWeight: 600 }}>
                        {scanResult.reputation_details?.service || 'Google Safe Browsing'}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'block', marginTop: '2px' }}>
                        {scanResult.created_at ? new Date(scanResult.created_at * 1000).toLocaleTimeString() : ''}
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: `1px solid ${theme.border}44`, fontSize: '0.9rem', color: '#e2e8f0', lineHeight: 1.5 }}>
                  {scanResult.verdict_explanation}
                </div>
              </div>

              {/* Heuristics & Findings List */}
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff', marginBottom: '14px' }}>
                  Evidence-Based Heuristic Markers ({scanResult.heuristics?.length || 0})
                </h3>
                {scanResult.heuristics && scanResult.heuristics.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {scanResult.heuristics.map((h, i) => (
                      <div key={i} style={{
                        padding: '14px 18px',
                        backgroundColor: 'rgba(16, 23, 41, 0.75)',
                        borderRadius: '10px',
                        border: '1px solid var(--border-color)',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '12px'
                      }}>
                        <AlertTriangle size={18} style={{ color: h.severity === 'CRITICAL' || h.severity === 'HIGH' ? 'var(--accent-rose)' : h.severity === 'WARNING' ? 'var(--accent-amber)' : 'var(--accent-cyan)', flexShrink: 0, marginTop: '2px' }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                            <span style={{ fontWeight: 700, color: '#fff', fontSize: '0.9rem' }}>{h.title}</span>
                            <span style={{
                              fontSize: '0.68rem',
                              fontWeight: 800,
                              padding: '2px 8px',
                              borderRadius: '6px',
                              backgroundColor: h.severity === 'CRITICAL' || h.severity === 'HIGH' ? 'rgba(239, 68, 68, 0.25)' : 'rgba(245, 158, 11, 0.25)',
                              color: h.severity === 'CRITICAL' || h.severity === 'HIGH' ? '#fca5a5' : '#fde68a',
                              border: `1px solid ${h.severity === 'CRITICAL' || h.severity === 'HIGH' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(245, 158, 11, 0.4)'}`
                            }}>
                              {h.severity}
                            </span>
                          </div>
                          <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', marginTop: '4px', lineHeight: 1.45 }}>{h.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: '16px', backgroundColor: 'rgba(16, 23, 41, 0.6)', borderRadius: '10px', color: 'var(--text-muted)', fontSize: '0.86rem', border: '1px solid var(--border-color)' }}>
                    No brand spoofing, deceptive subdomains, numerical IP hosts, or abnormal ports detected.
                  </div>
                )}
              </div>

              {/* Technical Probe & Redirection */}
              <div style={{
                padding: '20px',
                backgroundColor: 'rgba(16, 23, 41, 0.8)',
                borderRadius: '12px',
                border: '1px solid var(--border-color)'
              }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#fff', marginBottom: '14px' }}>
                  Technical Probing & Redirection Telemetry
                </h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                  <div style={{ padding: '12px', backgroundColor: 'rgba(11, 16, 27, 0.6)', borderRadius: '8px' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', display: 'block', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px' }}>HTTP Status</span>
                    <span className="font-mono" style={{ fontWeight: 800, color: '#fff' }}>
                      {scanResult.http_status ? `HTTP ${scanResult.http_status}` : (scanResult.error || 'No Response')}
                    </span>
                  </div>
                  <div style={{ padding: '12px', backgroundColor: 'rgba(11, 16, 27, 0.6)', borderRadius: '8px' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', display: 'block', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px' }}>Availability Verdict</span>
                    <StatusBadge status={scanResult.availability_status} size="sm" />
                  </div>
                  <div style={{ padding: '12px', backgroundColor: 'rgba(11, 16, 27, 0.6)', borderRadius: '8px' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', display: 'block', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px' }}>Latency</span>
                    <span className="font-mono" style={{ color: 'var(--accent-cyan)', fontWeight: 800 }}>
                      {scanResult.response_time_ms ? `${scanResult.response_time_ms} ms` : 'N/A'}
                    </span>
                  </div>
                  <div style={{ padding: '12px', backgroundColor: 'rgba(11, 16, 27, 0.6)', borderRadius: '8px' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', display: 'block', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px' }}>Final Destination</span>
                    <span className="font-mono" style={{ fontSize: '0.8rem', color: '#fff', wordBreak: 'break-all' }}>
                      {scanResult.final_url || scanResult.submitted_url}
                    </span>
                  </div>
                  <div style={{ padding: '12px', backgroundColor: 'rgba(11, 16, 27, 0.6)', borderRadius: '8px' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', display: 'block', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px' }}>Domain Age (WHOIS)</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Calendar size={14} style={{ color: 'var(--accent-purple)' }} />
                      <span style={{
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        color: scanResult.whois?.is_newly_registered ? 'var(--accent-rose)' : '#fff'
                      }}>
                        {scanResult.whois?.age_formatted || 'Established'}
                      </span>
                    </div>
                    {scanResult.whois?.registrar && (
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', display: 'block', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={scanResult.whois.registrar}>
                        Reg: {scanResult.whois.registrar}
                      </span>
                    )}
                  </div>
                </div>

                {scanResult.redirect_chain && scanResult.redirect_chain.length > 0 && (
                  <div style={{ marginTop: '12px', paddingTop: '14px', borderTop: '1px solid var(--border-color)' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                      Redirection Sequence Hops:
                    </span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {scanResult.redirect_chain.map((hop, index) => (
                        <div key={index} style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          fontSize: '0.82rem',
                          fontFamily: 'monospace',
                          padding: '8px 12px',
                          backgroundColor: 'rgba(11, 16, 27, 0.8)',
                          borderRadius: '8px'
                        }}>
                          <span style={{ color: 'var(--accent-cyan)', fontWeight: 700 }}>Hop #{hop.hop}</span>
                          <span style={{ color: 'var(--text-muted)' }}>{hop.from_url}</span>
                          <span style={{ color: 'var(--accent-amber)', fontWeight: 700 }}>({hop.status_code})</span>
                          <ArrowRight size={13} style={{ color: 'var(--accent-cyan)' }} />
                          <span style={{ color: '#fff' }}>{hop.to_url}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
