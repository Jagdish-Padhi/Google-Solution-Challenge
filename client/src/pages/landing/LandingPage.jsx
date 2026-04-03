import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
	ArrowRight,
	BarChart3,
	BellRing,
	FileSearch,
	Globe2,
	Layers3,
	LockKeyhole,
	Radar,
	ShieldCheck,
	Workflow,
} from 'lucide-react';

import { Button, Container, Header } from '../../components';

const navItems = [
	{ label: 'Product', href: '#product' },
	{ label: 'Capabilities', href: '#capabilities' },
	{ label: 'Security', href: '#security' },
	{ label: 'Contact', href: '#contact' },
];

const featureCards = [
	{
		title: 'Always-on fingerprinting',
		description: 'Register images and video clips with multi-signal fingerprints that hold up through crop, compression, reposting, and re-encoding.',
		icon: ShieldCheck,
		accent: 'from-sky-500/20 to-cyan-500/10',
	},
	{
		title: 'Public web discovery',
		description: 'Scan social platforms, open web sources, and repeat offender domains with scheduled sweeps and coordinated monitoring.',
		icon: Radar,
		accent: 'from-emerald-500/20 to-teal-500/10',
	},
	{
		title: 'Evidence you can act on',
		description: 'Every match can carry screenshots, confidence scores, source details, and an audit trail for downstream review.',
		icon: FileSearch,
		accent: 'from-amber-500/20 to-orange-500/10',
	},
	{
		title: 'Alerting that stays current',
		description: 'Surface high-confidence violations through unread badges, dashboards, and notification-ready workflows.',
		icon: BellRing,
		accent: 'from-violet-500/20 to-fuchsia-500/10',
	},
	{
		title: 'Board-ready analytics',
		description: 'Turn violation activity into decision-grade reporting with trends, source mix, and resolution metrics.',
		icon: BarChart3,
		accent: 'from-indigo-500/20 to-blue-500/10',
	},
	{
		title: 'Global distribution ready',
		description: 'Built for distributed teams that need a secure, scalable command center for content protection operations.',
		icon: Globe2,
		accent: 'from-slate-500/20 to-slate-700/10',
	},
];

const workflowSteps = [
	{
		title: 'Register assets',
		description: 'Securely onboard protected content with organization-scoped access and fingerprint metadata.',
		symbol: '01',
	},
	{
		title: 'Monitor the web',
		description: 'Continuously scan public channels for reposts, mirrors, and unauthorized distribution.',
		symbol: '02',
	},
	{
		title: 'Review evidence',
		description: 'Validate matches with screenshots, confidence signals, and a clear source history.',
		symbol: '03',
	},
	{
		title: 'Coordinate response',
		description: 'Use alerts and reporting to move quickly from detection to enforcement.',
		symbol: '04',
	},
];

const trustItems = ['Built for rights holders', 'Fast team onboarding', 'Real-time monitoring', 'Evidence-led workflow'];

const securityItems = [
	'Only authorized team members can access and manage protected content.',
	'Workspace activity is continuously monitored for accountability and control.',
	'Every action is traceable, so your team can respond with confidence.',
];

function useScrollReveal() {
	useEffect(() => {
		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						entry.target.classList.add('is-visible');
					}
				});
			},
			{ threshold: 0.16, rootMargin: '0px 0px -64px 0px' }
		);

		const elements = document.querySelectorAll('[data-reveal]');
		elements.forEach((element) => observer.observe(element));

		return () => {
			elements.forEach((element) => observer.unobserve(element));
			observer.disconnect();
		};
	}, []);
}

function Reveal({ children, className = '', style }) {
	return (
		<div data-reveal className={`reveal-on-scroll ${className}`} style={style}>
			{children}
		</div>
	);
}

