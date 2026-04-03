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
	orgName: '',
	email: '',
	password: '',
	confirmPassword: '',
};

export default function RegisterPage() {
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

		if (formData.password !== formData.confirmPassword) {
			toast.error('Passwords do not match.');
			return;
		}

		setIsSubmitting(true);

		try {
			const response = await api.post('/auth/register', formData);
			setAuth({ user: response.data.organization, accessToken: response.data.accessToken });
			toast.success('Organization registered successfully.');
			navigate('/dashboard');
		} catch (error) {
			const message = error.response?.data?.errors?.[0] || error.response?.data?.message || 'Registration failed.';
			toast.error(message);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Container className='flex min-h-screen items-center justify-center py-10'>
			<div className='grid w-full max-w-6xl gap-8 lg:grid-cols-[1.1fr_0.9fr]'>
				<section className='flex flex-col justify-between rounded-4xl border border-white/70 bg-[linear-gradient(160deg,rgba(15,118,110,0.96),rgba(37,99,235,0.92))] p-8 text-white shadow-2xl shadow-slate-900/10 lg:p-12'>
					<div className='space-y-6'>
						<span className='inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.24em]'>
							SportShield
						</span>
						<div className='space-y-4'>
							<h1 className='max-w-xl text-4xl font-semibold leading-tight lg:text-5xl'>
								Register your organization and start protecting content.
							</h1>
							<p className='max-w-lg text-sm leading-6 text-white/85 lg:text-base'>
								Phase 1 gives you the authenticated foundation: create an organization, log in securely, and land on a private dashboard with real session handling.
							</p>
						</div>
					</div>

					<div className='mt-10 grid gap-4 sm:grid-cols-3'>
						{[
							['JWT access', '15 min'],
							['Refresh token', '7 days'],
							['Protected routes', 'Ready'],
						].map(([label, value]) => (
							<div key={label} className='rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm'>
								<p className='text-xs uppercase tracking-[0.24em] text-white/65'>{label}</p>
								<p className='mt-2 text-2xl font-semibold'>{value}</p>
							</div>
						))}
					</div>
				</section>

				<Card className='border-white/80 bg-white/90 shadow-2xl shadow-slate-900/5' title='Create your account' subtitle='Use a work email to register your team organization.'>
					<form className='space-y-4' onSubmit={handleSubmit}>
						<Input label='Organization name' name='orgName' value={formData.orgName} onChange={handleChange} required placeholder='Test FC' />
						<Input label='Work email' type='email' name='email' value={formData.email} onChange={handleChange} required placeholder='team@example.com' />
						<Input label='Password' type='password' name='password' value={formData.password} onChange={handleChange} required placeholder='Create a strong password' helperText='Minimum 8 characters' />
						<Input label='Confirm password' type='password' name='confirmPassword' value={formData.confirmPassword} onChange={handleChange} required placeholder='Repeat password' />

						<div className='pt-2'>
							<Button type='submit' className='w-full' loading={isSubmitting} disabled={isSubmitting}>
								Register organization
							</Button>
						</div>

						<p className='text-sm text-(--app-color-text-muted)'>
							Already have an account?{' '}
							<Link to='/login' className='font-semibold text-(--app-color-primary) hover:text-(--app-color-primary-hover)'>
								Sign in
							</Link>
						</p>
					</form>
				</Card>
			</div>
		</Container>
	);
}