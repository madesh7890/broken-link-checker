import React, { useState, useEffect, useRef } from 'react';
import { 
  QrCode, 
  Camera, 
  Upload, 
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle, 
  ExternalLink, 
  RotateCw, 
  FileDown, 
  Globe, 
  CheckCircle, 
  Zap, 
  Link as LinkIcon 
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';
import { generatePdfReport } from '../services/pdfReportGenerator';

export default function QrScanner() {
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' or 'camera'
  const [decodedText, setDecodedText] = useState('');
  const [scanResult, setScanResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const qrReaderRef = useRef(null);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const stopCamera = async () => {
    if (qrReaderRef.current) {
      try {
        await qrReaderRef.current.stop();
        qrReaderRef.current.clear();
      } catch (e) {
        // ignore stop error
      }
      qrReaderRef.current = null;
      setCameraActive(false);
    }
  };

  const handleStartCamera = async () => {
    setError('');
    setDecodedText('');
    setScanResult(null);
    try {
      const html5QrCode = new Html5Qrcode('qr-reader-container');
      qrReaderRef.current = html5QrCode;
      setCameraActive(true);

      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        (decodedText) => {
          stopCamera();
          handleScannedData(decodedText);
        },
        () => {
          // ignore frame decode failures
        }
      );
    } catch (err) {
      setError('Unable to access camera. Please allow camera permissions or upload an image file instead.');
      setCameraActive(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    setDecodedText('');
    setScanResult(null);
    setLoading(true);

    try {
      const html5QrCode = new Html5Qrcode('qr-hidden-container');
      const text = await html5QrCode.scanFile(file, true);
      html5QrCode.clear();
      handleScannedData(text);
    } catch (err) {
      setError('No valid QR code detected in this image. Please try a clearer picture.');
      setLoading(false);
    }
  };

  const handleScannedData = async (text) => {
    const trimmed = (text || '').trim();
    setDecodedText(trimmed);
    setError('');

    // Check if decoded text is a URL
    const isUrl = trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.includes('.');

    if (!isUrl) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const targetUrl = trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;
      const res = await api.post('/links/check-single', { url: targetUrl });
      setScanResult(res.data.scan);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to inspect decoded QR link.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span className="tech-tag" style={{ color: 'var(--accent-purple)', borderColor: 'rgba(168, 85, 247, 0.3)' }}>
              <QrCode size={13} />
              <span>Anti-Quishing Defense</span>
            </span>
            <span className="tech-tag" style={{ color: 'var(--accent-cyan)', borderColor: 'rgba(6, 182, 212, 0.3)' }}>
              <Zap size={13} />
              <span>Zero-Click Inspection</span>
            </span>
          </div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', margin: 0 }}>
            QR Code Security Scanner
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
            Scan physical or digital QR codes to safely inspect and neutralize hidden phishing links without opening them.
          </p>
        </div>

        {/* Tab switch */}
        <div style={{
          display: 'flex',
          padding: '4px',
          background: 'rgba(16, 23, 41, 0.8)',
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
          gap: '6px'
        }}>
          <button
            onClick={() => { setActiveTab('upload'); stopCamera(); }}
            className={`btn ${activeTab === 'upload' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '8px 16px', fontSize: '0.85rem', borderRadius: '8px' }}
          >
            <Upload size={16} />
            <span>Upload Image</span>
          </button>
          <button
            onClick={() => { setActiveTab('camera'); }}
            className={`btn ${activeTab === 'camera' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '8px 16px', fontSize: '0.85rem', borderRadius: '8px' }}
          >
            <Camera size={16} />
            <span>Live Camera</span>
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

      {/* Main Scanner Box */}
      <div className="glass-card" style={{ padding: '30px', textAlign: 'center' }}>
        
        {activeTab === 'upload' && (
          <div style={{
            border: '2px dashed rgba(6, 182, 212, 0.35)',
            borderRadius: '14px',
            padding: '40px 20px',
            backgroundColor: 'rgba(6, 182, 212, 0.03)',
            cursor: 'pointer',
            position: 'relative'
          }}>
            <input 
              type="file" 
              accept="image/*"
              onChange={handleFileUpload}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                opacity: 0,
                cursor: 'pointer'
              }}
            />
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'rgba(6, 182, 212, 0.15)',
              color: 'var(--accent-cyan)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px'
            }}>
              <QrCode size={32} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff', margin: '0 0 8px 0' }}>
              Upload QR Code Image
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', maxWidth: '420px', margin: '0 auto' }}>
              Drag and drop any screenshot, photo, or invoice QR code here (PNG, JPG, WEBP).
            </p>
          </div>
        )}

        {activeTab === 'camera' && (
          <div>
            <div 
              id="qr-reader-container" 
              style={{ 
                width: '100%', 
                maxWidth: '450px', 
                margin: '0 auto', 
                borderRadius: '12px', 
                overflow: 'hidden',
                border: '1px solid var(--border-color)'
              }}
            />
            <div style={{ marginTop: '18px' }}>
              {!cameraActive ? (
                <button 
                  onClick={handleStartCamera} 
                  className="btn btn-primary"
                  style={{ padding: '10px 24px', fontSize: '0.9rem' }}
                >
                  <Camera size={16} />
                  <span>Activate Camera Scanner</span>
                </button>
              ) : (
                <button 
                  onClick={stopCamera} 
                  className="btn btn-danger"
                  style={{ padding: '10px 24px', fontSize: '0.9rem' }}
                >
                  <span>Stop Camera</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Hidden container for file scan */}
        <div id="qr-hidden-container" style={{ display: 'none' }} />

        {loading && (
          <div style={{ marginTop: '24px', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <RotateCw size={18} className="animate-spin" />
            <span>Decoding QR and executing multi-protocol security audit...</span>
          </div>
        )}
      </div>

      {/* Decoded Output & Security Inspection Result */}
      {decodedText && (
        <div className="glass-card animate-slide-up" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="tech-tag" style={{ color: 'var(--accent-cyan)', borderColor: 'rgba(6, 182, 212, 0.3)' }}>
                <LinkIcon size={12} />
                <span>Extracted QR Payload</span>
              </span>
            </div>

            {scanResult && (
              <button
                onClick={() => generatePdfReport(scanResult, 'url')}
                className="btn btn-secondary"
                style={{
                  padding: '7px 14px',
                  fontSize: '0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: 'var(--accent-cyan)',
                  borderColor: 'rgba(6, 182, 212, 0.4)'
                }}
              >
                <FileDown size={14} />
                <span>Export PDF Audit Report</span>
              </button>
            )}
          </div>

          <div style={{
            padding: '14px 18px',
            backgroundColor: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid var(--border-color)',
            borderRadius: '10px',
            fontFamily: 'monospace',
            color: '#fff',
            fontSize: '0.92rem',
            wordBreak: 'break-all',
            marginBottom: '20px'
          }}>
            {decodedText}
          </div>

          {/* If URL Inspection Finished, Show Forensic Card */}
          {scanResult && (
            <div>
              {/* Grand Verdict Banner */}
              {(() => {
                const verdict = scanResult.security_verdict || 'SAFE';
                const isSafe = verdict === 'SAFE';
                const isBroken = verdict === 'BROKEN';
                const isUnsafe = verdict === 'UNSAFE';

                const bannerBg = isSafe ? 'rgba(16, 185, 129, 0.12)' : isBroken ? 'rgba(239, 68, 68, 0.12)' : isUnsafe ? 'rgba(225, 29, 72, 0.18)' : 'rgba(245, 158, 11, 0.12)';
                const bannerBorder = isSafe ? '#10b981' : isBroken ? '#ef4444' : isUnsafe ? '#e11d48' : '#f59e0b';

                return (
                  <div style={{
                    padding: '20px',
                    borderRadius: '12px',
                    backgroundColor: bannerBg,
                    border: `1px solid ${bannerBorder}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '14px',
                    marginBottom: '20px'
                  }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                        <StatusBadge status={verdict} size="md" />
                        <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff' }}>
                          {isSafe ? 'SAFE QR DESTINATION' : isBroken ? 'BROKEN / DEAD QR LINK' : isUnsafe ? 'DANGEROUS MALICIOUS QR LINK' : 'ACCESS RESTRICTED'}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>
                        {scanResult.verdict_reason || 'Neutralized zero-click inspection complete.'}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Metrics Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                <div style={{ padding: '14px', backgroundColor: 'rgba(16, 23, 41, 0.8)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                    HTTP Status
                  </span>
                  <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#fff', fontSize: '1rem' }}>
                    {scanResult.http_status ? `HTTP ${scanResult.http_status}` : 'N/A'}
                  </span>
                </div>

                <div style={{ padding: '14px', backgroundColor: 'rgba(16, 23, 41, 0.8)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                    Google Safe Browsing
                  </span>
                  <StatusBadge status={scanResult.reputation_status} size="sm" />
                </div>

                <div style={{ padding: '14px', backgroundColor: 'rgba(16, 23, 41, 0.8)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                    Domain Age (WHOIS)
                  </span>
                  <span style={{ fontWeight: 700, color: 'var(--accent-cyan)', fontSize: '0.85rem' }}>
                    {scanResult.whois?.age_formatted || 'Established Domain'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
