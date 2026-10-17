import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  RotateCw, 
  ShieldCheck, 
  ShieldAlert, 
  ExternalLink, 
  Smartphone, 
  Globe, 
  FileCode,
  Clock,
  Layers,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';

export default function ScanDetails() {
  const { type, id } = useParams();
  const [scan, setScan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      setError('');
      try {
        const endpoint = type === 'apk' ? `/history/apk/${id}` : `/history/url/${id}`;
        const res = await api.get(endpoint);
        setScan(res.data.scan);
      } catch (err) {
        setError(err.response?.data?.message || 'Could not load scan report details.');
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [type, id]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
        <RotateCw size={28} className="animate-spin" style={{ margin: '0 auto 10px auto' }} />
        <p>Loading security audit report...</p>
      </div>
    );
  }

  if (error || !scan) {
    return (
      <div className="glass-card" style={{ padding: '30px', textAlign: 'center' }}>
        <h3 style={{ color: 'var(--accent-rose)', fontSize: '1.2rem', fontWeight: 700 }}>Report Not Found</h3>
        <p style={{ color: 'var(--text-muted)', marginTop: '6px' }}>{error || 'This scan report could not be found or you do not have permission to access it.'}</p>
        <div style={{ marginTop: '20px' }}>
          <Link to="/history" className="btn btn-primary" style={{ padding: '8px 16px' }}>
            Back to Scan History
          </Link>
        </div>
      </div>
    );
  }

  const isApk = type === 'apk';

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link to="/history" className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
            <ArrowLeft size={14} />
            <span>History</span>
          </Link>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff' }}>
              {isApk ? 'Android APK Static Audit Report' : 'HTTP/S Link Security Report'}
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '2px' }}>
              Report ID: {scan._id} &bull; Generated: {new Date(scan.created_at * 1000).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Main Verdict Card */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          paddingBottom: '20px',
          borderBottom: '1px solid var(--border-color)',
          marginBottom: '20px'
        }}>
          <div>
            <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 700 }}>
              Primary Finding & Verdict
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px' }}>
              <StatusBadge status={isApk ? scan.overall_status : (scan.security_status || scan.availability_status)} size="lg" />
              {scan.http_status && (
                <span style={{ padding: '4px 8px', borderRadius: '4px', backgroundColor: 'var(--bg-secondary)', fontWeight: 700, fontFamily: 'monospace' }}>
                  HTTP {scan.http_status}
                </span>
              )}
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', display: 'block' }}>Reputation Engine</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {scan.reputation_details?.service || 'Safe Browsing / Local Fallback'}
            </span>
          </div>
        </div>

        {/* URL Specific Sections */}
        {!isApk && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px', marginBottom: '20px' }}>
              <div style={{ padding: '14px', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', display: 'block' }}>Submitted Target</span>
                <span style={{ fontFamily: 'monospace', fontSize: '0.82rem', color: '#fff', wordBreak: 'break-all' }}>{scan.submitted_url}</span>
              </div>
              <div style={{ padding: '14px', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', display: 'block' }}>Resolved Destination</span>
                <span style={{ fontFamily: 'monospace', fontSize: '0.82rem', color: '#fff', wordBreak: 'break-all' }}>{scan.final_url}</span>
              </div>
              <div style={{ padding: '14px', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', display: 'block' }}>Response Latency</span>
                <span style={{ fontFamily: 'monospace', color: 'var(--accent-cyan)', fontWeight: 700 }}>{scan.response_time_ms} ms</span>
              </div>
              <div style={{ padding: '14px', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', display: 'block' }}>TLS Verification</span>
                <span style={{ fontWeight: 600, color: scan.tls_valid === true ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>
                  {scan.tls_valid === true ? 'Valid Certificate' : scan.tls_valid === false ? 'Validation Failed' : 'N/A'}
                </span>
              </div>
            </div>

            {/* Redirect Hops */}
            <div style={{ padding: '16px', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', marginBottom: '20px' }}>
              <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fff', marginBottom: '10px' }}>
                Redirect Progression ({scan.redirect_chain?.length || 0} Hops)
              </h4>
              {scan.redirect_chain && scan.redirect_chain.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {scan.redirect_chain.map((h, i) => (
                    <div key={i} style={{ fontSize: '0.8rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                      <span style={{ color: 'var(--accent-cyan)' }}>Hop #{h.hop}:</span> {h.from_url} ({h.status_code}) &rarr; {h.to_url}
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Direct request, no intermediate redirects encountered.</p>
              )}
            </div>
          </div>
        )}

        {/* APK Specific Sections */}
        {isApk && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '20px' }}>
              <div style={{ padding: '14px', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', display: 'block' }}>APK Filename</span>
                <span style={{ fontWeight: 600, color: '#fff' }}>{scan.filename}</span>
              </div>
              <div style={{ padding: '14px', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', display: 'block' }}>Package Identifier</span>
                <span style={{ fontFamily: 'monospace', fontSize: '0.82rem', color: 'var(--accent-cyan)' }}>
                  {scan.metadata?.package_name || 'N/A'}
                </span>
              </div>
              <div style={{ padding: '14px', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', display: 'block' }}>Version Name / Code</span>
                <span style={{ color: '#fff' }}>{scan.metadata?.version_name} ({scan.metadata?.version_code})</span>
              </div>
              <div style={{ padding: '14px', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', gridColumn: 'span 2' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', display: 'block' }}>SHA-256 Checksum</span>
                <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#fff', wordBreak: 'break-all' }}>{scan.sha256}</span>
              </div>
            </div>

            {/* Embedded URLs Preview */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px',
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: '8px',
              marginBottom: '20px'
            }}>
              <div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff' }}>Extracted Discoverable URLs</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Discovered {scan.embedded_urls?.length || scan.extracted_urls_count || 0} unique URLs inside bytecode and XML assets.
                </p>
              </div>
              <Link to={`/apk-embedded-urls/${scan._id}`} className="btn btn-primary" style={{ padding: '6px 14px', fontSize: '0.82rem' }}>
                <span>Inspect Embedded URLs</span>
                <ExternalLink size={13} />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
