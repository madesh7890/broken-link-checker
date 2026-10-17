import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  Activity, 
  ShieldCheck, 
  Key, 
  AlertTriangle, 
  CheckCircle2, 
  RotateCw,
  ExternalLink,
  Info,
  Save,
  Trash2,
  FileCode
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Settings() {
  const { user, updateUser } = useAuth();
  const [integrations, setIntegrations] = useState(null);
  const [fallbackNotice, setFallbackNotice] = useState('');
  const [loading, setLoading] = useState(true);

  // Google Safe Browsing API Key state
  const [safeBrowsingKey, setSafeBrowsingKey] = useState('');
  const [keySaving, setKeySaving] = useState(false);
  const [keyMsg, setKeyMsg] = useState('');
  const [keyErr, setKeyErr] = useState('');

  // VirusTotal API Key state
  const [virusTotalKey, setVirusTotalKey] = useState('');
  const [vtSaving, setVtSaving] = useState(false);
  const [vtMsg, setVtMsg] = useState('');
  const [vtErr, setVtErr] = useState('');

  const [preferences, setPreferences] = useState({
    request_timeout: user?.preferences?.request_timeout || 8,
    auto_redirect_check: user?.preferences?.auto_redirect_check ?? true,
    notify_unsafe_links: user?.preferences?.notify_unsafe_links ?? true,
    allow_external_lookup: true
  });
  const [saveMsg, setSaveMsg] = useState('');

  const fetchIntegrations = async () => {
    setLoading(true);
    try {
      const res = await api.get('/integrations/status');
      setIntegrations(res.data.integrations);
      setFallbackNotice(res.data.fallback_notice);
    } catch (err) {
      // quiet fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const handleSaveApiKey = async (e) => {
    e.preventDefault();
    if (!safeBrowsingKey.trim()) {
      setKeyErr('Please enter a Google Safe Browsing API key.');
      return;
    }

    setKeySaving(true);
    setKeyMsg('');
    setKeyErr('');

    try {
      const res = await api.post('/integrations/keys', {
        safe_browsing_key: safeBrowsingKey.trim()
      });
      setKeyMsg(res.data.message || 'API Key successfully verified and activated!');
      setIntegrations(res.data.integrations);
      setSafeBrowsingKey('');
      fetchIntegrations();
    } catch (err) {
      setKeyErr(err.response?.data?.message || 'Failed to validate API key. Please verify your Google Cloud Console credentials.');
    } finally {
      setKeySaving(false);
    }
  };

  const handleClearApiKey = async () => {
    if (!window.confirm('Disable Google Safe Browsing and revert to offline fallback mode?')) return;
    setKeySaving(true);
    setKeyMsg('');
    setKeyErr('');
    try {
      const res = await api.post('/integrations/keys', { clear_safe_browsing: true });
      setKeyMsg('API key removed. Reverted to safe offline fallback mode.');
      setIntegrations(res.data.integrations);
      fetchIntegrations();
    } catch (err) {
      setKeyErr('Failed to remove key.');
    } finally {
      setKeySaving(false);
    }
  };

  const handleSaveVtApiKey = async (e) => {
    e.preventDefault();
    if (!virusTotalKey.trim()) {
      setVtErr('Please enter a VirusTotal API key.');
      return;
    }

    setVtSaving(true);
    setVtMsg('');
    setVtErr('');

    try {
      const res = await api.post('/integrations/keys', {
        virustotal_key: virusTotalKey.trim()
      });
      setVtMsg(res.data.message || 'VirusTotal API Key successfully verified and activated!');
      setIntegrations(res.data.integrations);
      setVirusTotalKey('');
      fetchIntegrations();
    } catch (err) {
      setVtErr(err.response?.data?.message || 'Failed to validate VirusTotal API key. Please check your VirusTotal account.');
    } finally {
      setVtSaving(false);
    }
  };

  const handleClearVtApiKey = async () => {
    if (!window.confirm('Disable VirusTotal integration and revert to local static hash analysis?')) return;
    setVtSaving(true);
    setVtMsg('');
    setVtErr('');
    try {
      const res = await api.post('/integrations/keys', { clear_virustotal: true });
      setVtMsg('VirusTotal API key removed. Reverted to local static APK analysis.');
      setIntegrations(res.data.integrations);
      fetchIntegrations();
    } catch (err) {
      setVtErr('Failed to remove VirusTotal key.');
    } finally {
      setVtSaving(false);
    }
  };

  const handleSavePreferences = async (e) => {
    e.preventDefault();
    try {
      const res = await api.put('/profile', { preferences });
      updateUser(res.data.user);
      setSaveMsg('Preferences saved successfully.');
      setTimeout(() => setSaveMsg(''), 3000);
    } catch (err) {
      alert('Error updating preferences.');
    }
  };

  const isSafeBrowsingConfigured = integrations?.google_safe_browsing?.configured;
  const isVirusTotalConfigured = integrations?.virustotal?.configured;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '850px' }}>
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
          Settings & Security Integrations
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '2px' }}>
          Configure Google Safe Browsing and VirusTotal APIs, view offline fallback status, and adjust scanning preferences.
        </p>
      </div>

      {/* Integration Statuses */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>
              External Threat Intelligence Integrations
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Live service status and threat intelligence redundancy.
            </p>
          </div>
          <button onClick={fetchIntegrations} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
            <RotateCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Check Providers</span>
          </button>
        </div>

        {/* Fallback Notice Banner */}
        <div style={{
          padding: '14px',
          marginBottom: '20px',
          backgroundColor: isSafeBrowsingConfigured ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
          border: `1px solid ${isSafeBrowsingConfigured ? 'rgba(16, 185, 129, 0.25)' : 'rgba(245, 158, 11, 0.25)'}`,
          borderRadius: '8px',
          fontSize: '0.84rem',
          color: isSafeBrowsingConfigured ? '#a7f3d0' : '#fef3c7',
          display: 'flex',
          gap: '10px'
        }}>
          {isSafeBrowsingConfigured ? (
            <CheckCircle2 size={18} style={{ color: 'var(--accent-emerald)', flexShrink: 0, marginTop: '2px' }} />
          ) : (
            <Info size={18} style={{ color: 'var(--accent-amber)', flexShrink: 0, marginTop: '2px' }} />
          )}
          <div>
            <strong>Status:</strong> {fallbackNotice}
          </div>
        </div>

        {/* Integration Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          {integrations && Object.entries(integrations).map(([key, item]) => (
            <div key={key} style={{
              padding: '16px',
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: '8px',
              border: '1px solid var(--border-color)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <span style={{ fontWeight: 700, color: '#fff', fontSize: '0.95rem' }}>{item.name}</span>
                <span style={{
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  backgroundColor: item.configured ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                  color: item.configured ? 'var(--accent-emerald)' : 'var(--accent-amber)'
                }}>
                  {item.status}
                </span>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                Capability: {item.type}
              </p>
              <div style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', fontFamily: 'monospace' }}>
                Fallback: {item.fallback_mode}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Configure Google Safe Browsing API Key */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: 'rgba(6, 182, 212, 0.15)', color: 'var(--accent-cyan)' }}>
            <Key size={18} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>
              Add / Update Google Safe Browsing API Key
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Enable live malware and social engineering reputation checking for all HTTP and HTTPS link checks.
            </p>
          </div>
        </div>

        {keyMsg && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px',
            margin: '16px 0',
            backgroundColor: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '8px',
            color: '#a7f3d0',
            fontSize: '0.85rem'
          }}>
            <CheckCircle2 size={18} />
            <span>{keyMsg}</span>
          </div>
        )}

        {keyErr && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px',
            margin: '16px 0',
            backgroundColor: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
            color: '#fca5a5',
            fontSize: '0.85rem'
          }}>
            <AlertTriangle size={18} />
            <span>{keyErr}</span>
          </div>
        )}

        <form onSubmit={handleSaveApiKey} style={{ marginTop: '16px' }}>
          <div className="input-group">
            <label className="input-label">Google Safe Browsing API Key (v4)</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="password"
                className="input-control font-mono"
                placeholder={isSafeBrowsingConfigured ? "•••••••••••••••••••••••••••••••••••• (Active)" : "Paste your Google Cloud Safe Browsing API Key"}
                value={safeBrowsingKey}
                onChange={(e) => setSafeBrowsingKey(e.target.value)}
              />
              <button
                type="submit"
                className="btn btn-primary"
                style={{ minWidth: '170px' }}
                disabled={keySaving}
              >
                {keySaving ? <RotateCw size={15} className="animate-spin" /> : <Save size={15} />}
                <span>{keySaving ? 'Validating...' : 'Save & Activate Key'}</span>
              </button>
              {isSafeBrowsingConfigured && (
                <button
                  type="button"
                  onClick={handleClearApiKey}
                  className="btn btn-danger"
                  style={{ padding: '10px 14px' }}
                  title="Remove Key"
                  disabled={keySaving}
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
            <span style={{ fontSize: '0.76rem', color: 'var(--text-dim)', marginTop: '6px', display: 'block' }}>
              Your key is securely validated against the Google Safe Browsing endpoint and stored in backend environment configuration.
            </span>
          </div>
        </form>
      </div>

      {/* Configure VirusTotal API Key */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: 'rgba(168, 85, 247, 0.15)', color: 'var(--accent-purple)' }}>
            <Key size={18} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>
              Add / Update VirusTotal API Key
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Enable live malware and threat intelligence lookup for APK SHA-256 hashes via VirusTotal v3 API.
            </p>
          </div>
        </div>

        {vtMsg && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px',
            margin: '16px 0',
            backgroundColor: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '8px',
            color: '#a7f3d0',
            fontSize: '0.85rem'
          }}>
            <CheckCircle2 size={18} />
            <span>{vtMsg}</span>
          </div>
        )}

        {vtErr && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px',
            margin: '16px 0',
            backgroundColor: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
            color: '#fca5a5',
            fontSize: '0.85rem'
          }}>
            <AlertTriangle size={18} />
            <span>{vtErr}</span>
          </div>
        )}

        <form onSubmit={handleSaveVtApiKey} style={{ marginTop: '16px' }}>
          <div className="input-group">
            <label className="input-label">VirusTotal API Key (v3)</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="password"
                className="input-control font-mono"
                placeholder={isVirusTotalConfigured ? "•••••••••••••••••••••••••••••••••••• (Active)" : "Paste your VirusTotal v3 API Key"}
                value={virusTotalKey}
                onChange={(e) => setVirusTotalKey(e.target.value)}
              />
              <button
                type="submit"
                className="btn btn-primary"
                style={{
                  minWidth: '170px',
                  background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
                  boxShadow: '0 4px 14px rgba(168, 85, 247, 0.3)'
                }}
                disabled={vtSaving}
              >
                {vtSaving ? <RotateCw size={15} className="animate-spin" /> : <Save size={15} />}
                <span>{vtSaving ? 'Validating...' : 'Save & Activate Key'}</span>
              </button>
              {isVirusTotalConfigured && (
                <button
                  type="button"
                  onClick={handleClearVtApiKey}
                  className="btn btn-danger"
                  style={{ padding: '10px 14px' }}
                  title="Remove VirusTotal Key"
                  disabled={vtSaving}
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
            <span style={{ fontSize: '0.76rem', color: 'var(--text-dim)', marginTop: '6px', display: 'block' }}>
              Your key is securely validated against the VirusTotal v3 API endpoint and stored in backend environment configuration.
            </span>
          </div>
        </form>
      </div>

      {/* External Service Consent & Preferences */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '12px' }}>
          Data Privacy & Scanning Preferences
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '16px' }}>
          When external reputation checks are active, queried URLs or SHA-256 hashes are looked up against external intelligence APIs. Uploaded APK files are <strong>never</strong> transmitted to third parties or executed on the server.
        </p>

        <form onSubmit={handleSavePreferences}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', color: '#fff', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={preferences.allow_external_lookup}
                onChange={(e) => setPreferences(prev => ({ ...prev, allow_external_lookup: e.target.checked }))}
              />
              <span>Consent to query external threat intelligence APIs (URLs & SHA-256 hashes only)</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', color: '#fff', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={preferences.auto_redirect_check}
                onChange={(e) => setPreferences(prev => ({ ...prev, auto_redirect_check: e.target.checked }))}
              />
              <span>Automatically follow and SSRF-validate redirect hops (up to 5 hops)</span>
            </label>

            <div className="input-group" style={{ margin: 0, maxWidth: '300px' }}>
              <label className="input-label">Request Timeout (Seconds)</label>
              <input
                type="number"
                min="3"
                max="30"
                className="input-control"
                value={preferences.request_timeout}
                onChange={(e) => setPreferences(prev => ({ ...prev, request_timeout: parseInt(e.target.value) || 8 }))}
              />
            </div>
          </div>

          {saveMsg && (
            <div style={{ padding: '10px', marginBottom: '14px', backgroundColor: 'rgba(16, 185, 129, 0.12)', borderRadius: '6px', color: '#a7f3d0', fontSize: '0.85rem' }}>
              {saveMsg}
            </div>
          )}

          <button type="submit" className="btn btn-primary" style={{ padding: '10px 20px', fontSize: '0.85rem' }}>
            Save Scanning Preferences
          </button>
        </form>
      </div>
    </div>
  );
}
