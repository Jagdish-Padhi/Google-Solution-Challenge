import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
	ArrowRight,
	BarChart3,
	BellRing,
	Box,
	FileSearch,
	Globe2,
	Layers3,
	Lock,
	LockKeyhole,
	Mail,
	Radar,
	ShieldCheck,
	Workflow,
	Zap,
} from 'lucide-react';

import { Button, Container, Header, Loader, Footer } from '../../components';

const navItems = [
	{ label: 'Product', href: '#product', icon: Box },
	{ label: 'Capabilities', href: '#capabilities', icon: Zap },
	{ label: 'Security', href: '#security', icon: Lock },
	{ label: 'Contact', href: '#contact', icon: Mail },
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

const loopingPhrases = [
	'Fingerprint Matching',
	'Live Discovery',
	'Violation Alerts',
	'Copyright Control',
	'Asset Integrity',
];

function TextLoop() {
	const [index, setIndex] = useState(0);

	useEffect(() => {
		const timer = setInterval(() => {
			setIndex((prev) => (prev + 1) % loopingPhrases.length);
		}, 3000);
		return () => clearInterval(timer);
	}, []);

	return (
		<div className='mt-2 h-6 overflow-hidden'>
			<p key={index} className='animate-text-loop text-sm font-bold tracking-wide text-teal-500'>
				{loopingPhrases[index]}
			</p>
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
					<div className='noise-overlay' />
				</div>

				<Container className='relative grid min-h-[calc(100vh-4rem)] items-center py-8 lg:py-10'>
					<div className='grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]'>
						<div className='space-y-8'>
							<Reveal className='inline-flex items-center gap-2 rounded-full border border-(--app-color-border) bg-(--app-color-surface-glass) px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-(--app-color-text-muted) shadow-sm backdrop-blur-md'>
								<ShieldCheck className='h-4 w-4 text-(--app-color-primary)' />
								Digital rights command center
							</Reveal>

							<div className='space-y-5'>
								<Reveal>
									<h1 className='max-w-3xl text-4xl font-semibold tracking-tight text-(--app-color-text) sm:text-5xl lg:text-6xl'>
										You Created It. <br /> <span className='text-teal-600 font-bold italic underline decoration-teal-500/40 underline-offset-4'>Don't Let</span> Someone Else Own It.
									</h1>
								</Reveal>
								<Reveal>
									<p className='max-w-2xl text-base leading-7 text-(--app-color-text-muted) sm:text-lg'>
										The centralized hub for media rights protection. Register assets, scan the web, and take action on unauthorized re-posts before they spread.
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
						</div>

						<div className='relative flex items-center justify-center lg:justify-end'>
							<Reveal className='relative w-full max-w-md'>
								<div className='rounded-[2.5rem] border border-(--app-color-border) bg-(--app-color-surface-glass) p-6 shadow-[0_32px_100px_rgba(11,20,34,0.12)] backdrop-blur-2xl lg:p-8'>
									<div className='flex flex-col items-center gap-6 text-center'>
										<div className='relative'>
											<div className='absolute -inset-10 animate-spin-slow opacity-10 [background:conic-gradient(from_0deg,transparent_0deg,var(--app-color-primary)_180deg,transparent_360deg)] [mask-image:radial-gradient(circle,black,transparent_70%)]' />
											<Loader size={1.0} color='var(--app-color-primary)' />
										</div>

										<div className='space-y-3'>
											<div>
												<p className='text-[10px] font-black uppercase tracking-[0.3em] text-(--app-color-primary)'>Rights Protection Active</p>
												<h2 className='mt-2 text-xl font-black text-(--app-color-text)'>Automated Discovery</h2>
												<TextLoop />
											</div>
											<p className='text-xs leading-6 text-(--app-color-text-muted)'>
												Continuously matching your unique digital fingerprints against unauthorized distribution channels.
											</p>
										</div>

										<div className='flex w-full gap-3 pt-2'>
											<div className='flex-1 rounded-2xl border border-(--app-color-border) bg-(--app-color-surface-panel) p-3 text-left'>
												<div className='flex items-center gap-2'>
													<div className='h-2 w-2 animate-pulse rounded-full bg-emerald-500' />
													<p className='text-[9px] font-black uppercase tracking-widest text-(--app-color-text-muted)'>Asset Integrity</p>
												</div>
												<p className='mt-0.5 text-base font-bold text-(--app-color-text)'>Protected</p>
											</div>
											<div className='flex-1 rounded-2xl border border-(--app-color-border) bg-(--app-color-surface-panel) p-3 text-left'>
												<div className='flex items-center gap-2'>
													<div className='h-2 w-2 animate-pulse rounded-full bg-teal-500' />
													<p className='text-[9px] font-black uppercase tracking-widest text-(--app-color-text-muted)'>Web Scanning</p>
												</div>
												<p className='mt-0.5 text-base font-bold text-(--app-color-text)'>Active</p>
											</div>
										</div>
									</div>
								</div>
							</Reveal>
						</div>
					</div>
				</Container>
			</section>

			<section id='capabilities' className='flex min-h-screen items-center border-t border-(--app-color-border) bg-(--app-color-surface) py-16 sm:py-20'>
				<Container>
					<div className='mx-auto max-w-3xl space-y-4 text-center'>
						<p className='text-xs font-bold uppercase tracking-[0.3em] text-(--app-color-primary)'>Platform Features</p>
						<h2 className='text-3xl font-black tracking-tight text-(--app-color-text) sm:text-4xl'>
							Complete Content Protection Workflow.
						</h2>
						<p className='text-base leading-7 text-(--app-color-text-muted)'>
							From initial registration to violation detection, SportShield provides the tools needed to identify and manage your media assets across the web.
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

			<section id='workflow' className='border-t border-(--app-color-border) bg-(--app-color-surface-elevated)/30 py-20'>
				<Container>
					<div className='grid gap-12 lg:grid-cols-[0.8fr_1.2fr] items-center'>
						<Reveal className='space-y-6'>
							<p className='text-xs font-bold uppercase tracking-[0.3em] text-(--app-color-primary)'>How it works</p>
							<h2 className='text-4xl font-black tracking-tight text-(--app-color-text)'>
								From registration <br />to enforcement.
							</h2>
							<p className='text-base leading-7 text-(--app-color-text-muted)'>
								We've brought rights management into one unified dashboard, creating a four-step process to track and protect your organization's content.
							</p>
						</Reveal>

						<div className='grid gap-5 sm:grid-cols-2'>
							{workflowSteps.map((step) => (
								<Reveal key={step.symbol} className='group rounded-[2rem] border border-(--app-color-border) bg-(--app-color-surface-glass) p-8 shadow-sm backdrop-blur-md transition-all hover:border-(--app-color-primary)/30 hover:shadow-md'>
									<div className='flex items-center justify-between gap-4'>
										<p className='font-mono text-3xl font-black text-(--app-color-primary)'>{step.symbol}</p>
										<Workflow className='h-6 w-6 text-(--app-color-text-muted) group-hover:text-(--app-color-primary) transition-colors' />
									</div>
									<h3 className='mt-6 text-xl font-bold text-(--app-color-text)'>{step.title}</h3>
									<p className='mt-3 text-sm leading-7 text-(--app-color-text-muted)'>{step.description}</p>
								</Reveal>
							))}
						</div>
					</div>
				</Container>
			</section>

			<section id='contact' className='border-t border-(--app-color-border) py-24 bg-(--app-color-surface) relative overflow-hidden'>
				<div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none">
					<div className="absolute -top-24 -right-24 w-96 h-96 bg-(--app-color-primary) rounded-full blur-3xl" />
					<div className="absolute -bottom-24 -left-24 w-96 h-96 bg-(--app-color-success) rounded-full blur-3xl" />
				</div>

				<Container>
					<div className="grid lg:grid-cols-2 gap-16 items-center">
						<Reveal className='space-y-8'>
							<div className="space-y-4">
								<p className='text-xs font-black uppercase tracking-[0.3em] text-(--app-color-primary)'>Enterprise Support</p>
								<h2 className='text-4xl font-black text-(--app-color-text) leading-[1.1]'>
									Protect your legacy. <br />
									<span className="text-(--app-color-primary)">Talk to our Experts.</span>
								</h2>
								<p className='text-base leading-7 text-(--app-color-text-muted) max-w-lg'>
									Join the world's leading rights holders who trust SportShield to monitor their global digital footprint 24/7. Our team is ready to help you secure your content.
								</p>
							</div>

							<div className="space-y-6">
								<div className="flex items-start gap-4">
									<div className="h-10 w-10 rounded-xl bg-(--app-color-primary-soft) flex items-center justify-center text-(--app-color-primary) shrink-0">
										<Mail size={20} />
									</div>
									<div>
										<p className="text-xs font-bold uppercase tracking-wider text-(--app-color-text-muted)">Direct Email</p>
										<a href="mailto:code369decode@gmail.com" className="text-lg font-bold text-(--app-color-text) hover:text-(--app-color-primary) transition-colors">code369decode@gmail.com</a>
									</div>
								</div>

								<div className="flex items-start gap-4">
									<div className="h-10 w-10 rounded-xl bg-(--app-color-primary-soft) flex items-center justify-center text-(--app-color-primary) shrink-0">
										<ShieldCheck size={20} />
									</div>
									<div>
										<p className="text-xs font-bold uppercase tracking-wider text-(--app-color-text-muted)">Team Signature</p>
										<p className="text-lg font-bold text-(--app-color-text)">Esc(Reality);</p>
									</div>
								</div>
							</div>
						</Reveal>

						<Reveal className="relative">
							<div className="rounded-[2.5rem] border border-(--app-color-border) bg-(--app-color-surface-glass) p-10 shadow-2xl backdrop-blur-xl space-y-8">
								<div className="space-y-3">
									<h3 className="text-2xl font-black text-(--app-color-text)">Establish Connection</h3>
									<p className="text-sm text-(--app-color-text-muted) leading-relaxed">
										We provide dedicated engineering support for large-scale rights holders. Reach out directly to initiate onboarding.
									</p>
								</div>

								<div className="space-y-4">
									<div className="p-6 rounded-2xl bg-(--app-color-surface-elevated) border border-(--app-color-border) group hover:border-(--app-color-primary)/30 transition-all">
										<label className="text-[10px] font-bold uppercase tracking-widest text-(--app-color-primary) mb-2 block">Technical Inquiries</label>
										<p className="text-lg font-mono font-bold text-(--app-color-text)">code369decode@gmail.com</p>
									</div>
									
									<div className="p-6 rounded-2xl bg-(--app-color-surface-elevated) border border-(--app-color-border) group hover:border-(--app-color-primary)/30 transition-all">
										<label className="text-[10px] font-bold uppercase tracking-widest text-(--app-color-primary) mb-2 block">Lead Developer</label>
										<p className="text-lg font-mono font-bold text-(--app-color-text)">TEAM ESC(REALITY);</p>
									</div>
								</div>

								<div className="flex items-center gap-3 text-xs font-bold text-(--app-color-text-muted) uppercase tracking-widest">
									<span className="w-2 h-2 rounded-full bg-(--app-color-success) animate-pulse"></span>
									Available for deployment
								</div>
							</div>
						</Reveal>
					</div>
				</Container>
			</section>

			<Footer />
		</main>
	);
}
