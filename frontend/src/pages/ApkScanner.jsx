import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Smartphone, 
  UploadCloud, 
  FileCheck, 
  AlertTriangle, 
  ShieldAlert, 
  ShieldCheck, 
  HelpCircle, 
  RotateCw, 
  Link2, 
  Info,
  CheckCircle2,
  ExternalLink,
  Copy,
  Check,
  Shield,
  Layers,
  FileCode,
  AlertOctagon,
  Activity,
  Wifi,
  Bug,
  Radio,
  Eye
} from 'lucide-react';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';

const MAX_APK_MB = 50;
const CHUNK_SIZE = 2.5 * 1024 * 1024; // 2.5 MB chunks safe for cloud edge routers (Vercel max ~4.5MB)

const makeUploadId = () =>
  Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

async function postWithRetry(url, data, config, tries = 3) {
  for (let attempt = 1; ; attempt++) {
    try {
      return await api.post(url, data, config);
    } catch (err) {
      const status = err.response?.status;
      if (attempt >= tries || (status && status < 500 && status !== 429)) throw err;
      await new Promise((r) => setTimeout(r, 800 * attempt));
    }
  }
}

export default function ApkScanner() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [progress, setProgress] = useState('');
  const [uploadPercent, setUploadPercent] = useState(0);
  const [copiedSha, setCopiedSha] = useState(false);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleCopySha = (sha) => {
    navigator.clipboard.writeText(sha);
    setCopiedSha(true);
    setTimeout(() => setCopiedSha(false), 1600);
  };

  const handleUploadAndAnalyze = async (e) => {
    e.preventDefault();
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.apk')) {
      setError('Selected file is not an Android APK package (.apk).');
      return;
    }

    if (file.size > MAX_APK_MB * 1024 * 1024) {
      setError(`APK is ${(file.size / (1024 * 1024)).toFixed(1)} MB. Maximum allowed size is ${MAX_APK_MB} MB.`);
      return;
    }

    setError('');
    setLoading(true);
    setScanResult(null);
    setUploadPercent(0);

    try {
      let scan;
      if (file.size <= CHUNK_SIZE) {
        setProgress('Uploading APK...');
        const formData = new FormData();
        formData.append('file', file);
        const res = await api.post('/apk/scan', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 90000,
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const pct = Math.round((progressEvent.loaded * 85) / progressEvent.total);
              setUploadPercent(pct);
              setProgress(`Uploading package (${pct}%)...`);
            }
          }
        });
        setUploadPercent(100);
        scan = res.data.scan;
      } else {
        const uploadId = makeUploadId();
        const total = Math.ceil(file.size / CHUNK_SIZE);
        for (let i = 0; i < total; i++) {
          const chunkPct = Math.round(((i + 1) / total) * 85);
          setUploadPercent(chunkPct);
          setProgress(`Streaming chunk ${i + 1} of ${total} (${chunkPct}%)...`);
          const fd = new FormData();
          fd.append('upload_id', uploadId);
          fd.append('index', String(i));
          fd.append('total', String(total));
          fd.append('chunk', file.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE), 'chunk.bin');
          await postWithRetry('/apk/upload-chunk', fd, {
            headers: { 'Content-Type': 'multipart/form-data' },
            timeout: 60000
          });
        }
        setUploadPercent(95);
        setProgress('Reassembling binary & executing static audit...');
        const res = await api.post(
          '/apk/scan-chunked',
          { upload_id: uploadId, total, filename: file.name },
          { timeout: 120000 }
        );
        setUploadPercent(100);
        scan = res.data.scan;
      }
      setScanResult(scan);
    } catch (err) {
      setError(err.response?.data?.message || 'Error executing APK static analysis.');
    } finally {
      setLoading(false);
      setProgress('');
      setUploadPercent(0);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <span className="tech-tag" style={{ color: 'var(--accent-purple)', borderColor: 'rgba(168, 85, 247, 0.3)' }}>
            <FileCode size={13} />
            <span>Static Binary Inspector</span>
          </span>
          <span className="tech-tag" style={{ color: 'var(--accent-emerald)', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
            <ShieldCheck size={13} />
            <span>Non-Execution Sandbox</span>
          </span>
        </div>
        <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', margin: 0 }}>
          APK Malware & Static Binary Analysis
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
          Inspect Android application binaries, calculate SHA-256 checksums, analyze declared permission surfaces, and discover hidden embedded URLs.
        </p>
      </div>

      {/* Safety Policy Box */}
      <div style={{
        padding: '16px 20px',
        backgroundColor: 'rgba(168, 85, 247, 0.08)',
        border: '1px solid rgba(168, 85, 247, 0.25)',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        fontSize: '0.86rem',
        color: '#ede9fe'
      }}>
        <Info size={20} style={{ color: 'var(--accent-purple)', flexShrink: 0, marginTop: '2px' }} />
        <div>
          <strong style={{ color: '#fff' }}>Strict Non-Execution Policy:</strong> Uploaded APK packages are never launched or executed on the host server. Packages are statically decoded in isolated memory (Manifest, DEX bytecode strings, XML resources), indexed for security indicators, and purged immediately.
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

      {/* Upload Box */}
      <div className="glass-card" style={{ padding: '28px' }}>
        <form onSubmit={handleUploadAndAnalyze}>
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            style={{
              border: `2px dashed ${dragActive ? 'var(--accent-cyan)' : 'rgba(168, 85, 247, 0.35)'}`,
              borderRadius: '14px',
              padding: '44px 20px',
              textAlign: 'center',
              backgroundColor: dragActive ? 'rgba(6, 182, 212, 0.08)' : 'rgba(16, 23, 41, 0.6)',
              cursor: 'pointer',
              transition: 'all 0.25s ease',
              marginBottom: '20px',
              boxShadow: dragActive ? '0 0 24px rgba(6, 182, 212, 0.2)' : 'none'
            }}
            onClick={() => document.getElementById('apk-file-input').click()}
          >
            <input
              id="apk-file-input"
              type="file"
              accept=".apk"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
            <div style={{
              width: '62px',
              height: '62px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.25), rgba(99, 102, 241, 0.25))',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-purple)',
              marginBottom: '14px',
              border: '1px solid rgba(168, 85, 247, 0.4)',
              boxShadow: '0 0 20px rgba(168, 85, 247, 0.2)'
            }}>
              <UploadCloud size={30} />
            </div>

            {file ? (
              <div>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff' }}>{file.name}</h4>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  {(file.size / (1024 * 1024)).toFixed(2)} MB &bull; Package verified ready for static analysis
                </p>
                <span style={{ fontSize: '0.78rem', color: 'var(--accent-cyan)', marginTop: '8px', display: 'inline-block', fontWeight: 600 }}>
                  Click or drag another file to replace
                </span>
              </div>
            ) : (
              <div>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>
                  Drag & Drop Android APK File Here
                </h4>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  or click to browse your system (Max file limit: {MAX_APK_MB} MB)
                </p>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
              Supports APK architectures: ARM64-v8a, ARMeabi-v7a, x86, x86_64
            </span>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!file || loading}
              style={{
                padding: '12px 28px',
                background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #06b6d4 100%)',
                boxShadow: '0 4px 18px rgba(168, 85, 247, 0.35)'
              }}
            >
              {loading ? <RotateCw size={16} className="animate-spin" /> : <Smartphone size={16} />}
              <span>{loading ? (progress || 'Analyzing Binary...') : 'Execute APK Audit'}</span>
            </button>
          </div>
        </form>

        {/* Loading Banner */}
        {loading && (
          <div className="animate-pulse-scan" style={{
            marginTop: '24px',
            padding: '24px',
            backgroundColor: 'rgba(168, 85, 247, 0.08)',
            border: '1px solid rgba(168, 85, 247, 0.3)',
            borderRadius: '14px',
            textAlign: 'center'
          }}>
            <RotateCw size={30} className="animate-spin" style={{ color: 'var(--accent-purple)', margin: '0 auto 12px' }} />
            <div style={{ color: '#fff', fontWeight: 800, fontSize: '1.05rem' }}>
              {progress || 'Static Inspection in Progress...'}
            </div>

            {/* Glowing Linear Progress Bar */}
            <div style={{
              width: '100%',
              maxWidth: '480px',
              margin: '16px auto 12px',
              height: '8px',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              borderRadius: '999px',
              overflow: 'hidden',
              boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.4)'
            }}>
              <div style={{
                height: '100%',
                width: `${uploadPercent > 0 ? uploadPercent : 15}%`,
                background: 'linear-gradient(90deg, #7c3aed 0%, #a855f7 50%, #06b6d4 100%)',
                borderRadius: '999px',
                transition: 'width 0.35s ease',
                boxShadow: '0 0 12px rgba(168, 85, 247, 0.6)'
              }} />
            </div>

            <div style={{ color: 'var(--text-muted)', fontSize: '0.84rem', marginTop: '6px', maxWidth: '520px', margin: '6px auto 0 auto' }}>
              Computing SHA-256 fingerprint, parsing AndroidManifest XML, auditing declared permissions, and harvesting embedded network endpoints.
            </div>
          </div>
        )}

        {/* Scan Results View */}
        {scanResult && (() => {
          const verdict = scanResult.security_verdict || scanResult.overall_status || 'SAFE';
          const theme = (() => {
            if (verdict === 'UNSAFE') {
              return {
                status: 'UNSAFE',
                border: '#ef4444',
                bg: 'rgba(239, 68, 68, 0.18)',
                glow: 'rgba(239, 68, 68, 0.35)',
                label: 'UNSAFE — Known Malware Signature or Critical Risk Surface',
                badgeText: 'MALWARE / THREAT'
              };
            }
            if (verdict === 'POTENTIALLY_RISKY') {
              return {
                status: 'POTENTIALLY_RISKY',
                border: '#f59e0b',
                bg: 'rgba(245, 158, 11, 0.15)',
                glow: 'rgba(245, 158, 11, 0.25)',
                label: 'Potentially Risky — High-risk permission combos or suspicious indicators declared',
                badgeText: 'POTENTIALLY RISKY'
              };
            }
            return {
              status: 'SAFE',
              border: '#10b981',
              bg: 'rgba(16, 185, 129, 0.14)',
              glow: 'rgba(16, 185, 129, 0.3)',
              label: 'Safe — Clean static manifest signature & benign permission surface',
              badgeText: 'SAFE PACKAGE'
            };
          })();

          return (
            <div className="animate-slide-up" style={{ marginTop: '30px', paddingTop: '26px', borderTop: '1px solid var(--border-color)' }}>
              
              {/* Grand Verdict Banner */}
              <div style={{
                padding: '24px 28px',
                backgroundColor: theme.bg,
                border: `1px solid ${theme.border}`,
                borderRadius: '16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '18px',
                marginBottom: '22px',
                boxShadow: `0 8px 30px ${theme.glow}`
              }}>
                <div style={{ flex: '1 1 500px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 800, letterSpacing: '0.08em' }}>
                      PACKAGE VERDICT EVALUATION
                    </span>
                    {scanResult.app_category && (
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '6px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        backgroundColor: 'rgba(6, 182, 212, 0.15)',
                        color: 'var(--accent-cyan)',
                        border: '1px solid rgba(6, 182, 212, 0.3)'
                      }}>
                        App Category: {scanResult.app_category}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    <StatusBadge status={theme.status} text={theme.badgeText} size="md" />
                    <span style={{ fontSize: '1.25rem', color: '#fff', fontWeight: 800 }}>
                      {scanResult.verdict_title || theme.label}
                    </span>
                  </div>

                  {scanResult.verdict_summary && (
                    <div style={{ fontSize: '0.9rem', color: '#cbd5e1', marginTop: '10px', lineHeight: 1.5 }}>
                      {scanResult.verdict_summary}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px' }}>
                  <Link
                    to={`/apk-embedded-urls/${scanResult._id}`}
                    className="btn btn-primary"
                    style={{ padding: '10px 18px', fontSize: '0.86rem' }}
                  >
                    <Link2 size={16} />
                    <span>Embedded URLs ({scanResult.extracted_urls_count || 0})</span>
                  </Link>

                  {/* Threat Score Pill */}
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 14px',
                    borderRadius: '20px',
                    backgroundColor: 'rgba(15, 23, 42, 0.8)',
                    border: `1px solid ${theme.border}`
                  }}>
                    <Activity size={14} style={{ color: theme.border }} />
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Threat Score:</span>
                    <strong style={{ color: '#fff', fontSize: '0.92rem' }}>
                      {scanResult.threat_score ?? 5} / 100
                    </strong>
                  </div>
                </div>
              </div>

              {/* Threat Index Summary Telemetry Cards */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '14px',
                marginBottom: '24px'
              }}>
                <div style={{
                  padding: '16px 20px',
                  backgroundColor: 'rgba(16, 23, 41, 0.75)',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color)'
                }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                    Application Intent Context
                  </span>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff' }}>
                    {scanResult.app_category || 'General Utility'}
                  </div>
                  <span style={{ fontSize: '0.76rem', color: 'var(--accent-cyan)', marginTop: '4px', display: 'block' }}>
                    Context-aware capability evaluation active
                  </span>
                </div>

                <div style={{
                  padding: '16px 20px',
                  backgroundColor: 'rgba(16, 23, 41, 0.75)',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color)'
                }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                    Security Threat Index
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ fontSize: '1.05rem', fontWeight: 800, color: theme.border }}>
                      {scanResult.threat_score ?? 5} / 100
                    </div>
                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: '4px',
                      backgroundColor: theme.bg,
                      color: theme.border
                    }}>
                      {scanResult.threat_level || 'LOW'}
                    </span>
                  </div>
                  <div style={{
                    width: '100%',
                    height: '5px',
                    backgroundColor: 'rgba(255,255,255,0.08)',
                    borderRadius: '4px',
                    marginTop: '8px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${scanResult.threat_score || 5}%`,
                      height: '100%',
                      backgroundColor: theme.border,
                      borderRadius: '4px'
                    }} />
                  </div>
                </div>

                <div style={{
                  padding: '16px 20px',
                  backgroundColor: 'rgba(16, 23, 41, 0.75)',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color)'
                }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                    Threat Vectors Flagged
                  </span>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff' }}>
                    {scanResult.threats_count ?? (scanResult.threats_detected?.length || 0)} Vectors
                  </div>
                  <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                    {scanResult.cleartext_urls_count || 0} cleartext HTTP &bull; {scanResult.ip_urls_count || 0} raw IP
                  </span>
                </div>
              </div>

              {/* Exact Threats Breakdown Matrix */}
              <div style={{ marginBottom: '26px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ShieldAlert size={18} style={{ color: 'var(--accent-purple)' }} />
                    <span>Exact Threat Vectors & Risk Surface Analysis</span>
                  </h3>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                    Itemized heuristic & manifest threat breakdown
                  </span>
                </div>

                {scanResult.threats_detected && scanResult.threats_detected.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {scanResult.threats_detected.map((threat, idx) => {
                      const sevColor = (() => {
                        if (threat.severity === 'CRITICAL') return { text: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.35)' };
                        if (threat.severity === 'HIGH') return { text: '#f97316', bg: 'rgba(249, 115, 22, 0.15)', border: 'rgba(249, 115, 22, 0.35)' };
                        if (threat.severity === 'MEDIUM') return { text: '#eab308', bg: 'rgba(234, 179, 8, 0.15)', border: 'rgba(234, 179, 8, 0.35)' };
                        return { text: '#10b981', bg: 'rgba(16, 185, 129, 0.15)', border: 'rgba(16, 185, 129, 0.35)' };
                      })();

                      const isExpected = threat.status === 'EXPECTED_CAPABILITY';

                      return (
                        <div key={idx} style={{
                          padding: '18px 20px',
                          backgroundColor: isExpected ? 'rgba(16, 23, 41, 0.65)' : 'rgba(16, 23, 41, 0.9)',
                          borderRadius: '12px',
                          border: `1px solid ${isExpected ? 'var(--border-color)' : sevColor.border}`,
                          boxShadow: isExpected ? 'none' : `0 4px 16px ${sevColor.bg}`
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                              <strong style={{ fontSize: '0.96rem', color: '#fff' }}>{threat.title}</strong>
                              <span style={{
                                padding: '2px 8px',
                                borderRadius: '4px',
                                fontSize: '0.68rem',
                                fontWeight: 800,
                                backgroundColor: sevColor.bg,
                                color: sevColor.text,
                                border: `1px solid ${sevColor.border}`
                              }}>
                                {threat.severity}
                              </span>
                              {threat.badge && (
                                <span style={{
                                  padding: '2px 8px',
                                  borderRadius: '4px',
                                  fontSize: '0.68rem',
                                  fontWeight: 700,
                                  backgroundColor: isExpected ? 'rgba(16, 185, 129, 0.12)' : 'rgba(249, 115, 22, 0.12)',
                                  color: isExpected ? 'var(--accent-emerald)' : 'var(--accent-amber)',
                                  border: `1px solid ${isExpected ? 'rgba(16, 185, 129, 0.3)' : 'rgba(249, 115, 22, 0.3)'}`
                                }}>
                                  {threat.badge}
                                </span>
                              )}
                            </div>

                            <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)', fontWeight: 600 }}>
                              {threat.category}
                            </span>
                          </div>

                          <p style={{ fontSize: '0.86rem', color: '#cbd5e1', margin: '6px 0 10px 0', lineHeight: 1.5 }}>
                            {threat.description}
                          </p>

                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: '8px',
                            paddingTop: '8px',
                            borderTop: '1px solid rgba(255,255,255,0.06)',
                            fontSize: '0.78rem'
                          }}>
                            <span style={{ color: 'var(--accent-cyan)' }}>
                              <strong>Indicator:</strong> <code style={{ color: '#e2e8f0', background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: '4px' }}>{threat.indicator}</code>
                            </span>
                            {threat.mitigation && (
                              <span style={{ color: isExpected ? 'var(--accent-emerald)' : 'var(--text-muted)' }}>
                                {threat.mitigation}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{
                    padding: '20px',
                    backgroundColor: 'rgba(16, 185, 129, 0.08)',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                    borderRadius: '12px',
                    color: 'var(--accent-emerald)',
                    fontSize: '0.9rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}>
                    <CheckCircle2 size={20} />
                    <span>No malicious threat vectors or suspicious permission anomalies detected in this package.</span>
                  </div>
                )}
              </div>

              {/* VirusTotal Threat Intelligence Details */}
              {scanResult.reputation_details && scanResult.reputation_details.detected_threat_names && scanResult.reputation_details.detected_threat_names.length > 0 && (
                <div style={{
                  padding: '16px 20px',
                  marginBottom: '22px',
                  backgroundColor: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  borderRadius: '12px',
                  color: '#fee2e2'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <AlertOctagon size={18} style={{ color: '#ef4444' }} />
                    <strong style={{ fontSize: '0.92rem' }}>VirusTotal Threat Engine Detections:</strong>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#fca5a5' }}>
                    {scanResult.reputation_details.reason}
                  </div>
                  <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {scanResult.reputation_details.detected_threat_names.map((name, i) => (
                      <span key={i} style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        backgroundColor: 'rgba(239, 68, 68, 0.25)',
                        border: '1px solid rgba(239, 68, 68, 0.4)',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        color: '#fff'
                      }}>
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Offline Fallback Banner */}
              {scanResult.reputation_status === 'UNKNOWN' && (
                <div style={{
                  padding: '14px 18px',
                  marginBottom: '22px',
                  backgroundColor: 'rgba(245, 158, 11, 0.1)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  borderRadius: '10px',
                  color: '#fef3c7',
                  fontSize: '0.85rem'
                }}>
                  <strong>Offline Reputation Mode:</strong> {scanResult.reputation_details?.reason || "External malware intelligence keys are not configured. Local static threat matrix findings are active."}
                </div>
              )}

              {/* APK Metadata Grid */}
              <div style={{ marginBottom: '26px' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff', marginBottom: '14px' }}>
                  Application Package Manifest Metadata
                </h3>
                <div className="apk-meta-grid" style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '12px'
                }}>
                  <div style={{ padding: '16px', backgroundColor: 'rgba(16, 23, 41, 0.8)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', display: 'block', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px' }}>Application Label</span>
                    <span style={{ fontWeight: 700, color: '#fff', fontSize: '0.95rem' }}>{scanResult.metadata?.app_name || 'N/A'}</span>
                  </div>

                  <div style={{ padding: '16px', backgroundColor: 'rgba(16, 23, 41, 0.8)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', display: 'block', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px' }}>Package Identifier</span>
                    <span className="font-mono" style={{ fontSize: '0.84rem', color: 'var(--accent-cyan)', wordBreak: 'break-all', fontWeight: 600 }}>
                      {scanResult.metadata?.package_name || 'N/A'}
                    </span>
                  </div>

                  <div style={{ padding: '16px', backgroundColor: 'rgba(16, 23, 41, 0.8)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', display: 'block', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px' }}>Version Info</span>
                    <span style={{ color: '#fff', fontWeight: 600 }}>{scanResult.metadata?.version_name || '1.0'} (Build #{scanResult.metadata?.version_code || 1})</span>
                  </div>

                  <div style={{ padding: '16px', backgroundColor: 'rgba(16, 23, 41, 0.8)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', display: 'block', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px' }}>Android SDK Levels</span>
                    <span style={{ color: '#fff', fontWeight: 600 }}>Min SDK: {scanResult.metadata?.min_sdk || '21'} &bull; Target SDK: {scanResult.metadata?.target_sdk || '34'}</span>
                  </div>

                  <div className="apk-meta-full" style={{ padding: '16px', backgroundColor: 'rgba(16, 23, 41, 0.8)', borderRadius: '12px', border: '1px solid var(--border-color)', gridColumn: 'span 2' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>Cryptographic Fingerprint (SHA-256)</span>
                      <button
                        type="button"
                        onClick={() => handleCopySha(scanResult.sha256)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '0.74rem',
                          color: copiedSha ? 'var(--accent-emerald)' : 'var(--accent-cyan)',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        {copiedSha ? <Check size={12} /> : <Copy size={12} />}
                        <span>{copiedSha ? 'Copied' : 'Copy Hash'}</span>
                      </button>
                    </div>
                    <span className="font-mono" style={{ fontSize: '0.82rem', color: '#e2e8f0', wordBreak: 'break-all' }}>
                      {scanResult.sha256}
                    </span>
                  </div>
                </div>
              </div>

              {/* Permission Security Audit */}
              <div style={{ marginBottom: '26px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                    Permission Surface Matrix ({scanResult.permissions?.total_count || 0} Declared)
                  </h3>
                  <span style={{
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    backgroundColor: scanResult.permissions?.risky_count > 0 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                    color: scanResult.permissions?.risky_count > 0 ? 'var(--accent-rose)' : 'var(--accent-emerald)',
                    border: `1px solid ${scanResult.permissions?.risky_count > 0 ? 'rgba(239, 68, 68, 0.35)' : 'rgba(16, 185, 129, 0.35)'}`
                  }}>
                    {scanResult.permissions?.risky_count || 0} Sensitive Capabilities
                  </span>
                </div>

                {scanResult.permissions?.risky && scanResult.permissions.risky.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {scanResult.permissions.risky.map((p, idx) => (
                      <div key={idx} style={{
                        padding: '14px 18px',
                        backgroundColor: 'rgba(16, 23, 41, 0.75)',
                        borderRadius: '10px',
                        border: '1px solid var(--border-color)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '10px'
                      }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontWeight: 800, color: '#fff', fontSize: '0.9rem' }}>{p.title}</span>
                            <span style={{
                              padding: '2px 8px',
                              borderRadius: '6px',
                              fontSize: '0.68rem',
                              fontWeight: 800,
                              backgroundColor: p.severity === 'CRITICAL' ? 'rgba(239, 68, 68, 0.25)' : p.severity === 'HIGH' ? 'rgba(239, 68, 68, 0.18)' : 'rgba(245, 158, 11, 0.18)',
                              color: p.severity === 'CRITICAL' || p.severity === 'HIGH' ? 'var(--accent-rose)' : 'var(--accent-amber)',
                              border: `1px solid ${p.severity === 'CRITICAL' || p.severity === 'HIGH' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(245, 158, 11, 0.4)'}`
                            }}>
                              {p.severity}
                            </span>
                          </div>
                          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '3px' }}>{p.description}</p>
                        </div>
                        <span className="font-mono" style={{ fontSize: '0.78rem', color: 'var(--text-dim)', backgroundColor: 'rgba(0, 0, 0, 0.3)', padding: '4px 8px', borderRadius: '6px' }}>
                          {p.permission}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: '16px', backgroundColor: 'rgba(16, 23, 41, 0.6)', borderRadius: '10px', color: 'var(--text-muted)', fontSize: '0.86rem', border: '1px solid var(--border-color)' }}>
                    No critical or elevated sensitive capabilities declared in AndroidManifest.xml.
                  </div>
                )}
              </div>

              {/* Disclaimer Footer */}
              <div style={{
                padding: '14px 18px',
                backgroundColor: 'rgba(11, 16, 27, 0.85)',
                borderRadius: '10px',
                border: '1px solid var(--border-color)',
                fontSize: '0.78rem',
                color: 'var(--text-dim)',
                lineHeight: 1.5
              }}>
                <strong>Static Analysis Scope:</strong> {scanResult.static_analysis_disclaimer || "Static analysis inspects package manifests and DEX string tables without runtime code execution. Dynamic payload loading at runtime is not evaluated."}
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
