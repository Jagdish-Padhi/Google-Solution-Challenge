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

const readinessBlocks = [
	['Asset Fingerprints', 'Prepared'],
	['Web Discovery', 'Planned'],
	['Violation Evidence', 'Traceable'],
];

const onboardingSteps = [
	'Register your organization profile and ownership identity.',
	'Access your protected dashboard and team-level metrics.',
	'Begin asset onboarding and continuous scan monitoring.',
];

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
		<Container className='flex min-h-screen items-center justify-center py-10 lg:py-16'>
			<div className='grid w-full max-w-6xl overflow-hidden rounded-4xl border border-(--app-color-border) backdrop-blur-sm lg:grid-cols-[1.02fr_0.98fr]' style={{ backgroundColor: 'var(--app-color-surface-glass)', boxShadow: 'var(--app-shadow-elevated)' }}>
				<section className='border-b border-(--app-color-border) p-8 text-white lg:border-b-0 lg:border-r lg:p-10' style={{ background: 'var(--app-gradient-auth-register)' }}>
					<p className='inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em]'>
						Organization Onboarding
					</p>

					<h1 className='mt-5 max-w-lg text-3xl font-semibold leading-tight lg:text-4xl'>
						Create your secure rights-protection workspace.
					</h1>

					<p className='mt-4 max-w-xl text-sm leading-6 text-white/85 lg:text-base'>
						SportShield helps sports organizations register content, detect unauthorized distribution, and maintain evidence-backed reporting workflows.
					</p>

					<div className='mt-8 space-y-3'>
						{onboardingSteps.map((step, index) => (
							<div key={step} className='flex items-start gap-3 rounded-xl border border-white/15 bg-white/10 px-4 py-3'>
								<span className='mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full border border-white/35 text-xs font-semibold'>
									{index + 1}
								</span>
								<p className='text-sm text-white/90'>{step}</p>
							</div>
						))}
					</div>

					<div className='mt-8 grid gap-3 sm:grid-cols-3'>
						{readinessBlocks.map(([label, value]) => (
							<div key={label} className='rounded-xl border border-white/15 bg-black/15 px-3 py-3'>
								<p className='text-[11px] uppercase tracking-[0.16em] text-white/65'>{label}</p>
								<p className='mt-1 text-sm font-semibold text-white'>{value}</p>
							</div>
						))}
					</div>
				</section>

				<section className='p-6 sm:p-8 lg:p-10' style={{ backgroundColor: 'var(--app-color-surface-glass)' }}>
					<Card
						className='border-(--app-color-border) bg-white/95 shadow-lg shadow-slate-900/5'
						style={{ backgroundColor: 'var(--app-color-surface-panel)' }}
						title='Register Organization'
						subtitle='Set up credentials for your team security workspace.'
					>
						<form className='space-y-4' onSubmit={handleSubmit}>
							<Input
								label='Organization name'
								name='orgName'
								value={formData.orgName}
								onChange={handleChange}
								required
								placeholder='Example Sports Club'
							/>
							<Input
								label='Work email'
								type='email'
								name='email'
								value={formData.email}
								onChange={handleChange}
								required
								placeholder='rights@clubname.com'
							/>
							<Input
								label='Password'
								type='password'
								name='password'
								value={formData.password}
								onChange={handleChange}
								required
								placeholder='Create a strong password'
								helperText='Use at least 8 characters.'
							/>
							<Input
								label='Confirm password'
								type='password'
								name='confirmPassword'
								value={formData.confirmPassword}
								onChange={handleChange}
								required
								placeholder='Re-enter your password'
							/>

							<div className='rounded-xl border border-(--app-color-border) bg-(--app-color-surface-elevated) px-4 py-3'>
								<p className='text-xs font-semibold uppercase tracking-[0.14em] text-(--app-color-text-muted)'>Security baseline</p>
								<p className='mt-1 text-sm text-(--app-color-text)'>
									New accounts start on protected auth and organization-scoped access control.
								</p>
							</div>

							<div className='pt-2'>
								<Button type='submit' className='w-full' loading={isSubmitting} disabled={isSubmitting}>
									Create workspace
								</Button>
							</div>

							<p className='text-sm text-(--app-color-text-muted)'>
								Already registered?{' '}
								<Link to='/login' className='font-semibold text-(--app-color-primary) hover:text-(--app-color-primary-hover)'>
									Sign in
								</Link>
							</p>
						</form>
					</Card>
				</section>
			</div>
		</Container>
	);
}