import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { 
  FileCode, 
  Link2, 
  ExternalLink, 
  CheckCircle, 
  RotateCw, 
  ShieldAlert, 
  ShieldCheck, 
  Info,
  Search,
  ArrowLeft
} from 'lucide-react';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';

export default function ApkEmbeddedUrls() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const scanId = id || searchParams.get('scanId');

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [filterText, setFilterText] = useState('');
  const [checkingUrlId, setCheckingUrlId] = useState(null);

  const fetchEmbeddedUrls = async (targetId) => {
    if (!targetId) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/apk/embedded-urls/${targetId}`);
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load embedded URLs for this APK scan.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (scanId) {
      fetchEmbeddedUrls(scanId);
    }
  }, [scanId]);

  const handleVerifyUrl = async (urlId) => {
    setCheckingUrlId(urlId);
    try {
      const res = await api.post(`/apk/embedded-urls/${scanId}/check`, { url_id: urlId });
      // Update local state with the verified results
      setData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          urls: prev.urls.map(u => u._id === urlId ? res.data.url_data : u)
        };
      });
    } catch (err) {
      alert(err.response?.data?.message || 'Verification failed.');
    } finally {
      setCheckingUrlId(null);
    }
  };

  const filteredUrls = (data?.urls || []).filter(item => 
    item.url.toLowerCase().includes(filterText.toLowerCase()) ||
    (item.source_file && item.source_file.toLowerCase().includes(filterText.toLowerCase()))
  );

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
          APK Embedded URL Report
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '2px' }}>
          Extracted web endpoints, telemetry endpoints, and resource URLs discovered in compiled APK archives.
        </p>
      </div>

      {/* Mandatory Disclaimer Box (Section 8) */}
      <div style={{
        padding: '16px 20px',
        backgroundColor: 'rgba(6, 182, 212, 0.08)',
        border: '1px solid rgba(6, 182, 212, 0.25)',
        borderRadius: '10px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        fontSize: '0.84rem',
        color: '#e0f2fe'
      }}>
        <Info size={22} style={{ color: 'var(--accent-cyan)', flexShrink: 0, marginTop: '2px' }} />
        <div>
          <strong>Static Extraction Transparency:</strong> An embedded URL being present does not automatically indicate malicious behavior (many are legitimate API routes, documentation links, or third-party SDK endpoints). Some URLs may remain undiscovered due to code obfuscation, runtime reflection, encrypted assets, or dynamic assembly.
        </div>
      </div>

      {error && (
        <div style={{
          padding: '14px',
          backgroundColor: 'rgba(239, 68, 68, 0.12)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '8px',
          color: '#fca5a5',
          fontSize: '0.9rem'
        }}>
          {error}
        </div>
      )}

      {/* Details Card */}
      <div className="glass-card" style={{ padding: '24px' }}>
        {!scanId ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            <FileCode size={36} style={{ margin: '0 auto 12px auto', opacity: 0.5 }} />
            <h3 style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 700 }}>No APK Scan Selected</h3>
            <p style={{ fontSize: '0.85rem', marginTop: '6px' }}>
              Please select an APK scan from your scan history or perform an APK upload scan first.
            </p>
            <div style={{ marginTop: '16px' }}>
              <Link to="/apk-scanner" className="btn btn-primary" style={{ padding: '8px 18px', fontSize: '0.85rem' }}>
                Go to APK Scanner
              </Link>
            </div>
          </div>
        ) : loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            <RotateCw size={24} className="animate-spin" style={{ margin: '0 auto 8px auto' }} />
            <p>Loading discoverable embedded URLs...</p>
          </div>
        ) : (
          <div>
            {/* Metadata Bar */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
              paddingBottom: '18px',
              borderBottom: '1px solid var(--border-color)',
              marginBottom: '20px'
            }}>
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>
                  Target APK Package
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>{data?.filename}</h3>
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    backgroundColor: 'rgba(6, 182, 212, 0.15)',
                    color: 'var(--accent-cyan)'
                  }}>
                    {data?.total_urls || 0} Discoverable URLs
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <div className="input-group" style={{ margin: 0 }}>
                  <input
                    type="text"
                    className="input-control font-mono"
                    placeholder="Search extracted URLs..."
                    style={{ padding: '6px 12px', fontSize: '0.82rem', width: '220px' }}
                    value={filterText}
                    onChange={(e) => setFilterText(e.target.value)}
                  />
                </div>
                <Link to="/apk-scanner" className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.82rem' }}>
                  <ArrowLeft size={13} />
                  <span>Back to Scanner</span>
                </Link>
              </div>
            </div>

            {/* URLs Table */}
            {filteredUrls.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                No discoverable URLs found matching your filter criteria.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-dim)', fontSize: '0.75rem', textTransform: 'uppercase', textAlign: 'left' }}>
                      <th style={{ padding: '10px' }}>Discovered URL</th>
                      <th style={{ padding: '10px' }}>Source File</th>
                      <th style={{ padding: '10px' }}>Availability</th>
                      <th style={{ padding: '10px' }}>Reputation</th>
                      <th style={{ padding: '10px', textAlign: 'right' }}>Safe Verification</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUrls.map((item) => (
                      <tr key={item._id} style={{ borderBottom: '1px solid rgba(35, 44, 69, 0.5)' }}>
                        <td style={{ padding: '12px 10px', maxWidth: '360px', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                          <span style={{ color: '#fff', fontWeight: 500 }}>{item.url}</span>
                        </td>
                        <td style={{ padding: '12px 10px', fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--accent-purple)' }}>
                          {item.source_file || 'Binary / Unknown'}
                        </td>
                        <td style={{ padding: '12px 10px' }}>
                          <StatusBadge status={item.availability_status} size="sm" />
                          {item.http_status && (
                            <span style={{ marginLeft: '6px', fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              ({item.http_status})
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '12px 10px' }}>
                          <StatusBadge status={item.reputation_status} size="sm" />
                        </td>
                        <td style={{ padding: '12px 10px', textAlign: 'right' }}>
                          <button
                            onClick={() => handleVerifyUrl(item._id)}
                            disabled={checkingUrlId === item._id}
                            className="btn btn-secondary"
                            style={{ padding: '5px 10px', fontSize: '0.78rem' }}
                            title="Verify destination status with SSRF protection"
                          >
                            {checkingUrlId === item._id ? (
                              <RotateCw size={13} className="animate-spin" />
                            ) : (
                              <CheckCircle size={13} />
                            )}
                            <span>{checkingUrlId === item._id ? 'Checking...' : 'Verify Live'}</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
