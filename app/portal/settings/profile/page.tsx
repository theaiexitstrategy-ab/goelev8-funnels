'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

const C = {
  blk: '#000', card: '#0e0e0e', b1: '#181818', b2: '#202020',
  cyan: '#00CFFF', grn: '#00FF94', red: '#FF3B3B', wh: '#F5F5F5', wh2: '#999', mu: '#4a4a4a',
};

export default function ProfilePage() {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [userId, setUserId] = useState('');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [pwMsg, setPwMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/auth/login'); return; }
      setEmail(session.user.email || '');
      setUserId(session.user.id);
      const { data: profile } = await supabase
        .from('users')
        .select('full_name, business_name')
        .eq('id', session.user.id)
        .single();
      if (profile) {
        setFullName(profile.full_name || '');
        setBusinessName(profile.business_name || '');
      }
      setLoading(false);
    };
    load();
  }, []);

  const handleUpdateProfile = async () => {
    setSaving(true);
    setProfileMsg(null);
    const { error } = await supabase
      .from('users')
      .update({ full_name: fullName, business_name: businessName })
      .eq('id', userId);
    if (error) {
      setProfileMsg({ type: 'error', text: error.message });
    } else {
      setProfileMsg({ type: 'success', text: 'Profile updated successfully.' });
    }
    setSaving(false);
  };

  const handleUpdatePassword = async () => {
    setPwMsg(null);
    if (newPassword !== confirmPassword) {
      setPwMsg({ type: 'error', text: 'Passwords do not match.' });
      return;
    }
    if (newPassword.length < 8) {
      setPwMsg({ type: 'error', text: 'Password must be at least 8 characters.' });
      return;
    }
    setPwSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setPwMsg({ type: 'error', text: error.message });
    } else {
      setPwMsg({ type: 'success', text: 'Password updated successfully.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
    setPwSaving(false);
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 16px', background: C.b1, border: `1px solid ${C.b2}`,
    borderRadius: 1, color: C.wh, fontFamily: 'DM Sans, sans-serif', fontSize: 14,
    outline: 'none', boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block', color: C.wh2, fontSize: 13, marginBottom: 6,
    fontFamily: 'DM Sans, sans-serif',
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', background: C.blk, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: C.cyan, fontFamily: 'Bebas Neue, sans-serif', fontSize: 24 }}>Loading...</div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: C.blk, color: C.wh, fontFamily: 'DM Sans, sans-serif', padding: '40px 24px' }}>
      <div style={{ maxWidth: 560, margin: '0 auto' }}>
        <h1 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 40, color: C.cyan, margin: '0 0 32px' }}>
          Profile
        </h1>

        {/* Profile Info */}
        <div style={{ background: C.card, border: `1px solid ${C.b2}`, borderRadius: 1, padding: 28, marginBottom: 32 }}>
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Full Name</label>
            <input value={fullName} onChange={e => setFullName(e.target.value)} style={inputStyle} placeholder="Your full name" />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Email</label>
            <input value={email} readOnly style={{ ...inputStyle, opacity: 0.5, cursor: 'not-allowed' }} />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Business Name</label>
            <input value={businessName} onChange={e => setBusinessName(e.target.value)} style={inputStyle} placeholder="Your business name" />
          </div>

          {profileMsg && (
            <p style={{ color: profileMsg.type === 'success' ? C.grn : C.red, fontSize: 13, margin: '0 0 16px' }}>
              {profileMsg.text}
            </p>
          )}

          <button onClick={handleUpdateProfile} disabled={saving} style={{
            padding: '12px 32px', background: C.cyan, color: C.blk, border: 'none',
            borderRadius: 1, fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 14,
            cursor: 'pointer', opacity: saving ? 0.6 : 1,
          }}>
            {saving ? 'Saving...' : 'Update Profile'}
          </button>
        </div>

        {/* Change Password */}
        <div style={{ background: C.card, border: `1px solid ${C.b2}`, borderRadius: 1, padding: 28 }}>
          <h2 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 24, color: C.wh, margin: '0 0 20px' }}>Change Password</h2>
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Current Password</label>
            <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} style={inputStyle} />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>New Password</label>
            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} style={inputStyle} />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Confirm Password</label>
            <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} style={inputStyle} />
          </div>

          {pwMsg && (
            <p style={{ color: pwMsg.type === 'success' ? C.grn : C.red, fontSize: 13, margin: '0 0 16px' }}>
              {pwMsg.text}
            </p>
          )}

          <button onClick={handleUpdatePassword} disabled={pwSaving} style={{
            padding: '12px 32px', background: C.cyan, color: C.blk, border: 'none',
            borderRadius: 1, fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 14,
            cursor: 'pointer', opacity: pwSaving ? 0.6 : 1,
          }}>
            {pwSaving ? 'Updating...' : 'Update Password'}
          </button>
        </div>

        <p style={{ color: C.mu, fontSize: 12, textAlign: 'center', marginTop: 48 }}>
          &copy; 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
        </p>
      </div>
    </div>
  );
}
