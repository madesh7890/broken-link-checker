import React, { useState } from 'react';
import { 
  User, 
  KeyRound, 
  Shield, 
  CheckCircle2, 
  AlertCircle, 
  Lock, 
  RotateCw,
  Terminal,
  Cpu,
  Radar
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const AVATAR_OPTIONS = ['shield', 'radar', 'terminal', 'cpu', 'lock'];

export default function UserProfile() {
  const { user, updateUser } = useAuth();

  const [displayName, setDisplayName] = useState(user?.display_name || '');
  const [selectedAvatar, setSelectedAvatar] = useState(user?.avatar || 'shield');
  const [profileMsg, setProfileMsg] = useState('');
  const [profileErr, setProfileErr] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdMsg, setPwdMsg] = useState('');
  const [pwdErr, setPwdErr] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileMsg('');
    setProfileErr('');
    setProfileLoading(true);

    try {
      const res = await api.put('/profile', {
        display_name: displayName,
        avatar: selectedAvatar
      });
      updateUser(res.data.user);
      setProfileMsg('Profile information updated successfully.');
    } catch (err) {
      setProfileErr(err.response?.data?.message || 'Error updating profile.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwdMsg('');
    setPwdErr('');

    if (newPassword !== confirmPassword) {
      setPwdErr('New passwords do not match.');
      return;
    }

    if (newPassword.length < 8) {
      setPwdErr('New password must be at least 8 characters long.');
      return;
    }

    setPwdLoading(true);
    try {
      const res = await api.put('/profile/password', {
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword
      });
      setPwdMsg(res.data.message);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPwdErr(err.response?.data?.message || 'Failed to update password.');
    } finally {
      setPwdLoading(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '800px' }}>
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
          User Profile & Security
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '2px' }}>
          Manage your account identity, security credentials, and access credentials.
        </p>
      </div>

      {/* Account Info & Display Settings */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '16px' }}>
          Personal Details
        </h3>

        {profileMsg && (
          <div style={{ padding: '12px', marginBottom: '16px', backgroundColor: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '8px', color: '#a7f3d0', fontSize: '0.85rem' }}>
            {profileMsg}
          </div>
        )}
        {profileErr && (
          <div style={{ padding: '12px', marginBottom: '16px', backgroundColor: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', color: '#fca5a5', fontSize: '0.85rem' }}>
            {profileErr}
          </div>
        )}

        <form onSubmit={handleUpdateProfile}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div className="input-group" style={{ margin: 0 }}>
              <label className="input-label">Username</label>
              <input
                type="text"
                className="input-control"
                value={user?.username || ''}
                disabled
                style={{ opacity: 0.6, cursor: 'not-allowed' }}
              />
            </div>
            <div className="input-group" style={{ margin: 0 }}>
              <label className="input-label">Email Address</label>
              <input
                type="email"
                className="input-control"
                value={user?.email || ''}
                disabled
                style={{ opacity: 0.6, cursor: 'not-allowed' }}
              />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Display Name</label>
            <input
              type="text"
              className="input-control"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
            />
          </div>

          {/* Avatar Picker */}
          <div className="input-group">
            <label className="input-label">Security Avatar</label>
            <div style={{ display: 'flex', gap: '12px', marginTop: '6px' }}>
              {AVATAR_OPTIONS.map((av) => (
                <button
                  type="button"
                  key={av}
                  onClick={() => setSelectedAvatar(av)}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    backgroundColor: selectedAvatar === av ? 'rgba(6, 182, 212, 0.2)' : 'var(--bg-secondary)',
                    border: `1px solid ${selectedAvatar === av ? 'var(--accent-cyan)' : 'var(--border-color)'}`,
                    color: selectedAvatar === av ? 'var(--accent-cyan)' : 'var(--text-muted)',
                    textTransform: 'capitalize',
                    fontSize: '0.82rem',
                    fontWeight: 600
                  }}
                >
                  {av}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={profileLoading}
            style={{ padding: '10px 20px', fontSize: '0.85rem' }}
          >
            {profileLoading ? <RotateCw size={14} className="animate-spin" /> : null}
            <span>Save Profile Changes</span>
          </button>
        </form>
      </div>

      {/* Change Password Form */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '16px' }}>
          Change Password
        </h3>

        {pwdMsg && (
          <div style={{ padding: '12px', marginBottom: '16px', backgroundColor: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '8px', color: '#a7f3d0', fontSize: '0.85rem' }}>
            {pwdMsg}
          </div>
        )}
        {pwdErr && (
          <div style={{ padding: '12px', marginBottom: '16px', backgroundColor: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', color: '#fca5a5', fontSize: '0.85rem' }}>
            {pwdErr}
          </div>
        )}

        <form onSubmit={handleChangePassword}>
          <div className="input-group">
            <label className="input-label">Current Password</label>
            <input
              type="password"
              className="input-control"
              placeholder="Enter current password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div className="input-group" style={{ margin: 0 }}>
              <label className="input-label">New Password</label>
              <input
                type="password"
                className="input-control"
                placeholder="At least 8 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
            <div className="input-group" style={{ margin: 0 }}>
              <label className="input-label">Confirm New Password</label>
              <input
                type="password"
                className="input-control"
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={pwdLoading}
            style={{ padding: '10px 20px', fontSize: '0.85rem' }}
          >
            {pwdLoading ? <RotateCw size={14} className="animate-spin" /> : <Lock size={14} />}
            <span>Update Password</span>
          </button>
        </form>
      </div>
    </div>
  );
}
