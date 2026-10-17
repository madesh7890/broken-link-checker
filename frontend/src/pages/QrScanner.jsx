import React, { useState, useEffect, useRef } from 'react';
import {
  QrCode,
  Camera,
  Upload,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  RotateCw,
  FileDown,
  Globe,
  Zap,
  Link as LinkIcon,
  CreditCard,
  Wifi,
  User,
  Mail,
  Phone,
  MapPin,
  Tag,
  Hash,
  Lock,
  Info,
  ExternalLink,
  CheckCircle,
  Calendar
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';
import { generatePdfReport } from '../services/pdfReportGenerator';

// ───────────────────────────────────────────────
// QR Payload Parser — detects type & extracts fields
// ───────────────────────────────────────────────
function parseQrPayload(text) {
  const t = (text || '').trim();

  // 1. UPI Payment
  if (t.toLowerCase().startsWith('upi://pay')) {
    const params = {};
    try {
      const qs = t.split('?')[1] || '';
      qs.split('&').forEach(p => {
        const [k, v] = p.split('=');
        if (k && v !== undefined) params[k] = decodeURIComponent(v.replace(/\+/g, ' '));
      });
    } catch (_) {}

    // Merchant Category Codes
    const MCC_MAP = {
      '5411': 'Grocery / Supermarket', '5812': 'Restaurant / Food', '5999': 'Retail Shop',
      '4121': 'Taxi / Transport', '5912': 'Pharmacy / Medical', '7011': 'Hotel / Lodging',
      '5941': 'Sporting Goods', '5691': 'Clothing Store', '5045': 'Computers / Electronics',
      '7372': 'Software / Tech Services', '5732': 'Electronics Store', '6011': 'ATM / Banking',
    };
    const mcLabel = params.mc ? (MCC_MAP[params.mc] || `Merchant Code ${params.mc}`) : null;

    return {
      type: 'UPI_PAYMENT',
      icon: CreditCard,
      color: '#10b981',
      label: 'UPI Payment QR Code',
      fields: [
        { icon: User, label: 'Merchant Name', value: params.pn || 'Unknown' },
        { icon: Hash, label: 'UPI ID (VPA)', value: params.pa || '—' },
        { icon: Tag, label: 'Merchant Category', value: mcLabel || 'General / Retail' },
        { icon: CreditCard, label: 'Amount Pre-set', value: params.am ? `₹${params.am}` : 'No fixed amount — You choose' },
        { icon: Info, label: 'Currency', value: params.cu || 'INR' },
        { icon: Info, label: 'Transaction Note', value: params.tn || params.tr || 'Not specified' },
        { icon: CheckCircle, label: 'Payment Mode', value: params.mode === '01' ? 'QR Scan (Static)' : params.mode === '02' ? 'Intent (App-to-App)' : 'Standard' },
      ],
      riskNote: params.am
        ? `⚠️ This QR has a fixed payment amount of ₹${params.am} preset. Verify the merchant before scanning.`
        : '✅ No fixed amount is set — you control how much you pay. Verify merchant UPI ID before paying.'
    };
  }

  // 2. WiFi Credentials
  if (t.toUpperCase().startsWith('WIFI:')) {
    const wifiParams = {};
    const parts = t.substring(5).replace(/;;$/, '').split(';');
    parts.forEach(p => {
      const idx = p.indexOf(':');
      if (idx !== -1) {
        const k = p.substring(0, idx).toUpperCase();
        wifiParams[k] = p.substring(idx + 1);
      }
    });
    return {
      type: 'WIFI',
      icon: Wifi,
      color: '#38bdf8',
      label: 'Wi-Fi Network Configuration',
      fields: [
        { icon: Wifi, label: 'Network Name (SSID)', value: wifiParams['S'] || '—' },
        { icon: Lock, label: 'Security Type', value: wifiParams['T'] || 'WPA/WPA2' },
        { icon: Lock, label: 'Password', value: wifiParams['P'] ? '••••••••' : 'Open Network (No Password)' },
        { icon: Info, label: 'Hidden Network', value: wifiParams['H'] === 'true' ? 'Yes (Hidden SSID)' : 'No (Visible)' },
      ],
      riskNote: wifiParams['T']?.toUpperCase() === 'nopass'
        ? '⚠️ This is an open WiFi network with NO password. Avoid transmitting sensitive data.'
        : `✅ Protected network (${wifiParams['T'] || 'WPA'}). Only connect if you trust this network.`
    };
  }

  // 3. vCard (Contact)
  if (t.toUpperCase().startsWith('BEGIN:VCARD')) {
    const lines = t.split(/\r?\n/);
    const get = (prefix) => {
      const line = lines.find(l => l.toUpperCase().startsWith(prefix.toUpperCase()));
      return line ? line.split(':').slice(1).join(':').trim() : null;
    };
    const name = get('FN') || get('N')?.replace(/;/g, ' ').trim() || 'Unknown';
    return {
      type: 'CONTACT',
      icon: User,
      color: '#a855f7',
      label: 'Contact Card (vCard)',
      fields: [
        { icon: User, label: 'Full Name', value: name },
        { icon: Phone, label: 'Phone Number', value: get('TEL') || get('TEL;TYPE=CELL') || '—' },
        { icon: Mail, label: 'Email Address', value: get('EMAIL') || '—' },
        { icon: MapPin, label: 'Organization', value: get('ORG') || '—' },
        { icon: Tag, label: 'Job Title', value: get('TITLE') || '—' },
        { icon: Globe, label: 'Website', value: get('URL') || '—' },
        { icon: MapPin, label: 'Address', value: get('ADR')?.replace(/;+/g, ', ').replace(/^, /, '') || '—' },
      ],
      riskNote: '✅ This QR Code contains a contact card. Review details before saving to your phonebook.'
    };
  }

  // 4. Email (mailto:)
  if (t.toLowerCase().startsWith('mailto:')) {
    const raw = t.substring(7);
    const [to, rest] = raw.split('?');
    const mailParams = {};
    (rest || '').split('&').forEach(p => {
      const [k, v] = p.split('=');
      if (k && v) mailParams[k.toLowerCase()] = decodeURIComponent(v);
    });
    return {
      type: 'EMAIL',
      icon: Mail,
      color: '#f59e0b',
      label: 'Email QR Code (mailto)',
      fields: [
        { icon: Mail, label: 'Send To (Recipient)', value: to || '—' },
        { icon: Tag, label: 'Email Subject', value: mailParams.subject || 'Not set' },
        { icon: Info, label: 'Email Body (Draft)', value: mailParams.body || 'Empty' },
      ],
      riskNote: '⚠️ Verify the email address before sending. Scammers use email QR codes to collect replies from victims.'
    };
  }

  // 5. Phone Number (tel:)
  if (t.toLowerCase().startsWith('tel:')) {
    const number = t.substring(4);
    return {
      type: 'PHONE',
      icon: Phone,
      color: '#10b981',
      label: 'Phone Number QR Code',
      fields: [
        { icon: Phone, label: 'Phone Number', value: number || '—' },
      ],
      riskNote: '✅ Calling or messaging unknown numbers from QR codes can incur charges. Verify before calling.'
    };
  }

  // 6. SMS
  if (t.toLowerCase().startsWith('smsto:') || t.toLowerCase().startsWith('sms:')) {
    const raw = t.substring(t.indexOf(':') + 1);
    const [num, msg] = raw.split(':');
    return {
      type: 'SMS',
      icon: Phone,
      color: '#f97316',
      label: 'SMS QR Code',
      fields: [
        { icon: Phone, label: 'Send SMS To', value: num || '—' },
        { icon: Info, label: 'Pre-filled Message', value: msg || 'No message' },
      ],
      riskNote: '⚠️ Sending an SMS to an unknown number can reveal your phone number and incur costs. Be cautious.'
    };
  }

  // 7. Geographic Location
  if (t.toLowerCase().startsWith('geo:')) {
    const coords = t.substring(4).split(',');
    const lat = coords[0] || '—';
    const lng = (coords[1] || '').split('?')[0] || '—';
    return {
      type: 'LOCATION',
      icon: MapPin,
      color: '#ef4444',
      label: 'Geographic Location QR Code',
      fields: [
        { icon: MapPin, label: 'Latitude', value: lat },
        { icon: MapPin, label: 'Longitude', value: lng },
        { icon: Globe, label: 'Open In Maps', value: `https://maps.google.com/?q=${lat},${lng}` },
      ],
      riskNote: '✅ This QR contains a map location. Opening in maps is generally safe.'
    };
  }

  // 8. URL / HTTP link
  if (t.startsWith('http://') || t.startsWith('https://')) {
    let hostname = '';
    try { hostname = new URL(t).hostname; } catch (_) { hostname = t; }
    return {
      type: 'URL',
      icon: Globe,
      color: '#06b6d4',
      label: 'Web URL QR Code',
      fields: [
        { icon: Globe, label: 'Target Domain', value: hostname },
        { icon: LinkIcon, label: 'Full URL', value: t.length > 80 ? t.substring(0, 77) + '...' : t },
        { icon: Lock, label: 'Protocol', value: t.startsWith('https') ? '🔒 HTTPS (Encrypted)' : '⚠️ HTTP (Unencrypted)' },
      ],
      riskNote: t.startsWith('https')
        ? '🔐 Connection is encrypted. Security scan result shown below.'
        : '⚠️ This link uses plain HTTP (no encryption). Sensitive data may be exposed.'
    };
  }

  // 9. Plain text or unknown
  return {
    type: 'TEXT',
    icon: Info,
    color: '#94a3b8',
    label: 'Plain Text / Unknown QR Payload',
    fields: [
      { icon: Info, label: 'Decoded Content', value: t.length > 200 ? t.substring(0, 197) + '...' : t },
    ],
    riskNote: '✅ This QR code contains plain text data with no embedded commands or links.'
  };
}

// ───────────────────────────────────────────────
// Main Component
// ───────────────────────────────────────────────
export default function QrScanner() {
  const [activeTab, setActiveTab] = useState('upload');
  const [decodedText, setDecodedText] = useState('');
  const [parsedInfo, setParsedInfo] = useState(null);
  const [scanResult, setScanResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const qrReaderRef = useRef(null);

  useEffect(() => {
    return () => { stopCamera(); };
  }, []);

  const stopCamera = async () => {
    if (qrReaderRef.current) {
      try {
        await qrReaderRef.current.stop();
        qrReaderRef.current.clear();
      } catch (e) {}
      qrReaderRef.current = null;
      setCameraActive(false);
    }
  };

  const handleStartCamera = async () => {
    setError('');
    setDecodedText('');
    setScanResult(null);
    setParsedInfo(null);
    try {
      const html5QrCode = new Html5Qrcode('qr-reader-container');
      qrReaderRef.current = html5QrCode;
      setCameraActive(true);
      await html5QrCode.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decoded) => { stopCamera(); handleScannedData(decoded); },
        () => {}
      );
    } catch (err) {
      setError('Unable to access camera. Please allow camera permissions or upload a QR code image instead.');
      setCameraActive(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setDecodedText('');
    setScanResult(null);
    setParsedInfo(null);
    setLoading(true);
    try {
      const html5QrCode = new Html5Qrcode('qr-hidden-container');
      const text = await html5QrCode.scanFile(file, true);
      html5QrCode.clear();
      handleScannedData(text);
    } catch (err) {
      setError('No valid QR code detected in this image. Please try a clearer photo.');
      setLoading(false);
    }
  };

  const handleScannedData = async (text) => {
    const trimmed = (text || '').trim();
    setDecodedText(trimmed);
    setError('');

    const parsed = parseQrPayload(trimmed);
    setParsedInfo(parsed);

    const isUrl = trimmed.startsWith('http://') || trimmed.startsWith('https://');
    if (!isUrl) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/links/check-single', { url: trimmed });
      setScanResult(res.data.scan);
    } catch (err) {
      setError(err.response?.data?.message || 'Security scan failed for this URL.');
    } finally {
      setLoading(false);
    }
  };

  const TypeIcon = parsedInfo?.icon || QrCode;

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
              <span>Universal QR Decoder</span>
            </span>
          </div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', margin: 0 }}>
            QR Code Security Scanner
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
            Decode and analyze any QR code — UPI payments, WiFi, contacts, URLs, emails — without opening them.
          </p>
        </div>

        <div style={{
          display: 'flex', padding: '4px',
          background: 'rgba(16, 23, 41, 0.8)',
          borderRadius: '12px', border: '1px solid var(--border-color)', gap: '6px'
        }}>
          <button onClick={() => { setActiveTab('upload'); stopCamera(); }}
            className={`btn ${activeTab === 'upload' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '8px 16px', fontSize: '0.85rem', borderRadius: '8px' }}>
            <Upload size={16} />
            <span>Upload Image</span>
          </button>
          <button onClick={() => setActiveTab('camera')}
            className={`btn ${activeTab === 'camera' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '8px 16px', fontSize: '0.85rem', borderRadius: '8px' }}>
            <Camera size={16} />
            <span>Live Camera</span>
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: '14px 18px', backgroundColor: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.35)', borderRadius: '10px', color: '#fca5a5', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Scanner Box */}
      <div className="glass-card" style={{ padding: '30px', textAlign: 'center' }}>
        {activeTab === 'upload' && (
          <div style={{ border: '2px dashed rgba(6, 182, 212, 0.35)', borderRadius: '14px', padding: '40px 20px', backgroundColor: 'rgba(6, 182, 212, 0.03)', cursor: 'pointer', position: 'relative' }}>
            <input type="file" accept="image/*" onChange={handleFileUpload}
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} />
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'rgba(6, 182, 212, 0.15)', color: 'var(--accent-cyan)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
              <QrCode size={32} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff', margin: '0 0 8px 0' }}>
              Upload Any QR Code Image
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', maxWidth: '420px', margin: '0 auto 16px auto' }}>
              Works with all types: UPI/Payment • URLs • WiFi • vCard • Email • SMS • Location
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
              {['💳 UPI/Pay', '🌐 URL/Link', '📶 WiFi', '👤 vCard', '📧 Email', '📍 Location'].map(tag => (
                <span key={tag} style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '0.74rem', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'var(--text-dim)' }}>{tag}</span>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'camera' && (
          <div>
            <div id="qr-reader-container" style={{ width: '100%', maxWidth: '450px', margin: '0 auto', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)' }} />
            <div style={{ marginTop: '18px' }}>
              {!cameraActive ? (
                <button onClick={handleStartCamera} className="btn btn-primary" style={{ padding: '10px 24px', fontSize: '0.9rem' }}>
                  <Camera size={16} />
                  <span>Activate Camera Scanner</span>
                </button>
              ) : (
                <button onClick={stopCamera} className="btn btn-danger" style={{ padding: '10px 24px', fontSize: '0.9rem' }}>
                  <span>Stop Camera</span>
                </button>
              )}
            </div>
          </div>
        )}

        <div id="qr-hidden-container" style={{ display: 'none' }} />

        {loading && (
          <div style={{ marginTop: '24px', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <RotateCw size={18} className="animate-spin" />
            <span>Running security audit on decoded QR payload...</span>
          </div>
        )}
      </div>

      {/* ─── Decoded Result ─── */}
      {parsedInfo && decodedText && (
        <div className="glass-card animate-slide-up" style={{ padding: '0', overflow: 'hidden' }}>

          {/* Type Header Banner */}
          <div style={{
            padding: '18px 24px',
            background: `linear-gradient(135deg, ${parsedInfo.color}22 0%, rgba(15,23,42,0.9) 100%)`,
            borderBottom: `2px solid ${parsedInfo.color}55`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: `${parsedInfo.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${parsedInfo.color}50` }}>
                <TypeIcon size={24} style={{ color: parsedInfo.color }} />
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.08em', display: 'block' }}>QR PAYLOAD DECODED</span>
                <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff' }}>{parsedInfo.label}</span>
              </div>
            </div>

            {scanResult && (
              <button onClick={() => generatePdfReport(scanResult, 'url')} className="btn btn-secondary"
                style={{ padding: '7px 14px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--accent-cyan)', borderColor: 'rgba(6,182,212,0.4)' }}>
                <FileDown size={14} />
                <span>Export PDF Report</span>
              </button>
            )}
          </div>

          {/* Structured Details Grid */}
          <div style={{ padding: '24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px', marginBottom: '20px' }}>
              {parsedInfo.fields.map((field, i) => {
                const FieldIcon = field.icon;
                return (
                  <div key={i} style={{ padding: '14px 16px', backgroundColor: 'rgba(15, 23, 42, 0.7)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '5px' }}>
                      <FieldIcon size={13} style={{ color: parsedInfo.color, flexShrink: 0 }} />
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>{field.label}</span>
                    </div>
                    <div style={{ fontFamily: field.label.toLowerCase().includes('upi') || field.label.toLowerCase().includes('url') || field.label.toLowerCase().includes('phone') ? 'monospace' : 'inherit', fontSize: '0.9rem', fontWeight: 600, color: '#fff', wordBreak: 'break-all', lineHeight: 1.4 }}>
                      {field.value || '—'}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Risk Note */}
            {parsedInfo.riskNote && (
              <div style={{
                padding: '14px 18px',
                borderRadius: '10px',
                marginBottom: '20px',
                backgroundColor: parsedInfo.riskNote.startsWith('⚠️') ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.08)',
                border: `1px solid ${parsedInfo.riskNote.startsWith('⚠️') ? 'rgba(245,158,11,0.3)' : 'rgba(16,185,129,0.25)'}`,
                fontSize: '0.88rem',
                color: parsedInfo.riskNote.startsWith('⚠️') ? '#fcd34d' : '#a7f3d0',
                lineHeight: 1.5
              }}>
                {parsedInfo.riskNote}
              </div>
            )}

            {/* Raw Payload Box */}
            <div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: '6px' }}>Raw Decoded Payload</span>
              <div style={{ padding: '12px 16px', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: '8px', fontFamily: 'monospace', fontSize: '0.78rem', color: '#94a3b8', wordBreak: 'break-all', lineHeight: 1.5, maxHeight: '80px', overflowY: 'auto' }}>
                {decodedText}
              </div>
            </div>
          </div>

          {/* URL Security Verdict (only for URL type QR codes) */}
          {scanResult && (
            <div style={{ padding: '0 24px 24px 24px' }}>
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px', marginBottom: '14px' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.08em' }}>
                  🔒 LIVE SECURITY AUDIT — URL INSPECTION RESULT
                </span>
              </div>

              {(() => {
                const verdict = scanResult.security_verdict || 'SAFE';
                const colors = {
                  SAFE: { bg: 'rgba(16,185,129,0.12)', border: '#10b981', text: 'SAFE DESTINATION' },
                  BROKEN: { bg: 'rgba(239,68,68,0.12)', border: '#ef4444', text: `BROKEN LINK — HTTP ${scanResult.http_status || 404}` },
                  UNSAFE: { bg: 'rgba(225,29,72,0.18)', border: '#e11d48', text: 'DANGER — MALICIOUS LINK DETECTED' },
                  ACCESS_RESTRICTED: { bg: 'rgba(245,158,11,0.12)', border: '#f59e0b', text: 'ACCESS RESTRICTED' },
                  SERVER_ERROR: { bg: 'rgba(249,115,22,0.12)', border: '#f97316', text: 'SERVER ERROR' },
                  UNREACHABLE: { bg: 'rgba(236,72,153,0.12)', border: '#ec4899', text: 'URL UNREACHABLE' },
                };
                const theme = colors[verdict] || colors.SAFE;
                return (
                  <div style={{ padding: '18px 20px', borderRadius: '12px', backgroundColor: theme.bg, border: `1px solid ${theme.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                        <StatusBadge status={verdict} size="md" />
                        <span style={{ fontSize: '1rem', fontWeight: 800, color: '#fff' }}>{theme.text}</span>
                      </div>
                      <div style={{ fontSize: '0.84rem', color: '#cbd5e1' }}>
                        {scanResult.verdict_reason || 'Security inspection complete.'}
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '10px' }}>
                <div style={{ padding: '12px 14px', backgroundColor: 'rgba(16,23,41,0.8)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>HTTP Status</span>
                  <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#fff' }}>{scanResult.http_status ? `HTTP ${scanResult.http_status}` : 'N/A'}</span>
                </div>
                <div style={{ padding: '12px 14px', backgroundColor: 'rgba(16,23,41,0.8)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Latency</span>
                  <span style={{ fontFamily: 'monospace', fontWeight: 800, color: 'var(--accent-cyan)' }}>{scanResult.response_time_ms} ms</span>
                </div>
                <div style={{ padding: '12px 14px', backgroundColor: 'rgba(16,23,41,0.8)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Safe Browsing</span>
                  <StatusBadge status={scanResult.reputation_status} size="sm" />
                </div>
                <div style={{ padding: '12px 14px', backgroundColor: 'rgba(16,23,41,0.8)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Domain Age</span>
                  <span style={{ fontWeight: 700, color: scanResult.whois?.is_newly_registered ? 'var(--accent-rose)' : '#fff', fontSize: '0.85rem' }}>
                    {scanResult.whois?.age_formatted || 'Established'}
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
