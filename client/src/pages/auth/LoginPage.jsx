import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

import Button from '../../components/Button';
import Card from '../../components/Card';
import Container from '../../components/Container';
import Input from '../../components/Input';
import api from '../../services/api.js';
import useAuthStore from '../../store/auth.store.js';
import SignInwithGoogle from './GoogleSignIn.jsx';

const initialFormState = {
  email: '',
  password: '',
};

const securityChecks = [
  'Access tokens expire automatically every 15 minutes.',
  'Refresh sessions are rotated and revocable on logout.',
  'Protected routes require verified organization context.',
];

const systemStatus = [
  ['Detection Pipeline', 'Operational'],
  ['Credential Layer', 'Hardened'],
  ['Organization Scope', 'Isolated'],
];

export default function LoginPage() {
  const [formData, setFormData] = useState(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await api.post('/auth/login', formData);
      setAuth({ user: response.data.organization, accessToken: response.data.accessToken });
      toast.success('Logged in successfully.');
      navigate('/dashboard');
    } catch (error) {
      const message = error.response?.data?.errors?.[0] || error.response?.data?.message || 'Login failed.';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container className='flex min-h-screen items-center justify-center py-10 lg:py-16'>
      <div className='grid w-full max-w-6xl overflow-hidden rounded-4xl border border-(--app-color-border) backdrop-blur-sm lg:grid-cols-[1.05fr_0.95fr]' style={{ backgroundColor: 'var(--app-color-surface-glass)', boxShadow: 'var(--app-shadow-elevated)' }}>
        <section className='border-b border-(--app-color-border) p-8 text-white lg:border-b-0 lg:border-r lg:p-10' style={{ background: 'var(--app-gradient-auth-login)' }}>
          <p className='inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em]'>
            SportShield Security Access
          </p>

          <h1 className='mt-5 max-w-lg text-3xl font-semibold leading-tight lg:text-4xl'>
            Rights monitoring platform for serious organizations.
          </h1>

          <p className='mt-4 max-w-xl text-sm leading-6 text-white/80 lg:text-base'>
            Sign in to review violations, scans, and risk signals for your protected sports media. Every session is authenticated, scoped, and auditable.
          </p>

          <div className='mt-8 space-y-3'>
            {securityChecks.map((item) => (
              <div key={item} className='flex items-start gap-3 rounded-xl border border-white/15 bg-white/8 px-4 py-3'>
                <span className='mt-1 h-2 w-2 rounded-full bg-emerald-300' />
                <p className='text-sm text-white/90'>{item}</p>
              </div>
            ))}
          </div>

          <div className='mt-8 grid gap-3 sm:grid-cols-3'>
            {systemStatus.map(([label, value]) => (
              <div key={label} className='rounded-xl border border-white/15 bg-black/15 px-3 py-3'>
                <p className='text-[11px] uppercase tracking-[0.16em] text-white/65'>{label}</p>
                <p className='mt-1 text-sm font-semibold text-white'>{value}</p>
              </div>
            ))}
          </div>
        </section>

        <section className='p-6 sm:p-8 lg:p-10' style={{ backgroundColor: 'var(--app-color-surface-glass)' }}>
          <Card
            className='border-(--app-color-border) shadow-lg shadow-slate-900/5'
            style={{ backgroundColor: 'var(--app-color-surface-panel)' }}
            title='Organization Sign In'
            subtitle='Use your organization credentials to access the protected dashboard.'
          >
            <form className='space-y-4' onSubmit={handleSubmit}>
              <Input
                label='Work email'
                type='email'
                name='email'
                value={formData.email}
                onChange={handleChange}
                required
                placeholder='security@clubname.com'
              />
              <Input
                label='Password'
                type='password'
                name='password'
                value={formData.password}
                onChange={handleChange}
                required
                placeholder='Enter password'
              />

              <div className='rounded-xl border border-(--app-color-border) bg-(--app-color-surface-elevated) px-4 py-3'>
                <p className='text-xs font-semibold uppercase tracking-[0.14em] text-(--app-color-text-muted)'>Session policy</p>
                <p className='mt-1 text-sm text-(--app-color-text)'>
                  Automatic expiry and secure refresh are enabled for every login.
                </p>
              </div>

              <div className='pt-2'>
                <Button type='submit' className='w-full' loading={isSubmitting} disabled={isSubmitting}>
                  Sign in to dashboard
                </Button>
              </div>

              <p className='text-sm text-(--app-color-text-muted)'>
                Need an organization account?{' '}
                <Link to='/register' className='font-semibold text-(--app-color-primary) hover:text-(--app-color-primary-hover)'>
                  Register now
                </Link>
              </p>
            </form>
            <SignInwithGoogle/>
          </Card>
        </section>
      </div>
    </Container>
  );
}
