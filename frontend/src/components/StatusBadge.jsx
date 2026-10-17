import React from 'react';
import { 
  CheckCircle, AlertTriangle, XCircle, AlertOctagon, HelpCircle, 
  ArrowRightCircle, ShieldAlert, ShieldCheck, RefreshCw 
} from 'lucide-react';

const BADGE_CONFIG = {
  // Availability statuses
  WORKING: {
    label: 'Working (2xx/3xx)',
    color: '#10b981',
    bg: 'rgba(16, 185, 129, 0.12)',
    border: 'rgba(16, 185, 129, 0.3)',
    icon: CheckCircle
  },
  REDIRECTED: {
    label: 'Redirected',
    color: '#38bdf8',
    bg: 'rgba(56, 189, 248, 0.12)',
    border: 'rgba(56, 189, 248, 0.3)',
    icon: ArrowRightCircle
  },
  BROKEN: {
    label: 'Broken (4xx)',
    color: '#ef4444',
    bg: 'rgba(239, 68, 68, 0.12)',
    border: 'rgba(239, 68, 68, 0.3)',
    icon: XCircle
  },
  ACCESS_RESTRICTED: {
    label: 'Restricted (401/403)',
    color: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.12)',
    border: 'rgba(245, 158, 11, 0.3)',
    icon: AlertOctagon
  },
  SERVER_ERROR: {
    label: 'Server Error (5xx)',
    color: '#f97316',
    bg: 'rgba(249, 115, 22, 0.12)',
    border: 'rgba(249, 115, 22, 0.3)',
    icon: AlertTriangle
  },
  CONNECTION_FAILED: {
    label: 'Connection Failed',
    color: '#ec4899',
    bg: 'rgba(236, 72, 153, 0.12)',
    border: 'rgba(236, 72, 153, 0.3)',
    icon: AlertTriangle
  },

  // Security reputation & risk statuses
  SAFE: {
    label: 'SAFE',
    color: '#10b981',
    bg: 'rgba(16, 185, 129, 0.14)',
    border: 'rgba(16, 185, 129, 0.35)',
    icon: ShieldCheck
  },
  NO_INDICATORS_FOUND: {
    label: 'SAFE / CLEAN',
    color: '#10b981',
    bg: 'rgba(16, 185, 129, 0.14)',
    border: 'rgba(16, 185, 129, 0.35)',
    icon: ShieldCheck
  },
  MODERATE: {
    label: 'MODERATE / SUSPICIOUS',
    color: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.15)',
    border: 'rgba(245, 158, 11, 0.4)',
    icon: AlertTriangle
  },
  POTENTIALLY_SUSPICIOUS: {
    label: 'POTENTIALLY SUSPICIOUS',
    color: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.15)',
    border: 'rgba(245, 158, 11, 0.4)',
    icon: AlertTriangle
  },
  UNREACHABLE: {
    label: 'URL UNREACHABLE',
    color: '#38bdf8',
    bg: 'rgba(56, 189, 248, 0.12)',
    border: 'rgba(56, 189, 248, 0.3)',
    icon: HelpCircle
  },
  URL_UNREACHABLE: {
    label: 'URL UNREACHABLE',
    color: '#38bdf8',
    bg: 'rgba(56, 189, 248, 0.12)',
    border: 'rgba(56, 189, 248, 0.3)',
    icon: HelpCircle
  },
  HIGH_RISK: {
    label: 'HIGH RISK / UNSAFE',
    color: '#ef4444',
    bg: 'rgba(239, 68, 68, 0.2)',
    border: 'rgba(239, 68, 68, 0.5)',
    icon: ShieldAlert
  },
  UNSAFE: {
    label: 'UNSAFE / THREAT',
    color: '#ef4444',
    bg: 'rgba(239, 68, 68, 0.18)',
    border: 'rgba(239, 68, 68, 0.45)',
    icon: ShieldAlert
  },
  'SCAN FAILED': {
    label: 'SCAN FAILED',
    color: '#f43f5e',
    bg: 'rgba(244, 63, 94, 0.12)',
    border: 'rgba(244, 63, 94, 0.3)',
    icon: XCircle
  },
  SCAN_FAILED: {
    label: 'SCAN FAILED',
    color: '#f43f5e',
    bg: 'rgba(244, 63, 94, 0.12)',
    border: 'rgba(244, 63, 94, 0.3)',
    icon: XCircle
  },

  // APK statuses
  MALWARE_DETECTED: {
    label: 'THREAT DETECTED',
    color: '#ef4444',
    bg: 'rgba(239, 68, 68, 0.2)',
    border: 'rgba(239, 68, 68, 0.5)',
    icon: ShieldAlert
  },
  POTENTIALLY_RISKY: {
    label: 'POTENTIALLY RISKY',
    color: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.15)',
    border: 'rgba(245, 158, 11, 0.35)',
    icon: AlertTriangle
  },
  INCONCLUSIVE: {
    label: 'INCONCLUSIVE',
    color: '#94a3b8',
    bg: 'rgba(148, 163, 184, 0.12)',
    border: 'rgba(148, 163, 184, 0.25)',
    icon: HelpCircle
  },
  UNKNOWN: {
    label: 'UNKNOWN',
    color: '#94a3b8',
    bg: 'rgba(148, 163, 184, 0.12)',
    border: 'rgba(148, 163, 184, 0.25)',
    icon: HelpCircle
  }
};

export default function StatusBadge({ status, text, size = 'md' }) {
  const norm = (status || 'UNKNOWN').toUpperCase();
  const config = BADGE_CONFIG[norm] || BADGE_CONFIG.UNKNOWN;
  const Icon = config.icon;

  const isSmall = size === 'sm';

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: isSmall ? '5px' : '7px',
        padding: isSmall ? '3px 9px' : '5px 12px',
        fontSize: isSmall ? '0.72rem' : '0.8rem',
        fontWeight: 700,
        borderRadius: '20px',
        color: config.color,
        backgroundColor: config.bg,
        border: `1px solid ${config.border}`,
        whiteSpace: 'nowrap',
        letterSpacing: '0.03em',
        boxShadow: `0 2px 8px ${config.bg}`,
        transition: 'all 0.15s ease'
      }}
    >
      <Icon size={isSmall ? 12 : 14} style={{ filter: `drop-shadow(0 0 4px ${config.color})` }} />
      {text || config.label}
    </span>
  );
}
