import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  History, 
  Search, 
  Trash2, 
  ExternalLink, 
  Filter, 
  RotateCw, 
  Smartphone, 
  Globe, 
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Shield,
  Copy,
  Check
} from 'lucide-react';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';

export default function ScanHistory() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  const fetchHistory = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/history', {
        params: {
          type: typeFilter,
          search: search.trim(),
          page,
          limit: 15
        }
      });
      setItems(res.data.items);
      setTotal(res.data.total);
    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching scan history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [typeFilter, page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchHistory();
  };

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleDeleteItem = async (recordType, id) => {
    if (!window.confirm('Delete this private scan record permanently?')) return;

    try {
      const endpoint = recordType === 'APK' ? `/history/apk/${id}` : `/history/url/${id}`;
      await api.delete(endpoint);
      fetchHistory();
    } catch (err) {
      alert(err.response?.data?.message || 'Could not delete scan record.');
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Are you sure you want to permanently clear your entire scan history?')) return;

    try {
      await api.delete('/history/clear');
      fetchHistory();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to clear history.');
    }
  };

  const totalPages = Math.ceil(total / 15) || 1;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span className="tech-tag" style={{ color: 'var(--accent-cyan)', borderColor: 'rgba(6, 182, 212, 0.3)' }}>
              <History size={13} />
              <span>Audit Trail</span>
            </span>
          </div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', margin: 0 }}>
            Audit Log & Scan History
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
            Permanent forensic records of URLs probed, redirect chains observed, and APK binary audits.
          </p>
        </div>

        {items.length > 0 && (
          <button
            onClick={handleClearAll}
            className="btn btn-danger"
            style={{ padding: '9px 16px', fontSize: '0.84rem' }}
          >
            <Trash2 size={14} />
            <span>Purge All Records</span>
          </button>
        )}
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

      {/* Filter and Search Bar */}
      <div className="glass-card" style={{ padding: '16px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        {/* Type pills */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: 'All Audits' },
            { id: 'url', label: 'URL Checks' },
            { id: 'suspicious', label: 'Suspicious Links' },
            { id: 'apk', label: 'APK Packages' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => { setTypeFilter(tab.id); setPage(1); }}
              className={`btn ${typeFilter === tab.id ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '7px 14px', fontSize: '0.82rem', borderRadius: '8px' }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search input */}
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px' }}>
          <div className="input-group" style={{ margin: 0, position: 'relative' }}>
            <input
              type="text"
              className="input-control font-mono"
              placeholder="Search target URL, host or hash..."
              style={{ padding: '8px 12px 8px 34px', fontSize: '0.84rem', width: '250px' }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
          </div>
          <button type="submit" className="btn btn-secondary" style={{ padding: '8px 14px', fontSize: '0.82rem' }}>
            <span>Search</span>
          </button>
        </form>
      </div>

      {/* History Table */}
      <div className="glass-card" style={{ padding: '22px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
            <RotateCw size={28} className="animate-spin" style={{ margin: '0 auto 12px auto', color: 'var(--accent-cyan)' }} />
            <p style={{ fontWeight: 600 }}>Retrieving forensic audit trail...</p>
          </div>
        ) : items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
            <History size={40} style={{ margin: '0 auto 14px auto', opacity: 0.4, color: 'var(--accent-cyan)' }} />
            <h3 style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 700 }}>No Historical Records Found</h3>
            <p style={{ fontSize: '0.86rem', marginTop: '4px', maxWidth: '380px', margin: '4px auto 0 auto' }}>No scan events match your current filter parameters.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Target / Asset</th>
                  <th>Availability / State</th>
                  <th>Reputation</th>
                  <th>Timestamp</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        backgroundColor: row.record_type === 'APK' ? 'rgba(168, 85, 247, 0.15)' : 'rgba(6, 182, 212, 0.15)',
                        color: row.record_type === 'APK' ? 'var(--accent-purple)' : 'var(--accent-cyan)',
                        border: `1px solid ${row.record_type === 'APK' ? 'rgba(168, 85, 247, 0.3)' : 'rgba(6, 182, 212, 0.3)'}`
                      }}>
                        {row.record_type === 'APK' ? <Smartphone size={11} /> : <Globe size={11} />}
                        {row.record_type}
                      </span>
                    </td>
                    <td style={{ maxWidth: '360px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="font-mono" style={{ fontWeight: 600, color: '#fff', fontSize: '0.84rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={row.target}>
                          {row.target}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(row.target, row.id)}
                          title="Copy target"
                          style={{
                            padding: '3px',
                            color: copiedId === row.id ? 'var(--accent-emerald)' : 'var(--text-dim)',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          {copiedId === row.id ? <Check size={13} /> : <Copy size={13} />}
                        </button>
                      </div>
                      {row.sha256 && (
                        <div style={{ fontSize: '0.72rem', fontFamily: 'monospace', color: 'var(--text-dim)', marginTop: '2px' }}>
                          SHA-256: {row.sha256.substring(0, 18)}...
                        </div>
                      )}
                    </td>
                    <td>
                      <StatusBadge status={row.status} size="sm" />
                    </td>
                    <td>
                      <StatusBadge status={row.reputation} size="sm" />
                    </td>
                    <td style={{ color: 'var(--text-dim)', fontSize: '0.78rem' }}>
                      {row.created_at ? new Date(row.created_at * 1000).toLocaleString() : 'N/A'}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                        <Link
                          to={`/reports/${row.record_type.toLowerCase()}/${row.id}`}
                          className="btn btn-secondary"
                          style={{ padding: '5px 10px', fontSize: '0.76rem', color: 'var(--accent-cyan)', borderColor: 'rgba(6, 182, 212, 0.3)' }}
                        >
                          <span>Report</span>
                          <ExternalLink size={12} />
                        </Link>
                        <button
                          onClick={() => handleDeleteItem(row.record_type, row.id)}
                          className="btn btn-danger"
                          style={{ padding: '5px 8px', fontSize: '0.76rem' }}
                          title="Delete record"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '20px',
            paddingTop: '16px',
            borderTop: '1px solid var(--border-color)',
            fontSize: '0.84rem',
            color: 'var(--text-muted)'
          }}>
            <span>Showing page {page} of {totalPages} ({total} audit events)</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="btn btn-secondary"
                style={{ padding: '6px 12px', fontSize: '0.8rem' }}
              >
                <ChevronLeft size={14} />
                <span>Previous</span>
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="btn btn-secondary"
                style={{ padding: '6px 12px', fontSize: '0.8rem' }}
              >
                <span>Next</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