export default function LandingPage() {
	useScrollReveal();

	return (
		<main className='min-h-screen overflow-x-hidden pt-16 bg-[radial-gradient(circle_at_top_left,rgba(23,92,211,0.14),transparent_25%),radial-gradient(circle_at_bottom_right,rgba(15,95,115,0.16),transparent_28%),linear-gradient(180deg,var(--app-color-bg)_0%,#eef3f8_100%)] text-(--app-color-text)'>
			<Header
				logo='SportShield'
				navItems={navItems}
				position='fixed'
				className='backdrop-blur-xl'
				userMenu={
					<>
						<Link to='/login'>
							<Button variant='secondary' size='sm'>
								Sign in
							</Button>
						</Link>
						<Link to='/register'>
							<Button size='sm'>
								Register
							</Button>
						</Link>
					</>
				}
			/>

			<section id='product' className='relative isolate min-h-[calc(100vh-4rem)]'>
				<div className='pointer-events-none absolute inset-0 overflow-hidden'>
					<div className='aurora aurora-one' />
					<div className='aurora aurora-two' />
					<div className='noise-overlay' />
				</div>

				<Container className='relative grid min-h-[calc(100vh-4rem)] items-center py-8 lg:py-10'>
					<div className='grid items-center gap-10 lg:grid-cols-[1.04fr_0.96fr]'>
						<div className='space-y-8'>
							<Reveal className='inline-flex items-center gap-2 rounded-full border border-(--app-color-border) bg-(--app-color-surface-glass) px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-(--app-color-text-muted) shadow-sm backdrop-blur-md'>
								<ShieldCheck className='h-4 w-4 text-(--app-color-primary)' />
								Digital rights command center
							</Reveal>

							<div className='space-y-5'>
								<Reveal>
									<h1 className='max-w-3xl text-4xl font-semibold tracking-tight text-(--app-color-text) sm:text-5xl lg:text-6xl'>
										You Created It. Don't Let Someone Else Own It.
									</h1>
								</Reveal>
								<Reveal>
									<p className='max-w-2xl text-base leading-7 text-(--app-color-text-muted) sm:text-lg'>
										SportShield protects what you build - automatically registering, scanning, and alerting your team the moment your content appears where it shouldn't.
									</p>
								</Reveal>
							</div>

							<Reveal className='flex flex-col gap-3 sm:flex-row'>
								<Link to='/register'>
									<Button className='w-full sm:w-auto'>
										Start now
										<ArrowRight className='h-4 w-4' />
									</Button>
								</Link>
								<Link to='/login'>
									<Button variant='secondary' className='w-full sm:w-auto'>
										Sign in
									</Button>
								</Link>
							</Reveal>

							<Reveal className='grid gap-3 sm:grid-cols-3'>
								{[
									['24/7', 'Monitoring coverage'],
									['90s', 'Average alert response'],
									['Multi', 'Channel detection'],
								].map(([value, label]) => (
									<div key={label} className='rounded-2xl border border-(--app-color-border) bg-(--app-color-surface-glass) p-4 shadow-sm backdrop-blur-md'>
										<p className='text-2xl font-semibold text-(--app-color-text)'>{value}</p>
										<p className='mt-1 text-sm text-(--app-color-text-muted)'>{label}</p>
									</div>
								))}
							</Reveal>

							<Reveal className='flex flex-wrap gap-3 text-sm text-(--app-color-text-muted)'>
								{trustItems.map((item) => (
									<span key={item} className='rounded-full border border-(--app-color-border) bg-(--app-color-surface-glass) px-3 py-1.5 backdrop-blur-md'>
										{item}
									</span>
								))}
							</Reveal>
						</div>

						<div className='relative'>
							<Reveal className='hero-card rounded-[1.75rem] border border-(--app-color-border) bg-(--app-color-surface-glass) p-5 shadow-[0_30px_80px_rgba(11,20,34,0.16)] backdrop-blur-xl sm:p-6 lg:p-7'>
								<div className='flex items-center justify-between gap-4 border-b border-(--app-color-border) pb-4'>
									<div>
										<p className='text-xs font-semibold uppercase tracking-[0.2em] text-(--app-color-text-muted)'>Live posture</p>
										<h2 className='mt-1 text-xl font-semibold text-(--app-color-text)'>Protection operations</h2>
									</div>
									<LockKeyhole className='h-10 w-10 rounded-2xl bg-(--app-color-primary-soft) p-2 text-(--app-color-primary)' />
								</div>

								<div className='mt-5 grid gap-4 sm:grid-cols-2'>
									{[
										['Verified orgs', '12'],
										['Assets tracked', '4.8K'],
										['Matches surfaced', '1.2K'],
										['Alerts dispatched', '340'],
									].map(([label, value]) => (
										<div key={label} className='rounded-2xl border border-(--app-color-border) bg-(--app-color-surface-panel) p-4'>
											<p className='text-xs uppercase tracking-[0.18em] text-(--app-color-text-muted)'>{label}</p>
											<p className='mt-2 font-mono text-3xl font-semibold text-(--app-color-text)'>{value}</p>
										</div>
									))}
								</div>

								<div className='mt-5 rounded-2xl border border-(--app-color-border) bg-(--app-color-surface-elevated) p-4'>
									<div className='flex items-center gap-3'>
										<Layers3 className='h-5 w-5 text-(--app-color-primary)' />
										<p className='text-sm font-semibold text-(--app-color-text)'>Unified platform flow</p>
									</div>
									<p className='mt-2 text-sm leading-6 text-(--app-color-text-muted)'>
										One secure surface for onboarding, fingerprinting, discovery, evidence review, alerts, and reporting.
									</p>
								</div>
							</Reveal>
						</div>
					</div>
				</Container>
			</section>

			<section id='capabilities' className='flex min-h-screen items-center border-t border-(--app-color-border) bg-(--app-color-surface) py-16 sm:py-20'>
				<Container>
					<div className='mx-auto max-w-3xl space-y-4 text-center'>
						<p className='text-xs font-semibold uppercase tracking-[0.22em] text-(--app-color-primary)'>Core capabilities</p>
						<h2 className='text-3xl font-semibold tracking-tight text-(--app-color-text) sm:text-4xl'>
							Built for teams that need a serious rights protection workflow.
						</h2>
						<p className='text-base leading-7 text-(--app-color-text-muted)'>
							Each capability is designed to support the full content protection lifecycle: registration, detection, evidence, response, and reporting.
						</p>
					</div>

					<div className='mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3'>
						{featureCards.map((feature, index) => {
							const Icon = feature.icon;

							return (
								<Reveal key={feature.title} className='group h-full' style={{ transitionDelay: `${index * 80}ms` }}>
									<div className='feature-card h-full rounded-3xl border border-(--app-color-border) bg-(--app-color-surface) p-6 shadow-sm transition-all duration-500'>
										<div className={`mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-br ${feature.accent}`}>
											<Icon className='h-5 w-5 text-(--app-color-primary)' />
										</div>
										<p className='text-xs font-semibold uppercase tracking-[0.2em] text-(--app-color-text-muted)'>0{index + 1}</p>
										<h3 className='mt-2 text-xl font-semibold text-(--app-color-text)'>{feature.title}</h3>
										<p className='mt-3 text-sm leading-7 text-(--app-color-text-muted)'>{feature.description}</p>
										<div className='mt-6 h-px w-full bg-linear-to-r from-transparent via-(--app-color-border) to-transparent' />
										<div className='mt-4 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.16em] text-(--app-color-primary)'>
											<span>Product ready</span>
											<span className='opacity-0 transition-opacity duration-300 group-hover:opacity-100'>Explore</span>
										</div>
									</div>
								</Reveal>
							);
						})}
					</div>
				</Container>
			</section>

			<section id='security' className='border-t border-(--app-color-border) bg-[linear-gradient(180deg,var(--app-color-surface)_0%,var(--app-color-surface-elevated)_100%)] py-20'>
				<Container>
					<div className='grid gap-6 lg:grid-cols-[0.95fr_1.05fr]'>
						<Reveal className='rounded-[1.75rem] border border-(--app-color-border) bg-(--app-color-surface) p-8 shadow-sm'>
							<p className='text-xs font-semibold uppercase tracking-[0.22em] text-(--app-color-primary)'>Security posture</p>
							<h2 className='mt-3 text-3xl font-semibold tracking-tight text-(--app-color-text)'>
								Built for secure access and auditability.
							</h2>
							<p className='mt-4 text-sm leading-7 text-(--app-color-text-muted)'>
								The platform keeps access controlled, data scoped, and actions traceable so teams can operate with confidence.
							</p>

							<div className='mt-6 space-y-3'>
								{securityItems.map((item) => (
									<div key={item} className='flex items-start gap-3 rounded-2xl border border-(--app-color-border) bg-(--app-color-surface-glass) px-4 py-3'>
										<ShieldCheck className='mt-0.5 h-4 w-4 shrink-0 text-(--app-color-primary)' />
										<p className='text-sm leading-6 text-(--app-color-text-muted)'>{item}</p>
									</div>
								))}
							</div>
						</Reveal>

						<div id='workflow' className='grid gap-5 sm:grid-cols-2'>
							{workflowSteps.map((step) => (
								<Reveal key={step.symbol} className='rounded-3xl border border-(--app-color-border) bg-(--app-color-surface-glass) p-6 shadow-sm backdrop-blur-md'>
									<div className='flex items-center justify-between gap-4'>
										<p className='font-mono text-2xl font-semibold text-(--app-color-primary)'>{step.symbol}</p>
										<Workflow className='h-5 w-5 text-(--app-color-text-muted)' />
									</div>
									<h3 className='mt-5 text-xl font-semibold text-(--app-color-text)'>{step.title}</h3>
									<p className='mt-3 text-sm leading-7 text-(--app-color-text-muted)'>{step.description}</p>
								</Reveal>
							))}
						</div>
					</div>
				</Container>
			</section>

			<section id='contact' className='border-t border-(--app-color-border) py-16'>
				<Container>
					<Reveal className='flex flex-col items-start justify-between gap-6 rounded-[1.75rem] border border-(--app-color-border) bg-(--app-color-surface) p-8 shadow-sm lg:flex-row lg:items-center'>
						<div className='max-w-2xl space-y-3'>
							<p className='text-xs font-semibold uppercase tracking-[0.22em] text-(--app-color-primary)'>Ready to launch</p>
							<h2 className='text-2xl font-semibold text-(--app-color-text) sm:text-3xl'>
								Move from protected onboarding to content intelligence.
							</h2>
							<p className='text-sm leading-7 text-(--app-color-text-muted)'>
								Start with secure access, then expand into fingerprinting, scanning, evidence, alerts, and analytics without changing the product shell.
							</p>
						</div>

						<div className='flex flex-col gap-3 sm:flex-row'>
							<Link to='/register'>
								<Button>Start now</Button>
							</Link>
							<Link to='/login'>
								<Button variant='secondary'>Access dashboard</Button>
							</Link>
						</div>
					</Reveal>
				</Container>
			</section>
		</main>
	);
}
