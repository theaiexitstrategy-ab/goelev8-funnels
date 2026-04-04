// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
'use client';

import { useEffect, useState, useCallback } from 'react';

export default function ProfileSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [profile, setProfile] = useState({ name: '', email: '', phone: '', business_name: '' });
  const [passwords, setPasswords] = useState({ current: '', new_password: '', confirm: '' });
  const [changingPassword, setChangingPassword] = useState(false);

  const loadProfile = useCallback(async () => {
    try {
      const res = await fetch('/api/profile');
      if (res.ok) {
        const data = await res.json();
        setProfile({ name: data.name || '', email: data.email || '', phone: data.phone || '', business_name: data.business_name || '' });
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
      setMessage(res.ok ? 'Profile updated.' : 'Failed to update profile.');
    } catch {
      setMessage('Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.new_password !== passwords.confirm) {
      setMessage('Passwords do not match.');
      return;
    }
    if (passwords.new_password.length < 8) {
      setMessage('Password must be at least 8 characters.');
      return;
    }
    setChangingPassword(true);
    setMessage('');
    try {
      const res = await fetch('/api/profile/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current_password: passwords.current, new_password: passwords.new_password }),
      });
      if (res.ok) {
        setMessage('Password changed.');
        setPasswords({ current: '', new_password: '', confirm: '' });
      } else {
        const data = await res.json();
        setMessage(data.error || 'Failed to change password.');
      }
    } catch {
      setMessage('Failed to change password.');
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF' }}>Loading...</div>;

  const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #D1D5DB', fontSize: 15, outline: 'none' };

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '24px 16px' }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, color: '#111', marginBottom: 32 }}>Profile Settings</h1>

      {message && (
        <div style={{ background: message.includes('Failed') || message.includes('do not match') || message.includes('must be') ? '#FEF2F2' : '#F0FDF4', color: message.includes('Failed') || message.includes('do not match') || message.includes('must be') ? '#991B1B' : '#166534', padding: '12px 16px', borderRadius: 8, marginBottom: 20, fontSize: 14 }}>
          {message}
        </div>
      )}

      {/* Profile Info */}
      <section style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: 24, marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20 }}>Account Information</h2>
        <form onSubmit={handleSaveProfile}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4, color: '#374151' }}>Full Name</label>
              <input type="text" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4, color: '#374151' }}>Email</label>
              <input type="email" value={profile.email} disabled style={{ ...inputStyle, background: '#F9FAFB', color: '#9CA3AF' }} />
              <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>Email cannot be changed here. Contact support.</p>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4, color: '#374151' }}>Phone</label>
              <input type="tel" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4, color: '#374151' }}>Business Name</label>
              <input type="text" value={profile.business_name} onChange={(e) => setProfile({ ...profile, business_name: e.target.value })} style={inputStyle} />
            </div>
          </div>
          <button type="submit" disabled={saving} style={{
            marginTop: 20, background: '#2563EB', color: '#fff', border: 'none', borderRadius: 8,
            padding: '10px 24px', fontWeight: 600, cursor: 'pointer', fontSize: 14, opacity: saving ? 0.6 : 1,
          }}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </section>

      {/* Change Password */}
      <section style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20 }}>Change Password</h2>
        <form onSubmit={handleChangePassword}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4, color: '#374151' }}>Current Password</label>
              <input type="password" required value={passwords.current} onChange={(e) => setPasswords({ ...passwords, current: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4, color: '#374151' }}>New Password</label>
              <input type="password" required minLength={8} value={passwords.new_password} onChange={(e) => setPasswords({ ...passwords, new_password: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4, color: '#374151' }}>Confirm New Password</label>
              <input type="password" required value={passwords.confirm} onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })} style={inputStyle} />
            </div>
          </div>
          <button type="submit" disabled={changingPassword} style={{
            marginTop: 20, background: '#374151', color: '#fff', border: 'none', borderRadius: 8,
            padding: '10px 24px', fontWeight: 600, cursor: 'pointer', fontSize: 14, opacity: changingPassword ? 0.6 : 1,
          }}>
            {changingPassword ? 'Changing...' : 'Change Password'}
          </button>
        </form>
      </section>
    </div>
  );
}
