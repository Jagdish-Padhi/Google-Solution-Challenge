import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

import Button from '../../components/Button';
import Card from '../../components/Card';
import Container from '../../components/Container';
import Input from '../../components/Input';
import api from '../../services/api.js';
import useAuthStore from '../../store/auth.store.js';

const initialFormState = {
  email: '',
  password: '',
};

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
    <Container className='flex min-h-screen items-center justify-center py-10'>
      <div className='grid w-full max-w-6xl gap-8 lg:grid-cols-[0.92fr_1.08fr]'>
        <Card className='border-white/80 bg-white/90 shadow-2xl shadow-slate-900/5' title='Welcome back' subtitle='Sign in to continue monitoring your organization.'>
          <form className='space-y-4' onSubmit={handleSubmit}>
            <Input label='Work email' type='email' name='email' value={formData.email} onChange={handleChange} required placeholder='team@example.com' />
            <Input label='Password' type='password' name='password' value={formData.password} onChange={handleChange} required placeholder='Enter your password' />

            <div className='pt-2'>
              <Button type='submit' className='w-full' loading={isSubmitting} disabled={isSubmitting}>
                Sign in
              </Button>
            </div>

            <p className='text-sm text-[var(--app-color-text-muted)]'>
              Need an account?{' '}
              <Link to='/register' className='font-semibold text-[var(--app-color-primary)] hover:text-[var(--app-color-primary-hover)]'>
                Register organization
              </Link>
            </p>
          </form>
        </Card>

        <section className='flex flex-col justify-between rounded-[2rem] border border-white/70 bg-[linear-gradient(160deg,_rgba(15,23,42,0.96),_rgba(15,118,110,0.92))] p-8 text-white shadow-2xl shadow-slate-900/10 lg:p-12'>
          <div className='space-y-6'>
            <span className='inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.24em]'>
              Protected access
            </span>
            <div className='space-y-4'>
              <h1 className='max-w-xl text-4xl font-semibold leading-tight lg:text-5xl'>
                Authenticate once, keep your dashboard session in sync.
              </h1>
              <p className='max-w-lg text-sm leading-6 text-white/80 lg:text-base'>
                This login flow uses a short-lived JWT access token and a rotated refresh token cookie so the dashboard can stay protected without forcing constant re-authentication.
              </p>
            </div>
          </div>

          <div className='grid gap-4 sm:grid-cols-3'>
            {[
              ['Access token', 'Bearer'],
              ['Refresh cookie', 'HttpOnly'],
              ['Dashboard', 'Private'],
            ].map(([label, value]) => (
              <div key={label} className='rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm'>
                <p className='text-xs uppercase tracking-[0.24em] text-white/65'>{label}</p>
                <p className='mt-2 text-2xl font-semibold'>{value}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </Container>
  );
}
