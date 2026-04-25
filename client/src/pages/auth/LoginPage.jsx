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
import GlobalLoader from '../../components/loaders/GlobalLoader.jsx';

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
  const setTransitioning = useAuthStore((state) => state.setTransitioning);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setTransitioning(true, true);

    try {
      const response = await api.post('/auth/login', formData);
      setAuth({ user: response.data.organization, accessToken: response.data.accessToken });
      toast.success('Logged in successfully.');
      navigate('/dashboard');
    } catch (error) {
      const message = error.response?.data?.errors?.[0] || error.response?.data?.message || 'Login failed.';
      toast.error(message);
      setTransitioning(false);
      setIsSubmitting(false);
    }
  };

  return (
    <Container className='flex min-h-screen items-center justify-center py-4 lg:py-6'>
      {!isSubmitting && (
        <div className='grid w-full max-w-6xl overflow-hidden rounded-[2.5rem] border border-(--app-color-border)/40 backdrop-blur-md lg:grid-cols-[1.1fr_0.9fr]' style={{ backgroundColor: 'var(--app-color-surface-glass)', boxShadow: 'var(--app-shadow-elevated)' }}>
          {/* Left Branding Section */}
          <section className='relative flex flex-col items-center justify-center overflow-hidden p-8 text-center text-white lg:p-12' style={{ background: 'var(--app-gradient-auth-login)' }}>
            <div className='noise-overlay pointer-events-none opacity-20' />
            
            <div className='relative z-10 flex flex-col items-center'>
              <div className='flex flex-col items-center gap-6'>
                <img src='/logo.png' alt='SportShield Logo' className='h-36 w-36 object-contain filter drop-shadow-2xl' />
                <div className='h-[3px] w-16 rounded-full bg-emerald-400' />
              </div>

              <div className='mt-8'>
                <h1 className='text-4xl font-black uppercase tracking-tighter lg:text-5xl italic skew-x-[-6deg]'>
                  You Created It. <br />
                  <span className='text-teal-400'>
                    <span className='text-white font-black italic underline decoration-teal-500/60 underline-offset-4'>Don't Let</span> Someone Else Own It.
                  </span>
                </h1>
                <p className='mx-auto mt-4 max-w-sm text-lg font-bold leading-tight text-white/70'>
                  Protecting your creativity with enterprise-grade intelligence.
                </p>
              </div>

              <div className='mt-10 grid grid-cols-2 gap-x-8 gap-y-4 px-4 text-left'>
                {[
                  'Real-time detection',
                  'AI DMCA automation',
                  'Fingerprint matching',
                  'Secure analytics'
                ].map((feature) => (
                  <div key={feature} className='flex items-center gap-2.5'>
                    <div className='flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400'>
                      <svg className='h-3 w-3' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={4}>
                        <path strokeLinecap='round' strokeLinejoin='round' d='M5 13l4 4L19 7' />
                      </svg>
                    </div>
                    <span className='whitespace-nowrap text-xs font-black uppercase tracking-wider text-white/90'>{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className='absolute bottom-6 left-0 right-0 z-10 flex items-center justify-between px-10 text-[9px] font-black uppercase tracking-[0.3em] text-white/25'>
              <p>© 2026 SportShield</p>
              <p>Enterprise Protection</p>
            </div>
          </section>

          {/* Right Login Form Section */}
          <section className='auth-form-slide flex flex-col justify-center p-8 lg:p-12' style={{ backgroundColor: 'var(--app-color-surface-glass)' }}>
            <div className='mx-auto w-full max-w-sm'>
              <div className='mb-8 text-center lg:text-left'>
                <h2 className='text-3xl font-bold tracking-tight text-(--app-color-text)'>
                  Welcome back
                </h2>
                <p className='mt-1 text-sm text-(--app-color-text-muted)'>
                  Sign in to your organization dashboard
                </p>
              </div>

              <form className='space-y-4' onSubmit={handleSubmit}>
                <Input
                  label='Organization Email'
                  type='email'
                  name='email'
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder='security@yourclub.com'
                  className='h-11 rounded-xl border-(--app-color-border) bg-white focus:ring-2 focus:ring-(--app-color-primary)/20'
                />
                <div className='space-y-1'>
                  <div className='flex items-center justify-between'>
                    <label className='text-sm font-semibold text-(--app-color-text)'>Password</label>
                    <a href='#' className='text-xs font-medium text-(--app-color-primary) hover:underline'>Forgot password?</a>
                  </div>
                  <Input
                    type='password'
                    name='password'
                    value={formData.password}
                    onChange={handleChange}
                    required
                    placeholder='••••••••'
                    className='h-11 rounded-xl border-(--app-color-border) bg-white focus:ring-2 focus:ring-(--app-color-primary)/20'
                  />
                </div>

                <div className='pt-1'>
                  <Button type='submit' className='h-11 w-full rounded-xl text-sm font-bold shadow-lg shadow-(--app-color-primary)/20 transition-all hover:scale-[1.01] active:scale-[0.99]' loading={isSubmitting} disabled={isSubmitting}>
                    Access Secure Portal
                  </Button>
                </div>

                <div className='relative my-6'>
                  <div className='absolute inset-0 flex items-center'><div className='w-full border-t border-(--app-color-border)/60'></div></div>
                  <div className='relative flex justify-center text-xs uppercase'><span className='bg-white px-4 text-(--app-color-text-muted) font-black tracking-widest'>OR</span></div>
                </div>

                <div className='flex justify-center'>
                  <SignInwithGoogle />
                </div>

                <p className='mt-8 text-center text-xs text-(--app-color-text-muted)'>
                  Don't have an account?{' '}
                  <Link to='/register' className='font-black text-(--app-color-primary) hover:text-(--app-color-primary-hover)'>
                    Request Access
                  </Link>
                </p>
              </form>
            </div>
          </section>
        </div>
      )}
    </Container>
  );
}
