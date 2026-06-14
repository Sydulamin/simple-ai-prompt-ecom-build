import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { User, Loader2, CheckCircle } from 'lucide-react';
import { selectUser } from '../store/authSlice.js';
import api from '../utils/api.js';
import { toast } from '../hooks/useToast.js';

export default function ProfilePage() {
  const dispatch  = useDispatch();
  const user      = useSelector(selectUser);

  const [form, setForm] = useState({
    name:  user?.name  || '',
    phone: user?.phone || '',
  });
  const [saving,   setSaving]   = useState(false);
  const [pwForm,   setPwForm]   = useState({ current: '', newPw: '', confirm: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const [showPw,   setShowPw]   = useState(false);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/auth/profile', form);
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (pwForm.newPw !== pwForm.confirm) {
      toast.error('New passwords do not match');
      return;
    }
    if (pwForm.newPw.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setPwSaving(true);
    try {
      await api.put('/auth/password', { currentPassword: pwForm.current, newPassword: pwForm.newPw });
      toast.success('Password changed successfully');
      setPwForm({ current: '', newPw: '', confirm: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setPwSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your account details</p>
      </div>

      {/* Avatar / info banner */}
      <div className="card p-5 flex items-center gap-4">
        <div className="w-14 h-14 bg-brand-100 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-brand-700 text-2xl font-bold">
            {user?.name?.charAt(0).toUpperCase()}
          </span>
        </div>
        <div>
          <p className="font-semibold text-gray-900">{user?.name}</p>
          <p className="text-sm text-gray-500">{user?.email}</p>
          <span className={`badge text-xs mt-1 ${user?.role === 'admin' ? 'bg-brand-100 text-brand-700' : 'bg-gray-100 text-gray-600'}`}>
            {user?.role}
          </span>
        </div>
      </div>

      {/* Profile form */}
      <div className="card p-5">
        <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <User size={16} /> Personal Information
        </h2>
        <form onSubmit={handleProfileSave} className="space-y-4">
          <div>
            <label htmlFor="p-name" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              id="p-name"
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="input"
            />
          </div>
          <div>
            <label htmlFor="p-email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              id="p-email"
              type="email"
              disabled
              value={user?.email || ''}
              className="input bg-gray-50 cursor-not-allowed opacity-60"
            />
            <p className="text-xs text-gray-400 mt-1">Email cannot be changed.</p>
          </div>
          <div>
            <label htmlFor="p-phone" className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              id="p-phone"
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="input"
              placeholder="01700000000"
            />
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? <><Loader2 size={15} className="animate-spin" /> Saving…</> : <><CheckCircle size={15} /> Save Changes</>}
            </button>
          </div>
        </form>
      </div>

      {/* Change password */}
      <div className="card p-5">
        <h2 className="font-semibold text-gray-800 mb-4">Change Password</h2>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label htmlFor="cp-curr" className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
            <input
              id="cp-curr"
              type={showPw ? 'text' : 'password'}
              required
              value={pwForm.current}
              onChange={(e) => setPwForm({ ...pwForm, current: e.target.value })}
              className="input"
              autoComplete="current-password"
            />
          </div>
          <div>
            <label htmlFor="cp-new" className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
            <input
              id="cp-new"
              type={showPw ? 'text' : 'password'}
              required
              minLength={8}
              value={pwForm.newPw}
              onChange={(e) => setPwForm({ ...pwForm, newPw: e.target.value })}
              className="input"
              autoComplete="new-password"
            />
          </div>
          <div>
            <label htmlFor="cp-confirm" className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
            <input
              id="cp-confirm"
              type={showPw ? 'text' : 'password'}
              required
              value={pwForm.confirm}
              onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })}
              className="input"
              autoComplete="new-password"
            />
          </div>
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-gray-500 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showPw}
                onChange={(e) => setShowPw(e.target.checked)}
                className="accent-brand-600"
              />
              Show passwords
            </label>
            <button type="submit" disabled={pwSaving} className="btn-primary">
              {pwSaving ? <><Loader2 size={15} className="animate-spin" /> Changing…</> : 'Change Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
