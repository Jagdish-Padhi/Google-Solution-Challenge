import { useCallback, useEffect, useState } from 'react';
import { Bell, Camera, Mail, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

import { Badge, Button, Card, Spinner, Loader } from '../../components';
import api from '../../services/api.js';
import useAuthStore from '../../store/auth.store.js';

export default function CreatorAccountPage() {
  const { user } = useAuthStore();
  const [profile, setProfile] = useState(null);
  const [prefs, setPrefs] = useState({ emailDigest: true, emailOnHighConfidence: true });
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    try {
      const response = await api.get('/organization/me');
      const organization = response.data.organization || {};
      setProfile(organization);
      setPrefs({
        emailDigest: organization.notificationPrefs?.emailDigest ?? true,
        emailOnHighConfidence: organization.notificationPrefs?.emailOnHighConfidence ?? true,
      });
    } catch {
      toast.error('Unable to load account details.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    document.title = 'Account — SportShield Creator';
    loadProfile();
  }, [loadProfile]);

  const handleSavePrefs = async () => {
    setIsSaving(true);
    try {
      await api.patch('/organization/notification-prefs', prefs);
      toast.success('Notification preferences updated.');
    } catch {
      toast.error('Unable to save notification preferences.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className='flex h-full flex-col items-center justify-center gap-6 py-24 text-sm text-(--app-color-text-muted)'>
        <Loader size={0.7} />
        <p className='font-bold uppercase tracking-widest animate-pulse'>Loading account...</p>
      </div>
    );
  }

  return (
    <div className='mx-auto max-w-5xl space-y-8 p-6 lg:p-10'>
      <div>
        <h1 className='text-3xl font-black tracking-tight text-(--app-color-text)'>My Account</h1>
        <p className='text-base text-(--app-color-text-muted)'>Manage your creator profile and how you receive protection updates.</p>
      </div>

      <div className='grid gap-6 lg:grid-cols-[1.1fr_0.9fr]'>
        <Card className='border-(--app-color-border) shadow-sm'>
          <div className='space-y-5 p-6'>
            <div className='flex items-start justify-between gap-4'>
              <div>
                <p className='text-[10px] font-black uppercase tracking-[0.25em] text-(--app-color-text-muted)'>Profile</p>
                <h2 className='mt-2 text-xl font-black text-(--app-color-text)'>{profile?.orgName || user?.orgName || 'Independent Creator'}</h2>
                <p className='mt-1 text-sm text-(--app-color-text-muted)'>{profile?.email || user?.email}</p>
              </div>
              <Badge variant='primary' size='sm' className='bg-(--app-color-primary)/10 text-(--app-color-primary)'>Creator</Badge>
            </div>
            <div className='rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-800'>
              <p className='font-semibold'>Your Protection Summary</p>
              <p className='mt-1'>Protected since {new Date(profile?.createdAt || user?.createdAt || Date.now()).toLocaleDateString([], { month: 'long', year: 'numeric' })}.</p>
            </div>
            <div className='rounded-2xl border border-(--app-color-border) bg-slate-50 p-4'>
              <div className='flex items-center gap-3'>
                <div className='flex h-10 w-10 items-center justify-center rounded-xl bg-(--app-color-primary-soft) text-(--app-color-primary)'>
                  <Camera size={18} />
                </div>
                <div>
                  <p className='text-sm font-bold text-(--app-color-text)'>Registered as: Creator</p>
                  <p className='text-xs text-(--app-color-text-muted)'>Creator accounts protect individual works. For team access, contact us about broadcaster plans.</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card className='border-(--app-color-border) shadow-sm'>
          <div className='space-y-5 p-6'>
            <div>
              <p className='text-[10px] font-black uppercase tracking-[0.25em] text-(--app-color-text-muted)'>Notification preferences</p>
              <h2 className='mt-2 text-xl font-black text-(--app-color-text)'>Stay on top of theft alerts</h2>
            </div>
            <div className='space-y-4 rounded-2xl border border-(--app-color-border) bg-slate-50/60 p-4'>
              {[
                ['emailOnHighConfidence', 'Email me when new theft is found', 'Receive an alert as soon as a likely infringement is detected.'],
                ['emailDigest', 'Weekly protection summary', 'A short digest of findings and next actions every week.'],
              ].map(([key, title, copy]) => (
                <label key={key} className='flex items-start justify-between gap-4 rounded-xl border border-(--app-color-border) bg-white p-4'>
                  <div>
                    <p className='text-sm font-semibold text-(--app-color-text)'>{title}</p>
                    <p className='text-xs text-(--app-color-text-muted)'>{copy}</p>
                  </div>
                  <input
                    type='checkbox'
                    checked={prefs[key]}
                    onChange={(e) => setPrefs((prev) => ({ ...prev, [key]: e.target.checked }))}
                    className='mt-1 h-4 w-4 rounded border-slate-300 text-(--app-color-primary) focus:ring-(--app-color-primary)'
                  />
                </label>
              ))}
            </div>
            <Button onClick={handleSavePrefs} disabled={isSaving} className='w-full'>
              {isSaving ? 'Saving...' : 'Save preferences'}
            </Button>
          </div>
        </Card>
      </div>

      <Card className='border-(--app-color-border) shadow-sm'>
        <div className='grid gap-4 p-6 md:grid-cols-3'>
          <div className='rounded-2xl bg-slate-50 p-4'>
            <Mail size={16} className='text-(--app-color-primary)' />
            <p className='mt-3 text-[10px] font-black uppercase tracking-[0.25em] text-(--app-color-text-muted)'>Email</p>
            <p className='text-sm font-semibold text-(--app-color-text)'>{profile?.email || user?.email}</p>
          </div>
          <div className='rounded-2xl bg-slate-50 p-4'>
            <Shield size={16} className='text-emerald-600' />
            <p className='mt-3 text-[10px] font-black uppercase tracking-[0.25em] text-(--app-color-text-muted)'>Status</p>
            <p className='text-sm font-semibold text-(--app-color-text)'>Protection active</p>
          </div>
          <div className='rounded-2xl bg-slate-50 p-4'>
            <Bell size={16} className='text-amber-600' />
            <p className='mt-3 text-[10px] font-black uppercase tracking-[0.25em] text-(--app-color-text-muted)'>Plan</p>
            <p className='text-sm font-semibold text-(--app-color-text)'>{profile?.plan || 'Creator'}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
