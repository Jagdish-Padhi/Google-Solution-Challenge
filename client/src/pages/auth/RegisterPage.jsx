import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Tv, Camera, CheckCircle2, ArrowRight } from 'lucide-react';

import Button from '../../components/Button';
import Container from '../../components/Container';
import Input from '../../components/Input';
import api from '../../services/api.js';
import useAuthStore from '../../store/auth.store.js';
import SignInwithGoogle from './GoogleSignIn.jsx';

import useServerWarmup from '../../hooks/useServerWarmup.js';

const initialFormState = {
	orgName: '',
	email: '',
	password: '',
	confirmPassword: '',
};

export default function RegisterPage() {
	const [step, setStep] = useState(1);
	const [userType, setUserType] = useState('broadcaster');
	const [formData, setFormData] = useState(initialFormState);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const navigate = useNavigate();
	const setAuth = useAuthStore((state) => state.setAuth);
	const setTransitioning = useAuthStore((state) => state.setTransitioning);

	const { isReady, statusMessage } = useServerWarmup();

	const handleChange = (event) => {
		const { name, value } = event.target;
		setFormData((current) => ({ ...current, [name]: value }));
	};

	const isValidName = (name) => /^[A-Za-z][A-Za-z0-9 '\-.]{1,99}$/.test(name);
	const isValidEmail = (email) => /^[a-zA-Z0-9][a-zA-Z0-9._+\-]*@[a-zA-Z0-9][a-zA-Z0-9.\-]*\.[a-zA-Z]{2,}$/.test(email);

	const handleSubmit = async (event) => {
		event.preventDefault();

		if (!isReady) {
			toast.error('Please wait for production servers to finish warming up.');
			return;
		}

		const name = formData.orgName.trim();
		const email = formData.email.trim().toLowerCase();

		// ── Client-side validation ──────────────────────────────
		if (!name) {
			toast.error('Name is required.');
			return;
		}
		if (!isValidName(name)) {
			toast.error('Name must start with a letter and contain only letters, numbers, spaces, or hyphens.');
			return;
		}

		if (!email) {
			toast.error('Email address is required.');
			return;
		}
		if (!isValidEmail(email)) {
			toast.error('Please enter a valid email address (e.g. user@example.com).');
			return;
		}

		if (formData.password.length < 8) {
			toast.error('Password must be at least 8 characters.');
			return;
		}

		if (formData.password !== formData.confirmPassword) {
			toast.error('Passwords do not match.');
			return;
		}

		setIsSubmitting(true);
		setTransitioning(true, true);

		try {
			const response = await api.post('/auth/register', { ...formData, userType });
			setAuth({ user: response.data.organization, accessToken: response.data.accessToken });
			toast.success(userType === 'creator' ? 'Creator account created successfully.' : 'Organization registered successfully.');
			navigate(userType === 'creator' ? '/creator' : '/dashboard');
		} catch (error) {
			const message = error.response?.data?.errors?.[0] || error.response?.data?.message || 'Registration failed.';
			toast.error(message);
			setTransitioning(false);
			setIsSubmitting(false);
		}
	};

	const RoleCard = ({ type, icon: Icon, title, features, selected }) => (
		<div
			onClick={() => setUserType(type)}
			className={`relative cursor-pointer overflow-hidden rounded-2xl border-2 p-5 transition-all duration-200 ${
				selected 
					? 'border-(--app-color-primary) bg-(--app-color-primary)/5' 
					: 'border-(--app-color-border) bg-white hover:border-(--app-color-primary)/50'
			}`}
		>
			<div className='mb-4 flex items-center justify-between'>
				<div className={`flex h-10 w-10 items-center justify-center rounded-xl ${selected ? 'bg-(--app-color-primary) text-white' : 'bg-slate-100 text-slate-500'}`}>
					<Icon size={20} />
				</div>
				<div className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${selected ? 'border-(--app-color-primary) bg-(--app-color-primary)' : 'border-slate-200'}`}>
					{selected && <CheckCircle2 size={12} className='text-white' strokeWidth={4} />}
				</div>
			</div>
			<h3 className='mb-2 text-sm font-bold text-(--app-color-text)'>{title}</h3>
			<ul className='space-y-1.5'>
				{features.map((feature, i) => (
					<li key={i} className='flex items-center gap-2 text-xs text-(--app-color-text-muted)'>
						<div className='h-1 w-1 rounded-full bg-(--app-color-primary)/50' />
						{feature}
					</li>
				))}
			</ul>
		</div>
	);

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

					{/* Right Registration Section */}
					<section className='auth-form-slide flex flex-col justify-center p-8 lg:p-10' style={{ backgroundColor: 'var(--app-color-surface-glass)' }}>
						<div className='mx-auto w-full max-w-sm'>
							
							{step === 1 ? (
								<div className='animate-in fade-in slide-in-from-right-4 duration-300'>
									<div className='mb-6 text-center lg:text-left'>
										<h2 className='text-2xl font-bold tracking-tight text-(--app-color-text)'>
											Choose your account type
										</h2>
										<p className='mt-0.5 text-xs text-(--app-color-text-muted)'>
											Select the profile that best describes you
										</p>
									</div>

									<div className='space-y-4'>
										<RoleCard 
											type='broadcaster'
											icon={Tv}
											title='Sports Broadcaster / Rights Holder'
											features={['Manage multiple asset streams', 'Team-level analytics & API access', 'Advanced automated takedowns']}
											selected={userType === 'broadcaster'}
										/>
										<RoleCard 
											type='creator'
											icon={Camera}
											title='Photographer / Independent Creator'
											features={['Simple photo/video upload', 'Quick single-click scan for theft', 'Built-in DMCA reporting tools']}
											selected={userType === 'creator'}
										/>
									</div>

									<div className='mt-6 pt-2'>
										<Button onClick={() => setStep(2)} className='h-11 w-full rounded-xl text-sm font-bold shadow-lg shadow-(--app-color-primary)/20 flex items-center justify-center gap-2'>
											Continue <ArrowRight size={16} />
										</Button>
									</div>

									<p className='mt-6 text-center text-[11px] text-(--app-color-text-muted)'>
										Already have an account?{' '}
										<Link to='/login' className='font-black text-(--app-color-primary) hover:text-(--app-color-primary-hover)'>
											Sign in
										</Link>
									</p>
								</div>
							) : (
								<div className='animate-in fade-in slide-in-from-right-4 duration-300'>
									<div className='mb-4 text-center lg:text-left'>
										<button onClick={() => setStep(1)} className='mb-3 flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-(--app-color-text-muted) hover:text-(--app-color-text) transition-colors'>
											← Back to role
										</button>
										<h2 className='text-2xl font-bold tracking-tight text-(--app-color-text)'>
											{userType === 'creator' ? 'Create Creator Account' : 'Create Organization'}
										</h2>
										<p className='mt-0.5 text-xs text-(--app-color-text-muted)'>
											{userType === 'creator' ? 'Register your personal brand or name' : 'Register your organization workspace'}
										</p>
									</div>

									{!isReady && (
										<div className='mb-4 flex items-center justify-center gap-2 rounded-xl bg-amber-500/10 border border-amber-500/20 p-2.5 text-xs font-semibold text-amber-600 dark:text-amber-400 animate-pulse'>
											<span className='relative flex h-2 w-2'>
												<span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75'></span>
												<span className='relative inline-flex rounded-full h-2 w-2 bg-amber-500'></span>
											</span>
											<span>{statusMessage}</span>
										</div>
									)}

									<form className='space-y-3' onSubmit={handleSubmit}>
										<Input
											label={userType === 'creator' ? 'Your Name or Brand' : 'Organization Name'}
											name='orgName'
											value={formData.orgName}
											onChange={handleChange}
											required
											placeholder={userType === 'creator' ? 'Jane Doe Photography' : 'Example Sports Club'}
											className='h-10 rounded-xl border-(--app-color-border) bg-white text-sm focus:ring-2 focus:ring-(--app-color-primary)/20'
										/>
										<Input
											label={userType === 'creator' ? 'Email Address' : 'Work Email'}
											type='email'
											name='email'
											value={formData.email}
											onChange={handleChange}
											required
											placeholder={userType === 'creator' ? 'jane@example.com' : 'rights@clubname.com'}
											className='h-10 rounded-xl border-(--app-color-border) bg-white text-sm focus:ring-2 focus:ring-(--app-color-primary)/20'
										/>
										<div className='grid grid-cols-2 gap-3'>
											<Input
												label='Password'
												type='password'
												name='password'
												value={formData.password}
												onChange={handleChange}
												required
												placeholder='••••••••'
												className='h-10 rounded-xl border-(--app-color-border) bg-white text-sm focus:ring-2 focus:ring-(--app-color-primary)/20'
											/>
											<Input
												label='Confirm'
												type='password'
												name='confirmPassword'
												value={formData.confirmPassword}
												onChange={handleChange}
												required
												placeholder='••••••••'
												className='h-10 rounded-xl border-(--app-color-border) bg-white text-sm focus:ring-2 focus:ring-(--app-color-primary)/20'
											/>
										</div>

										<div className='pt-1'>
											<Button
												type='submit'
												className='h-10 w-full rounded-xl text-xs font-bold shadow-lg shadow-(--app-color-primary)/20 transition-all hover:scale-[1.01] active:scale-[0.99]'
												loading={isSubmitting}
												disabled={isSubmitting || !isReady}
											>
												{!isReady
													? 'Pinging Production Server...'
													: userType === 'creator'
													? 'Create Account'
													: 'Create Workspace'}
											</Button>
										</div>

										<div className='relative my-4'>
											<div className='absolute inset-0 flex items-center'><div className='w-full border-t border-(--app-color-border)/60'></div></div>
											<div className='relative flex justify-center text-[10px] uppercase'><span className='bg-white px-3 text-(--app-color-text-muted) font-black tracking-widest'>OR</span></div>
										</div>

										<div className='flex justify-center'>
											<SignInwithGoogle disabled={!isReady} serverWarmingText='Waking Up Production Server...' />
										</div>
									</form>
								</div>
							)}

						</div>
					</section>
				</div>
			)}
		</Container>
	);
}