import { Link } from 'react-router-dom';
import { Mail, Terminal, Globe, Users, ExternalLink } from 'lucide-react';
import Container from './Container';

export default function Footer() {
	return (
		<footer className='border-t border-(--app-color-border) bg-(--app-color-surface) pt-20 pb-10'>
			<Container>
				<div className='grid gap-12 lg:grid-cols-[1.5fr_1fr_1fr_1fr] pb-16'>
					<div className='space-y-6'>
						<Link to='/' className='flex items-center gap-3 logo-brand group'>
							<img src='/navlogo.png' alt='SportShield' className='h-10 w-10 object-contain transition-transform duration-500 group-hover:rotate-12' />
							<div className="flex items-baseline gap-0.5">
								<span className="text-(--app-color-text) text-xl!">Sport</span>
								<span className="logo-shield text-xl!">Shield</span>
							</div>
						</Link>
						<p className='max-w-xs text-sm leading-7 text-(--app-color-text-muted)'>
							The next-generation command center for digital rights protection. Monitor, detect, and enforce your content integrity across the global web.
						</p>
						<div className='flex items-center gap-4'>
							<a href='#' className='p-2 rounded-full border border-(--app-color-border) text-(--app-color-text-muted) hover:text-(--app-color-primary) hover:border-(--app-color-primary) transition-all'>
								<Globe size={18} />
							</a>
							<a href='#' className='p-2 rounded-full border border-(--app-color-border) text-(--app-color-text-muted) hover:text-(--app-color-primary) hover:border-(--app-color-primary) transition-all'>
								<Users size={18} />
							</a>
							<a href='#' className='p-2 rounded-full border border-(--app-color-border) text-(--app-color-text-muted) hover:text-(--app-color-primary) hover:border-(--app-color-primary) transition-all'>
								<Terminal size={18} />
							</a>
						</div>
					</div>

					<div>
						<h4 className='text-xs font-black uppercase tracking-[0.2em] text-(--app-color-text) mb-6'>Product</h4>
						<ul className='space-y-4 text-sm text-(--app-color-text-muted)'>
							<li><a href='#product' className='hover:text-(--app-color-primary) transition-colors'>Overview</a></li>
							<li><a href='#capabilities' className='hover:text-(--app-color-primary) transition-colors'>Capabilities</a></li>
							<li><a href='#workflow' className='hover:text-(--app-color-primary) transition-colors'>Workflow</a></li>
							<li><Link to='/register' className='hover:text-(--app-color-primary) transition-colors'>Get Started</Link></li>
						</ul>
					</div>

					<div>
						<h4 className='text-xs font-black uppercase tracking-[0.2em] text-(--app-color-text) mb-6'>Contact & Support</h4>
						<ul className='space-y-4 text-sm text-(--app-color-text-muted)'>
							<li className='flex items-center gap-2'>
								<Mail size={14} className='text-(--app-color-success)' />
								<a href='mailto:code369decode@gmail.com' className='hover:text-(--app-color-primary) transition-colors'>code369decode@gmail.com</a>
							</li>
							<li className='flex items-center gap-2'>
								<ExternalLink size={14} />
								<a href='#' className='hover:text-(--app-color-primary) transition-colors'>Documentation</a>
							</li>
							<li className='flex items-center gap-2'>
								<ExternalLink size={14} />
								<a href='#' className='hover:text-(--app-color-primary) transition-colors'>API Status</a>
							</li>
						</ul>
					</div>

					<div>
						<h4 className='text-xs font-black uppercase tracking-[0.2em] text-(--app-color-text) mb-6'>Organization</h4>
						<ul className='space-y-4 text-sm text-(--app-color-text-muted)'>
							<li><a href='#' className='hover:text-(--app-color-primary) transition-colors'>About Team</a></li>
							<li><a href='#' className='hover:text-(--app-color-primary) transition-colors'>Terms of Service</a></li>
							<li><a href='#' className='hover:text-(--app-color-primary) transition-colors'>Privacy Policy</a></li>
							<li className='pt-2'>
								<span className='inline-flex items-center rounded-lg bg-(--app-color-primary-soft) px-2.5 py-1 text-[10px] font-bold text-(--app-color-primary) uppercase tracking-wider'>
									v1.0.0 Stable
								</span>
							</li>
						</ul>
					</div>
				</div>

				<div className='pt-10 border-t border-(--app-color-border) flex flex-col md:flex-row items-center justify-between gap-6'>
					<p className='text-xs text-(--app-color-text-muted) font-medium'>
						© {new Date().getFullYear()} SportShield. All rights reserved.
					</p>
					<p className='text-xs text-(--app-color-text-muted)'>
						Built with precision by <span className='font-bold text-(--app-color-text)'>Team Esc(Reality);</span>
					</p>
					<div className='flex items-center gap-6 text-xs font-semibold text-(--app-color-text-muted) uppercase tracking-widest'>
						<a href='#' className='hover:text-(--app-color-text) transition-colors'>Cookie Policy</a>
						<a href='#' className='hover:text-(--app-color-text) transition-colors'>GDPR</a>
					</div>
				</div>
			</Container>
		</footer>
	);
}
